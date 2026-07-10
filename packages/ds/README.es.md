# @yoltra/ds

El **Sistema de Diseño de Yoltra** — tokens de fundación, temas semánticos
claro/oscuro, un generador de hoja de estilos basada en variables CSS y
componentes primitivos de React compartidos por el sitio web, la documentación
y los ejemplos de [Yoltra](https://yoltra.dev).

## Instalación

```bash
npm install @yoltra/ds
```

## Uso

Inyecta la hoja de estilos una vez en la raíz de tu app y usa los primitivos
donde quieras:

```tsx
import { themeCss, Button, Callout, CodeBlock } from "@yoltra/ds";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="light">
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
      </head>
      <body className="yl-root">{children}</body>
    </html>
  );
}
```

El tema se controla mediante el atributo **`data-theme="light" | "dark"`** en la
raíz del documento. Como el DS resuelve los colores con variables CSS, los
primitivos se renderizan en el servidor — solo los controles interactivos
(cambio de tema, pestañas, botón de copiar) son componentes de cliente.

## Contenido

| Export | Propósito |
| --- | --- |
| `foundationTokens` | Escala primitiva: paleta, tipografía, espaciado, radios, elevación, movimiento. |
| `lightTheme` / `darkTheme` / `themes` | Mapeos semánticos de roles. |
| `themeCss()` | Emite la hoja de estilos completa (variables `--yl-*` + estilos base). |
| `ThemeProvider` / `useTheme` / `applyTheme` | Controlador genérico de tema. |
| `Button`, `ButtonLink`, `Badge`, `CodeBlock`, `Callout`, `Tabs`, `Table` | Componentes primitivos. |

## Marca

Azul primario `#1A7FE2`, tinta `#0F172A`. Tipografía: **Inter** + **JetBrains Mono**.

## Licencia

MIT © Manu Ramirez
