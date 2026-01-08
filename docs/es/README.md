![Quo.js logo](https://quojs.dev/assets/logo.svg)

# Quo.js

> 👉 [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/README.md)&nbsp;
> | &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/README.md)&nbsp;
> | &nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/README.md)&nbsp;
> | &nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/README.md)

![Tamaño del bundle](https://badgen.net/bundlephobia/min/@quojs/core)
![Tamaño del bundle](https://badgen.net/bundlephobia/minzip/@quojs/core)
![Tamaño del bundle](https://badgen.net/bundlephobia/tree-shaking/@quojs/core)
![Tamaño del bundle](https://badgen.net/bundlephobia/dependency-count/@quojs/core)
![Descargas npm](https://badgen.net/npm/dm/@quojs/core)
![Licencia](https://img.shields.io/npm/l/@quojs/core)

**Gestión de estado basada en eventos con suscripciones atómicas.** 
Quo.js es un contenedor de estado moderno, async-first que combina **tipado fuerte (TypeScript)**, **eventos basados en canales**, **reactividad de grano fino** y **soporte nativo para async**—sin la complejidad de Redux Toolkit o la magia implícita de MobX.

---

## ¿Qué es Quo.js?

Quo.js es un **contenedor de estado basado en eventos, async-first** diseñado para resolver tres problemas fundamentales:

### 1. **Rendimiento: Cero Re-renderizados Innecesarios**

Las bibliotecas de estado tradicionales vuelven a renderizar componentes cuando *cualquier* parte del estado suscrito cambia. Quo.js utiliza **suscripciones atómicas de ruta** para eliminar este desperdicio.

```tsx
// ❌ Redux/Zustand: Re-renderiza cuando CUALQUIER tarea cambia
const todos = useSelector(state => state.todos);

// ✅ Quo.js: Solo re-renderiza cuando el título de ESTA tarea específica cambia
const title = useAtomicProp({ 
  reducer: 'todos', 
  property: 'items.0.title' 
});
```

[Ver comparación de flamegraph →](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.es.md)

### 2. **Complejidad Asíncrona: Integrada, No Añadida**

Quo.js trata lo asíncrono como una preocupación de primera clase. Los middleware y efectos son `async` por defecto—sin thunks, sin sagas, sin ceremonias.

```typescript
// Middleware asíncrono integrado
const middleware = async (state, event, emit) => {
  if (event.type === 'fetchUser') {
    const user = await fetch('/api/user').then(r => r.json());
    await emit('user', 'loaded', user);
  }
  return true;
};
```

### 3. **Organización: Eventos Basados en Canales**

Los eventos están organizados por namespace mediante canales `(channel, type, payload)`, evitando colisiones de nombres en aplicaciones grandes.

```typescript
emit('auth', 'login', credentials);     // Eventos de autenticación
emit('analytics', 'track', event);      // Eventos de analíticas
emit('ui', 'toast', message);           // Eventos de UI
```

---

## Características Principales

- 🎯 **Suscripciones Atómicas** — Suscríbete a rutas de estado exactas; solo re-renderiza cuando estas cambian
- ⚡ **Async-First** — Middleware + efectos async nativos; sin thunks/sagas requeridos
- 🗪 **Basado en Eventos** — Eventos basados en canales con garantías de ordenamiento FIFO
- 🛡️ **TypeScript-First** — Excelente inferencia de tipos y autocompletado
- 🧩 **Reducers Dinámicos** — Agrega/elimina slices de estado en tiempo de ejecución
- 🌍 **Agnóstico de Framework** — Por ahora solo React, pero ya estamos trabajando en ampliar la cobertura
- 📌 **Ligero** — ~15KB en total (@quojs/core + @quojs/react)

---

## Paquetes

- **[@quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.es.md)** — Store principal, reducers, middleware, effects (agnóstico de framework)
- **[@quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.es.md)** — Hooks de React y provider (compatible con Suspense/Concurrent)

---

## Guía de Inicio Rápido

- [Guía de inicio rápido de @quojs/core](https://github.com/quojs/quojs/blob/main/docs/es/QUICK_START_GUIDE.md).

---

## Ejemplos en Vivo

| Ejemplo | Descripción | Captura de pantalla |
|---------|-------------|---------------------|
| **[Aplicación de Tareas con Profiler](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/README.es.md)** | Aplicación de tareas comparando rendimiento Redux vs Quo.js ([flamegraphs](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.es.md)) | ![Profiler](https://quojs.dev/assets/examples/profiler-quojs-frame-15.png) |
| **[Logo Cinético (900 partículas)](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo/README.es.md)** | ~1500 círculos SVG impulsados por simulación de física + estado Quo.js | ![Logo](https://quojs.dev/assets/examples/quojs-dots.gif) |
| **[Cambiador de Tema Next.js 15](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-nextjs/README.es.md)** | Selector de tema en Next.js 15 App Router (React 19 + Quo.js) | ![Tema](https://quojs.dev/assets/examples/quojs-in-nextjs--theme-switcher.png) |

---

## ¿Cómo se Compara Quo.js?

Quo.js ocupa un espacio único entre la estructura de Redux y la simplicidad de Zustand:

| Biblioteca | Arquitectura | Soporte Async | Suscripciones | Tamaño del Bundle |
|------------|--------------|---------------|---------------|-------------------|
| **Redux Toolkit** | Centralizado | Thunks/RTK Query | Nivel de slice | ~45KB |
| **Zustand** | Centralizado | Manual | Nivel de selector | ~1KB |
| **Jotai** | Distribuido (átomos) | Manual | Nivel de átomo | ~3KB |
| **MobX** | Observable | `runInAction` | Nivel de observable | ~16KB |
| **XState** | Máquinas de Estado | Integrado | Nivel de estado | ~30KB |
| **Quo.js** | Basado en eventos | **Integrado** | **Nivel de ruta** | ~15KB |

**Diferenciadores Clave:**
- ✅ Suscripciones atómicas **por defecto** (sin tanto rollo)
- ✅ Pipeline asincrónico nativo (middleware + effects)
- ✅ Garantías de ordenamiento de eventos (queue FIFO)

👉 **[Lee la comparación completa →](https://github.com/quojs/quojs/blob/main/docs/es/design/state-management-library-comparison.md)**

---

## ¿Cuándo Deberías Usar Quo.js?

### ✅ Chido Para

- Aplicaciones donde el **rendimiento** (optimización de re-renderizado) es crítico
- Proyectos que necesitan **patrones async nativos** (sin thunks/sagas)
- **Bases de código grandes** donde la organización por canales previene colisiones
- **Aplicaciones universales** (web + servidores/microservicios Node.js)
- Equipos que quieren **flujo de eventos explícito** para depuración

### ⚠️ Considera Alternativas Si

- Necesitas **tamaño de bundle mínimo** (<5KB) → Prueba Zustand
- Tu equipo está **muy comprometido con Redux** → Prueba Redux Toolkit
- Prefieres **estado basado en átomos** → Prueba Jotai
- Estás modelando **flujos de trabajo complejos** → Prueba XState

---

## Instalación y Configuración

### 1. Instalar Paquetes

```bash
npm install @quojs/core @quojs/react
# o
yarn add @quojs/core @quojs/react
# o
pnpm add @quojs/core @quojs/react
```

### 2. Define Tu Mapa de Eventos

```typescript
// types.ts
export type AppEM = {
  todos: {
    add: { id: string; title: string };
    toggle: { id: string };
    delete: { id: string };
  };
  ui: {
    setTheme: 'light' | 'dark';
  };
};
```

### 3. Crea el Store

```typescript
// store.ts
import { createStore } from '@quojs/core';
import type { AppEM } from './types';

export const store = createStore({
  name: 'Quo.js Store',
  reducer: {
    todos: {
      state: { items: [] },
      events: [
        ['todos', 'add'],
        ['todos', 'toggle'],
        ['todos', 'delete']
      ],
      reducer: (state, event) => {
        // Tu lógica perrona
      }
    }
  }
});
```

### 4. Usa en React

```tsx
// App.tsx
import { StoreProvider } from '@quojs/react';
import { store } from './store';

function App() {
  return (
    <StoreProvider store={store}>
      <YourApp />
    </StoreProvider>
  );
}
```

---

## Documentación

- **[Guía de Inicio Rápido](https://github.com/quojs/quojs/blob/main/docs/es/QUICK_START_GUIDE.md)** — Comienza en 5 minutos
- **[Referencia de API (@quojs/core)](https://github.com/quojs/quojs/blob/main/packages/core/docs/README.md)** — TypeDoc para el paquete core (en Inglés)
- **[Referencia de API (@quojs/react)](https://github.com/quojs/quojs/blob/main/packages/react/docs/READMEmd)** — TypeDoc para hooks de React (en Inglés)
- **[Comparación de Bibliotecas](https://github.com/quojs/quojs/blob/main/docs/es/design/state-management-library-comparison.md)** — Cómo se compara Quo.js con Redux, Zustand, Jotai, etc.
- **[Arquitectura de Cola de Eventos](https://github.com/quojs/quojs/blob/main/docs/es/design/event-queue-architecture.md)** — Análisis técnico profundo

---

## Contribuir

¡Damos la bienvenida a las contribuciones! Por favor lee:

- [Guía de Contribución](https://github.com/quojs/quojs/blob/main/docs/es/CONTRIBUTING.md)
- [Código de Conducta](https://github.com/quojs/quojs/blob/main/docs/es/CODE_OF_CONDUCT.md)
- [Gobernanza](https://github.com/quojs/quojs/blob/main/docs/es/GOVERNANCE.md)
- [Mantenedores](https://github.com/quojs/quojs/blob/main/docs/es/MAINTAINERS.md)
- [Política de Seguridad](https://github.com/quojs/quojs/blob/main/docs/es/SECURITY.md)

---

## Desarrollo (Monorepo)

```bash
# Instala Rush globalmente
npm i -g @microsoft/rush

# Instala dependencias
rush install

# Construye todos los paquetes
rush build

# Ejecuta pruebas
rush test

# Construye un paquete específico
rush build --to @quojs/core

# Construye desde un paquete específico
rush build --from @quojs/react
```

Consulta la **[Guía del Desarrollador](https://github.com/quojs/quojs/blob/main/docs/es/DEVELOPER_GUIDE.md)** para más detalles.

---

## Estado

Quo.js está en etapa de **Release Candidate**:
- ✅ Las APIs son estables (terminología v0.5.0 finalizada)
- ✅ Los tipos de TypeScript son estrictos y completos
- ✅ Usado en aplicaciones en producción
- ⚠️ Las APIs menores aún pueden evolucionar antes de v1.0

**¡Los comentarios y PRs son bienvenidos!**

---

## Licencia

**MIT** — Libre para usar en proyectos comerciales y de código abierto.

Consulta [LICENSE](https://github.com/quojs/quojs/blob/main/LICENSE) para más detalles.

---

## Comunidad

- Visita la **[web oficial de Quo.js](https://quojs.dev/?lang=es)**
- **Twitter/X:** [@quojs_dev](https://twitter.com/quojs_dev)
- **GitHub Discussions:** [Únete a la conversación](https://github.com/quojs/quojs/discussions)
- **Issues:** [Reporta errores o solicita funcionalidades](https://github.com/quojs/quojs/issues)

---

Hecho en 🇲🇽 con ❤️ para el mundo.