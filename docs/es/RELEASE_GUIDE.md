![Yoltra logo](../../assets/yoltra-logo.png)

# Guía de Publicación

> [🇺🇸 English](../en/RELEASE_GUIDE.md) &nbsp;|&nbsp; 👉 Español

Cómo versionar, generar changelog y publicar los paquetes de Yoltra. Si solo lees una cosa, lee la
[Chuleta](#chuleta).

---

## Modelo mental

Tres mecanismos **independientes** — no los confundas:

1. **El changelog sale de los _change files_, no de los mensajes de commit.** Cada PR que toca un
   paquete publicable incluye un change file (`rush change`). Al publicar, `rush version --bump`
   los convierte en entradas de `CHANGELOG.md` y en bumps de versión. Tus mensajes de commit **no**
   generan el changelog.
2. **Una sola versión para toda la suite (lockstep).** `@yoltra/core`, `@yoltra/react` y cada
   `@yoltra/devtools-*` comparten una única versión vía la política **`yoltra`**
   ([version-policies.json](../../common/config/rush/version-policies.json)). Siempre bumpean
   juntos (p. ej. todos `0.1.0 → 0.2.0`). Nunca llevas una versión por paquete.
   `@yoltra/eslint-config-*` y `@yoltra/devtools-ext` van, a propósito, en pistas separadas.
3. **El formato de commit se valida por separado.** Un git hook `commit-msg` corre **commitlint**
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

Para publicar también necesitas un token de npm con permisos de publicación en el scope `@yoltra`:

```bash
export NPM_AUTH_TOKEN="npm_xxx"   # ponlo solo cuando de verdad vayas a publicar
```

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
  rush change --verify     # alias: rush change -v
  ```
---

## Cortar un release

Desde un `main` actualizado:

```bash
git checkout main && git pull
git checkout -b release/v0.2.0        # rama de release efímera

# 1. Consume los change files → bumpea versiones + escribe CHANGELOGs (borra los change files)
rush version --bump
#    Cada paquete "yoltra" se mueve junto a la siguiente versión (minor por defecto: 0.1.0 → 0.2.0).

# 2. Revisa la nueva versión en cada package.json y cada CHANGELOG.md, luego commitea
git add -A && git commit -m "chore(release): v0.2.0"
```

### Patch en vez de minor

La política usa `minor` por defecto. Para un release solo de fixes, sobreescribe al bumpear:

```bash
rush version --bump --override-bump patch      # 0.1.0 → 0.1.1
```

(o edita `nextBump` en [version-policies.json](../../common/config/rush/version-policies.json)).

---

## Prueba local contra Verdaccio (recomendado)

Prueba la experiencia real de instalación antes de tocar npm. `.npmrc-publish` apunta a **npm**, así
que apuntalo a Verdaccio explícitamente con `--registry`:

```bash
# inicia el registry local
docker compose -f tools/registry/docker-compose.yml up -d

# solo la primera vez: crea un usuario local
npm adduser --registry http://localhost:4873

# publica la suite al registry LOCAL
rush publish --publish --include-all --version-policy yoltra --registry http://localhost:4873

# en un proyecto desechable, fuera de este repo:
echo '@yoltra:registry=http://localhost:4873/' >> .npmrc
npm add @yoltra/core@0.2.0 @yoltra/react@0.2.0

# apaga (‑v también borra los paquetes almacenados)
docker compose -f tools/registry/docker-compose.yml down -v
```

---

## Publicar a npm

```bash
export NPM_AUTH_TOKEN="npm_xxx"   # token con permisos de publicación en @yoltra

# publica SOLO la suite de producto en lockstep (core, react, devtools-*) a npm
rush publish --publish --include-all --version-policy yoltra
```

Rush lee el registry + token de [.npmrc-publish](../../common/config/rush/.npmrc-publish).

**No hay ruta de publicación accidental:** `rush publish` no hace nada sin `--publish`, y no puede
autenticarse a menos que `NPM_AUTH_TOKEN` esté definido. npm rechaza republicar una versión
existente (409), así que re-ejecutar tras una publicación parcial es seguro.

Luego mergea y etiqueta:

```bash
# PR release/v0.2.0 → main, revisa, mergea
git checkout main && git pull
git tag v0.2.0 && git push origin v0.2.0
```

Crea un release de GitHub desde el tag y pega la sección relevante de `CHANGELOG.md` como notas.

---

## Hotfix (patch sobre un release publicado)

```bash
git checkout main && git pull
git checkout -b hotfix/v0.2.1

# fix mínimo + un change file de tipo patch
git commit -m "fix(core): resolver <problema crítico>"
rush change                              # elige "patch"

rush version --bump --override-bump patch   # 0.2.0 → 0.2.1
git add -A && git commit -m "chore(release): v0.2.1"

# PR → main, mergea, luego publica + etiqueta como arriba
rush publish --publish --include-all --version-policy yoltra
git tag v0.2.1 && git push origin v0.2.1
```

---

## Pre-releases (alpha / beta / rc)

```bash
rush version --bump --override-bump preminor   # p. ej. 0.2.0-0
rush publish --publish --include-all --version-policy yoltra --tag next
```

Los consumidores optan explícitamente: `npm add @yoltra/core@next`. Prueba los pre-releases en
Verdaccio primero.

---

## Chuleta

```bash
# --- durante el desarrollo ---
rush change                # agrega una entrada de changelog para tu cambio
rush change -v             # verifica que existan change files

# --- cortar un release ---
git checkout -b release/vX.Y.Z
rush version --bump                       # bumpea toda la suite + escribe CHANGELOGs (minor por defecto)
#   release solo de fixes:  rush version --bump --override-bump patch

# --- prueba en Verdaccio ---
docker compose -f tools/registry/docker-compose.yml up -d
rush publish --publish --include-all --version-policy yoltra --registry http://localhost:4873

# --- publicar a npm ---
export NPM_AUTH_TOKEN=...
rush publish --publish --include-all --version-policy yoltra

# --- etiquetar ---
git tag vX.Y.Z && git push origin vX.Y.Z
```
