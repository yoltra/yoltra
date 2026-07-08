![Yoltra logo](../../assets/yoltra-logo.png)

# Guía de Publicación

> [🇺🇸 English](../en/RELEASE_GUIDE.md) &nbsp;|&nbsp; 👉 Español

Cómo versionar, generar changelog y publicar los paquetes de Yoltra. Si solo lees una cosa, lee la
[Chuleta](#chuleta).

---

## Modelo mental

Cuatro mecanismos **independientes** — no los confundas:

1. **El changelog sale de los _change files_, no de los mensajes de commit.** Cada PR que toca un
   paquete publicable incluye un change file (`rush change`). Al publicar, `rush version --bump`
   los convierte en entradas de `CHANGELOG.md` y en bumps de versión. Tus mensajes de commit **no**
   generan el changelog.
2. **Una sola versión para toda la suite (lockstep).** `@yoltra/core`, `@yoltra/react` y cada
   `@yoltra/devtools-*` comparten una única versión vía la política **`yoltra`**
   ([version-policies.json](../../common/config/rush/version-policies.json)). Siempre bumpean
   juntos (p. ej. todos `0.1.0 → 0.2.0`). Nunca llevas una versión por paquete.
   `@yoltra/eslint-config-*` y `@yoltra/devtools-ext` van, a propósito, en pistas separadas.
3. **La publicación es automática con un tag de versión.** Nunca corres `npm publish` a mano. Hacer
   push de un tag `v*.*.*` dispara
   [`.github/workflows/release.yml`](../../.github/workflows/release.yml), que compila y publica vía
   **npm [Trusted Publishing](https://docs.npmjs.com/trusted-publishers) (OIDC)** — sin token de
   larga vida. Mergear a `main` **no** publica.
4. **El formato de commit se valida por separado.** Un git hook `commit-msg` corre **commitlint**
   (Conventional Commits); los mensajes que no cumplen se rechazan. Esto es higiene — no tiene que
   ver con el changelog.

## Quedarse en 0.x

Permanecemos en `< 1.0.0` hasta que la API esté estable. En semver 0.x, un **cambio incompatible es
un bump MINOR**, así que el `nextBump` de la política es `minor` (`0.1.0 → 0.2.0`). Para un release
solo de fixes, haz un patch (más abajo). **No bumpees a 1.0.0 todavía** — cambia `nextBump`
deliberadamente cuando llegue el momento.

---

## Configuración inicial (una vez)

```bash
npm i -g @microsoft/rush          # Rush maneja todo
rush install                      # instala deps Y copia los git hooks a .git/hooks
rush update-autoinstaller --name rush-commitlint   # instala commitlint para el hook de commit
```

La publicación usa **npm Trusted Publishing (OIDC)** — **no hay secreto `NPM_TOKEN`**. La única
configuración es del lado de npm: para cada paquete publicable `@yoltra/*`, agrega un **Trusted
Publisher** (npmjs.com → paquete → _Settings → Trusted Publisher_) apuntando al repo `yoltra/yoltra`,
workflow `release.yml`, entorno `production`. Ve [RELEASING.md](../../RELEASING.md) para los valores
exactos. npm permite pre-registrar un nombre que nunca se ha publicado, así que los paquetes de
devtools pueden configurarse antes de su primer release.

---

## Durante el desarrollo: change files

Cuando una rama cambia un paquete **publicable**, agrega un change file antes de mergear:

```bash
rush change
#  → selecciona los paquetes que tocaste
#  → elige un tipo: patch | minor | none
#  → escribe una descripción de una línea → esta será la entrada del CHANGELOG
```

Notas:

- Bajo lockstep, el bump **real** lo decide la política al publicar (`nextBump`), no el tipo
  por-paquete de aquí — pero igual corre `rush change` para que tu descripción llegue al changelog.
  Usa `none` para cambios que no deberían aparecer en un changelog (docs puras, ejemplos).
- Verifica que una rama tenga sus change files:

  ```bash
  rush change --verify     # alias: rush change -v   (CI lo corre en cada PR)
  ```

---

## Cortar un release

El bump de versión vive en su **propio PR** — los PRs de feature solo llevan change files; el PR de
release es el que los convierte en un bump de versión. La publicación ocurre en CI cuando etiquetas.

```bash
git checkout main && git pull
git checkout -b release/v0.2.0        # rama de release efímera

# 1. Consume los change files → bumpea versiones + escribe CHANGELOGs (borra los change files)
rush version --bump
#    Cada paquete "yoltra" se mueve junto a la siguiente versión (minor por defecto: 0.1.0 → 0.2.0).

# 2. Revisa la nueva versión en cada package.json y cada CHANGELOG.md, luego commitea
git add -A && git commit -m "chore(release): v0.2.0"
git push -u origin release/v0.2.0
```

Luego:

1. **Abre un PR** `release/v0.2.0 → main`. Contiene el bump de versión + changelogs; revísalo y
   **mergéalo**.
2. **Etiqueta el commit de merge** y haz push del tag — esto es lo que publica:

   ```bash
   git checkout main && git pull
   git tag v0.2.0 && git push origin v0.2.0
   ```

   > El tag es solo el disparador. `rush publish` publica la versión que está en `package.json`, así
   > que el bump ya debe estar en `main` (paso 1) y el nombre del tag debe coincidir con ella.

3. El workflow **Release** compila y publica a npm vía OIDC. Si el entorno `production` tiene una
   compuerta de aprobación, aprueba la ejecución.
4. **Crea un release de GitHub** desde el tag y pega la sección relevante de `CHANGELOG.md` como
   notas.

### Patch en vez de minor

La política usa `minor` por defecto. Para un release solo de fixes, sobreescribe al bumpear:

```bash
rush version --bump --override-bump patch      # 0.1.0 → 0.1.1
```

(o edita `nextBump` en [version-policies.json](../../common/config/rush/version-policies.json)).

---

## Prueba local contra Verdaccio (recomendado)

Prueba la experiencia real de instalación antes de tocar npm — totalmente local, sin auth de npm ni
OIDC. `.npmrc-publish` apunta a **npm**, así que apúntalo a Verdaccio explícitamente con
`--registry`:

```bash
# inicia el registry local
docker compose -f tools/registry/docker-compose.yml up -d

# solo la primera vez: crea un usuario local
npm adduser --registry http://localhost:4873

# publica la suite al registry LOCAL (esta es la única vez que corres rush publish a mano —
# y siempre solo contra localhost)
rush publish --publish --include-all --version-policy yoltra --registry http://localhost:4873

# en un proyecto desechable, fuera de este repo:
echo '@yoltra:registry=http://localhost:4873/' >> .npmrc
npm add @yoltra/core@0.2.0 @yoltra/react@0.2.0

# apaga (‑v también borra los paquetes almacenados)
docker compose -f tools/registry/docker-compose.yml down -v
```

---

## Publicar a npm

**No lo haces tú — lo hace CI.** Hacer push del tag `v*.*.*` (arriba) corre
[`release.yml`](../../.github/workflows/release.yml), que ejecuta
`rush publish --publish --include-all --set-access-level public` autenticado con OIDC. No hay token
que configurar ni nada que correr localmente.

**Seguridad:** mergear a `main` nunca publica (solo un tag lo hace); el entorno `production` puede
gatear la ejecución con una aprobación; y npm rechaza republicar una versión existente (409), así
que re-ejecutar el workflow tras una publicación parcial es seguro. Para reintentar la publicación
de un tag existente, re-ejecuta el workflow desde la pestaña Actions (también tiene un disparador
manual `workflow_dispatch`).

---

## Hotfix (patch sobre un release publicado)

```bash
git checkout main && git pull
git checkout -b hotfix/v0.2.1

# fix mínimo + un change file de tipo patch
git commit -m "fix(core): resolver <problema crítico>"
rush change                                 # elige "patch"

rush version --bump --override-bump patch   # 0.2.0 → 0.2.1
git add -A && git commit -m "chore(release): v0.2.1"
git push -u origin hotfix/v0.2.1

# PR → main, revisa, mergea, luego etiqueta el commit de merge para publicar:
git checkout main && git pull
git tag v0.2.1 && git push origin v0.2.1
```

---

## Pre-releases (alpha / beta / rc)

El workflow disparado por tag siempre publica al dist-tag `latest`, así que los pre-releases **no**
están conectados a él todavía. Para lanzar uno:

```bash
rush version --bump --override-bump preminor   # p. ej. 0.2.0-0
```

luego **pruébalo en Verdaccio** (arriba), o publica ese único pre-release a npm con un dist-tag — lo
que por ahora implica extender [`release.yml`](../../.github/workflows/release.yml) para pasar
`--tag next` en tags de pre-release. Los consumidores optan explícitamente: `npm add @yoltra/core@next`.

---

## Chuleta

```bash
# --- durante el desarrollo (rama feature) ---
rush change                # agrega una entrada de changelog para tu cambio
rush change -v             # verifica que existan change files (CI lo exige)

# --- cortar un release (rama release → PR → main) ---
git checkout -b release/vX.Y.Z
rush version --bump                       # bumpea toda la suite + escribe CHANGELOGs (minor por defecto)
#   release solo de fixes:  rush version --bump --override-bump patch
git commit -am "chore(release): vX.Y.Z" && git push -u origin release/vX.Y.Z
#   → abre PR a main, revisa, mergea

# --- publicar (etiqueta el commit de merge; CI hace el resto vía OIDC) ---
git checkout main && git pull
git tag vX.Y.Z && git push origin vX.Y.Z

# --- opcional: prueba en Verdaccio (solo local) ---
docker compose -f tools/registry/docker-compose.yml up -d
rush publish --publish --include-all --version-policy yoltra --registry http://localhost:4873
```
