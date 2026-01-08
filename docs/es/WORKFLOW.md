![Quo.js logo](../../assets/logo.svg)

# Flujo de trabajo continuo

>  👉 [ 🇲🇽 Versión en Español](../es/WORKFLOW.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](../pt/WORKFLOW.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](../../WORKFLOW.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](../fr/WORKFLOW.md)

Este documento describe el flujo de desarrollo y publicación de paquetes de Quo.js usando **versionado independiente** en un monorepo con Rush.

## Desarrollo diario

- **Ramas de feature/fix** creadas desde `main`:
  - Ejemplos de nombres de rama: 
    - `feat(core): ...` 
    - `fix(react): ...`
  - Generar archivos de cambio:
    ```bash
    rush change -v
    ```
    - Usa **patch** para correcciones. 
    - Usa **minor** para nuevas funcionalidades. 
    - Usa **minor** para cambios incompatibles (mientras `<1.0.0`, todos los cambios breaking cuentan como minor).
  - Abre un PR → merge después de la revisión.

## Ciclo de Trabajo de TypeDoc

Mantener la documentación sincronizada con el código es esencial para la claridad, la integración y la referencia de API.
Sigue estos pasos cada vez que modifiques o agregues código:

1. Documenta tu código

Después de completar tu implementación, asegúrate de que todo el código nuevo o actualizado incluya anotaciones de TypeDoc como @param, @returns y @example.
Estas anotaciones son fundamentales, ya que permiten al generador de documentación extraer comentarios, tipos y ejemplos hacia los archivos Markdown.

2. Genera la documentación

Ejecuta el comando de Rush para reconstruir la documentación.

```bash
  rushx:docs
```

Esto invocará a TypeDoc y regenerará todos los archivos Markdown a partir de tus anotaciones.

3. Revisa el resultado

Abre los archivos Markdown generados y confirma que tus cambios se reflejan correctamente.
Verifica que se muestren las nuevas funciones, clases y propiedades, que las descripciones y ejemplos estén actualizados y que no queden secciones obsoletas.

4. Haz commit de la documentación

Cuando todo se vea correcto, haz commit de la documentación generada utilizando un mensaje de commit convencional con el tipo "docs".
Esto mantiene el historial limpio y ayuda a que los flujos de CI/CD se ejecuten correctamente.

## Ciclo de versionado y publicación

Puede ser manual o automatizado en CI:

```bash
rush version --ensure-version-policy
rush publish --publish --apply --target-branch main
```

- Solo los paquetes con archivos de cambio se versionan. 
- Los paquetes sin cambios mantienen su versión. 

## Cambios incompatibles en `@quojs/core`

- Aumenta el **minor** en core (ej: `0.2.x → 0.3.0`). 
- Actualiza los adaptadores validados a:

  ```json
  "peerDependencies": {
    "@quojs/core": "^0.3.0"
  }
  ```

- Genera archivos de cambio para esos adaptadores (patch o minor según el caso). 
- Publica solo los adaptadores validados. 
- **No incrementes adaptadores que no has verificado aún**; la verificación de dependencias por parte de los consumidores los protegerá.

## Pre-releases

- Para trabajo experimental o arriesgado, publica pre-releases:
  ```bash
  0.2.0-alpha.0
  ```
  usando `--tag next` (en npm) o publicando en Verdaccio. 
- Los adaptadores pueden adoptar el nuevo rango de dependencias de manera progresiva.

# Por qué este flujo funciona

- **Versionado independiente** → solo los paquetes modificados cambian de versión. 
- **Comenzar en `0.1.0`** → los rangos con caret funcionan como se espera (`^0.1.0` permite flotación de patch, no de minor). 
- **Archivos de cambio desde el primer día** → Rush se mantiene consistente y genera notas de versión claras. 
- **Etiquetas por paquete** → hacen más fácil el bisect y la generación de changelogs.