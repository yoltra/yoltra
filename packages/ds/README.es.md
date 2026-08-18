![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/ds

> 👉 🇲🇽 Versión en Español&nbsp; | &nbsp;[ 🇺🇸 English Version](./README.md)

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
| `Portal`, `Dialog`, `Drawer` | Overlays modales, renderizados fuera del árbol. Ver más abajo. |
| `Popover`, `Menu`, `ContextMenu`, `Tooltip` | Overlays anclados, posicionados contra un trigger o un punto. |

## Marca

Azul primario `#1A7FE2`, tinta `#0F172A`. Tipografía: **Inter** + **JetBrains Mono**.

## Instalando los estilos

El sistema de diseño publica **una hoja de estilos por componente**, de modo que una aplicación
carga los estilos de lo que importa y nada más. Dos hojas hacen falta siempre; el resto son
opcionales.

```ts
import "@yoltra/ds/styles/tokens.css";   // las custom properties, ambos temas
import "@yoltra/ds/styles/base.css";     // la raíz de 10px, .yl-root, .yl-container
import "@yoltra/ds/styles/button.css";   // una por cada componente que uses
import "@yoltra/ds/styles/badge.css";
```

`@yoltra/ds/styles/all.css` las lleva todas, para un sitio de documentación o un prototipo donde
el intercambio no vale la pena.

Es deliberado. El JavaScript se sacude — el presupuesto de tamaño lo demuestra — pero una sola
hoja con las reglas de todos los componentes no puede, así que se vuelve un costo que toda
aplicación paga sin importar lo que renderice.

`themeCss()` se sigue exportando y emite las mismas custom properties, para un render de servidor
que necesite inyectarlas en línea en vez de enlazarlas.

## 1rem son 10px

`base.css` define `html { font-size: 62.5% }`, lo que deja la raíz en 10px y hace que cada
longitud del sistema se lea como su valor en píxeles dividido entre diez — `1.6rem` son 16px,
`0.4rem` son 4px. Los tokens se escriben en píxeles, porque que `spacing[4]` sea `16` es más
fácil de razonar que `1.6`, y solo el valor emitido lleva la unidad.

`rem` en lugar de `px` para que la preferencia de tamaño de fuente del lector siga escalando la
interfaz. La raíz más pequeña hace legible la aritmética; no vuelve fijo el tamaño.

De ahí se siguen tres cosas, y son fáciles de equivocar:

- **Los breakpoints van en píxeles.** `rem` dentro de una media query se resuelve contra el
  tamaño de fuente raíz *inicial*, no contra este, así que un breakpoint en rem sería
  silenciosamente 1.6× lo que aparenta.
- **Los bordes de un pixel van en píxeles.** `0.1rem` invita al redondeo subpíxel; un borde de
  1px debería medir 1px.
- **La declaración de raíz es global.** Afecta al documento entero, no solo a los componentes de
  Yoltra. Una aplicación que no pueda aceptarlo debería importar
  `@yoltra/ds/styles/base-no-root.css` y definir su propia raíz — momento en el cual cada
  longitud `--yl-*` queda relativa a lo que esa aplicación elija.

## Overlays

`Dialog` y `Drawer` se renderizan a través de `Portal` dentro de un nodo bajo `document.body`, en
vez de donde están escritos. No es una decisión estética — renderizar en el sitio pierde contra
el CSS de tres maneras distintas, y ninguna se arregla con `z-index`:

- un ancestro con `overflow: hidden` recorta el panel;
- un ancestro con `transform`, `filter` o `will-change` se convierte en el bloque contenedor de
  `position: fixed`, así que un diálogo "centrado en el viewport" queda centrado en ese ancestro;
- un ancestro que estableció un contexto de apilamiento atrapa al overlay debajo de lo que esté
  encima de *ese* ancestro.

Portar al body deja al overlay compitiendo únicamente con el orden de apilamiento del documento,
que es lo que describen los tokens `--yl-z-*`. Su orden codifica contención: un popover abierto
dentro de un diálogo queda por encima de él, y un tooltip por encima de ambos.

### El nivel modal

`Dialog` y `Drawer` son controlados — `open` y `onClose` son todo el contrato de estado — y traen
el comportamiento que hace a un overlay usable en vez de meramente visible:

| Comportamiento | Qué evita |
| --- | --- |
| Foco atrapado dentro de la superficie | Que Tab salga del modal hacia la página de atrás |
| Foco restaurado al cerrar | Que el siguiente Tab empiece desde el inicio del documento |
| Scroll de página bloqueado, con conteo de referencias | Que la página de atrás se desplace bajo el panel; y que el bloqueo sobreviva al último overlay |
| Descarte con Escape y con clic fuera, apilado | Que una sola tecla cierre el menú *y* el diálogo que está detrás |

`title` es obligatorio, no opcional. Un modal sin nombre accesible se anuncia como "diálogo" y
nada más, que es la forma más común de equivocar este componente; envuélvelo en `VisuallyHidden`
si el diseño no lleva encabezado visible.

```tsx
import { Dialog } from "@yoltra/ds/client";
import "@yoltra/ds/styles/modal.css";

<Dialog open={open} onClose={close} title="Dar de baja satélite" description="Esto no se puede deshacer.">
  <Text>SAT-04 dejará de reportar telemetría de inmediato.</Text>
</Dialog>;
```

### El nivel anclado

`Popover`, `Menu` y `ContextMenu` no son modales: se sientan junto a la página en vez de encima,
así que no atrapan ni bloquean nada. Se cierran con Escape, con un clic fuera, y cuando el foco se
va hacia algo que no es ni la superficie ni su trigger. `Menu` añade el patrón de teclado de menú
— el foco pasa al primer elemento al abrir y rota con las flechas, Home y End, dando la vuelta en
ambos extremos; Tab cierra y sigue más allá del trigger.

Cada uno recibe un render prop `trigger` y le entrega el cableado ARIA:

```tsx
<Menu
  open={open}
  onClose={() => setOpen(false)}
  label="Acciones del satélite"
  trigger={(props) => <Button {...props} onClick={() => setOpen((v) => !v)}>Acciones</Button>}
>
  <MenuItem onSelect={deploy}>Desplegar paneles</MenuItem>
  <MenuItem onSelect={boost} disabled>Elevar órbita</MenuItem>
</Menu>
```

Entregar `aria-expanded`, `aria-haspopup` y `aria-controls` en vez de documentarlos es
deliberado: ese cableado es el paso que se salta, y entonces un lector de pantalla describe un
botón que aparenta no hacer nada.

Un `MenuItem` deshabilitado lleva `aria-disabled`, no el atributo `disabled`, para que las flechas
sigan llegando a él. Que te digan que una acción no está disponible es mejor que no poder
enterarte de que existe.

`ContextMenu` se ancla a un punto en lugar de a un elemento — `at={{ x, y }}` desde un evento
`contextmenu`, o `null` cuando está cerrado. La aritmética de posicionamiento trata un punto como
un rectángulo de tamaño cero, así que voltea y recorta cerca de los bordes de la ventana igual que
un menú anclado a un elemento.

`Tooltip` es la excepción a la regla de "controlado": su visibilidad pertenece al puntero y al
anillo de foco, no al estado de la aplicación. Nunca toma el foco, y se cablea con
`aria-describedby` en vez de `aria-label` — etiquetar con un tooltip deja un botón de ícono cuyo
nombre desaparece cuando el tooltip lo hace.

### Posicionamiento

`resolvePlacement` se exporta y es puro. Voltea únicamente cuando el lado opuesto realmente cabe —
"el lado con más espacio" suena equivalente pero mueve un overlay más alto que la ventana por unos
pocos puntos porcentuales de área visible, lo que no compra nada y vuelve impredecible la
posición. El recorte aplica solo al eje transversal; recortar el eje principal deslizaría el
overlay encima del mismísimo elemento que describe.

Las posiciones son coordenadas de viewport contra `position: fixed`, así que no hay aritmética de
offset-parent — la fuente habitual de los bugs "correcto en todas partes menos dentro de ese panel
con scroll".

**Una limitación que conviene conocer.** El overlay es `position: fixed`, así que un ancestro de
la *raíz del portal* con un transform aún lo capturaría — pero la raíz del portal es hija directa
de `document.body`, con lo que en la práctica eso significa un transform sobre `<body>` mismo.

## Tamaño

Medido como lo publica un consumidor — empaquetado, sacudido, minificado, comprimido con gzip — y
verificado por `rush size` en cada build.

| Import | Tamaño |
| --- | --- |
| `{ Button, Card, Stack, Text }` | 2.4 KB |
| todo | 5.4 KB |
| `{ Dialog }` desde `/client` | 1.9 KB |
| todo `/client` | 4.5 KB |

La distancia entre las filas de barrel y las de import nombrado es el tree-shaking funcionando —
`{ Dialog }` no se movió cuando aterrizó el nivel anclado, aunque el barrel de cliente creció dos
tercios. La cifra del barrel es
un detector de crecimiento, no un costo que alguien pague; `import * as all` no es algo que la
gente escriba.

Estos números son menores que antes de separar la hoja de estilos, y eso no es una mejora — el
CSS no encogió, salió del bundle de JavaScript hacia archivos que importas deliberadamente. Suma
las hojas de los componentes que uses al comparar.

## Autoría de estilos

Los estilos de los componentes son SASS, en `src/primitives/<Componente>.scss` y
`src/overlay/<Componente>.scss`, compilados a un archivo por componente por
`scripts/build-styles.mjs`.

SASS nunca es dueño de un *valor*. Los colores, espaciados y radios se leen como `var(--yl-*)`,
porque el tema es un cambio de atributo `data-theme` en tiempo de ejecución sobre la raíz del
documento, y una variable SASS se compila mucho antes de que ese cambio ocurra. Lo que SASS
aporta es anidamiento, archivos por componente y los mixins de `src/styles/_mixins.scss` — anillo
de foco, oculto-visualmente, breakpoints — que antes eran fragmentos repetidos dentro de un
template literal.

## Licencia

MIT © Manu Ramirez
