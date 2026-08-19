![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/core

> 👉 🇲🇽 Versión en Español&nbsp; |
> &nbsp;[ 🇺🇸 English Versión](./README.md)&nbsp;

![npm downloads](https://badgen.net/npm/dm/@yoltra/core)
![License](https://badgen.net/npm/license/@yoltra/core)

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
  │  ══ fase de reduccion SINCRONA — corre antes de que emit() retorne ══
  ├─ 1. Middleware ─── Hooks pre-reducer sincronos (devolver false para rechazar → evento "no confirmado")
  ├─ 2. Reducers ─── Cada slice que aplica se prepara, y todas se confirman bajo una sola raiz
  ├─ 3. Suscriptores de eventos ─── Notificaciones de eventos confirmados/no confirmados
  ├─ 4. Suscriptores gruesos ─── Listeners externos del store (useSyncExternalStore, etc.), si el estado cambio
  │
  └─ 5. Efectos ─── Efectos secundarios ASYNC, una tarea independiente por evento (indexados para busqueda O(1))
```

La fase de reducción (1–4) es **síncrona**, así que `getState()` es correcto en el instante en que
`emit()` retorna — incluso con middleware. Los efectos (5) corren después como una tarea async
independiente; la promesa de `emit()` se resuelve cuando terminan los efectos de ese evento. Cada
etapa es interceptable, y `store.instrument()` expone todo el flujo — rutas hoja cambiadas, tiempos
de reducción, fase confirmado/rechazado — a las DevTools sin ningún `as any`. Ver la
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

El middleware se ejecuta **sincronamente, antes** de los reducers y puede cancelar la propagación
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

---

## Suscripciones a Eventos

Suscríbete a eventos (no al estado) desde la capa de vista. Útil para notificaciones,
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

## Los commits son atómicos entre slices

Un evento que toca varias slices las escribe todas y después notifica. Nadie observa un evento
aplicado a medias: un suscriptor de una slice que lee `getState()` ve todas las demás slices del
mismo evento ya aplicadas.

Esto importa sobre todo donde un cambio se usa como señal para volver a leer, que es lo que hacen
los hooks de React.

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

result.committed; // true — el middleware lo permitio
result.written; // false — pero no se escribio nada
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
middleware permite, incluidos todos los eventos de un store sin reducers — la forma que toma un
bus de notificaciones o de analítica.

---

## Petición y respuesta — `store.call()`

Todo consumidor de un bus de eventos acaba escribiendo petición/respuesta a mano: generar un id,
suscribirse, emparejar, expirar, desuscribirse. Son unas ochenta líneas y siempre traen los
mismos dos bugs: la suscripción sobrevive a la llamada, y `Quien Responde` que olvida devolver el
id produce un timeout sin nada a lo que apuntar.

```typescript
const res = await store.call("rpc", "ask", { q: "quien?" }, { reply: ["rpc", "answer"] });
res.payload.text;
```

`Quien Responde` no hace nada especial. Responde con el `emit` que recibio, y la marca causal del
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
efectos, y el colector es un efecto que no retorna hasta que el consumidor tomo el elemento — así
que un `Quien Responde` que escribe `await emit("job", "tick", chunk)` **va al ritmo del lector**.

La contrapresión entra en juego **cuando empiezas a iterar**. Una llamada que solo se espera con
`await` nunca extrae nada, así que bloquear a su productor causaría un interbloqueo de la propia
llamada: el progreso que nadie lee impediría que se enviara el evento terminal. Por eso el
progreso no iterado se almacena hasta `highWaterMark` y después se cuenta en `call.dropped`.

### Retroceso

| | |
|---|---|
| `timeoutMs` | **Inactividad**, no total: todo evento correlacionado lo reinicia, incluido el progreso. Por defecto 30s. |
| `signal` | Un `AbortSignal`, para una fecha límite real o una acción cancelada. |
| `call.cancel(reason)` | Deja de escuchar y liquida la llamada. |

Termine como termine, la suscripción se elimina y se libera cualquier productor detenido por la
contrapresión. Un `Quien Responde` atascado es peor que el buffer sin límite que esto reemplazo.

---

## Leer un valor al suscribirse

`connect` empieza en "de ahora en adelante", así que la primera lectura había que repetirla en
otro lado — la misma ruta en dos sitios, libres de divergir:

```typescript
store.connect({ reducer: "todos", property: "items.0.title" }, render, { immediate: true });
```

El primer cambio sintético trae `oldValue: undefined` y **sin procedencia**, porque ningún evento
lo causó. React no lo necesita: `useSyncExternalStore` ya lee una instantánea al montar.

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

La procedencia está **ausente** cuando ningún evento causó el cambio — un salto de time-travel de
DevTools, o la entrega `immediate` de arriba. La ausencia es la señal, en vez de un id inventado.

---

## Deduplicación de Eventos (opt-in)

La deduplicación está **desactivada por defecto** — yoltra nunca descarta en silencio eventos
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

// Por identidad: dedup por una clave explicita — p. ej. un doble-invoke de React Strict Mode en un efecto.
await store.emit("analytics", "pageView", { page }, { dedupKey: `pageView:${page}` });
```

---

## Protección contra cascadas (activada por defecto)

Dos consumidores conectados entre sí — un suscriptor que emite lo que su propio reducer atiende, o
dos slices que atienden los eventos de la otra — producen una cadena de eventos sin final. La cola
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
`parentId` y `depth` para que el ciclo sea legible después. Ambos campos están **ausentes** en un
evento raíz, así que los eventos que emite tu aplicación siguen siendo idénticos byte a byte.

Superar el tope no lanza. El emit ofensor se rechaza, lo ya confirmado se mantiene, y `onCascade`
(más un error en consola) lo nombra — lanzar aparecería en el suscriptor o efecto que casualmente
estuviera emitiendo, que es justo el fallo inatribuible que el tope existe para evitar.

**Una rafaga ancha no es una cascada.** Un evento cuyo suscriptor emite quinientos hermanos es una
forma legítima; la profundidad es lo que la distingue de un ciclo, y un bucle normal de
`store.emit` nunca acumula profundidad. `maxTransitionsPerDrain` acota el *ancho* y por eso viene
desactivado.

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

## Mejores Prácticas

### El estado es síncrono; haz `await` solo por los efectos

La fase de reducción es síncrona, así que el estado refleja tu evento en el instante en que `emit()`
retorna — sin `await` para leerlo. Haz `await` de `emit()` cuando además quieras que los efectos de
_ese evento_ hayan terminado:

```typescript
emit("todo", "add", todo);
store.getState(); // Ya refleja la nueva tarea — sin await

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
| `store.onEvent(channel, type, handler, phase?)` | Suscripción a eventos (committed/uncommitted/all)     |
| `store.onEffect(channel, type, handler)`        | Shorthand de efecto para un solo evento               |
| `store.dispose()`                               | Limpiar timers y recursos                             |

### Registro Dinámico

| API                                 | Descripción                               |
| ----------------------------------- | ----------------------------------------- |
| `store.registerReducer(name, spec)` | Agregar un slice en tiempo de ejecución   |
| `store.registerMiddleware(fn)`      | Agregar middleware en tiempo de ejecución |
| `store.registerEffect(spec)`        | Agregar un efecto en tiempo de ejecución  |

### HMR

| API                                     | Descripción                                 |
| --------------------------------------- | ------------------------------------------- |
| `store.replaceReducers(reducers, opts)` | Reemplazar todos los reducers               |
| `store.replaceMiddleware(middleware)`   | Reemplazar todos los middleware             |
| `store.replaceEffects(effects)`         | Reemplazar todos los efectos                |
| `store.hotReplace(partial)`             | Reemplazar cualquier subconjunto de una vez |

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

Con 1000 filas, hacer el diff después de una inserción al principio cuesta 1200 µs para un array
y 371 µs normalizado, y el array reporta alrededor de mil rutas cambiadas frente a dos. Ese es
el caso para el que existe el adapter.

Una actualización de un solo campo va al revés: 20 µs para el array frente a 470 µs normalizado.
`detectChangedProps` indexa un array pero enumera las claves de un objeto, construyendo dos
arrays de claves y un `Set` por comparación, así que un mapa de entidades ancho es más caro de
recorrer aunque casi nada dentro se haya movido. Los números están en `benchmarks/`, y cerrar
esa brecha es trabajo con seguimiento, no una propiedad de normalizar como tal.

Así que: normaliza las colecciones que se reordenan o que rotan mucho. Una colección grande a la
que solo se le editan campos individuales está mejor como array hoy.

---

## Rendimiento

| Métrica               | Valor                                     |
| --------------------- | ----------------------------------------- |
| **Tamaño del bundle** | Medido en cada build — ver la tabla abajo |
| **Tree-shakeable**    | Sí (módulos ES)                           |
| **Dependencias**      | Cero                                      |
| **TypeScript**        | Definiciones de tipos completas incluidas |

El tamaño del bundle se verifica, no se afirma: `rush size` empaqueta el paquete como lo haría
un consumidor — sacudido, minificado, comprimido con gzip — y falla cuando excede el
presupuesto declarado en `package.json`. La tabla de abajo la escribe esa misma verificación,
así que no puede desviarse de lo que se midió; editarla a mano hace fallar el CI.

La cifra que importa es lo que importas, no lo que el paquete exporta:

<!-- size-table:start -->
| Import | Tamaño | Presupuesto |
| --- | --- | --- |
| `{ createStore }` | 8.3 KB | 14 KB |
| `{ createStore, hydrate, persist }` | 9.7 KB | 16 KB |
| todo | 11.2 KB | 18 KB |
<!-- size-table:end -->

Estas son cifras de **producción** — lo que públicas una vez que tu empaquetador define
`NODE_ENV=production` y las guardas exclusivas de desarrollo desaparecen. La columna de
presupuesto es el techo que `rush size` impone, y se verifica contra un build de desarrollo,
que es el mayor de los dos: el código exclusivo de desarrollo no puede crecer sin que nadie lo
note solo porque nunca llega a un usuario. Por eso el margen que se infiere aquí es
deliberadamente conservador.

La **distancia entre filas** es la afirmación de tree-shaking, y es lo que hay que vigilar: la
persistencia añade 1.5 KB a quienes la importan y nada a los demás, y el barrel completo está
2.9 KB por encima del store. La última fila es un detector de crecimiento; `import * as all` no
es algo que nadie escriba.

---

## Documentación

- **[README raíz de yoltra](../../README.md)** --
  Descripción general y configuración rápida
- **[@yoltra/react](../react/README.md)** --
  Hooks de React y Suspense
- **[Guia de Inicio Rápido](https://github.com/yoltra/yoltra/blob/main/docs/en/QUICK_START_GUIDE.md)**
  -- Cinco pasos hacia una app funcional
- **[Arquitectura de Cola de Eventos](https://github.com/yoltra/yoltra/blob/main/docs/en/design/event-queue-architecture.md)**
  -- Inmersión técnica profunda
- **[Comparación de Bibliotecas](https://github.com/yoltra/yoltra/blob/main/docs/en/design/state-management-library-comparison.md)**
  -- Comparación arquitectónica

---

## Ejemplos

- **[App de Tareas](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react)** --
  CRUD completo con perfilado de rendimiento · [▶ Abrir la demo en vivo](https://yoltra.dev/es/demos/in-react)
- **[Logo Cinético](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-kinetic-logo)**
  -- 3000 círculos con simulación física. · [▶ Abrir la demo en vivo](https://yoltra.dev/es/demos/kinetic-logo)
- **[Integración con Next.js](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-nextjs)**
  -- Pages Router, estado de cliente + cambio de tema · [▶ Abrir la demo en vivo](https://yoltra.dev/es/demos/in-nextjs)

---

## Contribuir

- [Raíz del Monorepo](../../README.md)
- [Guia de Contribución](https://github.com/yoltra/yoltra/blob/main/CONTRIBUTING.md)

---

## Estado

**Release Candidate** -- Las APIs son estables, usadas en producción, cambios menores posibles
antes de v1.0.0.

---

## Licencia

**MIT** -- Libre para usar en proyectos comerciales y de código abierto.
