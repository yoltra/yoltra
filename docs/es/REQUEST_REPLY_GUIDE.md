![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Petición y respuesta

> 👉 🇲🇽 Versión en Español&nbsp; | &nbsp;[ 🇺🇸 English Versión](../en/REQUEST_REPLY_GUIDE.md)

Un bus de eventos es unidireccional por diseño: emites, y quien le interese reacciona. Pero
algunas interacciones son genuinamente una pregunta y una respuesta - trae esto, valida aquello,
ejecuta este trabajo y dime cómo fue - y expresarlas sobre un bus unidireccional significa
correlacionar la respuesta con la petición a mano.

`store.call()` es esa correlación, hecha una sola vez.

---

## La forma del problema

Escrito a mano, petición/respuesta se ve así siempre:

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

Unas ochenta líneas en cuanto agregas progreso, cancelación y todas las rutas por las que hay que
quitar la suscripción. Y trae dos bugs casi siempre:

- **La suscripción sobrevive a la llamada.** Se te escapa un `off()` en una ruta de error y el
  store acumula un listener por petición, para siempre.
- **`Quien Responde` debe devolver el id, y algún día no lo hará.** El síntoma es un timeout: una
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

**No hay id de correlación.** El store marca `parentId` en todo lo que se emite mientras se
atiende un evento, así que una respuesta enviada con el `emit` inyectado ya viene correlacionada.
Nada que generar, nada que devolver, nada que olvidar.

### `payload` es la petición

Vale la pena decirlo porque la firma se lee ambigua: `payload` es lo que estás *enviando*. Lo que
regresa lo describe `reply`.

---

## No saber que va a regresar

Muchas veces quien llama no puede saber que *tipo* de respuesta recibirá - una respuesta, un
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

La respuesta se transmite emitiendo eventos no terminales, y después uno terminal:

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

### La contrapresión es real

Ese `await emit(...)` bloquea de verdad. No es una cola con límite que empieza a descartar - el
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
colector *es* un efecto. Nada hace polling, nada se descarta, y ningún buffer crece sin límite.

Elige `highWaterMark` según que tan adelante puede ir el productor: `1` para lockstep, más alto
para absorber irregularidad.

### La contrapresión entra cuando empiezas a iterar

Una llamada que solo se espera con `await` nunca extrae nada. Si su productor se bloqueara, la
llamada causaría su propio interbloqueo: el progreso que nadie lee impediría que se enviara el
evento terminal, así que el `await` nunca retornaría.

Por eso el progreso no iterado se almacena hasta `highWaterMark`, y lo que pase de ahi se cuenta:

```typescript
const call = store.call("job", "start", { id }, { reply: ["job", "done"] });
const res = await call;
call.dropped; // progreso que elegiste no leer
```

`dropped > 0` no es un error. Es la cuenta honesta de lo que quien llamó se saltó, y conviene
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
progreso. Un trabajo que transmite durante dos minutos no hará fallar una llamada de cinco
segundos - el timeout pregunta "sigue vivo `Quien Responde`?", no "ya terminó?".

Para una fecha límite real - *esto tiene que estar listo para entonces, por muy activo que este* -
usa `signal`. Ambos se componen: arriba, `Quien Responde` puede callar como máximo cinco segundos, y
el total no puede pasar de sesenta.

```typescript
call.cancel("el usuario navego a otro lado");
```

Termine como termine - resuelta, expirada, abortada, cancelada - la suscripción se elimina y se
libera cualquier productor detenido por la contrapresión. Si `Quien Responde` queda atascado sería peor que
el buffer sin límite que esto reemplazo.

Liberar el store también termina cada llamada pendiente, con `CallAbortedError("store disposed")`,
y una llamada hecha sobre un store liberado, o con un signal ya abortado, se rechaza sin enviar
nada.

El timer de inactividad se arma en el `scheduler` del store, el mismo puerto que usan sus otros
timers, así que un test puede dispararlo en lugar de esperarlo (ver
[Probar una llamada](#probar-una-llamada)).

---

## Cuando la respuesta no puede ser hija directa

Todo lo anterior funciona porque el store marca con `parentId` lo que un `Quien Responde` emite
mientras atiende la petición, así que la respuesta se correlaciona de forma estructural y nunca hay
que anotar ningún id.

Ese vínculo solo existe **dentro de un proceso**, y solo para una respuesta emitida
**directamente** al atender la petición. No es descendencia: una respuesta emitida un salto más
abajo en la cascada lleva el id del evento intermedio y no se verá. Así que hay tres casos que
necesitan un id explícito:

- el `Quien Responde` está en otro nodo, en un worker, o al otro lado de cualquier transporte;
- el `Quien Responde` contesta en un turno posterior, tras encolar la petición;
- la respuesta la emite algo que la petición causó, y no el manejador mismo.

Para esos, pasa `correlationId` y haz que el `Quien Responde` lo devuelva en `meta`:

```typescript
const id = crypto.randomUUID();

const answer = await store.call(
  "rpc",
  "ask",
  { q: "quien?" },
  { reply: ["rpc", "answer"], correlationId: id },
);
```

```typescript
// El Quien Responde, viva donde viva, devuelve el id que recibió.
await emit("rpc", "answer", result, { meta: { correlationId: id } });
```

**Por defecto amplía la coincidencia, no la reemplaza.** La comprobación del padre se sigue
ejecutando primero, así que un `Quien Responde` local que no sabe nada del id sigue funcionando, que
es lo que permite que el mismo sitio de llamada sirva a un respondedor local y a uno remoto sin
ramificar.

**Cuando el vínculo con el padre puede apuntar a la petición equivocada, correlaciona solo por el
id.** Un `Quien Responde` cuyo protocolo lleva su propio id de petición puede tener varias peticiones
en curso en un canal y contestar una mientras atiende otra. Esa respuesta desciende de la petición
equivocada, y con el comportamiento por defecto resuelve la llamada de la que desciende.
`correlation: "id"` correlaciona solo por el id devuelto:

```ts
const res = await store.call(
  "rpc",
  "ask",
  { q },
  { reply: ["rpc", "answer"], correlationId: id, correlation: "id" },
);
```

`correlation` es `"either"` por defecto; `"causal"` ignora el id devuelto; `"id"` sin un
`correlationId` lanza al hacer la llamada, porque nunca podría coincidir.

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

Para probar un timeout sin esperarlo, dale al store un scheduler que puedas disparar:

```typescript
const timers: Array<{ run: () => void; delayMs: number }> = [];
const store = createStore<{}, EM>({
  name: "test",
  scheduler: { setTimeout: (run, delayMs) => timers.push({ run, delayMs }) - 1, clearTimeout: () => undefined },
});

const call = store.call("rpc", "ask", { q: "?" }, { reply: ["rpc", "answer"], timeoutMs: 5_000 });
timers.find((t) => t.delayMs === 5_000)!.run();
await expect(call).rejects.toBeInstanceOf(CallTimeoutError);
```

Para *comprobar* la contrapresión en vez de suponerla, registra cuando *resuelve* el `emit` del
productor y compara contra cuánto ha tomado el consumidor:

```typescript
for await (const step of call) {
  consumed.push(step.payload.n);
  expect(emitted.length).toBeLessThanOrEqual(consumed.length + 1); // hwm de 1
  await trabajoLento();
}
```

---

## Ver también

- [README de `@yoltra/core`](../../packages/core/README.es.md) - la API completa del store
- [Arquitectura del Pipeline de Eventos](./design/event-queue-architecture.md) - por que se
  esperan los efectos, que es lo que hace posible la contrapresión
