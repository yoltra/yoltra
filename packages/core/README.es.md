![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/core

> 👉 🇲🇽 Versión en Español&nbsp; |
> &nbsp;[ 🇺🇸 English Versión](./README.md)&nbsp;

[![versión npm](https://img.shields.io/npm/v/@yoltra/core)](https://www.npmjs.com/package/@yoltra/core)
[![descargas npm](https://img.shields.io/npm/dm/@yoltra/core)](https://www.npmjs.com/package/@yoltra/core)
[![tipos](https://img.shields.io/npm/types/@yoltra/core)](https://www.npmjs.com/package/@yoltra/core)
[![Licencia](https://img.shields.io/npm/l/@yoltra/core)](https://github.com/yoltra/yoltra/blob/main/LICENSE)

**Contenedor de estado orientado a eventos, agnóstico de framework, con suscripciones de grano
fino por ruta.**

`@yoltra/core` es la base de [yoltra](../../README.md).
Proporciona el store, el pipeline de eventos, middleware, efectos y el sistema de suscripciones
`connect()`. Cero dependencias de framework.

---

## Instalación

```bash
npm install @yoltra/core
```

---

## El Pipeline de Eventos

Cada llamada a `emit()` fluye a través de un pipeline determinista:

```
emit(channel, type, payload)
  │
  ├─ 0. Dedup (opt-in) ─── Omite un duplicado solo si dedupWindowMs > 0 o se pasa un dedupKey
  │
  │  ══ fase de reduccion SINCRONA: corre antes de que emit() retorne ══
  ├─ 1. Middleware ─── Hooks pre-reducer sincronos (devolver false para rechazar → evento "no confirmado")
  ├─ 2. Reducers ─── Cada slice que aplica se prepara, y todas se confirman bajo una sola raiz
  ├─ 3. Suscriptores de eventos ─── Notificaciones de eventos confirmados/no confirmados
  ├─ 4. Suscriptores gruesos ─── Listeners externos del store (useSyncExternalStore, etc.), si el estado cambio
  │
  └─ 5. Efectos ─── Efectos secundarios ASYNC, una tarea independiente por evento (indexados para busqueda O(1))
```

La fase de reducción (1–4) es **síncrona**, así que `getState()` es correcto en el instante en que
`emit()` retorna, incluso con middleware. Los efectos (5) corren después como una tarea async
independiente; la promesa de `emit()` se resuelve cuando terminan los efectos de ese evento. Cada
etapa es interceptable, y `store.instrument()` expone todo el flujo (rutas hoja cambiadas, tiempos
de reducción, fase confirmado/rechazado) a las DevTools sin ningún `as any`. Un evento que no se
confirmó también lleva `reason` y, cuando lo vetó un middleware con nombre, `vetoedBy`, la misma
atribución que devuelve `emit`. En la práctica `reason` ahí vale `"vetoed"`: un evento deduplicado
o rechazado por la cascada nunca llega a la instrumentación. Ver la
[Arquitectura del Pipeline de Eventos](../../docs/es/design/event-queue-architecture.md) para el
modelo completo.

---

## Conceptos Fundamentales

### Eventos basados en canales

Los eventos son tuplas `(channel, type, payload)`. Los canales proporcionan namespacing natural
que escala en bases de código grandes:

```typescript
await store.emit("auth", "login", credentials);
await store.emit("analytics", "track", { event: "page_view" });
await store.emit("ui", "toast", { message: "Saved!" });
```

### Suscripciones de grano fino vía `connect()`

Suscríbete a rutas de estado exactas usando notación de puntos. Soporta wildcards `*` (un
segmento) y `**` (cero o más segmentos):

```typescript
// Ruta exacta: se dispara cuando items[0].title cambia
store.connect({ reducer: "todos", property: "items.0.title" }, (change) =>
  console.log("title:", change.oldValue, "→", change.newValue),
);

// Wildcard de un segmento: se dispara cuando el titulo de CUALQUIER item cambia
store.connect({ reducer: "todos", property: "items.*.title" }, (change) =>
  console.log("some title changed at", change.path),
);

// Wildcard profundo: se dispara cuando algo bajo items cambia
store.connect({ reducer: "todos", property: "items.**" }, (change) =>
  console.log("items tree changed at", change.path),
);
```

### Slices que contienen un solo valor

Una slice no tiene por qué ser un objeto. Un primitivo, un `Map`, un `Set` o una `Date` es un
estado de slice válido, y se confirma igual que cualquier otro:

```typescript
const store = createStore({
  name: "session",
  reducer: {
    token: {
      state: null as string | null,
      when: { keys: [["auth", "login"]] },
      reducer: (_state, event) => event.payload.token,
    },
  },
});

await store.emit("auth", "login", { token: "abc123" });
store.getState().token; // "abc123"
```

Una slice así no tiene ninguna propiedad debajo, así que sus cambios se reportan en la **raíz de
la slice**, la ruta vacía. Suscríbete a ella con `property: ""`:

```typescript
store.connect({ reducer: "token", property: "" }, (change) =>
  console.log("token:", change.oldValue, " --> ", change.newValue),
);
```

Los tipos conocen la diferencia. `property` en una slice de valor raíz acepta `""` y nada más,
porque no hay ninguna clave que direccionar, y el valor vuelve correctamente tipado:

```typescript
const token = useAtomicProp({ reducer: "token", property: "" }); // string | null
```

### `""` frente a `"**"`: observar una slice completa

Dos suscripciones que suenan iguales y no lo son:

| Patrón | Se dispara cuando |
|---|---|
| `""` | el **valor completo** de la slice se reemplaza: cambia un primitivo, se reconstruye un `Map`, una slice de objeto pasa a `null` |
| `"**"` | cambia **cualquier cosa** dentro de la slice, a cualquier profundidad. También coincide con la raíz, porque `**` coincide con cero segmentos |
| `"*"` | exactamente un nivel más abajo. Nunca coincide con la raíz |

**`"**"` es la suscripción a la slice completa, y funciona para toda slice sin importar su forma.**
Recurre a `""` solo cuando te refieras al valor raíz en sí; en una slice de objeto se queda
callada, porque una slice así reporta sus cambios en las hojas.

`Map` y `Set` se comparan por referencia, no por entrada: un reducer que devuelve un `Map` nuevo
es un cambio, mutar uno en el sitio no lo es. Eso se desprende del contrato de inmutabilidad en
vez de ser un caso especial. Construye una colección nueva en lugar de mutar la almacenada. Es
también la razón de que no tengan rutas debajo: `"byId"` es suscribible, `"byId.get"` no, y los
tipos lo dicen.

### Inmutabilidad

El estado se congela profundamente antes de confirmarse. Las mutaciones lanzan error en modo
estricto:

```typescript
const state = store.getState();
state.counter.value = 999; // TypeError: Cannot assign to read-only property
```

Los valores binarios son la excepción. Un typed array, un `DataView` o un `ArrayBuffer` no se
pueden congelar, así que se guardan tal cual y se tratan como un solo valor en su propia ruta,
comparado por referencia, igual que un `Map` o un `Set`. Reemplazarlo notifica su ruta una vez;
escribir dentro de él no notifica a nadie. Para cambiarlo, guarda una vista nueva (`bytes.slice()`,
o un arreglo nuevo); nunca escribas dentro de la que está en el estado. Las builds de desarrollo
avisan cuando un reducer conserva un buffer del payload del evento, incluido uno que cuelga de un
campo del payload, porque quien emitió todavía puede escribir en él.

---

## Consumo de Eventos con Matchers `When`

> **El canal y el tipo se unen en una sola clave, `"canal::tipo"`.** El despacho, la deduplicación
> y la introspección se indexan por ella, así que dos pares distintos pueden colapsar juntos:
> `("a::b", "c")` y `("a", "b::c")` se convierten los dos en `"a::b::c"`, y un suscriptor de uno se
> dispara con el otro. Un `::` en un canal está bien por sí solo (es como se le da namespace al
> canal de un par), así que las builds de desarrollo avisan de la **colisión**, no del
> separador, nombrando el store y ambos pares, una vez por store.


Los reducers, efectos y middleware usan un matcher `When` unificado para declarar a cuales
eventos responden:

```typescript
import { createStore, eventKeys } from "@yoltra/core";

type AppEM = {
  ui: { increment: number; decrement: number; reset: void };
  admin: { setCounter: number };
  system: { init: void; shutdown: void };
};

// Coincidir con claves de evento especificas (recomendado: preserva la correlacion de tipos)
const counterReducer = {
  state: { value: 0 },
  when: {
    keys: eventKeys<AppEM>()([
      ["ui", "increment"],
      ["ui", "decrement"],
    ]),
  },
  reducer: (state, event) => {
    if (event.type === "increment") return { value: state.value + event.payload };
    if (event.type === "decrement") return { value: state.value - event.payload };
    return state;
  },
};

// Coincidir con todos los eventos de un canal
const uiLogger = {
  when: { channel: "ui" },
  effect: (event) => console.log("UI event:", event.type),
};

// Coincidir con eventos de multiples canales
const auditTrail = {
  when: { channels: ["ui", "admin"] },
  effect: (event) => logToAuditTrail(event),
};

// Coincidir con TODOS los eventos
const globalLogger = {
  when: { any: true },
  middleware: (state, event) => {
    console.log(`[${event.channel}] ${event.type}`);
    return true;
  },
};

// Coincidir con canales por patrón (solo middleware): `*` representa cero o más caracteres
const rateGuard = {
  when: { channelPattern: "*::plan" }, // `bb::plan`, `peer::plan`, pero no `plan`
  middleware: (state, event) => withinBudget(event.channel),
};
```

Las primeras cuatro formas comparan de forma exacta. `channelPattern` es para canales que no se
pueden nombrar de antemano, como el `bb::plan` con namespace de un par. `*` es el único
metacarácter, y coincide como en cualquier glob: `"*plan"` también coincide con `replan`, así que un
store que tiene un `plan` local y otros con namespace necesita `"*::plan"` más una regla aparte para
el canal local. La
[Guía de Decoración](../../docs/es/DECORATION_GUIDE.md#apuntar-a-un-canal-que-no-puedes-nombrar-por-adelantado)
explica la trampa de reducir a `{ channel }` un guard que filtra a mano.

`channelPattern` es solo para middleware. Los reducers y los efectos toman las cuatro formas
exactas (`ExactWhen`), y registrar uno con un patrón lanza, igual que un `when` que no es ninguna
de las cinco formas. Antes de 0.10.0 ambos se aceptaban y no coincidían con nada.

---

## Middleware

El middleware se ejecuta **sincronamente, antes** de los reducers y puede cancelar la propagación
de eventos (devolver `false` para rechazar → evento "no confirmado"). El trabajo async va en los
efectos, no en el middleware. Cuando un evento no se confirma, `emit` dice por qué: `reason` vale
`"vetoed"`, `"deduped"` o `"cascade"`, y un veto nombra al middleware en `vetoedBy`, así que un
guard que rechaza una acción se distingue de un doble clic colapsado. Soporta tanto funciones
directas (legacy) como objetos
`MiddlewareSpec` con targeting:

```typescript
import type { MiddlewareSpec } from "@yoltra/core";

// Middleware con target: solo se ejecuta para eventos del canal admin
const adminGuard: MiddlewareSpec<AppState, AppEM> = {
  when: { channel: "admin" },
  middleware: (state, event) => {
    if (!state.auth.isAdmin) return false; // Rechazar → crea evento "no confirmado"
    return true;
  },
  meta: { type: "middleware", name: "adminGuard" },
};

// Middleware global: se ejecuta para todos los eventos. Sincrono, nunca una Promise: solo un
// `false` explicito veta, asi que un middleware que solo observa puede no devolver nada.
const logger = (state, event) => {
  console.log("Event:", event.channel, event.type);
  return true;
};

const store = createStore({
  name: "App",
  reducer: {
    /* ... */
  },
  middleware: [adminGuard, logger],
});
```

### Middleware dinámico

```typescript
const off = store.registerMiddleware((state, event) => {
  return event.type !== "forbidden";
});
off(); // Remover despues
```

---

## Efectos

Los efectos se ejecutan **después** de los reducers y ven el estado final. Están indexados por
evento para búsqueda O(1):

```typescript
// Via spec del store
const store = createStore({
  name: "App",
  reducer: {
    /* ... */
  },
  effects: [
    {
      when: {
        keys: eventKeys<AppEM>()([
          ["todos", "add"],
          ["todos", "delete"],
        ]),
      },
      effect: async (event, getState, emit) => {
        await saveToServer(getState());
      },
      meta: { type: "effect", name: "syncToServer" },
    },
  ],
});

// Registro dinamico
const off = store.registerEffect({
  when: { channel: "analytics" },
  effect: async (event) => sendToAnalytics(event),
});

// Helper de conveniencia para un solo evento
const off2 = store.onEffect("ui", "save", async (payload, getState, emit) => {
  await saveToCloud(payload);
});
```

Los efectos de un mismo evento se ejecutan **uno tras otro**, y la promesa que devuelve `emit()`
se resuelve solo cuando el último ha terminado. Un efecto lento retrasa entonces a los efectos que
le siguen para ese evento, y a lo que esté esperando ese `emit()`, pero no a otros eventos: los
efectos de cada evento corren como una tarea propia. Para trabajo que debe arrancar de inmediato y
correr en paralelo, usa [`onEvent`](#suscripciones-a-eventos), cuyos handlers se llaman sin
esperarlos.

---

## Suscripciones a Eventos

Suscríbete a eventos (no al estado) desde la capa de vista. Útil para notificaciones,
animaciones y reaccionar a eventos rechazados:

```typescript
// Eventos confirmados (por defecto): eventos que pasaron el middleware
const off = store.onEvent("ui", "save", (event, getState, emit, phase) => {
  console.log("Save committed:", event.payload);
});

// Eventos no confirmados: eventos rechazados por el middleware
store.onEvent(
  "ui",
  "delete",
  (event, getState, emit, phase) => {
    console.log("Delete was rejected");
  },
  "uncommitted",
);

// Eventos escritos: el estado cambió de verdad. Se dispara tras el commit, así que getState() está al día.
store.onEvent(
  "plan",
  "patch",
  (event, getState) => {
    console.log("applied:", getState().plan);
  },
  "written",
);

// Todos los eventos: tanto confirmados como no confirmados (no los escritos; ver abajo)
store.onEvent(
  "ui",
  "action",
  (event, getState, emit, phase) => {
    console.log(`Action ${phase}:`, event.type);
  },
  "all",
);
```

`committed` significa **no vetado**, y siempre lo ha significado: se dispara con cada evento que
el middleware dejó pasar, lo haya escrito un reducer o no, incluido cada evento de un store sin
reducers. `written` es el hecho más estricto, agregado en vez de sustituido, así que los toasts y
la analítica siguen funcionando sin cambios. `all` sigue siendo `committed | uncommitted`; meter
`written` ahí le daría a los suscriptores existentes una segunda notificación por evento.

### Suscriptores de eventos y viaje en el tiempo

**El replay no llama a tus handlers.** Recorrer una línea de tiempo de DevTools vuelve a reducir
los eventos, así que el estado sigue el recorrido, pero los handlers de `onEvent` permanecen en
silencio. Antes se ejecutaban igual que con un evento real, así que arrastrar la línea de tiempo
volvía a publicar a los pares, a escribir en sockets y a disparar analítica por eventos que no
estaban ocurriendo de nuevo, sin nada dentro del handler que permitiera notar la diferencia.

Un handler que deriva estado de vista puramente del flujo de eventos, y que no hace E/S, puede
activarlo:

```ts
store.onEvent("ui", "save", handler, "committed", { duringReplay: true });
```

`store.isReplaying` existe para lo que deba ramificar en lugar de simplemente omitirse. Los
suscriptores gruesos de `subscribe` y las suscripciones de `connect` siguen disparándose, porque
el estado sí cambió y la interfaz tiene que seguir el recorrido.

---

## Los commits son atómicos entre slices

Un evento que toca varias slices las escribe todas y después notifica. Nadie observa un evento
aplicado a medias: un suscriptor de una slice que lee `getState()` ve todas las demás slices del
mismo evento ya aplicadas.

Esto importa sobre todo donde un cambio se usa como señal para volver a leer, que es lo que hacen
los hooks de React.

---

## Un reducer ve una slice, y escribe una slice

Esto es una garantía, no una convención. A un reducer se le entrega su propia slice como `state` y
el evento, y nada más: ni `getState`, ni una referencia al store, ni ninguna slice hermana. Lo que
devuelve se escribe bajo el nombre con el que fue montado, así que no puede escribir otra slice ni
aunque devuelva un objeto con la forma del store completo.

Vale la pena decir la consecuencia, porque es fácil construir un mecanismo que no hace falta:
**dentro de una slice no hay un segundo escritor, así que no hay pregunta de autorización** — solo
la pregunta habitual de si el código de ese reducer es correcto. Dos reducers que quieran
protegerse los datos mutuamente son dos slices, y el core ya las mantiene separadas gratis.

El único efecto entre slices que tiene un reducer es rechazar el evento, que es la sección
siguiente.

---

## Rechazar una escritura

Un reducer devuelve `Rejected(reason)` en lugar de estado para declinar. **Se rechaza el evento
completo**: ninguna slice escribe, no se emite ninguna notificación de cambio, y quien llamo sabe
por que.

```typescript
import { createStore, Rejected } from "@yoltra/core";

const store = createStore({
  name: "plan",
  reducer: {
    plan: {
      state: { steps: [], version: 1 },
      when: { keys: [["plan", "patch"]] },
      reducer: (state, event) =>
        event.payload.expectedVersion === state.version
          ? { ...state, steps: event.payload.steps, version: state.version + 1 }
          : Rejected(`escritura obsoleta: esperaba v${event.payload.expectedVersion}`),
    },
  },
  onRejected: (rejection, event, slice) => metrics.increment("write.refused", { slice }),
});

const result = await store.emit("plan", "patch", { steps, expectedVersion: 1 });

result.committed; // true: el middleware lo permitio
result.written; // false: no se escribio nada
result.rejected?.reason;
```

Rechazar **no** es lo mismo que devolver el estado sin cambios, que es indistinguible de "este
evento no me concierne". Tampoco es lo mismo que lanzar: un reducer que lanza tiene un bug, así
que su slice queda aislada y las demás sí escriben, mientras que un reducer que rechaza ha tomado
una decisión a la que cede el evento entero.

`emit` resuelve a un `EmitResult` cuando terminan los efectos:

| | |
|---|---|
| `committed` | el middleware no lo vetó |
| `written` | un reducer cambió el estado de verdad |
| `rejected` | presente cuando un reducer rechazó, con su `reason` |

La fase `written` de `onEvent` reporta lo mismo a los suscriptores. `committed` sigue
significando **no vetado** y no se estrecho a proposito: se dispara para todo evento que el
middleware permite, incluidos todos los eventos de un store sin reducers, la forma que toma un
bus de notificaciones o de analítica.

---

## Petición y respuesta: `store.call()`

Todo consumidor de un bus de eventos acaba escribiendo petición/respuesta a mano: generar un id,
suscribirse, emparejar, expirar, desuscribirse. Son unas ochenta líneas y siempre traen los
mismos dos bugs: la suscripción sobrevive a la llamada, y `Quien Responde` que olvida devolver el
id produce un timeout sin nada a lo que apuntar.

```typescript
const res = await store.call("rpc", "ask", { q: "quien?" }, { reply: ["rpc", "answer"] });
res.payload.text;
```

`Quien Responde` no hace nada especial. Responde con el `emit` que recibio, la marca de padre del
store correlaciona ambos: **no hay id que generar, devolver ni olvidar**.

```typescript
store.registerEffect({
  when: { keys: [["rpc", "ask"]] },
  effect: async (event, _get, emit) => {
    await emit("rpc", "answer", await lookup(event.payload.q));
  },
});
```

### Una llamada resuelve al evento, no al payload

Porque muchas veces quien llama no sabe *cuál* respuesta va a recibir. `reply` nombra los tipos
**terminales**, y el evento trae el discriminante:

```typescript
const res = await store.call("rpc", "ask", { q }, { reply: ["rpc", ["answer", "error"]] });

switch (res.type) {
  case "answer": return res.payload.text;
  case "error": throw new Error(res.payload.reason);
}
```

### El progreso se transmite, y el productor espera

Cualquier evento correlacionado que **no** sea terminal es progreso. Itera la llamada para
consumirlo:

```typescript
const call = store.call("job", "start", { id }, { reply: ["job", "done"], highWaterMark: 4 });

for await (const step of call) await render(step.payload);
const { payload } = await call;
```

La contrapresión es real, no un buffer con límite. `emit` resuelve solo cuando terminan sus
efectos, y el colector es un efecto que no retorna hasta que el consumidor tomo el elemento, así
que un `Quien Responde` que escribe `await emit("job", "tick", chunk)` **va al ritmo del lector**:

```typescript
effect: async (_event, _get, emit) => {
  for (const chunk of chunks) {
    await emit("job", "tick", chunk); // espera aquí mientras el consumidor va atrasado
  }
  await emit("job", "done", { ok: true });
}
```

La contrapresión entra en juego **cuando empiezas a iterar**. Una llamada que solo se espera con
`await` nunca extrae nada, así que bloquear a su productor causaría un interbloqueo de la propia
llamada: el progreso que nadie lee impediría que se enviara el evento terminal. Por eso el
progreso no iterado se almacena hasta `highWaterMark` y después se cuenta en `call.dropped`.

### Rendirse

| | |
|---|---|
| `timeoutMs` | **Inactividad**, no total: todo evento correlacionado lo reinicia, incluido el progreso. Un trabajo que transmite durante dos minutos no hace fallar una llamada de treinta segundos. Por defecto 30s. |
| `signal` | Un `AbortSignal`, para una fecha límite real o una acción cancelada. |
| `call.cancel(reason)` | Deja de escuchar y liquida la llamada. Llamarla dos veces es seguro. |

Termine como termine, ya sea resuelta, por timeout o abortada, la suscripción se elimina y se libera cualquier productor detenido por la
contrapresión. Un `Quien Responde` atascado es peor que el buffer sin límite que esto reemplazo.

### Para profundizar

La superficie exportada es `ReplySpec`, `CallOptions`, `CallHandle`, `CallTimeoutError` y
`CallAbortedError`. Dos cosas que esta sección no cubre:

- **`correlationId`**, para un `Quien Responde` que no puede contestar directamente — porque lo hace
  en un turno posterior, o a través de un worker o de la red. Por defecto amplía la coincidencia para
  incluir un id devuelto y la comprobación del padre se sigue ejecutando primero; `correlation: "id"`
  correlaciona solo por el id devuelto.
- **Cómo probar una llamada**, y el resto del detalle, en la
  [guía de Petición y Respuesta](https://github.com/yoltra/yoltra/blob/main/docs/es/REQUEST_REPLY_GUIDE.md).

---

## Leer un valor al suscribirse

`connect` empieza en "de ahora en adelante", así que la primera lectura había que repetirla en
otro lado: la misma ruta en dos sitios, libres de divergir:

```typescript
store.connect({ reducer: "todos", property: "items.0.title" }, render, { immediate: true });
```

El primer cambio sintético trae `oldValue: undefined` y **sin procedencia**, porque ningún evento
lo causó. Para un patrón con wildcard, que no tiene un único valor actual, se entrega la raíz de la
slice con `path: ""`.

React no lo necesita: `useSyncExternalStore` ya lee una instantánea al montar.

---

## De dónde vino un cambio

Un `Change` nombra el evento que lo causó, así que un suscriptor ya no tiene que duplicar la causa
dentro del estado:

```typescript
store.connect({ reducer: "orders", property: "status" }, (change) => {
  audit.record(change.path, change.newValue, {
    causedBy: change.eventId,
    via: `${change.channel}/${change.type}`,
  });
});
```

La procedencia está **ausente** cuando ningún evento causó el cambio: un salto de time-travel de
DevTools, o la entrega `immediate` de arriba. La ausencia es la señal, en vez de un id inventado.

---

## Deduplicación de Eventos (opt-in)

La deduplicación está **desactivada por defecto**. Yoltra nunca descarta en silencio eventos
idénticos legítimos y rápidos (doble-clics, `+1` repetidos). Actívala solo cuando de verdad quieras
coalescer:

```typescript
// Por contenido: coalescer (channel, type, payload) identicos dentro de una ventana.
const store = createStore({
  name: "App",
  reducer: {
    /* ... */
  },
  dedupWindowMs: 100, // default: 0 (desactivado)
});

// Por identidad: dedup por una clave explicita, p. ej. un doble-invoke de React Strict Mode en un efecto.
await store.emit("analytics", "pageView", { page }, { dedupKey: `pageView:${page}` });
```

---

## Tiempo y timers

Un store lee la hora a través de un puerto y arma sus timers a través de otro, y ambos se pueden
reemplazar. Con los valores por defecto escritos:

```typescript
const store = createStore({
  name: "app",
  reducer: { /* ... */ },
  clock: { now: () => Date.now() },
  scheduler: {
    setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
    clearTimeout: (handle) => clearTimeout(handle),
  },
});
```

`clock` decide las ventanas de deduplicación y marca `InstrumentedEvent.at`. `scheduler` arma la
limpieza de la caché de deduplicación y el timeout de inactividad de `store.call()`; `persist` toma
su propia opción `scheduler`. Las duraciones como `reduceTimeMs` se miden con `performance.now()` en
cualquier caso.

Los valores por defecto buscan los globales cada vez que se usan, así que `vi.useFakeTimers()`
funciona aunque se instale después de construir el store. Inyecta los tuyos para controlar el
tiempo sin falsear globales, o para darle a todas las bibliotecas que configura un host el mismo
reloj y los mismos timers. Sus métodos se llaman como métodos, así que una instancia de clase
funciona.

---

## Protección contra cascadas (activada por defecto)

Dos consumidores conectados entre sí, ya sea un suscriptor que emite lo que su propio reducer atiende o
dos slices que atienden los eventos de la otra, producen una cadena de eventos sin final. La cola
de reducción se drena de forma **síncrona**, así que eso no es un programa lento: es una pestana
congelada, o un core al 100%, sin error ni stack al que apuntar.

Por eso cada evento lleva su posición causal, y el store se niega a extender una cadena más allá
de un tope:

```typescript
const store = createStore({
  name: "app",
  reducer: { ... },

  // Por defecto 64. Acotado configures o no: un fallo tan grave no deberia exigir
  // configuracion para evitarse. Usa Infinity para renunciar a el conscientemente.
  maxReduceDepth: 64,

  onCascade: ({ event, depth, chain }) => {
    report(`cascada en ${event.channel}/${event.type}, profundidad ${depth}`, chain);
  },
});
```

Un evento emitido mientras se atiende otro está un nivel más abajo que su causa, y lleva
`parentId` y `depth` para que el ciclo sea legible después:

```typescript
store.onEvent("plan", "patch", (event) => {
  event.depth;     // 0 para un evento emitido por código de la aplicación
  event.parentId;  // undefined en profundidad 0; debajo, el id del evento que lo causó
});
```

Ambos campos están **ausentes** en un evento raíz, en vez de presentes como `0`/`undefined`, así
que los eventos que emite tu aplicación siguen siendo idénticos byte a byte a como eran antes.

Superar el tope no lanza. El emit ofensor se rechaza, lo ya confirmado se mantiene, y `onCascade`
(más un error en consola) lo nombra. Lanzar aparecería en el suscriptor o efecto que casualmente
estuviera emitiendo, que es justo el fallo inatribuible que el tope existe para evitar.

**Una ráfaga ancha no es una cascada.** Un evento cuyo suscriptor emite quinientos hermanos es una
forma legítima; la profundidad es lo que la distingue de un ciclo, y un bucle normal de
`store.emit` nunca acumula profundidad, porque cada llamada se drena por completo antes de la
siguiente, así que cada una es una raíz. `maxTransitionsPerDrain` acota el *ancho* de la ráfaga y
por eso viene desactivado; el evento que inicia un drenado nunca es rechazado por él.

---

## Reducers Dinámicos

Agrega o elimina slices de reducer en tiempo de ejecución:

```typescript
const dispose = store.registerReducer("filters", {
  state: { q: "" },
  when: { keys: eventKeys<AppEM>()([["ui", "setQuery"]]) },
  reducer: (state, event) => (event.type === "setQuery" ? { q: event.payload } : state),
});

// Despues: remover el slice y su estado
dispose();
```

### Decorar un store, con sus tipos

Una slice agregada en runtime era invisible para el sistema de tipos: `registerReducer`
recibía un `string` y devolvía un disposer, así que nada aguas abajo sabía que la slice
existía ni qué forma tenía. `withSlice` devuelve **el mismo store, re-tipado**:

```typescript
type FlagsEM = { flag: { enabled: { id: string } } };

const flags = defineSlice<FlagsEM>()({
  state: { enabled: [] as string[] },
  when: { keys: [["flag", "enabled"]] },
  reducer: (s, e) => (e.type === "enabled" ? { enabled: [...s.enabled, e.payload.id] } : s),
});

const app = store.withSlice("flags", flags, { owner: "@scope/flags" });

app.getState().flags.enabled; // string[]
app.emit("flag", "enabled", { id: "a1" }); // el canal nuevo ya es emitible
```

`withMiddleware` y `withEffect` hacen lo mismo para el mapa de eventos. Las llamadas se
encadenan, y una librería publica un decorador tomando un store y devolviendo otro:

```typescript
export function withFlags<R extends string, S extends Record<R, any>, EM extends EventMapBase>(
  store: StoreInstance<R, S, EM>,
  config: FlagsConfig,
) {
  return store.withSlice("flags", flags, { owner: "@scope/flags" });
}

// Los decoradores se anidan, en cualquier orden.
const decorated = withFlags(withDevtools(store, dtConfig), config);
```

**Por qué los builders.** El `when` de un spec lleva cadenas de canal y tipo, no tipos de
payload, así que el mapa de eventos que aporta una decoración no puede inferirse de ahí, y
TypeScript no tiene inferencia parcial de argumentos de tipo. `defineSlice<EM>()` lo coloca en
posición de valor, donde la inferencia sí funciona, así que ningún sitio de registro necesita
un argumento de tipo ni un cast. Una consecuencia que conviene conocer: **una función de
middleware sin spec nunca puede ampliar el mapa de eventos**, porque el parámetro de evento de
`MiddlewareFunction` es un tipo mapeado del que no se puede inferir nada de vuelta. Solo la
forma de spec de `defineMiddleware` puede.

**Es el mismo objeto.** Nada se vuelve a suscribir, ningún estado se mueve, y una llamada
`store.call()` en vuelo no se ve afectada. Solo cambia el tipo.

**Orden.** Decora en el ámbito del módulo, una vez, antes del primer render. Entre
`createStore` y la decoración la slice realmente no existe, y un componente que la lea verá
`undefined` hasta que exista.

**Disposición.** `withSlice` no devuelve disposer a propósito: después de ejecutarlo, el tipo
ampliado sigue prometiendo una slice que ya no está, y ningún sistema de tipos puede expresar
"válido hasta esa llamada". Usa `registerSlice` cuando la slice sea tuya y necesites
desmontarla, y mantén ese disposer privado a la librería. Leer una slice desmontada lanza un
error con nombre en desarrollo, en lugar de devolver `undefined` desde un tipo que prometía un
valor.

---

## Hot Module Replacement

```typescript
if (import.meta.hot) {
  import.meta.hot.accept("./reducers", (mod) => {
    store.replaceReducers(mod.reducers, { preserveState: true });
  });

  import.meta.hot.accept("./middleware", (mod) => {
    store.replaceMiddleware(mod.middleware);
  });

  import.meta.hot.accept("./effects", (mod) => {
    store.replaceEffects(mod.effects);
  });

  // O reemplazar todo de una vez
  store.hotReplace({
    reducer: newReducers,
    middleware: newMiddleware,
    effects: newEffects,
    preserveState: true,
  });
}
```

### `replace*` reemplaza lo que tú escribiste, no lo que agregó una librería

Un reducer, middleware o efecto registrado **después** de la construcción, con
`registerReducer`, `registerMiddleware` o `registerEffect`, sobrevive a una llamada a
`replace*`. Esos registros nunca formaron parte del conjunto que estás reemplazando: nadie que
escribe `replaceReducers(myReducers)` quiere decir "y ademas borra la slice que montó devtools,
junto con su estado".

Antes ocurría lo contrario, lo que hacía que la línea de HMR de arriba borrara la slice de una
librería y su estado al primer guardado de archivo, sin error y sin advertencia. Es también la
razón por la que una llamada `store.call()` en vuelo ya no muere a mitad de recarga: su
listener de respuesta pertenece al propio store.

Pasa `{ scope: "all" }` para el comportamiento anterior, que un arnés de pruebas que reinicia un
store entre casos sí puede querer:

```typescript
store.replaceReducers(nextReducers, { scope: "all" });
store.hotReplace({ reducer: nextReducers, scope: "all" }); // se reenvía a los tres
```

Una aplicación que declara una slice que una librería ya montó recibe un error que nombra la
slice, en lugar de una apropiación silenciosa que deja a la librería con un disposer de algo que
ya no es suyo. En desarrollo, `replace*` registra en nivel debug cuando preservó algo, así que
"por qué sigue disparándose ese efecto tras la recarga" tiene respuesta.

---

## Mejores Prácticas

### El estado es síncrono; haz `await` solo por los efectos

La fase de reducción es síncrona, así que el estado refleja tu evento en el instante en que `emit()`
retorna, sin `await` para leerlo. Haz `await` de `emit()` cuando además quieras que los efectos de
_ese evento_ hayan terminado:

```typescript
emit("todo", "add", todo);
store.getState(); // Ya refleja la nueva tarea. Sin await

await emit("todo", "save", todo); // se resuelve cuando terminan los efectos de save
```

### Mantener los reducers rápidos

Los reducers son síncronos y corren en el mismo tick que `emit()`. Mueve el trabajo costoso a los
efectos:

```typescript
// Reducer: solo establecer un flag de carga
reducer: ((state, event) => ({ ...state, loading: true }),
  // Efecto: hacer el trabajo pesado
  store.onEffect("data", "compute", async (payload, getState, emit) => {
    const result = await computeAsync();
    await emit("data", "computeComplete", result);
  }));
```

### Manejar errores de efectos

```typescript
store.registerEffect({
  when: { channel: "data" },
  effect: async (event, getState, emit) => {
    try {
      const data = await fetch(url);
      await emit("data", "loadSuccess", data);
    } catch (error) {
      await emit("data", "loadFailure", { error: error.message });
    }
  },
});
```

---

## Errores y diagnósticos

Un store contiene cada fallo del código que ejecuta: un reducer, efecto, suscriptor o middleware
que lanza se reporta, y el resto del evento sigue su curso. También rechaza cosas (una cascada, un
reducer que declina una escritura) y, en desarrollo, avisa de errores que puede ver. Todo eso es un
`Diagnostic`:

```typescript
type Diagnostic = {
  level: "info" | "warn" | "error";
  code: DiagnosticCode;          // estable: "effect-error", "reducer-error", "cascade", ...
  message: string;               // para una persona; puede cambiar de redacción
  detail?: Record<string, unknown>; // el evento, el error, el slice
};
```

**Quien es dueño del store decide a dónde van**, una sola vez:

```typescript
const store = createStore({
  name: "app",
  reducer: { /* ... */ },
  diagnostics: (d) => logger[d.level](d.code, d.message, d.detail),
});
```

Sin `diagnostics`, el store escribe en la consola exactamente como siempre. Con él, el sink
reemplaza esa salida. Los hooks `onEffectError`, `onReducerError`, `onSubscriberError`, `onCascade`
y `onRejected` se siguen llamando en ambos casos.

**Cualquier otro observa**, en cualquier momento, sin silenciar nada:

```typescript
const off = store.onDiagnostic((d) => {
  if (d.level === "error") metrics.count(d.code);
});
```

Esta es la costura para código conectado a un store que no creó, que no puede fijar los hooks.
Los avisos de desarrollo nunca se envían en producción, y un sink u observador que lanza se ignora.

---

## Resumen de API

### Creación del Store

| API                                             | Descripción                                           |
| ----------------------------------------------- | ----------------------------------------------------- |
| `createStore(spec)`                             | Crear un store (tipos inferidos de los reducers)      |
| `createStore<S, EM>(spec)`                      | Crear un store con tipos de estado/eventos explícitos |
| `store.emit(channel, type, payload)`            | Emitir un evento (retorna una promesa)                |
| `store.getState()`                              | Obtener snapshot del estado actual (solo lectura)     |
| `store.subscribe(listener)`                     | Suscripción gruesa (cualquier cambio de estado)       |
| `store.connect(spec, handler)`                  | Suscripción de grano fino por ruta con wildcards      |
| `store.onEvent(channel, type, handler, phase?, options?)` | Suscripción a eventos (committed/uncommitted/written/all). Silenciosa durante el replay salvo `{ duringReplay: true }` |
| `store.onRegistrationChange(observer, opts?)` | Avisa cuando el store gana o pierde un reducer, middleware o efecto. Cada cambio lleva `when`, el matcher normalizado: `{ keys }` para un slice con claves, `{ any: true }` para middleware sin filtro |
| `store.onEffect(channel, type, handler)`        | Shorthand de efecto para un solo evento               |
| `store.onDiagnostic(observer)`                  | Observa fallos, rechazos y avisos de desarrollo. Ver [Errores y diagnósticos](#errores-y-diagnósticos) |
| `store.dispose()`                               | Limpiar timers y recursos                             |

### Registro Dinámico

| API                                 | Descripción                               |
| ----------------------------------- | ----------------------------------------- |
| `store.registerSlice(name, spec, opts?)` | Agrega un slice en runtime; devuelve el store re-tipado y un disposer |
| `store.withSlice(name, spec, opts?)` | Igual, devolviendo el store re-tipado para encadenar |
| `store.withMiddleware(mw)`, `store.withEffect(spec)` | Registra y amplía el mapa de eventos |
| `defineSlice<EM>()`, `defineMiddleware<EM>()`, `defineEffect<EM>()` | Declara el mapa de eventos que aporta un spec |
| `store.registerReducer(name, spec)` | Agregar un slice en tiempo de ejecución. Es genérico sobre su spec, así que una decoración puede montar un slice en un canal que el mapa de eventos de la app no tiene, sin cast |
| `store.registerMiddleware(fn)`      | Agregar middleware en tiempo de ejecución |
| `store.registerEffect(spec)`        | Agregar un efecto en tiempo de ejecución  |

### HMR

| API                                     | Descripción                                 |
| --------------------------------------- | ------------------------------------------- |
| `store.replaceReducers(reducers, opts)`     | Reemplaza los reducers del spec; los de runtime sobreviven salvo `{ scope: "all" }` |
| `store.replaceMiddleware(middleware, opts)` | Reemplaza el middleware del spec; misma regla |
| `store.replaceEffects(effects, opts)`       | Reemplaza los efectos del spec; misma regla   |
| `store.hotReplace(partial)`                 | Reemplaza cualquier subconjunto; reenvía `scope` |

### Helpers

| API                      | Descripción                                                      |
| ------------------------ | ---------------------------------------------------------------- |
| `eventKeys<EM>()([...])` | Arrays de claves de evento con seguridad de tipos sin `as const` |

---

## Guardar y restaurar estado

Dos funciones, porque las dos mitades ocurren en lados opuestos de la existencia del store.
`hydrate` produce el *estado inicial de las slices*, así que el store nace con él:

```ts
import { createStore, createWebStorageAdapter, hydrate, persist, withHydration } from '@yoltra/core';

const adapter = createWebStorageAdapter(localStorage);
const hydration = await hydrate({ key: 'app', adapter, version: 3 });

const store = createStore({
  name: 'App',
  reducer: withHydration({ todos: todosSpec, ui: uiSpec }, hydration),
});

const stop = persist(store, { key: 'app', adapter, version: 3, slices: ['todos'] });
```

Restaurar *después* de construir es la alternativa obvia y la equivocada: aplicar una
instantánea a un store vivo emite un cambio en todas las rutas, lo que en el arranque es un
parpadeo, una ráfaga de entradas de instrumentación que describen cambios que nadie hizo, y
efectos observando una transición que nunca ocurrió.

**Nada lanza en el arranque.** Un payload ausente, ilegible o no migrable recae en los valores
por defecto que declaraste y se reporta por `onError`. Un store que no arranca porque el
almacenamiento guarda JSON obsoleto es peor que uno que arranca de cero, y un disco lleno no
debería tumbar una página, así que los fallos de escritura se reportan igual en vez de lanzarse.

**Las versiones que no coinciden se rechazan, no se asumen.** Los reducers cambian, y una
instantánea escrita contra una forma anterior puede no ser estado válido para este build en
absoluto. Aporta `migrate` para actualizarla, o se descarta.

Las escrituras las dirige la instrumentación, así que un cambio confinado a una slice que no
estás persistiendo no cuesta nada, y una ráfaga se agrupa en una sola escritura. `Map`, `Set`,
`Date`, `BigInt`, `undefined` y las referencias circulares sobreviven al viaje de ida y vuelta:
`JSON.stringify` no falla con eso, los destruye en silencio.

Para un render en servidor, `dehydrate(store, { version })` produce el payload y
`hydrate({ source, version })` lo consume.

---

## Listas que se reordenan

La notificación por ruta es posicional para los arrays. `items.0.title` nombra un *hueco*, no
una cosa, así que `unshift`, `splice(0, 1)` y `sort` mueven casi todos los elementos a un hueco
distinto, y el diff reporta correctamente que casi todas las hojas cambiaron. Insertar una fila
al principio de mil despierta a mil suscriptores.

Eso es honesto en vez de ruidoso: con rutas posicionales el valor de casi cada índice cambió de
verdad. El remedio es la forma del estado, no un diff que se calle.

```ts
import { createEntityAdapter } from '@yoltra/core';

const todos = createEntityAdapter<Todo>();

// state is { ids: [...], entities: { abc: {...} } }
todos.updateOne(state, { id: 'abc', changes: { done: true } });

// and the adapter hands out the paths, so they are never typed by hand
todos.pathTo('abc', 'title');  // "entities.abc.title"
todos.idsPath;                 // "ids"
```

`entities.abc.title` sobrevive a insertar, eliminar y reordenar. Un contenedor de lista se
suscribe a `ids` y reordena sus hijos; las filas se suscriben a su propia entidad y siguen
dormidas durante un `sort`.

`ids` sigue siendo un array, así que un reordenamiento todavía reporta `ids.0`, `ids.1` y así
sucesivamente. Ese costo queda confinado, no eliminado. Lo que ganas es un costo proporcional a
lo que realmente cambió.

Para una lista pequeña que solo crece por el final, `items.0.title` está bien y es más simple.
El adapter es para colecciones que se reordenan, o que son lo bastante grandes como para que la
diferencia se note.

### Lo que cuesta, medido

Con 1000 filas, hacer el diff después de una inserción al principio cuesta unos 890 µs para un
array y 77 µs normalizado, y el array reporta alrededor de mil rutas cambiadas frente a dos. Ese
es el caso para el que existe el adapter.

Una actualización de un solo campo va al revés: unos 2 µs para el array frente a 83 µs
normalizado. `detectChangedProps` llega a la fila cambiada de un array por su índice, pero en un
objeto tiene que leer las dos listas de claves y confirmar que la forma no cambió antes de poder
saltarse las entidades que no se movieron, así que un mapa de entidades ancho cuesta en
proporción a su ancho aunque solo haya cambiado un campo. Las cifras salen de
`benchmarks/detect-changed-props.bench.ts` en una sola máquina: compáralas entre sí, no con tu
hardware.

Así que: normaliza las colecciones que se reordenan o que rotan mucho. Una colección grande a la
que solo se le editan campos individuales está mejor como array hoy.

---

## Rendimiento

| Métrica               | Valor                                     |
| --------------------- | ----------------------------------------- |
| **Tamaño del bundle** | Medido en cada build, ver la tabla abajo |
| **Tree-shakeable**    | Sí (módulos ES)                           |
| **Dependencias**      | Cero                                      |
| **TypeScript**        | Definiciones de tipos completas incluidas |

El tamaño del bundle se verifica, no se afirma: `rush size` empaqueta el paquete como lo haría
un consumidor (sacudido, minificado, comprimido con gzip) y falla cuando excede el
presupuesto declarado en `package.json`. La tabla de abajo la escribe esa misma verificación,
así que no puede desviarse de lo que se midió; editarla a mano hace fallar el CI.

La cifra que importa es lo que importas, no lo que el paquete exporta:

<!-- size-table:start -->
| Import | Tamaño | Presupuesto |
| --- | --- | --- |
| `{ createStore }` | 13.2 KB | 15 KB |
| `{ createStore, hydrate, persist }` | 14.5 KB | 16 KB |
| todo | 16.0 KB | 18 KB |
<!-- size-table:end -->

Estas son cifras de **producción**: lo que publicas una vez que tu empaquetador define
`NODE_ENV=production` y las guardas exclusivas de desarrollo desaparecen. La columna de
presupuesto es el techo que `rush size` impone, y se verifica contra un build de desarrollo,
que es el mayor de los dos: el código exclusivo de desarrollo no puede crecer sin que nadie lo
note solo porque nunca llega a un usuario. Por eso el margen que se infiere aquí es
deliberadamente conservador.

La **distancia entre filas** es la afirmación de tree-shaking, y es lo que hay que vigilar: la
persistencia añade 1.3 KB a quienes la importan y nada a los demás, y el barrel completo está
2.8 KB por encima del store. La última fila es un detector de crecimiento; `import * as all` no
es algo que nadie escriba.

La primera fila solo se mueve cuando crece el store en sí, y ha crecido: acotar las cascadas,
preparar los commits para que se apliquen de forma atómica y `store.call()` son maquinaria del
store, no módulos opcionales, así que los paga todo el mundo. Es el intercambio honesto por un
comportamiento por defecto que impide que un desbocado cuelgue la pestaña.

Un presupuesto solo se mueve por lo que se midió, y dice por qué. En 0.10.0 el presupuesto de
`createStore` pasó de 14 KB a 15 KB por la costura de diagnósticos
([Errores y diagnósticos](#errores-y-diagnósticos)), que midió 0.6 KB: un helper de enrutamiento
y una frase por cada fallo que el store contiene.

---

## Documentación

- **[README raíz de yoltra](../../README.md)**:
  Descripción general y configuración rápida
- **[@yoltra/react](../react/README.md)**:
  Hooks de React y Suspense
- **[Guia de Inicio Rápido](https://github.com/yoltra/yoltra/blob/main/docs/es/QUICK_START_GUIDE.md)**:
  Cinco pasos hacia una app funcional
- **[Actualizar a 0.10.0](https://github.com/yoltra/yoltra/blob/main/docs/es/UPGRADE_0.10.md)**:
  Un matcher que nunca podría coincidir ahora lanza, y cuatro arreglos menores
- **[Actualizar a 0.8.0](https://github.com/yoltra/yoltra/blob/main/docs/es/UPGRADE_0.8.md)**:
  Cinco cambios de comportamiento, y un riesgo si haces rollback
- **[Guía de Decoración](https://github.com/yoltra/yoltra/blob/main/docs/es/DECORATION_GUIDE.md)**:
  Agregar una slice, middleware o efecto al store de alguien más, con los tipos
- **[Arquitectura de Cola de Eventos](https://github.com/yoltra/yoltra/blob/main/docs/es/design/event-queue-architecture.md)**:
  Inmersión técnica profunda
- **[Comparación de Bibliotecas](https://github.com/yoltra/yoltra/blob/main/docs/es/design/state-management-library-comparison.md)**:
  Comparación arquitectónica

---

## Ejemplos

- **[App de Tareas](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react)**:
  CRUD completo con perfilado de rendimiento · [▶ Abrir la demo en vivo](https://yoltra.dev/es/demos/in-react)
- **[Logo Cinético](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-kinetic-logo)**:
  3000 círculos con simulación física. · [▶ Abrir la demo en vivo](https://yoltra.dev/es/demos/kinetic-logo)
- **[Integración con Next.js](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-nextjs)**:
  Pages Router, estado de cliente + cambio de tema · [▶ Abrir la demo en vivo](https://yoltra.dev/es/demos/in-nextjs)

---

## Contribuir

- [Raíz del Monorepo](../../README.md)
- [Guia de Contribución](https://github.com/yoltra/yoltra/blob/main/CONTRIBUTING.md)

---

## Estado

**Release Candidate**. Las APIs son estables, usadas en producción, cambios menores posibles
antes de v1.0.0.

---

## Licencia

**MIT**. Libre para usar en proyectos comerciales y de código abierto.
