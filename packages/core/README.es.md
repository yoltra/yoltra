![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/core

> 👉 🇲🇽 Versión en Español&nbsp; |
> &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp;

![npm downloads](https://badgen.net/npm/dm/@yoltra/core)
![License](https://badgen.net/npm/license/@yoltra/core)

**Contenedor de estado orientado a eventos, agnostico de framework, con suscripciones de grano
fino por ruta.**

`@yoltra/core` es la base de [yoltra](../../README.md).
Proporciona el store, el pipeline de eventos, middleware, efectos y el sistema de suscripciones
`connect()`. Cero dependencias de framework.

---

## Instalacion

```bash
npm install @yoltra/core
```

---

## El Pipeline de Eventos

Cada llamada a `emit()` fluye a traves de un pipeline determinista:

```
emit(channel, type, payload)
  │
  ├─ 0. Dedup (opt-in) ─── Omite un duplicado solo si dedupWindowMs > 0 o se pasa un dedupKey
  │
  │  ══ fase de reduccion SINCRONA — corre antes de que emit() retorne ══
  ├─ 1. Middleware ─── Hooks pre-reducer sincronos (devolver false para rechazar → evento "no confirmado")
  ├─ 2. Reducers ─── Cada slice que aplica se prepara, y todas se confirman bajo una sola raiz
  ├─ 3. Suscriptores de eventos ─── Notificaciones de eventos confirmados/no confirmados
  ├─ 4. Suscriptores gruesos ─── Listeners externos del store (useSyncExternalStore, etc.), si el estado cambio
  │
  └─ 5. Efectos ─── Efectos secundarios ASYNC, una tarea independiente por evento (indexados para busqueda O(1))
```

La fase de reduccion (1–4) es **sincrona**, asi que `getState()` es correcto en el instante en que
`emit()` retorna — incluso con middleware. Los efectos (5) corren despues como una tarea async
independiente; la promesa de `emit()` se resuelve cuando terminan los efectos de ese evento. Cada
etapa es interceptable, y `store.instrument()` expone todo el flujo — rutas hoja cambiadas, tiempos
de reduccion, fase confirmado/rechazado — a las DevTools sin ningun `as any`. Ver la
[Arquitectura del Pipeline de Eventos](../../docs/es/design/event-queue-architecture.md) para el
modelo completo.

---

## Conceptos Fundamentales

### Eventos basados en canales

Los eventos son tuplas `(channel, type, payload)`. Los canales proporcionan namespacing natural
que escala en bases de codigo grandes:

```typescript
await store.emit("auth", "login", credentials);
await store.emit("analytics", "track", { event: "page_view" });
await store.emit("ui", "toast", { message: "Saved!" });
```

### Suscripciones de grano fino via `connect()`

Suscribete a rutas de estado exactas usando notacion de puntos. Soporta wildcards `*` (un
segmento) y `**` (cero o mas segmentos):

```typescript
// Ruta exacta — se dispara cuando items[0].title cambia
store.connect({ reducer: "todos", property: "items.0.title" }, (change) =>
  console.log("title:", change.oldValue, "→", change.newValue),
);

// Wildcard de un segmento — se dispara cuando el titulo de CUALQUIER item cambia
store.connect({ reducer: "todos", property: "items.*.title" }, (change) =>
  console.log("some title changed at", change.path),
);

// Wildcard profundo — se dispara cuando algo bajo items cambia
store.connect({ reducer: "todos", property: "items.**" }, (change) =>
  console.log("items tree changed at", change.path),
);
```

### Inmutabilidad

El estado se congela profundamente antes de confirmarse. Las mutaciones lanzan error en modo
estricto:

```typescript
const state = store.getState();
state.counter.value = 999; // TypeError: Cannot assign to read-only property
```

---

## Consumo de Eventos con Matchers `When`

Los reducers, efectos y middleware usan un matcher `When` unificado para declarar a cuales
eventos responden:

```typescript
import { createStore, eventKeys } from "@yoltra/core";

type AppEM = {
  ui: { increment: number; decrement: number; reset: void };
  admin: { setCounter: number };
  system: { init: void; shutdown: void };
};

// Coincidir con claves de evento especificas (recomendado — preserva la correlacion de tipos)
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
```

---

## Middleware

El middleware se ejecuta **sincronamente, antes** de los reducers y puede cancelar la propagacion
de eventos (devolver `false` para rechazar → evento "no confirmado"). El trabajo async va en los
efectos, no en el middleware. Soporta tanto funciones directas (legacy) como objetos
`MiddlewareSpec` con targeting:

```typescript
import type { MiddlewareSpec } from "@yoltra/core";

// Middleware con target — solo se ejecuta para eventos del canal admin
const adminGuard: MiddlewareSpec<AppState, AppEM> = {
  when: { channel: "admin" },
  middleware: (state, event) => {
    if (!state.auth.isAdmin) return false; // Rechazar → crea evento "no confirmado"
    return true;
  },
  meta: { type: "middleware", name: "adminGuard" },
};

// Middleware global — se ejecuta para todos los eventos (sincrono: devuelve un boolean, nunca una Promise)
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

### Middleware dinamico

```typescript
const off = store.registerMiddleware((state, event) => {
  return event.type !== "forbidden";
});
off(); // Remover despues
```

---

## Efectos

Los efectos se ejecutan **despues** de los reducers y ven el estado final. Estan indexados por
evento para busqueda O(1):

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

---

## Suscripciones a Eventos

Suscribete a eventos (no al estado) desde la capa de vista. Util para notificaciones,
animaciones y reaccionar a eventos rechazados:

```typescript
// Eventos confirmados (por defecto) — eventos que pasaron el middleware
const off = store.onEvent("ui", "save", (event, getState, emit, phase) => {
  console.log("Save committed:", event.payload);
});

// Eventos no confirmados — eventos rechazados por el middleware
store.onEvent(
  "ui",
  "delete",
  (event, getState, emit, phase) => {
    console.log("Delete was rejected");
  },
  "uncommitted",
);

// Todos los eventos — tanto confirmados como no confirmados
store.onEvent(
  "ui",
  "action",
  (event, getState, emit, phase) => {
    console.log(`Action ${phase}:`, event.type);
  },
  "all",
);
```

---

## Los commits son atomicos entre slices

Un evento que toca varias slices las escribe todas y despues notifica. Nadie observa un evento
aplicado a medias: un suscriptor de una slice que lee `getState()` ve todas las demas slices del
mismo evento ya aplicadas.

Esto importa sobre todo donde un cambio se usa como senal para volver a leer, que es lo que hacen
los hooks de React.

---

## Rechazar una escritura

Un reducer devuelve `Rejected(reason)` en lugar de estado para declinar. **Se rechaza el evento
completo**: ninguna slice escribe, no se emite ninguna notificacion de cambio, y quien llamo sabe
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

result.committed; // true — el middleware lo permitio
result.written; // false — pero no se escribio nada
result.rejected?.reason;
```

Rechazar **no** es lo mismo que devolver el estado sin cambios, que es indistinguible de "este
evento no me concierne". Tampoco es lo mismo que lanzar: un reducer que lanza tiene un bug, asi
que su slice queda aislada y las demas si escriben, mientras que un reducer que rechaza ha tomado
una decision a la que cede el evento entero.

`emit` resuelve a un `EmitResult` cuando terminan los efectos:

| | |
|---|---|
| `committed` | el middleware no lo veto |
| `written` | un reducer cambio el estado de verdad |
| `rejected` | presente cuando un reducer rechazo, con su `reason` |

La fase `written` de `onEvent` reporta lo mismo a los suscriptores. `committed` sigue
significando **no vetado** y no se estrecho a proposito: se dispara para todo evento que el
middleware permite, incluidos todos los eventos de un store sin reducers — la forma que toma un
bus de notificaciones o de analitica.

---

## Peticion y respuesta — `store.call()`

Todo consumidor de un bus de eventos acaba escribiendo peticion/respuesta a mano: generar un id,
suscribirse, emparejar, expirar, desuscribirse. Son unas ochenta lineas y siempre traen los
mismos dos bugs: la suscripcion sobrevive a la llamada, y un respondedor que olvida devolver el
id produce un timeout sin nada a lo que apuntar.

```typescript
const res = await store.call("rpc", "ask", { q: "quien?" }, { reply: ["rpc", "answer"] });
res.payload.text;
```

El respondedor no hace nada especial. Responde con el `emit` que recibio, y la marca causal del
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

Porque muchas veces quien llama no sabe *cual* respuesta va a recibir. `reply` nombra los tipos
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

La contrapresion es real, no un buffer con limite. `emit` resuelve solo cuando terminan sus
efectos, y el colector es un efecto que no retorna hasta que el consumidor tomo el elemento — asi
que un respondedor que escribe `await emit("job", "tick", chunk)` **va al ritmo del lector**.

La contrapresion entra en juego **cuando empiezas a iterar**. Una llamada que solo se espera con
`await` nunca extrae nada, asi que bloquear a su productor causaria un interbloqueo de la propia
llamada: el progreso que nadie lee impediria que se enviara el evento terminal. Por eso el
progreso no iterado se almacena hasta `highWaterMark` y despues se cuenta en `call.dropped`.

### Rendirse

| | |
|---|---|
| `timeoutMs` | **Inactividad**, no total: todo evento correlacionado lo reinicia, incluido el progreso. Por defecto 30s. |
| `signal` | Un `AbortSignal`, para una fecha limite real o una accion cancelada. |
| `call.cancel(reason)` | Deja de escuchar y liquida la llamada. |

Termine como termine, la suscripcion se elimina y se libera cualquier productor detenido por la
contrapresion. Un respondedor atascado es peor que el buffer sin limite que esto reemplazo.

### `call` es local

Una respuesta no puede llegar desde un peer federado: el sobre de federacion no lleva `meta` ni
`parentId`, y la entrada pone el canal bajo un espacio de nombres, asi que ni la correlacion ni
la ruta de respuesta sobreviven el salto. No es un descuido — la federacion resuelve
peticion/respuesta entre nodos con **queries** tipadas, con una politica que puede conceder o
denegar. Una llamada que federara en silencio convertiria esa decision de acceso en un accidente.

---

## Leer un valor al suscribirse

`connect` empieza en "de ahora en adelante", asi que la primera lectura habia que repetirla en
otro lado — la misma ruta en dos sitios, libres de divergir:

```typescript
store.connect({ reducer: "todos", property: "items.0.title" }, render, { immediate: true });
```

El primer cambio sintetico trae `oldValue: undefined` y **sin procedencia**, porque ningun evento
lo causo. React no lo necesita: `useSyncExternalStore` ya lee una instantanea al montar.

---

## De donde vino un cambio

Un `Change` nombra el evento que lo causo, asi que un suscriptor ya no tiene que duplicar la causa
dentro del estado:

```typescript
store.connect({ reducer: "orders", property: "status" }, (change) => {
  audit.record(change.path, change.newValue, {
    causedBy: change.eventId,
    via: `${change.channel}/${change.type}`,
  });
});
```

La procedencia esta **ausente** cuando ningun evento causo el cambio — un salto de time-travel de
DevTools, o la entrega `immediate` de arriba. La ausencia es la senal, en vez de un id inventado.

---

## Proteccion contra cascadas (activada por defecto)

Dos consumidores conectados entre si — un suscriptor que emite lo que su propio reducer atiende, o
dos slices que atienden los eventos de la otra — producen una cadena de eventos sin final. La cola
de reduccion se drena de forma **sincrona**, asi que eso no es un programa lento: es una pestana
congelada, o un core al 100%, sin error ni stack al que apuntar.

Por eso cada evento lleva su posicion causal, y el store se niega a extender una cadena mas alla
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

Un evento emitido mientras se atiende otro esta un nivel mas abajo que su causa, y lleva
`parentId` y `depth` para que el ciclo sea legible despues. Ambos campos estan **ausentes** en un
evento raiz, asi que los eventos que emite tu aplicacion siguen siendo identicos byte a byte.

Superar el tope no lanza. El emit ofensor se rechaza, lo ya confirmado se mantiene, y `onCascade`
(mas un error en consola) lo nombra — lanzar apareceria en el suscriptor o efecto que casualmente
estuviera emitiendo, que es justo el fallo inatribuible que el tope existe para evitar.

**Una rafaga ancha no es una cascada.** Un evento cuyo suscriptor emite quinientos hermanos es una
forma legitima; la profundidad es lo que la distingue de un ciclo, y un bucle normal de
`store.emit` nunca acumula profundidad. `maxTransitionsPerDrain` acota el *ancho* y por eso viene
desactivado.

---

## Deduplicacion de Eventos (opt-in)

La deduplicacion esta **desactivada por defecto** — yoltra nunca descarta en silencio eventos
identicos legitimos y rapidos (doble-clics, `+1` repetidos). Actívala solo cuando de verdad quieras
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

// Por identidad: dedup por una clave explicita — p. ej. un doble-invoke de React Strict Mode en un efecto.
await store.emit("analytics", "pageView", { page }, { dedupKey: `pageView:${page}` });
```

---

## Reducers Dinamicos

Agrega o elimina slices de reducer en tiempo de ejecucion:

```typescript
const dispose = store.registerReducer("filters", {
  state: { q: "" },
  when: { keys: eventKeys<AppEM>()([["ui", "setQuery"]]) },
  reducer: (state, event) => (event.type === "setQuery" ? { q: event.payload } : state),
});

// Despues: remover el slice y su estado
dispose();
```

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

---

## Mejores Practicas

### El estado es sincrono; haz `await` solo por los efectos

La fase de reduccion es sincrona, asi que el estado refleja tu evento en el instante en que `emit()`
retorna — sin `await` para leerlo. Haz `await` de `emit()` cuando ademas quieras que los efectos de
_ese evento_ hayan terminado:

```typescript
emit("todo", "add", todo);
store.getState(); // Ya refleja la nueva tarea — sin await

await emit("todo", "save", todo); // se resuelve cuando terminan los efectos de save
```

### Mantener los reducers rapidos

Los reducers son sincronos y corren en el mismo tick que `emit()`. Mueve el trabajo costoso a los
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

## Resumen de API

### Creacion del Store

| API                                             | Descripcion                                           |
| ----------------------------------------------- | ----------------------------------------------------- |
| `createStore(spec)`                             | Crear un store (tipos inferidos de los reducers)      |
| `createStore<S, EM>(spec)`                      | Crear un store con tipos de estado/eventos explicitos |
| `store.emit(channel, type, payload)`            | Emitir un evento (retorna una promesa)                |
| `store.getState()`                              | Obtener snapshot del estado actual (solo lectura)     |
| `store.subscribe(listener)`                     | Suscripcion gruesa (cualquier cambio de estado)       |
| `store.connect(spec, handler)`                  | Suscripcion de grano fino por ruta con wildcards      |
| `store.onEvent(channel, type, handler, phase?)` | Suscripcion a eventos (committed/uncommitted/all)     |
| `store.onEffect(channel, type, handler)`        | Shorthand de efecto para un solo evento               |
| `store.dispose()`                               | Limpiar timers y recursos                             |

### Registro Dinamico

| API                                 | Descripcion                               |
| ----------------------------------- | ----------------------------------------- |
| `store.registerReducer(name, spec)` | Agregar un slice en tiempo de ejecucion   |
| `store.registerMiddleware(fn)`      | Agregar middleware en tiempo de ejecucion |
| `store.registerEffect(spec)`        | Agregar un efecto en tiempo de ejecucion  |

### HMR

| API                                     | Descripcion                                 |
| --------------------------------------- | ------------------------------------------- |
| `store.replaceReducers(reducers, opts)` | Reemplazar todos los reducers               |
| `store.replaceMiddleware(middleware)`   | Reemplazar todos los middleware             |
| `store.replaceEffects(effects)`         | Reemplazar todos los efectos                |
| `store.hotReplace(partial)`             | Reemplazar cualquier subconjunto de una vez |

### Helpers

| API                      | Descripcion                                                      |
| ------------------------ | ---------------------------------------------------------------- |
| `eventKeys<EM>()([...])` | Arrays de claves de evento con seguridad de tipos sin `as const` |

---

## Rendimiento

| Metrica               | Valor                                     |
| --------------------- | ----------------------------------------- |
| **Tamano del bundle** | ~8KB (minificado + gzipped)               |
| **Tree-shakeable**    | Si (modulos ES)                           |
| **Dependencias**      | Cero                                      |
| **TypeScript**        | Definiciones de tipos completas incluidas |

---

## Documentacion

- **[README raiz de yoltra](../../README.md)** --
  Descripcion general y configuracion rapida
- **[@yoltra/react](../react/README.md)** --
  Hooks de React y Suspense
- **[Guia de Inicio Rapido](https://github.com/yoltra/yoltra/blob/main/docs/en/QUICK_START_GUIDE.md)**
  -- Cinco pasos hacia una app funcional
- **[Arquitectura de Cola de Eventos](https://github.com/yoltra/yoltra/blob/main/docs/en/design/event-queue-architecture.md)**
  -- Inmersion tecnica profunda
- **[Comparacion de Bibliotecas](https://github.com/yoltra/yoltra/blob/main/docs/en/design/state-management-library-comparison.md)**
  -- Comparacion arquitectonica

---

## Ejemplos

- **[App de Tareas](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react)** --
  CRUD completo con perfilado de rendimiento · [▶ Abrir la demo en vivo](https://yoltra.dev/es/demos/in-react)
- **[Logo Cinetico](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-kinetic-logo)**
  -- 3000 círculos con simulación física. · [▶ Abrir la demo en vivo](https://yoltra.dev/es/demos/kinetic-logo)
- **[Integracion con Next.js](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-nextjs)**
  -- Pages Router, estado de cliente + cambio de tema · [▶ Abrir la demo en vivo](https://yoltra.dev/es/demos/in-nextjs)

---

## Contribuir

- [Raiz del Monorepo](../../README.md)
- [Guia de Contribucion](https://github.com/yoltra/yoltra/blob/main/CONTRIBUTING.md)

---

## Estado

**Release Candidate** -- Las APIs son estables, usadas en produccion, cambios menores posibles
antes de v1.0.0.

---

## Licencia

**MIT** -- Libre para usar en proyectos comerciales y de codigo abierto.
