![Quo.js logo](../../assets/logo.svg)

# Guía de Desarrollo (Monorepo Quo.js)

>  👉 [ 🇲🇽 Versión en Español](../es/DEVELOPER_GUIDE.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](../pt/DEVELOPER_GUIDE.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](../../DEVELOPER_GUIDE.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](../fr/DEVELOPER_GUIDE.md)

Fuente única de verdad para el SDLC, configuración local, _branching_, pruebas/cobertura y
lanzamientos usando **Rush + PNPM**.

## SDLC (cómo entregamos)

1. Planificar → abrir/triage de un Issue (bug/feat).
2. Ramificar → `feature/<issue>-<slug>` o `fix/<issue>-<slug>`.
3. Codificar → pruebas + documentación; **Conventional Commits** con firma **DCO**.
4. Puertas locales → pasan `rush build` y `rush test`; cobertura ≥ umbrales.
5. PR → completar la plantilla de PR; enlazar issues; CI debe estar en verde (**change files**
   verificados).
6. Revisión → aprobaciones; _squash_ o _rebase_ según criterio del mantenedor.
7. Lanzamiento → los mantenedores ejecutan `rush version` y luego `rush publish` (ver
   “Lanzamientos” abajo).

## Configuración local

Instala Rush (una sola vez):

```bash
npm i -g @microsoft/rush
```

Instala dependencias (determinístico vía PNPM + Rush):

```bash
rush install
```

Compila todo (construye del grafo, incremental; usa caché de compilación de Rush):

```bash
rush build
```

Ejecuta pruebas para todos los paquetes (definido vía command-line.json):

```bash
rush test
```

Lint para todos los paquetes que definan un script "lint":

```bash
rush lint
```

Compilaciones focalizadas:

```bash
rush build --to @quojs/core
rush build --from @quojs/react
```

Trabajo a nivel de paquete:

```bash
cd packages/quojs

rushx build
rushx test
rushx lint
```

## Estrategia de ramas

- Rama por defecto: `main`.
- El trabajo ocurre en ramas `feature/*` o `fix/*`.
- Abre PRs contra `main`.
- Cada PR que cambie un paquete publicable debe incluir un **change file** (ver “Cambios y
  versionado”).

## Conventional commits + DCO (aplicado)

Cada commit debe:

- seguir **Conventional Commits** (linteado localmente vía Husky y en CI), y
- incluir una línea de firma **DCO**, por ejemplo:

```
  Signed-off-by: Tu Nombre <tu@tu-proveedor-de-email.com>
```

> Consejo: usa `git commit -s` para añadir la línea DCO automáticamente.

Tipos permitidos:

- `feat`
- `fix`
- `perf`
- `refactor`
- `docs`
- `test`
- `build`
- `chore`
- `revert`

## Pruebas y cobertura

- _Test runner_: **Vitest**.
- Pruebas de UI: **@testing-library/react** (para `quojs-react`).
- Los umbrales de cobertura se aplican en la configuración de Vitest:
  - Líneas / Ramas / Funciones / Sentencias: **≥ 95%** (sobre código tocado).
- _Snapshots_ solo para salidas estables y deterministas.

Ejecutar:

```bash
rush test
```

## Linting y formato

- ESLint (TypeScript), Prettier.
- Scripts por paquete se ejecutan vía `rushx`.

Ejemplos:

```bash
rush lint
cd packages/quojs-react && rushx lint
rushx format
```

## Caché de compilación (Rush)

El repositorio habilita la **caché local** de compilación de Rush. La configuración vive en:

- A nivel repo: `common/config/rush/build-cache.json`
- _Outputs_ por paquete: `packages/<name>/config/rush-project.json`

Los _outputs_ se cachean desde `dist/` para ambos paquetes núcleo. Para `@quojs/core`, la clave
de caché también incluye `BUILD_TARGET`.

Notas:

- `rush build` leerá/escribirá caché.
- `rush rebuild` **omite** la caché y recompila desde cero (por diseño).

## Cambios y versionado (Rush)

### Archivos de cambio

Crea entradas de cambio en `common/changes/`:

```bash
rush change
```

CI verifica los archivos de cambio en los PRs:

```bash
rush change -v
```

### Políticas de versión

- `quojs-lockstep` (lockStepVersion): mantiene **@quojs/core** y **@quojs/react** en
  sincronía.
- `lib-individual` (individualVersion): reservado para futuros _adapters_ no atados al ritmo del
  núcleo.

Los proyectos se asignan en `rush.json` vía `versionPolicyName`.

## Lanzamientos

### Lanzamiento oficial (mantenedores)

1. Incrementar versiones/_changelogs_ a partir de los archivos de cambio acumulados:

```bash
rush version
```

2. Publicar al registro real (banderas de ejemplo; añade OTP/acceso según sea necesario):

```bash
rush publish --apply --publish --target-branch main
```

> Consejo: ejecuta `rush publish` sin banderas para un _dry-run_ del plan.

### Ensayo de lanzamiento local (Verdaccio)

Existen dos formas seguras:

#### A) _Dry run_ solo tarballs (sin registro)

Genera archivos `.tgz` para cada paquete público bajo `./dist-tarballs/`.

```bash
rush change
rush publish --include-all --pack --release-folder ./dist-tarballs
```

Consumir en apps:

```bash
pnpm add ./dist-tarballs/quojs-quojs-<ver>.tgz
pnpm add ./dist-tarballs/quojs-quojs-react-<ver>.tgz
```

#### B) Publicación en registro local (script Verdaccio)

Inicia Verdaccio e inicia sesión una vez:

```bash
docker compose -f ops/verdaccio/docker-compose.yml up -d
pnpm adduser --registry http://localhost:4873/
```

Luego ejecuta el script:

```bash
common/scripts/publish-verdaccio.sh
```

Opciones:

- `--skip-bump` para saltar `rush version`
- `--skip-tests` para no correr ejemplos contra Verdaccio
- `--registry URL` si no usas localhost

Restablecer registro:

```bash
docker compose -f ops/verdaccio/docker-compose.yml down -v
unset npm_config_registry
```

Notas:

- Los registros no permiten republicar la misma versión; sube _patch_ para ensayos repetidos o
  limpia el almacenamiento de Verdaccio.
- El registro de instalación por defecto es npmjs vía `common/config/rush/.npmrc`.
- El registro de publicación es Verdaccio vía `common/config/rush/.npmrc-publish` usando
  `${NPM_AUTH_TOKEN}`.

## Reporte de bugs y PRs (GitHub)

- Usa las plantillas de **Bug Report** y **Feature Request**.
- Los PRs deben seguir la **plantilla de Pull Request**.

Checklist mínimo para PR:

- _Conventional commit_ + firma DCO
- `rush build` y `rush test` pasan localmente
- Archivo de cambio agregado (si cambió un paquete publicable)
- La cobertura cumple umbrales (CI fallará de lo contrario)

## Seguridad

Consulta [SECURITY](./SECURITY.md). **No** abras issues públicos por vulnerabilidades.

## Solución de problemas (respuestas rápidas)

- Falta archivo de cambio → ejecuta `rush change`; CI también verifica con `rush change -v`.
- Commit rechazado localmente → corrige el mensaje para cumplir Conventional Commits y añade la
  línea DCO; o usa `git commit -s`.
- La caché parece obsoleta → recuerda que `rush rebuild` ignora la caché; usa `rush build` para
  beneficiarte de la caché.
- Verdaccio “version already exists” → incrementa versión (vía `rush change` + `rush version`) o
  limpia el almacenamiento de Verdaccio.
- Las instalaciones apuntan inesperadamente a Verdaccio → asegúrate de no haber exportado
  `npm_config_registry`; elimina cualquier .npmrc por proyecto.

## Consejos de DX

- Las extensiones recomendadas de VS Code están en `.vscode/extensions.tson`.
- El formateo está estandarizado vía `.prettierrc.json` y `.editorconfig`.
- Las _project references_ de TypeScript están configuradas para mejorar navegación del IDE y
  _builds_.
