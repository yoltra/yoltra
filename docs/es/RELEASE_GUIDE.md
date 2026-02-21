![Yoltra logo](../../assets/yoltra-logo.png)

# Guía de Publicación

> [🇺🇸 English](../en/RELEASE_GUIDE.md) &nbsp;|&nbsp; 👉 Español

Esta guía cubre el ciclo completo de publicación: subida de versiones, pruebas contra el
registro Verdaccio local y publicación en npm.

Para el modelo de ramas que alimenta este proceso consulta [WORKFLOW.md](./WORKFLOW.md).

---

## Resumen del flujo de publicación

```
develop  (todos los PRs fusionados, archivos de cambio presentes)
    │
    ├── git checkout -b release/v0.9.0
    │       rush version --bump          ← consumir archivos de cambio, subir versiones
    │       revisar CHANGELOGs
    │       [prueba local con Verdaccio] ← opcional pero muy recomendado
    │
    ├── PR: release/v0.9.0 → develop    ← sincronizar bumps de versión de vuelta
    │
    └── PR: develop → main
              │
              rush publish --publish      ← publicar en npm
              git tag v0.9.0
              git push --tags
```

---

## Paso 1 — Verificar que develop está verde

Antes de crear la rama de release, verifica que todos los controles pasan:

```bash
git checkout develop
git pull

rush install
rush build
rush test
rush lint
rush typecheck
```

Comprueba también que todos los PRs publicables incluyeron archivos de cambio:

```bash
rush change -v
```

---

## Paso 2 — Crear la rama de release y subir versiones

```bash
git checkout -b release/v0.9.0

# Consumir todos los archivos de cambio y actualizar versiones en package.json + escribir CHANGELOG.md
rush version --bump

# Revisar los archivos CHANGELOG generados en cada paquete
# Revisar los números de versión actualizados en los archivos package.json

git add .
git commit -s -m "chore(release): bump versions for v0.9.0"
```

`rush version --bump` lee cada archivo en `common/changes/`, aplica el bump de semver
correspondiente a cada paquete afectado, actualiza `CHANGELOG.md` y elimina los archivos
de cambio.

**Importante:** `@yoltra/core` y `@yoltra/react` comparten la política de versiones
`"lockstep"`, por lo que siempre se mueven a la misma versión juntos.

---

## Paso 3 — Probar contra el registro Verdaccio local

Este paso te permite verificar la experiencia completa de instalación del consumidor antes
de tocar npm.

### 3a. Iniciar Verdaccio

```bash
cd tools/registry
docker compose up -d

# Verificar que está sano
curl http://localhost:4873/-/ping
```

### 3b. Crear un usuario local (solo la primera vez)

```bash
npm adduser --registry http://localhost:4873
# Introduce un nombre de usuario, contraseña y email cuando se solicite.
# Estas credenciales son solo locales — no tocan npmjs.com.
```

### 3c. Publicar en Verdaccio

```bash
# Desde la raíz del repo — publica todos los paquetes con shouldPublish:true en Verdaccio
rush publish --publish --registry http://localhost:4873

# Si la versión ya existe en Verdaccio de una prueba anterior,
# usa --include-all para forzar la publicación de todos los paquetes:
rush publish --publish --registry http://localhost:4873 --include-all
```

### 3d. Consumir desde Verdaccio en un proyecto de prueba

En un proyecto temporal fuera de este repo:

```bash
# Apuntar pnpm al registro local para el scope @yoltra
echo '@yoltra:registry=http://localhost:4873/' >> .npmrc

npm add @yoltra/core@0.9.0 @yoltra/react@0.9.0
# Usa los números de versión exactos de tus archivos package.json
```

Verifica que el paquete funciona como se espera.

### 3e. Detener Verdaccio

```bash
# Detener pero conservar los datos (útil para pruebas repetidas)
docker compose down

# Detener Y borrar todos los paquetes almacenados + usuarios (estado limpio)
docker compose down -v
```

---

## Paso 4 — Sincronizar la rama de release de vuelta a develop

Antes de fusionar a `main`, sincroniza los bumps de versión de vuelta a `develop` para que
las dos ramas no diverjan:

```bash
# Abrir un PR: release/v0.9.0 → develop
# Revisar, aprobar y fusionar normalmente.
```

---

## Paso 5 — Fusionar a main y publicar en npm

```bash
# Abrir un PR: develop → main
# Revisar, aprobar y fusionar normalmente.

git checkout main
git pull
```

Establece tu token de autenticación de npm (usa una variable de entorno, no un valor
hardcodeado):

```bash
export NPM_AUTH_TOKEN="tu_token_npm_aqui"
```

Publicar en npm:

```bash
# Simulacro primero — muestra qué se publicaría sin publicar realmente
rush publish --publish --dry-run

# Publicar de verdad
rush publish --publish
```

Rush lee el registro y el token de autenticación desde `common/config/rush/.npmrc-publish`.

---

## Paso 6 — Etiquetar el release

```bash
git tag v0.9.0
git push origin v0.9.0
```

Crea un release en GitHub desde la etiqueta y pega la sección relevante de `CHANGELOG.md`
como notas del release.

---

## Publicar solo paquetes específicos

Para publicar un único paquete sin tocar los demás:

```bash
rush publish --publish --include-all --version-policy lockstep
# o apuntar a un paquete específico:
rush publish --publish --include-all --to @yoltra/core
```

---

## Re-publicar tras un fallo en la publicación

Si la publicación se interrumpió y algunos paquetes llegaron mientras otros no:

```bash
# --include-all obliga a Rush a intentar todos los paquetes, omitiendo los que ya están en npm
rush publish --publish --include-all
```

npm rechaza los intentos de republicar la misma versión con un error 409, por lo que
`--include-all` es seguro de ejecutar varias veces.

---

## Releases de hotfix

Un hotfix sigue los mismos pasos pero crea la rama desde `main` en lugar de `develop`:

```bash
git checkout main
git pull
git checkout -b hotfix/v0.8.1

# Aplicar la corrección mínima
git commit -s -m "fix(core): resolver problema crítico"

# Crear un archivo de cambio de nivel patch
rush change   # elige "patch" para todos los paquetes afectados

# Subir versiones
rush version --bump

git add .
git commit -s -m "chore(release): bump to v0.8.1"

# [Opcional] probar en Verdaccio (pasos 3a–3e anteriores)

# PR hotfix/v0.8.1 → main, fusionar, luego publicar
rush publish --publish

# Etiquetar
git tag v0.8.1 && git push origin v0.8.1

# Back-merge: PR main → develop para mantener sincronía
```

---

## Pre-releases (alpha / beta / rc)

```bash
# Crear un archivo de cambio de pre-release (elige el tipo de bump "prerelease")
rush change

# Bump — produce versiones como 0.9.0-alpha.0
rush version --bump

# Publicar en npm con un dist-tag (los usuarios deben optar con @next)
rush publish --publish --tag next
```

Los usuarios instalan pre-releases de forma explícita:

```bash
npm add @yoltra/core@next
```

Para probar pre-releases localmente, publica en Verdaccio usando el paso 3 anterior.

---

## Referencia rápida

```bash
# --- preparar ---
rush change                             # crear archivos de cambio (durante el desarrollo)
rush change -v                          # validar que existen archivos de cambio
rush version --bump                     # aplicar bumps, escribir changelogs

# --- prueba local ---
docker compose -f tools/registry/docker-compose.yml up -d
rush publish --publish --registry http://localhost:4873

# --- npm ---
rush publish --publish                  # publicar usando .npmrc-publish
rush publish --publish --include-all    # forzar publicación de todos los paquetes

# --- etiquetar ---
git tag vX.Y.Z && git push origin vX.Y.Z
```
