![Yoltra logo](../../../assets/yoltra-logo.png)

# Yoltra en Next.js (React 19)

> 👉 [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp;

Un ejemplo minimo que muestra como **[Yoltra](https://yoltra.dev)** -- reactividad de grano fino
para aplicaciones orientadas a eventos -- puede ejecutarse **dentro de una aplicacion Next.js
(App Router)**, incluyendo componentes cliente compatibles con SSR.

Esta demo implementa un sencillo **selector de tema** (claro ↔ oscuro) impulsado por
`@yoltra/core` y `@yoltra/react`, demostrando que **Yoltra** puede gestionar el estado de la
aplicación sin fricciones en **React 19 + Next.js 16**.

---

## Propósito

Este ejemplo está diseñado para:

- Demostrar que **Yoltra funciona bajo SSR de Next.js** (Server-Side Rendering)
- Mostrar **suscripciones atómicas** — la UI solo actualiza los componentes cuyos valores
  cambian
- Implementar un **sistema de temas** usando reductores y selectores atómicos de Yoltra

---

## Descripción del Concepto

La app define un `themeReducer` con dos eventos:

| Evento          | Propósito                                                  |
| :-------------- | :--------------------------------------------------------- |
| `theme.set`     | Define el tema preferido (`light`, `dark` o `system`)      |
| `theme.resolve` | Resuelve el tema efectivo según la preferencia del sistema |

El tema seleccionado se aplica a `document.documentElement.classList` (`theme-light` /
`theme-dark`) y se mantiene de forma reactiva mediante la **suscripción atómica** de Yoltra con
`useAtomicProp`.

---

## Estructura

```
yoltra-in-nextjs/
├── src/
│   ├── components/
│   │   ├── Head.component.tsx
│   │   ├── Header.component.tsx
│   │   └── Content.component.tsx
│   ├── context/
│   │   └── Store.context.ts
│   ├── state/
│   │   ├── theme/Theme.reducer.ts
│   │   ├── hooks.ts
│   │   ├── store.ts
│   │   └── types.ts
│   └── pages/
│       └── index.tsx
└── package.json
```

---

## Cómo Ejecutar

Primero, instala las dependencias:

```bash
rush update
```

Luego, abre una terminal en este directorio y ejecuta:

```bash
rush dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

### 3. Cambiar Tema

Haz clic en el ícono 🌙 / 🌞 en el encabezado para alternar entre modo claro y oscuro. El cambio
se maneja mediante **Yoltra** usando una actualización atómica de propiedades.
