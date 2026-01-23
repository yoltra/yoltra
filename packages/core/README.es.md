![Quo.js logo](https://quojs.dev/assets/logo.svg)

# Quo.js El estado de las cosas, re-escrito.

> 👉 [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/packages/core/README.es.md)&nbsp;
> | &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/packages/core/README.pt.md)&nbsp;
> | &nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/packages/core/README.md)&nbsp;
> | &nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/packages/core/README.fr.md)

![Tamaño del bundle](https://badgen.net/bundlephobia/min/@quojs/core)
![Tamaño del bundle](https://badgen.net/bundlephobia/minzip/@quojs/core)
![Tamaño del bundle](https://badgen.net/bundlephobia/tree-shaking/@quojs/core)
![Tamaño del bundle](https://badgen.net/bundlephobia/dependency-count/@quojs/core)
![Versión npm](https://badgen.net/npm/v/@quojs/core)
![Descargas npm](https://badgen.net/npm/dm/@quojs/core)
![Licencia](https://badgen.net/npm/license/@quojs/core)

**Contenedor de estado basado en eventos, agnóstico de framework.**

`@quojs/core` es la base de Quo.js—una biblioteca moderna de gestión de estado que combina
**eventos basados en canales**, **suscripciones atómicas** y **soporte nativo para async** en un
paquete ligero y universal.

**Funciona en todos lados:** Navegadores, Node.js 18+, Deno, Bun. Cero dependencias del DOM.

---

## ¿Qué es @quojs/core?

`@quojs/core` proporciona:

- **Arquitectura basada en eventos** — Los eventos fluyen a través de canales
  `(channel, type, payload)`
- **Cola de eventos FIFO** — Procesamiento de eventos predecible y serializado con garantías de
  ordenamiento
- **Async-first** — Middleware y effects async nativos (sin thunks/sagas)
- **Suscripciones de grano fino** — Suscríbete a rutas de estado exactas mediante notación de
  puntos
- **Inmutabilidad** — Aplicación de deep-freeze con detección de cambios estructurales
- **TypeScript-first** — Excelente inferencia de tipos y autocompletado

> Consulta el informe de
> [Comparación de Bibliotecas de Gestión de Estado](https://github.com/quojs/quojs/blob/main/docs/es/design/state-management-library-comparison.md).

---

## Instalación

```bash
npm install @quojs/core
# o
yarn add @quojs/core
# o
pnpm add @quojs/core
```

---

## Guía de inicio rápido

---

## Conceptos Fundamentales

### Arquitectura Basada en Eventos

Los eventos son ciudadanos de primera clase en Quo.js. Cada cambio de estado es activado por un
evento explícito.

```typescript
// Los eventos tienen un canal, tipo y payload
await store.emit("auth", "login", { username, password });
await store.emit("analytics", "track", { event: "page_view" });
await store.emit("ui", "toast", { message: "¡Bienvenido!" });
```

**Beneficios:**

- Intención clara (cada acción es rastreable)
- Modularidad natural (organiza por canal)
- Rastro de auditoría (los eventos son serializables)

Consulta el documento de descripción general de
**[Arquitectura de Cola de Eventos](https://github.com/quojs/quojs/blob/main/docs/es/design/event-queue-architecture.md)**.

### Async-First

Los middleware y effects son `async` por defecto. No se necesitan bibliotecas externas.

```typescript
// Middleware asíncrono
const authMiddleware = async (state, event, emit) => {
  if (event.type === "login") {
    const token = await authenticateUser(event.payload);
    await emit("auth", "loginSuccess", { token });
    return false; // Cancela el evento original
  }
  return true;
};

// Effects asíncronos (se ejecutan después de los reducers)
const analyticsEffect = async (event, getState, emit) => {
  if (event.channel === "analytics") {
    await sendToAnalytics(event.payload);
  }
};

const store = createStore({
  name: "App",
  reducer: {
    /* ... */
  },
  middleware: [authMiddleware],
  effects: [
    {
      events: [["analytics", "track"]],
      effect: analyticsEffect,
    },
  ],
});
```

### Suscripciones de Grano Fino

Suscríbete a rutas de estado exactas usando notación de puntos:

```typescript
// Suscribirse a ruta anidada
store.connect({ reducer: "todos", property: "items.0.title" }, (change) => {
  console.log("Cambió el título de la primera tarea:", change.newValue);
});

// Patrones wildcard
store.connect({ reducer: "todos", property: "items.*.completed" }, (change) => {
  console.log("Cambió el estado de completitud de una tarea");
});
```

### Garantías de Inmutabilidad

El estado está **deep-frozen** antes de confirmarse para prevenir mutaciones accidentales:

```typescript
const state = store.getState();
state.counter.value = 999; // ❌ TypeError: No se puede asignar a propiedad de solo lectura

// En su lugar, emite eventos:
await store.emit("counter", "set", 999); // ✅ Forma correcta
```

---

## Mejores Prácticas

### Código de Aplicación

#### 1. Siempre Espera `emit()`

```typescript
// ❌ MAL: Disparar y olvidar
emit("todo", "add", todo);
const state = store.getState(); // ¡Puede no tener la nueva tarea aún!

// ✅ BIEN: Esperar la completitud
await emit("todo", "add", todo);
const state = store.getState(); // Garantizado que tiene la nueva tarea
```

#### 2. Evita Bucles Infinitos

```typescript
// ❌ MAL: Recursión infinita
registerEffect({
  events: [["counter", "increment"]],
  effect: (evt, getState, emit) => {
    emit("counter", "increment", evt.payload + 1); // ¡Infinito!
  },
});

// ✅ BIEN: Condición de guardia
registerEffect({
  events: [["counter", "increment"]],
  effect: (evt, getState, emit) => {
    if (evt.payload < 100) {
      // Detener en 100
      emit("counter", "increment", evt.payload + 1);
    }
  },
});
```

#### 3. Mantén los Reducers Rápidos

```typescript
// ❌ MAL: Reducer lento bloquea la cola
reducer: (state, event) => {
  const result = expensiveComputation(); // Bloquea por segundos
  return { ...state, result };
};

// ✅ BIEN: Mover a effect asíncrono
reducer: (state, event) => {
  return { ...state, loading: true };
};

registerEffect({
  events: [["data", "compute"]],
  effect: async (evt, getState, emit) => {
    const result = await computeAsync(); // No bloquea
    emit("data", "computeComplete", result);
  },
});
```

#### 4. Maneja Errores de Effects

```typescript
// ❌ MAL: Errores de effect no manejados
effect: async (evt, getState, emit) => {
  const data = await fetch(url); // Puede lanzar error
  emit("data", "loaded", data);
};

// ✅ BIEN: Manejo de errores con eventos de fallo
effect: async (evt, getState, emit) => {
  try {
    const data = await fetch(url);
    emit("data", "loadSuccess", data);
  } catch (error) {
    emit("data", "loadFailure", { error: error.message });
  }
};
```

#### 5. Limita Eventos de Alta Frecuencia

```typescript
// ❌ MAL: Inunda la cola
window.addEventListener("mousemove", (e) => {
  emit("ui", "mouseMove", { x: e.clientX, y: e.clientY });
});

// ✅ BIEN: Limitar emisiones
import { throttle } from "lodash-es";

const throttledEmit = throttle(
  (x, y) => emit("ui", "mouseMove", { x, y }),
  16, // ~60fps
);

window.addEventListener("mousemove", (e) => {
  throttledEmit(e.clientX, e.clientY);
});
```

---

## Características Avanzadas

### Reducers Dinámicos

Agrega o elimina reducers en tiempo de ejecución:

```typescript
// Agregar un nuevo reducer dinámicamente
const disposeReducer = store.registerReducer("newFeature", {
  state: { enabled: false },
  events: [["features", "toggle"]],
  reducer: (state, event) => {
    return { enabled: !state.enabled };
  },
});

// Más tarde: eliminar el reducer
disposeReducer();
```

### Deduplicación de Eventos

Quo.js previene automáticamente el procesamiento duplicado de eventos (seguro para React Strict
Mode):

```typescript
// En React Strict Mode, los effects se disparan dos veces en desarrollo
useEffect(() => {
  emit("analytics", "pageView", { page });
  // ↑ Disparado 2x por React, pero Quo.js lo procesa solo una vez
}, [page]);
```

### Middleware

El middleware se ejecuta **antes** de los reducers y puede cancelar eventos:

```typescript
const loggingMiddleware = async (state, event, emit) => {
  console.log("Evento:", event.channel, event.type, event.payload);
  return true; // Permitir que el evento continúe
};

const validationMiddleware = async (state, event) => {
  if (event.type === "addTodo" && !event.payload.title) {
    console.error("Tarea inválida: falta el título");
    return false; // Cancelar evento
  }
  return true;
};
```

### Effects

Los effects se ejecutan **después** de los reducers y son ideales para efectos secundarios:

```typescript
const saveToLocalStorageEffect = async (event, getState) => {
  const state = getState();
  localStorage.setItem("app-state", JSON.stringify(state));
};

store.registerEffect({
  events: [
    ["todos", "add"],
    ["todos", "toggle"],
    ["todos", "delete"],
  ],
  effect: saveToLocalStorageEffect,
});
```

---

## Soporte para TypeScript

Quo.js es TypeScript-first con excelente inferencia de tipos:

```typescript
// El mapa de eventos está completamente tipado
type AppEM = {
  counter: {
    increment: number; // Tipo de payload
    decrement: number;
  };
};

const store = createStore<AppEM>({
  /* ... */
});

// ✅ El autocompletado funciona:
await store.emit("counter", "increment", 5);
// ↑ Sugiere: 'increment' | 'decrement'
// ↑ Espera: number

// ❌ TypeScript detecta errores:
await store.emit("counter", "increment", "five"); // Error: Se esperaba number
await store.emit("invalid", "event", null); // Error: Canal desconocido
```

---

## Runtime Universal

`@quojs/core` tiene **cero dependencias del DOM** y funciona donde sea que JavaScript se
ejecute:

### Navegador

```typescript
import { createStore } from "@quojs/core";
const store = createStore({
  /* ... */
});
```

### Node.js

```typescript
const { createStore } = require("@quojs/core");

const store = createStore({
  name: "ServerState",
  reducer: {
    /* ... */
  },
});

// Usar en middleware de Express, trabajos en segundo plano, etc.
app.use((req, res, next) => {
  req.store = store;
  next();
});
```

### Deno / Bun

```typescript
import { createStore } from "@quojs/core";
// Funciona idénticamente a navegadores/Node.js
```

---

## Resumen de API

### Creación de Store

- `createStore(spec)` — Crear una nueva instancia de store
- `store.emit(channel, type, payload)` — Emitir un evento (async)
- `store.getState()` — Obtener estado actual (solo lectura)
- `store.subscribe(listener)` — Suscribirse a cualquier cambio de estado
- `store.connect(spec, handler)` — Suscribirse a una ruta de estado específica

### Registro Dinámico

- `store.registerReducer(name, spec)` — Agregar reducer en tiempo de ejecución
- `store.registerMiddleware(middleware)` — Agregar middleware en tiempo de ejecución
- `store.registerEffect(spec)` — Agregar effect en tiempo de ejecución

### Hot Module Replacement

- `store.replaceReducers(reducers, opts)` — Reemplazar todos los reducers (HMR)
- `store.replaceMiddleware(middleware)` — Reemplazar todos los middleware (HMR)
- `store.replaceEffects(effects)` — Reemplazar todos los effects (HMR)

---

## Rendimiento

| Métrica               | Valor                                     |
| --------------------- | ----------------------------------------- |
| **Tamaño del Bundle** | ~8KB (minificado + gzipped)               |
| **Tree-shakeable**    | ✅ Sí (módulos ES)                        |
| **Dependencias**      | Cero dependencias en tiempo de ejecución  |
| **TypeScript**        | Definiciones de tipos completas incluidas |

---

## Documentación

- **[Guía de Inicio Rápido](https://quojs.dev)** — Comienza en 5 minutos
- **[Referencia de API TypeDoc](https://github.com/quojs/quojs/blob/main/packages/core/docs/README.md)**
  — Documentación completa de la API (en Inglés)
- **[Arquitectura de Cola de Eventos](https://github.com/quojs/quojs/blob/main/docs/es/design/event-queue-architecture.md)**
  — Análisis técnico profundo
- **[Comparación de Bibliotecas](https://github.com/quojs/quojs/blob/main/docs/es/design/state-management-library-comparison.md)**
  — vs Redux, Zustand, Jotai, etc.

---

## Ejemplos

- **[Aplicación de Tareas](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/README.es.md)**
  — Ejemplo CRUD completo con perfilado de rendimiento
- **[Logo Cinético](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo/README.es.md)**
  — Simulación de física con 900 partículas
- **[Integración con Next.js](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-nextjs/README.es.md)**
  — SSR + cambiador de tema

---

## Migración desde v0.4.x

### Cambios de Terminología (v0.5.0+)

| Antiguo (v0.4.x) | Nuevo (v0.5.0+) | Estado                                       |
| ---------------- | --------------- | -------------------------------------------- |
| `dispatch()`     | `emit()`        | ❌ Eliminado (usar `emit()` en su lugar)     |
| `Action`         | `Event`         | ❌ Eliminado (usar tipo `Event`)             |
| `ActionMap`      | `EventMap`      | ❌ Eliminado (usar tipo `EventMapBase`)      |
| `ActionPair`     | `EventKey`      | ❌ Eliminado (usar tipo `EventKey`)          |
| `ActionUnion`    | `EventUnion`    | ❌ Eliminado (usar tipo `EventUnion`)        |
| `Dispatch`       | `Emit`          | ❌ Eliminado (usar tipo `Emit`)              |
| `typedActions`   | `typedEvents`   | ❌ Eliminado (usar función `typedEvents`)    |
| `action.event`   | `event.type`    | ⚠️ Cambio disruptivo                         |

### Ejemplo de Migración

```typescript
// ANTES (v0.4.x)
store.dispatch("counter", "increment", 1);
const actions = typedActions([])('counter', ['increment']);
type MyAction = Action<EM, 'counter', 'increment'>;

// DESPUÉS (v0.5.0+)
store.emit("counter", "increment", 1);
const events = typedEvents([])('counter', ['increment']);
type MyEvent = Event<EM, 'counter', 'increment'>;
```

**Nota:** Todos los alias deprecados han sido eliminados. Si estás actualizando desde v0.4.x, debes actualizar tu código para usar la nueva terminología de event-bus.

---

## Contribuir

¡Damos la bienvenida a las contribuciones! Ver:

- [Raíz del Monorepo](https://github.com/quojs/quojs/blob/main/docs/es/README.md)
- [Guía de Contribución](https://github.com/quojs/quojs/blob/main/docs/es/CONTRIBUTING.md)
- [Código de Conducta](https://github.com/quojs/quojs/blob/main/docs/es/CODE_OF_CONDUCT.md)

---

## Estado

**Release Candidate** — Las APIs son estables, usadas en producción, cambios menores posibles
antes de v1.0.

---

## Licencia

**MIT** — Libre para usar en proyectos comerciales y de código abierto.

---

Hecho en 🇲🇽 para el mundo.
