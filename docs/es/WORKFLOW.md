![Yoltra logo](../../assets/yoltra-logo.png)

# Flujo de Trabajo de Desarrollo

> [🇺🇸 English](../en/WORKFLOW.md) &nbsp;|&nbsp; 👉 Español

Este documento cubre la estrategia de ramas, el proceso de PRs y la disciplina de archivos de
cambio que mantienen el monorepo en buen estado. Para realizar un lanzamiento consulta
[RELEASE_GUIDE.md](./RELEASE_GUIDE.md).

---

## Modelo de ramas

```
main          ←── estable, siempre lista para release; se publica a npm al hacer push de un tag
  ↑
release/vX.Y  ←── de vida corta; solo bump de versiones + preparación del release
feature/*     ←── una funcionalidad / corrección por rama
fix/*
chore/*
hotfix/*
```

**Reglas:**

- `main` está protegida. Todo entra vía PR — nunca force-push. Mergear a `main` **no** publica;
  hacer push de un tag `v*.*.*` sí.
- Las ramas `feature/*` / `fix/*` / `chore/*` se crean desde `main` y se hacen PR de vuelta a `main`.
- Las ramas `release/*` se crean desde `main`, se bumpean (`rush version --bump`) y se hacen PR a
  `main`; el commit de merge se etiqueta para publicar.
- Las ramas `hotfix/*` se crean desde `main` para una corrección crítica y se hacen PR directo de
  vuelta a `main`.

---

## Día a día: funcionalidad o corrección

```
main
  └─ feature/123-mi-funcionalidad
         │  commits con Conventional Commits + DCO
         │  rush change (al menos una vez)
         └─► PR → main
```

**Paso a paso:**

```bash
# 1. Crear rama desde main
git checkout main
git pull
git checkout -b feature/123-mi-funcionalidad

# 2. Crear el archivo de cambio antes de abrir el PR
rush change
#  → selecciona los paquetes que modificaste
#  → elige el tipo de bump (patch / minor)
#  → escribe una descripción corta (aparecerá en CHANGELOG.md)


# 3. Realiza tu trabajo — los commits deben seguir Conventional Commits + firma DCO
git commit -S -s -m "feat(core): añadir coincidencia de eventos con wildcard"

# 4. Publicar rama y abrir PR contra main
git push -u origin feature/123-mi-funcionalidad
```

**Lista de verificación del PR:**

- [ ] Mensajes de commit en formato Conventional Commits con firma DCO en cada commit
- [ ] `rush build` pasa localmente
- [ ] `rush test` pasa (cobertura ≥ 95%)
- [ ] `rush lint` y `rush typecheck` pasan
- [ ] Archivo de cambio en `common/changes/` (`rush change -v` está en verde)
- [ ] La descripción del PR enlaza los issues correspondientes

---

## Preparar un release (mantenedores)

```
main
  └─ release/v0.9.0
         │  rush version --bump
         │  revisión manual de changelogs
         └─► PR → main, luego push del tag vX.Y.Z  ── el tag (no el merge) publica vía CI
```

La publicación se dispara al hacer push de un tag `v*.*.*`, **no** al mergear a `main` — el tag
corre `release.yml`, que publica vía npm Trusted Publishing (OIDC). Consulta
**[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)** para el paso a paso completo.

---

## Cambios breaking mientras `< 1.0.0`

Hasta que la suite alcance `1.0.0`, un **cambio breaking es un bump `minor`** (no `major`). Toda la
suite de producto — `@yoltra/core`, `@yoltra/react` y cada `@yoltra/devtools-*` — se versiona en
**lockstep** vía la política `yoltra`, así que siempre se mueven juntos a la misma versión. **No**
eliges un bump por paquete.

1. Agrega un archivo de cambio para que quede en el changelog:

   ```bash
   rush change    # escribe una descripción breve; el tipo es informativo bajo lockstep
   ```

2. Al publicar, `rush version --bump` mueve toda la suite al siguiente minor (el `nextBump` de la
   política). Ver la **[Guía de Publicación](./RELEASE_GUIDE.md)** para el flujo completo.

---

## Hotfixes

Un hotfix es una corrección crítica que debe publicarse sin esperar al siguiente release
planificado.

```
main
  └─ hotfix/v0.8.1-bug-critico
         │  corrección mínima + rush change (patch)
         │  rush version --bump --override-bump patch
         └─► PR → main  (revisado y fusionado directamente)
               └─► push del tag v0.8.1 → CI publica
```

Después de que el PR del hotfix llegue a `main`, etiqueta el commit de merge
(`git tag v0.8.1 && git push origin v0.8.1`) — el tag dispara CI, que publica vía OIDC (consulta
RELEASE_GUIDE.md).

---

## Pre-releases

Para funcionalidades experimentales que no están listas para un release estable, bumpea a una
versión pre-release:

```bash
rush version --bump --override-bump preminor   # p. ej. 0.2.0-0
```

Los pre-releases **no** están conectados al CI disparado por tag (que publica el dist-tag `latest`).
Pruébalos en el registro Verdaccio local, o consulta
**[RELEASE_GUIDE.md](./RELEASE_GUIDE.md) → Pre-releases** para publicar uno a npm bajo el dist-tag
`next`. Los usuarios instalan con:

```bash
npm add @yoltra/core@next @yoltra/react@next
```

---

## Documentación TypeDoc

Actualiza la documentación de la API siempre que añadas o modifiques una API pública:

```bash
# En el paquete correspondiente
cd packages/core
rushx docs          # Genera los formatos Markdown y JSON

cd packages/react
rushx docs
```

Haz commit de los archivos generados bajo `.typedoc/` junto con el cambio de código usando un
commit de tipo `docs`:

```
docs(core): actualizar API docs para el matcher de wildcard
```
