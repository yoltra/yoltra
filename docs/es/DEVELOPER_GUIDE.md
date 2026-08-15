![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Guía del Desarrollador

> [🇺🇸 English](../en/DEVELOPER_GUIDE.md) &nbsp;|&nbsp; 👉 Español

Fuente única de verdad para configurar el monorepo, entender su estructura y realizar el trabajo
de desarrollo diario.

Para la estrategia de ramas y el proceso de PRs consulta [WORKFLOW.md](./WORKFLOW.md). Para
publicar versiones (local + NPM) consulta [RELEASE_GUIDE.md](./RELEASE_GUIDE.md).

---

## Requisitos previos

| Herramienta | Versión                    | Notas                                             |
| ----------- | -------------------------- | ------------------------------------------------- |
| Node.js     | ≥ 18.18                    | [nodejs.org](https://nodejs.org)                  |
| Rush        | última                     | `npm install -g @microsoft/rush`                  |
| Docker      | cualquier versión reciente | Solo necesario para pruebas con el registro local |

> **No instales pnpm globalmente.** Rush descarga y gestiona pnpm internamente con la versión
> exacta especificada en `rush.json`. Ejecutar `pnpm install` directamente producirá resultados
> incorrectos y corromperá el lockfile.

---

## Configuración inicial

```bash
# 1. Clonar el repositorio
git clone https://github.com/yoltra/yoltra.git
cd yoltra

# 2. Instalar todas las dependencias del workspace (Rush gestiona pnpm)
rush install

# 3. Compilar todo el monorepo (ordenado por grafo, incremental)
rush build
```

Rush lee el grafo de proyectos desde `rush.json`, instala todos los paquetes en el almacén
compartido `common/temp/` y los enlaza mediante pnpm workspaces.

---

## Estructura del repositorio

```
yoltra/
├── packages/
│   ├── core/                 @yoltra/core      — librería de contenedor de estado
│   ├── react/                @yoltra/react     — bindings para React
│   └── ds/                   @yoltra/ds        — sistema de diseño para el sitio/docs/ejemplos
│
├── devtools/
│   ├── devtools-protocol/    @yoltra/devtools-protocol      — tipos de mensajes + utilidades de parches
│   ├── devtools-server/      @yoltra/devtools-server        — el hub (relay WebSocket)
│   ├── devtools-browser-agent/ @yoltra/devtools-browser-agent — agente del lado del store (navegador)
│   ├── devtools-node-agent/  @yoltra/devtools-node-agent    — agente del lado del store (Node)
│   ├── devtools-ui/          @yoltra/devtools-ui            — hooks headless + hub de loopback
│   ├── devtools-storeview/   @yoltra/devtools-storeview     — panel embebible (React)
│   ├── devtools-ext/         @yoltra/devtools-ext           — shell de extensión MV3
│   └── devtools-cli/         @yoltra/devtools-cli           — UI de terminal con Ink
│
├── tools/
│   ├── eslint-config-base/   @yoltra/eslint-config-base  — ESLint compartido (Node + browser TS)
│   ├── eslint-config-react/  @yoltra/eslint-config-react — ESLint compartido (React + TS)
│   ├── repo-tools/           @eraelco/repo-tools         — binarios de lint/commitlint a nivel repo
│   └── registry/             Registro local Verdaccio (Docker)
│
├── examples/
│   └── v0/
│       ├── yoltra-mission-control/    Insignia — store + panel de DevTools embebido, sin instalar
│       ├── yoltra-react-counter/      Ejemplo mínimo de extremo a extremo
│       ├── yoltra-in-react/           App de comparación Yoltra vs Redux Toolkit
│       ├── yoltra-in-nextjs/          Ejemplo de integración con Next.js
│       └── yoltra-kinetic-logo/       Animación SVG — demo de suscripciones granulares
│
├── common/
│   ├── config/rush/          Archivos de configuración de Rush (versionados — nunca editar el lockfile manualmente)
│   ├── changes/              Archivos de cambios de Rush (generados por `rush change`)
│   └── scripts/              Helpers compartidos (copy-license.cjs, etc.)
│
└── docs/
    ├── en/                   Documentación en inglés
    └── es/                   Documentación en español (esta carpeta)
```

---

## Comandos del día a día

### A nivel de monorepo

```bash
rush install            # Instalar / sincronizar todas las dependencias (tras clonar o hacer pull)
rush update             # Regenerar el lockfile (ejecutar tras editar cualquier package.json)
rush build              # Compilación incremental — usa caché, omite paquetes sin cambios
rush rebuild            # Recompilación completa — ignora la caché, recompila todo
rush test               # Ejecutar Vitest en todos los paquetes
rush lint               # Ejecutar ESLint en todos los paquetes
rush typecheck          # Ejecutar tsc --noEmit en todos los paquetes
```

### Compilaciones enfocadas

Usa `--to` y `--from` para reducir la compilación a un subconjunto del grafo de dependencias:

```bash
rush build --to @yoltra/core           # Compilar core y sus dependencias transitivas
rush build --to @yoltra/react          # Compilar react (y core primero)
rush build --from @yoltra/core         # Compilar core y todos sus dependientes aguas abajo
rush build --to @yoltra/react --verbose  # Lo mismo, con salida detallada
```

### Comandos por paquete (rushx)

`rushx` ejecuta un script npm en el paquete **actual**. Primero cambia al directorio del
paquete:

```bash
cd packages/core
rushx build         # Compilar solo este paquete
rushx test          # Ejecutar pruebas con cobertura
rushx lint          # Revisar errores de lint
rushx lint:fix      # Corregir errores de lint automáticamente
rushx typecheck     # Verificación de tipos TypeScript

cd packages/react
rushx build
rushx test
rushx docs          # Generar documentación de la API con TypeDoc
```

---

## Caché de compilación

La caché de compilación local de Rush está habilitada en `common/config/rush/build-cache.json`.

Cada paquete de librería declara sus salidas cacheables en `rush-project.json`:

```json
{
  "operationSettings": [{ "operationName": "build", "outputFolderNames": ["dist"] }]
}
```

**Reglas clave:**

- `rush build` — lee y escribe en la caché; los paquetes sin cambios terminan al instante.
- `rush rebuild` — **siempre ignora la caché**; úsalo cuando sospeches de una salida
  desactualizada.
- La caché vive en `common/temp/build-cache/` (incluido en .gitignore, solo local).

---

## Arquitectura de ESLint

La configuración de lint está centralizada en dos paquetes compartidos bajo `tools/`:

| Paquete                       | Paquetes destino | Contenido                                                                 |
| ----------------------------- | ---------------- | ------------------------------------------------------------------------- |
| `@yoltra/eslint-config-base`  | `@yoltra/core`   | ESLint recommended, typescript-eslint recommended, globals browser + Node |
| `@yoltra/eslint-config-react` | `@yoltra/react`  | Extiende base + react-hooks + react-refresh                               |

Cada paquete de librería tiene un `eslint.config.mjs` mínimo que simplemente re-exporta la
configuración compartida:

```js
// packages/core/eslint.config.mjs
import baseConfig from "@yoltra/eslint-config-base";
export default baseConfig;
```

```js
// packages/react/eslint.config.mjs
import reactConfig from "@yoltra/eslint-config-react";
export default reactConfig;
```

**Para añadir una regla globalmente** — edita el paquete de configuración en `tools/`. No es
necesario tocar el `eslint.config.mjs` de cada librería. **Para sobreescribir una regla en un
paquete** — extiende el array en el `eslint.config.mjs` de ese paquete.

---

## Conventional Commits + DCO

Cada commit debe:

1. Seguir el formato de **Conventional Commits**:

   ```
   <type>(<scope>): <descripción corta>

   [cuerpo opcional]

   Signed-off-by: Tu Nombre <tu@ejemplo.com>
   ```

2. Incluir una línea de **firma DCO** (`git commit -s` la añade automáticamente).

Valores permitidos para `<type>`: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`,
`chore`, `revert`.

---

## Pruebas y cobertura

- Ejecutor: **Vitest**
- Helpers de UI: `@testing-library/react` (para `@yoltra/react`)
- Umbrales mínimos de cobertura (líneas / ramas / funciones / sentencias): **95%**

```bash
# Todos los paquetes
rush test

# Un paquete específico
cd packages/core && rushx test
```

Los snapshots solo están permitidos para salidas estables y deterministas.

---

## Archivos de cambio (requeridos en cada PR publicable)

Cualquier PR que modifique `@yoltra/core`, `@yoltra/react` u otro paquete publicado **debe**
incluir un archivo de cambio de Rush. CI lo exige: `rush change --verify` corre en cada PR a
`main` (ver `.github/workflows/ci.yml` y la [Guía de Publicación](./RELEASE_GUIDE.md)).
Verifícalo localmente antes de hacer push con el comando de abajo.

```bash
# Prompt interactivo — selecciona los paquetes que cambiaste y el tipo de bump
rush change

# Verificar que existe un archivo de cambio
rush change -v
```

Los archivos de cambio se versionan en `common/changes/` junto con el código. Cuando se prepara
una versión, `rush version --bump` los consume para actualizar las versiones en `package.json` y
generar las entradas de `CHANGELOG.md`.

> Mientras el proyecto esté en `< 1.0.0`: usa `minor` para cambios breaking y `patch` para
> correcciones.

### Dos cosas que `rush change -v` no te va a decir

Su mensaje de error dice "corre `rush change`", lo cual no ayuda cuando ya lo hiciste.

**Un archivo de cambio debe estar commiteado, no solo escrito o en el índice.** La verificación
lee los archivos de cambio del diff contra la rama destino, así que uno sin commitear le resulta
invisible — y el error es idéntico, palabra por palabra, al de no haber escrito ninguno. Si
estás viendo un archivo que acabas de crear mientras Rush insiste en que no existe, commitéalo.

**El primer PR después de un bump de versión recibe reclamos por archivos de cambio que no se
ganó.** `rush version --bump` reescribe los rangos de dependencias (`"@yoltra/core": "^0.3.0"` →
`"^0.4.0"`) en cada paquete que depende de un hermano en lockstep. Rush ignora un diff de
`package.json` que solo toca el campo `version` **propio** del proyecto, pero trata la edición de
un **rango de dependencia** como contenido real — así que esos paquetes, y solo esos, quedan
marcados. Espera `@yoltra/react`, `@yoltra/devtools-node-agent` y
`@yoltra/devtools-browser-agent`. Escríbeles un archivo de cambio que describa tu trabajo real;
no es un caché viejo y no hay nada que purgar.

---

## Agregar un nuevo paquete publicable

1. Crea la carpeta bajo `packages/` o `tools/`.
2. Añade un `package.json` con `"publishConfig": { "access": "public" }`.
3. Añade un `rush-project.json` mínimo (declara `outputFolderNames` si el paquete compila).
4. Registra el paquete en `rush.json` bajo `"projects"`.
5. Ejecuta `rush update` para regenerar el lockfile.
6. Si se publica junto con la suite de producto, define `"versionPolicyName": "yoltra"` (la
   política lockstep — ver la [Guía de Publicación](./RELEASE_GUIDE.md)); si no, déjalo sin definir
   para versionado independiente.

### Convenciones de salida de compilación

Dos reglas que solo afectan a quien consume el paquete, así que nada en este repositorio te
avisa. Ambas las verifica `node common/scripts/check-publish-metadata.mjs` — ejecútalo antes de
publicar.

**Nombra las salidas `.mjs` y `.cjs`, nunca `.esm.js` / `.cjs.js`.** Node determina el formato
de un archivo `.js` a partir del campo `type` del `package.json` más cercano, así que un `.js`
significa lo contrario dentro de un paquete `"type": "module"` que fuera de él. Ambas
direcciones ya se publicaron rotas: una condición `require` apuntando a un `.js` dentro de un
paquete `"type": "module"` lanza `ReferenceError: exports is not defined`, y una condición
`import` apuntando a un `.js` en un paquete sin campo `type` falla en todo Node anterior a 22.7.

```jsonc
"exports": {
  ".": {
    "types":   "./dist/types/index.d.ts",
    "import":  "./dist/thing.mjs",
    "require": "./dist/thing.cjs"
  }
}
```

**Añade el paso de extensiones de declaración al script `build` del paquete:**

```jsonc
"build": "vite build && node ../../tools/repo-tools/bin/dts-extensions.mjs dist/types"
```

TypeScript emite las declaraciones tal como las escribió el código fuente, y aquí escribimos
importaciones relativas sin extensión. En un paquete `"type": "module"` esas no resuelven, y
como casi todo proyecto usa `skipLibCheck: true` los errores quedan suprimidos mientras **cada
símbolo reexportado degrada a `any`** — una compilación en verde sin ninguna verificación de
tipos, que es peor que un fallo porque nada en ella parece un fallo.

---

## Actualizar dependencias

1. Edita el `package.json` correspondiente.
2. Ejecuta `rush update` para recalcular y reescribir el lockfile.
3. Haz commit tanto del cambio en `package.json` como del `common/config/rush/pnpm-lock.yaml`
   actualizado.

Nunca toques `common/config/rush/pnpm-lock.yaml` manualmente.

---

## Solución de problemas

| Síntoma                                      | Solución                                                                                      |
| -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Falta el archivo de cambio                   | Ejecuta `rush change` y haz commit del archivo en `common/changes/`.                          |
| `rush install` falla con errores de peer dep | `strictPeerDependencies: false` ya está configurado; prueba `rush install --purge`.           |
| Commit rechazado                             | Asegúrate del formato Conventional Commits + firma DCO (`git commit -s`).                     |
| Salida de compilación desactualizada         | `rush rebuild` ignora la caché y fuerza una recompilación completa.                           |
| Verdaccio: "version already exists"          | Sube la versión (`rush change` + `rush version --bump`) o borra con `docker compose down -v`. |
| `rushx` no encontrado                        | `npm install -g @microsoft/rush`                                                              |
| Versión de pnpm incorrecta en el lockfile    | Nunca ejecutes `pnpm install` directamente; usa siempre `rush install` / `rush update`.       |
