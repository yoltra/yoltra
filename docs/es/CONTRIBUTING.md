![Yoltra logo](../../assets/yoltra-logo.png)

# Contribuir a Yoltra!

>  👉 [ 🇲🇽 Versión en Español](../es/CONTRIBUTING.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](../pt/CONTRIBUTING.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](../../CONTRIBUTING.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](../fr/CONTRIBUTING.md)

¡Gracias por tu interés en contribuir! 🎉 Este proyecto es de código abierto bajo **MIT** con un modelo de gobernanza ligero y acogedor.

- **Licencia de código:** MIT 
- **Licencia de documentación:** CC BY 4.0 (salvo indicación) 
- **Código de Conducta:** Contributor Covenant v2.1 
- **DCO:** Developer Certificate of Origin 1.1 (se requiere *sign-off* en cada *commit*)

> Para el flujo de ingeniería completo y el proceso de publicación, consulta la **Guía de Desarrollo**: [./DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md). Este archivo es un inicio rápido para contribuyentes y autores de PR.

## Inicio rápido (monorepo Rush)

```bash
# instala rush una vez
npm i -g @microsoft/rush

# instala todas las dependencias (pnpm vía Rush)
rush install

# compila todo (incremental, usa caché de Rush)
rush build

# ejecuta pruebas en todo el repositorio
rush test

# lint para todos los paquetes que definan un script 'lint'
rush lint

# builds focalizados
rush build --to @yoltra/core
rush build --from @yoltra/react

# trabaja dentro de un solo paquete
cd packages/core
rushx build
rushx test
rushx lint
```

Cada paquete publicable tiene su propio `package.json`. La carpeta raíz es privada y **no** se publica.

## Flujo de trabajo

1. **Crea una rama** desde `main`: `feature/<issue>-<slug>` o `fix/<issue>-<slug>`.
2. **Desarrolla** con pruebas y documentación.
3. **Verifica** deben pasar: `rush build`, `rush test`, `rush lint`.
4. **Archivo de cambios** (si cambió un paquete publicable): 
   ```bash
   rush change
   ```
5. **Abre un Pull Request** (completa la plantilla, enlaza issues/RFCs). CI aplica estilo de *commits*, DCO, archivos de cambios, pruebas y cobertura.
6. **Revisión y *merge*** (squash o rebase según criterio del mantenedor).

## Estilo de *Commits* (Conventional Commits) + DCO (obligatorio)

Usa el formato convencional:

```
type(scope): short summary

body (optional)
```

**Tipos permitidos:** `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `chore`, `revert`

**Ejemplos**
- `feat(yoltra): add deep-path wildcard subscriptions`
- `fix(yoltra-react): normalize leading dot in useAtomicProp`
- `test(store): cover devtools DISPATCH apply state`

**DCO sign-off** — cada *commit* debe incluir una línea de firma:

```
Signed-off-by: Your Name <you@example.com>
```

Sugerencia: usa `git commit -s` para añadirla automáticamente. Los mensajes de *commit* se lintéan localmente (Husky) y en CI.

## Pruebas y Cobertura

- *Test runner*: **Vitest**
- Pruebas de UI: **@testing-library/react** (para `yoltra-react`)
- Umbrales de cobertura aplicados en la configuración de Vitest:
  - Líneas / Ramas / Funciones / Sentencias: **≥ 95%** (en código tocado)
- Prefiere pruebas enfocadas y robustas; usa *snapshots* solo para salidas estables y deterministas.

Ejecuta todas las pruebas:

```bash
rush test
```

## Linting y Formateo

- Lint: **ESLint** (TypeScript)
- Formato: **Prettier**

```bash
rush lint
rushx format
```

## Reporte de *Issues* y PRs

- Usa las plantillas de **Bug Report** y **Feature Request**.
- Los PRs deben seguir la **plantilla de Pull Request** e incluir:
  - Título con *Conventional Commit* + *DCO* *sign-off*
  - *Checks* locales en verde: `rush build`, `rush test`, `rush lint`
  - **Archivo de cambios** si cambió un paquete publicable
  - Pruebas y actualizaciones de docs adecuadas

## Seguridad

Si encuentras un problema de seguridad, **no abras un *issue* público**. Sigue **[SECURITY.md](./SECURITY.md)** para divulgación responsable.

¡Gracias por contribuir! ❤️
