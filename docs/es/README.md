![Yoltra logo](../../assets/yoltra-logo.png)

# Yoltra

> 👉 🇲🇽 Versión en Español | [ 🇺🇸 English Version](../../README.md)

![npm downloads](https://badgen.net/npm/dm/@yoltra/core)
![License](https://img.shields.io/npm/l/@yoltra/core)

**Reactividad de grano fino para aplicaciones orientadas a eventos.**

![Kinetic Logo Demo](../../assets/yoltra-dots.gif)

> 3000 círculos, cada uno suscrito a su propia posición vía `useAtomicProp`. Cada círculo se
> vuelve a renderizar de forma independiente --- el resto del árbol no se toca.
> [Ver el código fuente de la demo.](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-kinetic-logo/README.md)

---

## La propuesta en 30 segundos

```tsx
import { useAtomicProp, useEmit } from "./hooks";

function TodoTitle({ index }: { index: number }) {
  // Se suscribe a items[index].title — se re-renderiza SOLO cuando cambia.
  const title = useAtomicProp({
    reducer: "todos",
    property: `items.${index}.title`,
  });
  const emit = useEmit();

  return (
    <span onClick={() => emit("todos", "edit", { index, title: "New title" })}>{title}</span>
  );
}
```

Sin selectores. Sin memoización. Sin optimización manual. La suscripción _es_ la optimización.

> Yoltra es un fork de [Quo.js](https://github.com/quojs/quojs). Decidimos dejar de usar
> **Quojs** para no luchar en SEO con librerías zombis (están muertas, pero siguen merodeando).

---

## ¿Por qué Yoltra?

### 1. Suscripciones de grano fino con comodines (wildcards)

Suscríbete a `"items.0.title"` o `"items.*.done"` y solo se volverá a renderizar cuando esa ruta
exacta cambie. Esto funciona sobre un árbol de estado completo --- incluyendo objetos anidados,
arrays y claves dinámicas.

```tsx
// Ruta exacta — se re-renderiza cuando items[0].title cambia
const title = useAtomicProp({ reducer: "todos", property: "items.0.title" });

// Comodín — se re-renderiza cuando el flag 'done' de CUALQUIER item cambia
const allDone = useAtomicProp({ reducer: "todos", property: "items.*.done" }, (state) =>
  state.items.every((i) => i.done),
);
```

[Ver la comparación de flamegraph (Redux vs Yoltra).](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react/redux-yoltra-profiler.md)

### 2. Pipeline de eventos estructurado

Los eventos fluyen a través de un pipeline formal donde cada etapa es interceptable:

    emit() → dedup → middleware (puede rechazar) → reducers → suscriptores de eventos → efectos → suscriptores gruesos

El rechazo por middleware crea **eventos no confirmados**, a los que la UI puede reaccionar ---
útil para autorización, validación y patrones de UI optimista:

```tsx
// Mostrar una advertencia cuando el middleware bloquea un delete
useEvent(
  "ui",
  "delete",
  () => {
    showToast("La eliminación fue bloqueada por permisos");
  },
  "uncommitted",
);
```

### 3. Organización de eventos basada en canales

Los eventos son tuplas `(channel, type, payload)` --- un _namespacing_ natural que escala sin
colisiones:

```typescript
await emit("auth", "login", credentials);
await emit("analytics", "track", event);
await emit("ui", "toast", { message: "Saved!" });
```

---

## Paquetes

**[@yoltra/core](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)** Store
agnóstico de framework, reducers, middleware y efectos

**[@yoltra/react](https://github.com/yoltra/yoltra/blob/main/packages/react/README.md)** Hooks
de React con suscripciones de grano fino y soporte para Suspense

---

## Guía de Inicio Rápido

- [React](./QUICK_START_GUIDE.md) - Una app de ejemplo en menos de 3 minutos.

---

## Ejemplos en vivo

**[Logo cinético](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-kinetic-logo/README.md)**
(3000 Simulación de física con suscripciones de partículas)ruta independientes por círculo

**[App de tareas](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react/README.md)**
con Comparación de flamegraph lado a lado con Profiler Redux

**[Next.js 15 App](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-nextjs/README.md)**
Compatibilidad SSR + App Router con cambio de tema

---

## Documentación

- **[Guía de inicio rápido](https://github.com/yoltra/yoltra/blob/main/docs/en/QUICK_START_GUIDE.md)**
  --- Cinco pasos hacia una app funcional
- **[API de @yoltra/core](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)**
  --- Store, middleware, efectos, matchers `when`
- **[API de @yoltra/react](https://github.com/yoltra/yoltra/blob/main/packages/react/README.md)**
  --- Hooks, Suspense, `createHooks`
- **[Arquitectura de cola de eventos](https://github.com/yoltra/yoltra/blob/main/docs/en/design/event-queue-architecture.md)**
  --- Inmersión técnica profunda en el pipeline
- **[Comparación de bibliotecas](https://github.com/yoltra/yoltra/blob/main/docs/en/design/state-management-library-comparison.md)**
  --- Comparación arquitectónica con Redux, Zustand, Jotai y otras

---

## Contribuir

¡Damos la bienvenida a las contribuciones! Por favor, lee:

- [Guía de contribución](https://github.com/yoltra/yoltra/blob/main/CONTRIBUTING.md)
- [Código de conducta](https://github.com/yoltra/yoltra/blob/main/CODE_OF_CONDUCT.md)
- [Gobernanza](https://github.com/yoltra/yoltra/blob/main/GOVERNANCE.md)
- [Mantenedores](https://github.com/yoltra/yoltra/blob/main/MAINTAINERS.md)
- [Política de seguridad](https://github.com/yoltra/yoltra/blob/main/SECURITY.md)

---

## Desarrollo (Monorepo)

```bash
npm i -g @microsoft/rush
rush install
rush build
rush test
```

Consulta la
**[Guía del desarrollador](https://github.com/yoltra/yoltra/blob/main/docs/en/DEVELOPER_GUIDE.md)**
para más detalles.

---

## Estado

Yoltra está en etapa de **Release Candidate** (v0.1.0):

- Las APIs son estables y se usan en aplicaciones en producción.
- Los tipos de TypeScript son estrictos y completos.
- Las APIs menores aún pueden evolucionar antes de v1.0.

Los comentarios y PRs son bienvenidos.

---

## Licencia

**MIT** --- Libre para usar en proyectos comerciales y de código abierto.

Consulta [LICENSE](https://github.com/yoltra/yoltra/blob/main/LICENSE) para más detalles.

---

## Comunidad

- **Sitio web:** [yoltra.dev](https://yoltra.dev)
- **Twitter/X:** [@yoltra_dev](https://twitter.com/yoltra_dev)
- **GitHub Discussions:**
  [Únete a la conversación](https://github.com/yoltra/yoltra/discussions)
- **Issues:**
  [Reporta errores o solicita funcionalidades](https://github.com/yoltra/yoltra/issues)
