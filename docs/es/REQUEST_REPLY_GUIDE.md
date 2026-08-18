![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Peticion y respuesta

> 👉 🇲🇽 Versión en Español&nbsp; | &nbsp;[ 🇺🇸 English Version](../en/REQUEST_REPLY_GUIDE.md)

Un bus de eventos es unidireccional por diseno: emites, y quien le interese reacciona. Pero
algunas interacciones son genuinamente una pregunta y una respuesta - trae esto, valida aquello,
ejecuta este trabajo y dime como fue - y expresarlas sobre un bus unidireccional significa
correlacionar la respuesta con la peticion a mano.

`store.call()` es esa correlacion, hecha una sola vez.

---

## La forma del problema

Escrito a mano, peticion/respuesta se ve asi siempre:

```typescript
// No escribas esto.
function ask(store, question) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timer = setTimeout(() => {
      off();
      reject(new Error("timeout"));
    }, 30_000);

    const off = store.onEvent("rpc", "answer", (event) => {
      if (event.meta?.correlationId !== id) return;
      clearTimeout(timer);
      off();
      resolve(event.payload);
    });

    void store.emit("rpc", "ask", question, { meta: { correlationId: id } });
  });
}
```

Unas ochenta lineas en cuanto agregas progreso, cancelacion y todas las rutas por las que hay que
quitar la suscripcion. Y trae dos bugs casi siempre:

- **La suscripcion sobrevive a la llamada.** Se te escapa un `off()` en una ruta de error y el
  store acumula un listener por peticion, para siempre.
- **`Quien Responde` debe devolver el id, y algun dia no lo hara.** El sintoma es un timeout: una
  respuesta que en el log se ve perfectamente normal, sin emparejar.

---

## La llamada

```typescript
const res = await store.call("rpc", "ask", { q: "quien?" }, { reply: ["rpc", "answer"] });
res.payload.text;
```

`Quien Responde` no hace nada especial. Responde con el `emit` que recibio:

```typescript
store.registerEffect({
  when: { keys: [["rpc", "ask"]] },
  effect: async (event, _get, emit) => {
    await emit("rpc", "answer", await lookup(event.payload.q));
  },
});
```

**No hay id de correlacion.** El store marca `parentId` en todo lo que se emite mientras se
atiende un evento, asi que una respuesta enviada con el `emit` inyectado ya viene correlacionada.
Nada que generar, nada que devolver, nada que olvidar.

### `payload` es la peticion

Vale la pena decirlo porque la firma se lee ambigua: `payload` es lo que estas *enviando*. Lo que
regresa lo describe `reply`.

---

## No saber que va a regresar

Muchas veces quien llama no puede saber que *tipo* de respuesta recibira - una respuesta, un
rechazo, un resultado parcial. Por eso una llamada resuelve al **evento**, no al payload: el
evento trae el discriminante.

```typescript
const res = await store.call("rpc", "ask", { q }, { reply: ["rpc", ["answer", "error"]] });

switch (res.type) {
  case "answer":
    return res.payload.text;
  case "error":
    throw new Error(res.payload.reason);
}
```

`reply` nombra los tipos que **terminan** la llamada. Tres formas:

| `reply` | Significado |
|---|---|
| `["rpc", "answer"]` | un solo tipo terminal; el payload tipa exacto |
| `["rpc", ["answer", "error"]]` | cualquiera la termina; discrimina por `type` |
| `["rpc"]` | todo evento del canal es terminal |

---

## Progreso, y por que el productor espera

Cualquier evento correlacionado que **no** sea terminal es progreso. Itera la llamada para
recibirlo:

```typescript
const call = store.call("job", "start", { id }, {
  reply: ["job", "done"],
  highWaterMark: 4,
});

for await (const step of call) {
  await renderProgress(step.payload);
}

const { payload } = await call; // la respuesta terminal
```

La respuesta se transmite emitiendo eventos no terminales, y despues uno terminal:

```typescript
store.registerEffect({
  when: { keys: [["job", "start"]] },
  effect: async (event, _get, emit) => {
    for (const chunk of await plan(event.payload.id)) {
      await emit("job", "tick", chunk); // ← espera aqui mientras el consumidor va atras
    }
    await emit("job", "done", { ok: true });
  },
});
```

### La contrapresion es real

Ese `await emit(...)` bloquea de verdad. No es una cola con limite que empieza a descartar - el
productor va al ritmo del lector, de punta a punta:

```
  `Quien responde`                store                    Quien Pregunta
       │                          │                            │
       ├─ await emit("tick") ────►│                            │
       │                          ├─ efecto: queue.put(item) ──┤ (buffer lleno)
       │       (detenido)         │              ▲             │
       │                          │              └─────────────┤ for await … next()
       ◄──────── resuelve ────────┤◄──────── item tomado ──────┤
```

Funciona por dos cosas que ya existian: `emit` resuelve solo cuando terminan sus efectos, y el
colector *es* un efecto. Nada hace polling, nada se descarta, y ningun buffer crece sin limite.

Elige `highWaterMark` segun que tan adelante puede ir el productor: `1` para lockstep, mas alto
para absorber irregularidad.

### La contrapresion entra cuando empiezas a iterar

Una llamada que solo se espera con `await` nunca extrae nada. Si su productor se bloqueara, la
llamada causaria su propio interbloqueo: el progreso que nadie lee impediria que se enviara el
evento terminal, asi que el `await` nunca retornaria.

Por eso el progreso no iterado se almacena hasta `highWaterMark`, y lo que pase de ahi se cuenta:

```typescript
const call = store.call("job", "start", { id }, { reply: ["job", "done"] });
const res = await call;
call.dropped; // progreso que elegiste no leer
```

`dropped > 0` no es un error. Es la cuenta honesta de lo que quien llamo se salto, y conviene
registrarla en vez de adivinarla.

---

## Rendirse

```typescript
const call = store.call("job", "start", { id }, {
  reply: ["job", "done"],
  timeoutMs: 5_000,
  signal: AbortSignal.timeout(60_000),
});
```

**`timeoutMs` es de inactividad, no total.** Todo evento correlacionado lo reinicia, incluido el
progreso. Un trabajo que transmite durante dos minutos no hara fallar una llamada de cinco
segundos - el timeout pregunta "sigue vivo `Quien Responde`?", no "ya termino?".

Para una fecha limite real - *esto tiene que estar listo para entonces, por muy activo que este* -
usa `signal`. Ambos se componen: arriba, `Quien Responde` puede callar como maximo cinco segundos, y
el total no puede pasar de sesenta.

```typescript
call.cancel("el usuario navego a otro lado");
```

Termine como termine - resuelta, expirada, abortada, cancelada - la suscripcion se elimina y se
libera cualquier productor detenido por la contrapresion. Si `Quien Responde` queda atascado seria peor que
el buffer sin limite que esto reemplazo.

---

## Probar una llamada

No hace falta nada especial - `Quien Responde` es un efecto normal:

```typescript
it("responde", async () => {
  const store = createStore<{}, EM>({ name: "test" });
  store.registerEffect({
    when: { keys: [["rpc", "ask"]] },
    effect: async (_e, _get, emit) => {
      await emit("rpc", "answer", { text: "hola" });
    },
  });

  const res = await store.call("rpc", "ask", { q: "?" }, { reply: ["rpc", "answer"] });
  expect(res.payload.text).toBe("hola");
});
```

Para *comprobar* la contrapresion en vez de suponerla, registra cuando *resuelve* el `emit` del
productor y compara contra cuanto ha tomado el consumidor:

```typescript
for await (const step of call) {
  consumed.push(step.payload.n);
  expect(emitted.length).toBeLessThanOrEqual(consumed.length + 1); // hwm de 1
  await trabajoLento();
}
```

---

## Ver tambien

- [README de `@yoltra/core`](../../packages/core/README.es.md) - la API completa del store
- [Arquitectura del Pipeline de Eventos](./design/event-queue-architecture.md) - por que se
  esperan los efectos, que es lo que hace posible la contrapresion
