![Quo.js logo](../../assets/logo.svg)

# Gobernanza de Quo.js!

>  👉 [ 🇲🇽 Versión en Español](../es/DEVELOPER_GUIDE.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](../pt/DEVELOPER_GUIDE.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](../../DEVELOPER_GUIDE.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](../fr/DEVELOPER_GUIDE.md)

Este documento explica cómo se toman las decisiones y cómo las personas colaboradoras se convierten en mantenedoras.

## Roles

- **Colaboradores/as**: Cualquier persona que envía PRs, issues o documentación. 
- **Mantenedores/as**: Personas colaboradoras de confianza con permisos de *merge* en uno o más paquetes. 
- **Mantenedor/a Líder**: Coordina la hoja de ruta (*roadmap*) y los lanzamientos (inicialmente **@pixerael / Erael Group.**).

La lista de mantenedores/as actuales se mantiene en [MAINTAINERS.md](./MAINTAINERS.md) (si existe) o en la organización/equipo de GitHub.

## Toma de decisiones

Apuntamos a **consenso tácito** (*lazy consensus*):
1. Propón el cambio vía PR o RFC (para cambios sustanciales de API).
2. Mantén una ventana corta de discusión (típicamente 3–7 días para RFCs).
3. Si no hay objeciones bien fundamentadas, la propuesta se acepta.

Si no se puede alcanzar consenso, decide el/la **Mantenedor/a Líder** (o el/la mantenedor/a delegado/a para el paquete).

## RFCs

Usa un RFC cuando:
- Cambies APIs públicas o el comportamiento de manera incompatible.
- Introduzcas dependencias mayores o cambios arquitectónicos.
- Propongas nuevos paquetes núcleo.

Plantilla de RFC:
- Motivación y objetivos
- Diseño y alternativas
- Borrador de API y ejemplos
- Plan de migración y riesgos
- Estrategia de pruebas

## Lanzamientos y Versionado

- El versionado sigue **SemVer**.
- Cada paquete se versiona de forma independiente.
- El/la **Responsable de Lanzamiento** (rotativo entre mantenedores/as) prepara *changelogs* y etiquetas (*tags*).
- Los cambios incompatibles requieren:
  - Un RFC o una justificación clara
  - Notas de migración en el *changelog*
  - Pruebas que demuestren el cambio

## Expectativas de Mantenimiento

- Ser respetuoso/a y seguir el **Código de Conducta**.
- Revisar PRs con prontitud y de forma constructiva.
- Mantener alta cobertura de pruebas y calidad de documentación.
- Declarar conflictos de interés.

## Agregar/Remover Mantenedores/as

- **Nominación**: Cualquier mantenedor/a puede nominar a una persona colaboradora.
- **Criterios**: Contribuciones de calidad consistentes (código/docs/revisiones), buena comunicación, valores alineados con el proyecto.
- **Aprobación**: Consenso tácito entre mantenedores/as. El/la Mantenedor/a Líder confirma los cambios de acceso.
- **Inactividad**: Mantenedores/as inactivos/as durante ~6 meses pueden pasar al estado “alumni” (pueden regresar más adelante).

## Marcas y Branding

Los nombres “Quo.js” y “quojs-react” son marcas de Erael Group. Consulta [TRADEMARKS.md](./TRADEMARKS.md). La gobernanza no implica una licencia de marca.

## Cambios a la Gobernanza

Los cambios de gobernanza siguen el proceso de RFC y requieren aprobación explícita del/de la Mantenedor/a Líder.
