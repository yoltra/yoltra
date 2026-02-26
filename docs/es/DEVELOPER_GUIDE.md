![Yoltra logo](../../assets/yoltra-logo.png)

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
│   └── react/                @yoltra/react     — bindings para React
│
├── tools/
│   ├── eslint-config-base/   @yoltra/eslint-config-base  — ESLint compartido (Node + browser TS)
│   ├── eslint-config-react/  @yoltra/eslint-config-react — ESLint compartido (React + TS)
│   └── registry/             Registro local Verdaccio (Docker)
│
├── examples/
│   └── v0/
│       ├── yoltra-in-react/        App de comparación Yoltra vs Redux Toolkit
│       ├── yoltra-in-nextjs/       Ejemplo de integración con Next.js
│       └── yoltra-kinetic-logo/    Animación SVG — demo de suscripciones granulares
│
├── common/
│   ├── config/rush/          Archivos de configuración de Rush (versionados — nunca editar el lockfile manualmente)
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

Cualquier PR que modifique `@yoltra/core`, `@yoltra/react` o un paquete publicado de `tools/`
**debe** incluir un archivo de cambio de Rush. El CI rechazará los PRs que no lo tengan.

```bash
# Prompt interactivo — selecciona los paquetes que cambiaste y el tipo de bump
rush change

# Verificar que existe un archivo de cambio (el CI también ejecuta esto en cada PR)
rush change -v
```

Los archivos de cambio se versionan en `common/changes/` junto con el código. Cuando se prepara
una versión, `rush version --bump` los consume para actualizar las versiones en `package.json` y
generar las entradas de `CHANGELOG.md`.

> Mientras el proyecto esté en `< 1.0.0`: usa `minor` para cambios breaking y `patch` para
> correcciones.

---

## Agregar un nuevo paquete publicable

1. Crea la carpeta bajo `packages/` o `tools/`.
2. Añade un `package.json` con `"publishConfig": { "access": "public" }`.
3. Añade un `rush-project.json` mínimo (declara `outputFolderNames` si el paquete compila).
4. Registra el paquete en `rush.json` bajo `"projects"`.
5. Ejecuta `rush update` para regenerar el lockfile.
6. Asígnalo a la política de versiones `"lockstep"` (si se publica junto con core/react) o deja
   `versionPolicyName` sin definir para versionado independiente.

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
| CI rechaza el PR: "missing change file"      | Ejecuta `rush change` y haz commit del archivo en `common/changes/`.                          |
| `rush install` falla con errores de peer dep | `strictPeerDependencies: false` ya está configurado; prueba `rush install --purge`.           |
| Commit rechazado                             | Asegúrate del formato Conventional Commits + firma DCO (`git commit -s`).                     |
| Salida de compilación desactualizada         | `rush rebuild` ignora la caché y fuerza una recompilación completa.                           |
| Verdaccio: "version already exists"          | Sube la versión (`rush change` + `rush version --bump`) o borra con `docker compose down -v`. |
| `rushx` no encontrado                        | `npm install -g @microsoft/rush`                                                              |
| Versión de pnpm incorrecta en el lockfile    | Nunca ejecutes `pnpm install` directamente; usa siempre `rush install` / `rush update`.       |
