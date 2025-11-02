![Quo.js logo](../../assets/logo.svg)

# Quo.js El estado de las cosas, re-escrito.

> 👉 [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp; | &nbsp;[ 🇫🇷 Version française](./README.fr.md)

**@quojs/core** es una biblioteca moderna de gestión de estado, **agnóstica de framework** e
inspirada en Redux — pero sin el peso de Toolkit. Introduce **canales + eventos**, **middleware
y effects asíncronos nativos**, y **suscripciones atómicas**.

> Funciona en **navegadores y en Node**. No asume DOM. Adecuado para Node 18+, Bun y Deno (con
> ESM).

## Instalación

```bash
npm i @quojs/core
```

## ¿Por qué Quo.js?

- 🔗 **Modelo Canal + Evento** — `{ channel, event, payload }` para modularidad natural
- 🎯 **suscripciones atómicas** — seguimiento atómico de cambios
- ⚡ **Middleware y effects asíncronos** — integrados, sin _thunk/saga_
- 🛡 **TypeScript primero** — tipos ergonómicos y predecibles
- 🧩 **Reductores dinámicos** — añade/quita reduceres en tiempo de ejecución
- 🧭 **Agnóstico de framework** — úsalo con `@quojs/react` o sin UI en Node

## Docs

- [Desarrollador](https://quojs.dev/?lang=es): guía de inicio rápido, tutorial, gists, etc.
- [TypeDoc](./docs/README.md): una documentación más técnica extraída utilizando TypeDoc (en Inglés).

## Enlaces

- [Monorepo](../../docs/es/README.md)
- [Gobernanza](../../docs/es/GOVERNANCE.md)
- [Código de conducta](../../docs/es/CODE_OF_CONDUCT.md)
- [Guía de Contribución](../../docs/es/CONTRIBUTING.md)

## Estado

**Fase RC**. APIs estables (potencialmente cambiantes), tipos estrictos, uso en producción. Se
agradecen comentarios y PRs.

Hecho con ❤️ en 🇲🇽 para el 🌎.
