# Quo.js

![Quo.js logo](../../assets/logo.svg)

>  👉 [ 🇲🇽 Versión en Español](./README.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](../pt/README.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](../../README.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](../fr/README.md)

Declarativa • Ultrasencilla • eXpressiva: Quo.js es una librería moderna de gestión de estado
inspirada en Redux, pero sin el “equipaje” de Redux Toolkit. Recupera la simplicidad y la
potencia del patrón Redux original, mientras introduce **canales + eventos**, **middleware y
efectos asíncronos nativos**, **suscripciones granulares** y **hooks para React preparados para
Suspense y Concurrent Mode**.

## Paquetes

- **[@quojs/core](../../packages/core/README.es.md)** — _Store_ núcleo, _reducers_,
  _middleware_, _effects_ (agnóstico del _framework_)
- **[@quojs/react](../../packages/react/README.es.md)** — _Provider_ y _hooks_ para React
  (compatibles con Suspense/Concurrent)
- **[examples/](../../examples/)** — ejemplos ejecutables

## ¿Por qué Quo.js?

- 🗪 **Modelo Canal + Evento** — las acciones son `{ channel, event, payload }`; los _reducers_
  se suscriben exactamente a la granularidad que necesites.
- 🎯 **suscripciones atómicas** — suscríbete a propiedades atómicas para evitar
  [**renders innecesarios**](../../examples/v0/quojs-in-react/redux-quojs-profiler.es.md).
- 🧭 **TypeScript de primera** — _typings_ ergonómicos y APIs predecibles.
- ⚡ **Middleware & effects integrados** — asíncronos por defecto; sin _boilerplate_ de
  thunk/saga.
- 🧩 **Reducers dinámicos** — agrega/quita _reducers_ en tiempo de ejecución.
- 📌 **Ligero** — superficie pequeña y enfocada.
- 🧭 **Agnóstico de framework** — React hoy; se aceptan más _bindings_.

## ¿Cómo se compara **Quo.js** con otros contenedores de estado?

Al evaluar un gestor de estado, la superficie del API no lo es todo.  
Lo que realmente importa es la filosofía detrás, las compensaciones que hace y cómo esas
decisiones afectan la **experiencia de desarrollo, el rendimiento y la escalabilidad** en
proyectos reales.

Quo.js fue diseñado como una evolución pragmática de las ideas originales de Redux:  
_Actions_ explícitas, transiciones de estado predecibles, tipado fuerte con TypeScript y manejo
de _async/effects_ integrado — sin la “magia” oculta ni el _boilerplate_ de otros ecosistemas.

Para ayudarte a decidir si Quo.js es la mejor opción, hemos preparado comparaciones directas
contra otras librerías populares. Cada documento explora:

- **Modelo conceptual** (cómo fluye el estado a través de _Actions_, _Reducers_ y _Effects_)
- **Ergonomía de desarrollo** (_boilerplate_, tipado, herramientas de depuración)
- **Rendimiento** (granularidad de suscripciones, eficiencia en re-renderizados)
- **Async & effects** (cómo se expresan _workflows_ y efectos secundarios)
- **Integración con React** (selectores, Suspense, soporte para concurrent mode)

👉 Revisa las comparaciones [aquí](../../examples/v0/quojs-in-react/redux-quojs-profiler.es.md).

## Inicio rápido (Monorepo)

```bash
npm i -g @microsoft/rush
rush install
rush build
rush test
```

Compilaciones focalizadas:

```bash
rush build --to @quojs/core
rush build --from @quojs/react
```

Consulta la **Guía de Desarrollo** para SDLC, caché y lanzamientos:

- [Guía de Desarrollo](./DEVELOPER_GUIDE.md)

## Docs

### Núcleo

- [TypeDoc](../../packages/core/docs/README.md): una
  documentación más técnica extraída utilizando TypeDoc (en Inglés).
- [Desarrollador (en proceso)](https://www.quojs.dev/?lang=es): guía de inicio rápido, tutorial,
  gists, etc.

### Bindings para React

- [TypeDoc](../../packages/react/docs/README.md): una documentación más técnica extraída
  utilizando TypeDoc.
- [Desarrollador (en proceso)](https://www.quojs.dev/?lang=es): guía de inicio rápido, tutorial,
  gists, etc.

## Contribuir

- Empieza aquí — [Guía de contribución](./CONTRIBUTING.md)
- [Código de conducta](./CODE_OF_CONDUCT.md)
- [Gobernanza](./GOVERNANCE.md)
- [Mantenedores](./MAINTAINERS.md)
- [Seguridad](./SECURITY.md)
- [Workflow](./WORKFLOW.md)
- [Marcas](./TRADEMARKS.md)

## Estado

Quo.js está en fase RC. Por ahora, clone el repositorio y use Rush para probarlo en **[los ejemplos/](../../examples/)**.
Una vez que recibamos suficientes comentarios, publicaremos la versión inicial para su instalación mediante `npm`. Agradecemos sus comentarios y PRs.

Hecho con ❤️ en 🇲🇽, para el 🌎.
