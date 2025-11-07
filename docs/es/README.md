![Quo.js logo](https://quojs.dev/assets/logo.svg)

# Quo.js

>  👉 [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/README.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/README.md)&nbsp; | &nbsp;
> [ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/README.md)&nbsp; | &nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/README.md)

![Bundle size](https://badgen.net/bundlephobia/min/@quojs/core)
![Bundle size](https://badgen.net/bundlephobia/minzip/@quojs/core)
![Bundle size](https://badgen.net/bundlephobia/tree-shaking/@quojs/core)
![Bundle size](https://badgen.net/bundlephobia/dependency-count/@quojs/core)
![npm downloads](https://badgen.net/npm/dm/@quojs/core)
![License](https://img.shields.io/npm/l/@quojs/core)

Declarativa • Ultrasencilla • eXpressiva: Quo.js es una librería moderna de gestión de estado
inspirada en Redux, pero sin el “equipaje” de Redux Toolkit. Recupera la simplicidad y la
potencia del patrón Redux original, mientras introduce **canales + eventos**, **middleware y
efectos asíncronos nativos**, **suscripciones granulares** y **hooks para React preparados para
Suspense y Concurrent Mode**.

## Paquetes

* **[@quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.es.md)** — *Store* núcleo, *reducers*,
  *middleware*, *effects* (agnóstico del *framework*)
* **[@quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.es.md)** — *Provider* y *hooks* para React
  (compatibles con Suspense/Concurrent)

## [Ejemplos Ejecutables](https://github.com/quojs/quojs/tree/main/packages)

| Example                                                                                | Description                                                                                                             | Screenshot                                                                    |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **[Quo.js en React](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/README.es.md)**                          | Una sencilla aplicación de tareas pendientes (consulta la comparación usando [React Profiler](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.es.md)) |
| **[Logo Cinético de Quo.js (React + SVG)](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo/README.es.md)** | Un logo cinético hecho con ~1.5k círculos SVG, impulsado por un mini motor de simulación y sincronizado con una store de Quo.js. | ![Quo.js logo](https://quojs.dev/assets/examples/quojs-dots.gif)              |

## ¿Por qué Quo.js?

* 🗪 **Modelo Canal + Evento** — las acciones son `{ channel, event, payload }`; los *reducers*
  se suscriben exactamente a la granularidad que necesites.
* 🎯 **suscripciones atómicas** — suscríbete a propiedades atómicas para evitar
  [**renders innecesarios**](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.es.md).
* 🧭 **TypeScript de primera** — *typings* ergonómicos y APIs predecibles.
* ⚡ **Middleware & effects integrados** — asíncronos por defecto; sin *boilerplate* de
  thunk/saga.
* 🧩 **Reducers dinámicos** — agrega/quita *reducers* en tiempo de ejecución.
* 📌 **Ligero** — superficie pequeña y enfocada.
* 🧭 **Agnóstico de framework** — React hoy; se aceptan más *bindings*.

## ¿Cómo se compara **Quo.js** con otros contenedores de estado?

Al evaluar un gestor de estado, la superficie del API no lo es todo.\
Lo que realmente importa es la filosofía detrás, las compensaciones que hace y cómo esas
decisiones afectan la **experiencia de desarrollo, el rendimiento y la escalabilidad** en
proyectos reales.

Quo.js fue diseñado como una evolución pragmática de las ideas originales de Redux:\
*Actions* explícitas, transiciones de estado predecibles, tipado fuerte con TypeScript y manejo
de *async/effects* integrado — sin la “magia” oculta ni el *boilerplate* de otros ecosistemas.

Para ayudarte a decidir si Quo.js es la mejor opción, hemos preparado comparaciones directas
contra otras librerías populares. Cada documento explora:

* **Modelo conceptual** (cómo fluye el estado a través de *Actions*, *Reducers* y *Effects*)
* **Ergonomía de desarrollo** (*boilerplate*, tipado, herramientas de depuración)
* **Rendimiento** (granularidad de suscripciones, eficiencia en re-renderizados)
* **Async & effects** (cómo se expresan *workflows* y efectos secundarios)
* **Integración con React** (selectores, Suspense, soporte para concurrent mode)

👉 Revisa las comparaciones [aquí](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.es.md).

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

* [Guía de Desarrollo](https://github.com/quojs/quojs/blob/main/docs/es/DEVELOPER_GUIDE.md)

## Docs

### Núcleo

* [TypeDoc](https://github.com/quojs/quojs/blob/main/packages/core/docs/README.md): una
  documentación más técnica extraída utilizando TypeDoc (en Inglés).
* [Desarrollador (en proceso)](https://www.quojs.dev/?lang=es): guía de inicio rápido, tutorial,
  gists, etc.

### Bindings para React

* [TypeDoc](https://github.com/quojs/quojs/blob/main/packages/react/docs/README.md): una documentación más técnica extraída
  utilizando TypeDoc.
* [Desarrollador (en proceso)](https://www.quojs.dev/?lang=es): guía de inicio rápido, tutorial,
  gists, etc.

## Contribuir

* Empieza aquí — [Guía de contribución](https://github.com/quojs/quojs/blob/main/docs/es/CONTRIBUTING.md)
* [Código de conducta](https://github.com/quojs/quojs/blob/main/docs/es/CODE_OF_CONDUCT.md)
* [Gobernanza](https://github.com/quojs/quojs/blob/main/docs/es/GOVERNANCE.md)
* [Mantenedores](https://github.com/quojs/quojs/blob/main/docs/es/MAINTAINERS.md)
* [Seguridad](https://github.com/quojs/quojs/blob/main/docs/es/SECURITY.md)
* [Workflow](https://github.com/quojs/quojs/blob/main/docs/es/WORKFLOW.md)
* [Marcas](https://github.com/quojs/quojs/blob/main/docs/es/TRADEMARKS.md)

## Estado

Quo.js está en fase RC. Por ahora, clone el repositorio y use Rush para probarlo en **[los ejemplos/](https://github.com/quojs/quojs/blob/main/examples/)**.
Una vez que recibamos suficientes comentarios, publicaremos la versión inicial para su instalación mediante `npm`. Agradecemos sus comentarios y PRs.

Hecho con ❤️ en 🇲🇽, para el 🌎.
