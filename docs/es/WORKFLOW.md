![Yoltra logo](../../assets/yoltra-logo.png)

# Flujo de Trabajo de Desarrollo

> [🇺🇸 English](../en/WORKFLOW.md) &nbsp;|&nbsp; 👉 Español

Este documento cubre la estrategia de ramas, el proceso de PRs y la disciplina de archivos de
cambio que mantienen el monorepo en buen estado. Para realizar un lanzamiento consulta
[RELEASE_GUIDE.md](./RELEASE_GUIDE.md).

---

## Modelo de ramas

```
main          ←── estable, publicado en npm, siempre listo para release
  ↑
develop       ←── rama de integración, siempre verde
  ↑
release/vX.Y  ←── de vida corta; solo bump de versiones + preparación del release
  ↑
feature/*     ←── una funcionalidad / corrección por rama
fix/*
chore/*
```

**Reglas:**

- `main` está protegida. Solo se fusionan PRs desde `develop` (tras un ciclo de release).
- `develop` está protegida. Solo se fusionan PRs — nunca force-push.
- Las ramas `release/*` se crean desde `develop`, se suben de versión, se prueban y luego se
  hacen PR de vuelta a `develop` primero y después a `main`.
- Las ramas `feature/*` / `fix/*` / `chore/*` se crean desde `develop`.

---

## Día a día: funcionalidad o corrección

```
develop
  └─ feature/123-mi-funcionalidad
         │  commits con Conventional Commits + DCO
         │  rush change (al menos una vez)
         └─► PR → develop
```

**Paso a paso:**

```bash
# 1. Crear rama desde develop
git checkout develop
git pull
git checkout -b feature/123-mi-funcionalidad

# 2. Crear el archivo de cambio antes de abrir el PR
rush change
#  → selecciona los paquetes que modificaste
#  → elige el tipo de bump (patch / minor)
#  → escribe una descripción corta (aparecerá en CHANGELOG.md)


# 3. Realiza tu trabajo — los commits deben seguir Conventional Commits + firma DCO
git commit -S -s -m "feat(core): añadir coincidencia de eventos con wildcard"

# 4. Publicar rama y abrir PR contra develop
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
develop
  └─ release/v0.9.0
         │  rush version --bump
         │  revisión manual de changelogs
         └─► PR → develop  (sincronizar bumps de versión de vuelta)
               └─► PR → main (desencadenar publicación en NPM)
```

Consulta **[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)** para el paso a paso completo.

---

## Cambios breaking mientras `< 1.0.0`

Hasta que la librería alcance `1.0.0`, usa `minor` (no `major`) para cambios breaking.

Cuando `@yoltra/core` tiene un cambio breaking:

1. Elige **minor** en el prompt de `rush change` para core.
2. Actualiza el rango de `peerDependencies` de `@yoltra/react` para que coincida:
   ```json
   "@yoltra/core": "^0.9.0"
   ```
3. Añade también un archivo de cambio para `@yoltra/react` (minor o patch, según el impacto).

---

## Hotfixes

Un hotfix es una corrección crítica que debe publicarse sin esperar al siguiente release
planificado.

```
main
  └─ hotfix/v0.8.1-bug-critico
         │  corrección mínima + rush change (patch)
         └─► PR → main  (revisado y fusionado directamente)
               └─► PR de back-merge → develop
```

Después de que el PR del hotfix llegue a `main`:

1. Publicar desde `main` (consulta RELEASE_GUIDE.md).
2. Abrir inmediatamente un PR de back-merge desde `main` → `develop` para mantenerlas en
   sincronía.

---

## Pre-releases

Para funcionalidades experimentales que no están listas para un release estable:

```bash
# Etiqueta la versión como pre-release en el archivo de cambio (elige bump "prerelease")
rush change

# Publicar con un dist-tag para que los usuarios deban optar explícitamente
rush publish --publish --tag next
```

Los usuarios instalan pre-releases de forma explícita:

```bash
npm add @yoltra/core@next @yoltra/react@next
```

Los pre-releases también se pueden publicar en el registro Verdaccio local para pruebas sin
tocar npm (consulta RELEASE_GUIDE.md).

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
