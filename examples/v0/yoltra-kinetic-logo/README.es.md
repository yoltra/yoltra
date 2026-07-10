![Yoltra logo](../../../assets/yoltra-logo.png)

# Yoltra: Animación cinética del logo

![Yoltra dots](../../../assets/yoltra-dots.gif);

> 👉🇲🇽 Versión en Español &nbsp; &nbsp; | [ 🇺🇸 English Version](./README.md)&nbsp;

> Una animación cinética del logo, de alto rendimiento, que demuestra las **suscripciones
> atómicas** de Yoltra.

Cada píxel no transparente del logo de Yoltra se convierte en un punto independiente. Hasta
**3000** puntos\
entran volando desde posiciones aleatorias y se acomodan en su píxel de destino. Mueve el cursor
sobre el lienzo\
para repeler los puntos; cuando lo alejas, regresan suavemente.

---

## Qué demuestra este demo

---

Función de Yoltra Dónde se utiliza

---

`createYoltra` Una sola llamada en `state/yoltra.ts` devuelve el store y todos los hooks tipados
--- sin archivo de context, sin `createHooks`, sin provider

`useAtomicProp` Cada `<PixelDot>` se suscribe exactamente a `pixel.dots.<id>` (ruta string
dinámica); `Screen` usa accessors tipados para sus rutas estáticas

`when: { channel }` El reducer apunta a todo el canal `pixel` con un único matcher

`store.onEffect` El `Engine` conecta los efectos `pixel/stop` y `pixel/start` al bucle rAF; la
`Simulation` conecta efectos `on/mousemove` a la consulta del quadtree

Reducer `batchUpdate` Estrategia de pasada única con asignación perezosa: el registro `dots` se
expande **como máximo una vez por frame**, sin importar cuántos puntos se movieron

---

### Suscripciones atómicas --- la idea clave

    batchUpdate  →  reducer  →  store notifica a 3000 suscriptores
                                 │
                                 ├─ dot_0 sin cambios  →  no hay re-render
                                 ├─ dot_1 cambió       →  re-render (solo cx, cy)
                                 ├─ dot_2 sin cambios  →  no hay re-render
                                 └─ …

Un frame que mueve 300 puntos dispara exactamente **300 renders de React**, cada uno
actualizando dos atributos SVG.\
Los otros 2700 componentes permanecen intactos.

---

## Diseño de rendimiento del reducer

La ruta crítica es `batchUpdate`, llamada en cada frame de animación.

**Enfoque anterior v0 (O(N_dots × N_changes) asignaciones):**

```ts
for (const c of changes) {
  state = { ...state, [group]: { ...state[group], [c.id]: next } };
}
return { ...state };
```

Con 500 cambios afectando el mismo registro de 3000 claves: ≈ 500 × 3000 = **1,500,000 copias de
propiedades** por frame.

**Nuevo enfoque v1 (O(N_dots + N_changes) --- como máximo 2 asignaciones):**

```ts
let nextDots: Record<string, Dot> | null = null;

for (const c of changes) {
  const prev = (nextDots ?? state.dots)[c.id];
  if (c.x !== prev?.x || c.y !== prev?.y) {
    if (!nextDots) nextDots = { ...state.dots };
    nextDots[c.id] = { id: c.id, x: c.x, y: c.y, color: prev?.color ?? c.color };
  }
}
return nextDots ? { ...state, dots: nextDots } : state;
```

Mismo frame: 1 × 1000 (expansión de dots) + 1 × unas pocas (expansión de state) = **\~1000
copias de propiedades**.

---

## Ejecutar localmente

```bash
# desde la raíz del repositorio
rush install
rush build
cd examples/v0/yoltra-kinetic-logo
pnpm dev
```

Luego abre `http://localhost:5173`.

---

## Arquitectura

    src/
    ├── App.tsx                        Bootstrap: carga imagen → extrae specs → inicia el engine
    ├── state/
    │   ├── types.ts                   AppState / AppEM / Dot / DotUpdate
    │   ├── yoltra.ts                  createYoltra() — store + hooks tipados + withDevtools
    │   └── pixel/
    │       └── Pixel.reducer.ts       Reducer optimizado para el canal `pixel`
    ├── components/
    │   ├── config-panel/
    │   │   └── ConfigPanel.component.tsx  Controles en vivo de física / muestreo
    │   └── screen/
    │       ├── Screen.component.tsx   Lienzo SVG + eventos de puntero (accessors tipados)
    │       └── items/dot/
    │           └── Dot.component.tsx  Un punto → una suscripción atómica (ruta dinámica)
    └── utils/
        ├── index.ts                   Helpers matemáticos (expApproach, orbit, clamp…)
        ├── Quadtree.ts                QuadTree genérico<T extends PointItem>
        ├── image/
        │   ├── imagePixels.ts         PNG → ImageData vía OffscreenCanvas
        │   └── extract.ts             Escaneo de píxeles + reservoir sampling → DotItemSpec[]
        └── engine/
            ├── Engine.ts              Bucle rAF, suavizado de FPS, suscripciones a efectos
            ├── Simulation.ts          Pool de ítems, quadtree, manejador de mouse
            ├── DotItem.ts             Física por punto (expApproach + orbit)
            └── SimulationItem.ts      Clase base abstracta

---

## Personalización

---

Opción Ubicación Valor por defecto

---

Máximo de puntos `App.tsx` → `MAX_DOTS` `3000`

Imagen del logo `src/assets/logo.png` Logo de Yoltra

FPS objetivo `App.tsx` → `60` `new Engine({ targetFPS })`

Radio de repulsión `DotItem.ts` → `INTERACT_RADIUS` `8 px`

Velocidad de `extract.ts` → opción `factor` aleatorio acercamiento `[3, 7]`

Retraso inicial `extract.ts` → opción `delay` aleatorio `[0, 0.8 s]`

---

# Licencia

MIT - **Yoltra Kinetic Logo** es un proyecto de ejemplo, provisto con fines de demostración y documentación.
