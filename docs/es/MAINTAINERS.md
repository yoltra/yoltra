![Quo.js logo](../../assets/logo.svg)

# Mantenedores

> 👉 [ 🇲🇽 Versión en Español](../es/MAINTAINERS.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](../pt/MAINTAINERS.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](../../MAINTAINERS.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](../fr/MAINTAINERS.md)

Este archivo lista a los mantenedores activos y las áreas de responsabilidad del monorepo de Quo.js.

- **Mantenedor/a Líder:** Manu Ramirez (@pixerael), Erael Group.
- **Correo del proyecto:** [opensource@quojs.dev](mailto:opensource@quojs.dev)
- **Contacto de seguridad:** seguridad@quojs.dev (ver [SECURITY.md](./SECURITY.md))
- **Código de Conducta:** [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

> Se espera que los mantenedores sigan los flujos de trabajo definidos en [GOVERNANCE.md](./GOVERNANCE.md) y [CONTRIBUTING.md](./CONTRIBUTING.md).

## Mantenedores/as actuales

| Handle de GitHub | Nombre       | Área(s)                                   | Notas                          |
|------------------|--------------|-------------------------------------------|------------------------------------------------|
| @pixerael        | Manu Ramirez | General, lanzamientos, marcas registradas | Propietario en funciones de todos los paquetes |

### Vacantes de Mantenedor/a

Estamos invitando a mantenedores de la comunidad para los roles siguientes. Ver **Cómo ser Mantenedor/a**.

| ID del rol       | Área(s)                                       | Tiempo estimado   | Estado   |
|------------------|-----------------------------------------------|-------------------|----------|
| @co-maintainer   | quojs core (store/reducer/bus/utils)          | ~2–4 h/semana     | **ABIERTO** |
| @react-maint     | quojs-react (hooks, suspense, docs/ejemplos)  | ~2–4 h/semana     | **ABIERTO** |

## Propiedad de Paquetes

| Paquete / Ruta           | Propietarios                                           |
|--------------------------|--------------------------------------------------------|
| `packages/quojs`         | @pixerael (en funciones), **@co-maintainer (ABIERTO)** |
| `packages/react`         | @pixerael (en funciones), **@react-maint (ABIERTO)**   |
| `examples/*`             | @pixerael (en funciones), **@react-maint (ABIERTO)**   |
| `docs/*`                 | @pixerael (en funciones), **@react-maint (ABIERTO)**   |

> Hasta que se cubran las vacantes, @pixerael es el propietario en funciones y revisor final.

## Gestión de Lanzamientos

- **Rotación:** Los propietarios rotan el rol de “Responsable de Lanzamiento” por cada *minor*.
- **Tareas:** *changelog*, incremento de versiones, *tags*, notas de lanzamiento en GitHub, publicación en npm (si aplica).
- **SemVer:** obligatorio. Los cambios incompatibles requieren notas de migración y (por lo general) un RFC.

## Cómo ser Mantenedor/a

Damos la bienvenida a solicitudes para los asientos **@co-maintainer** y **@react-maint**.

**Elegibilidad (indicativa):**
- Contribuciones sostenidas y de alta calidad (código/docs/revisiones) en el área relevante.
- Colaboración constructiva alineada con el Código de Conducta.
- Familiaridad con la arquitectura y la hoja de ruta del proyecto.

**Cómo postularse:**
1. Abre una Discusión en GitHub titulada **“Maintainer Application: <role> – <your handle>”**.
2. Incluye:
   - Tu experiencia y zona horaria
   - Experiencia OSS relevante / enlaces
   - Áreas que te gustaría liderar / mejorar
   - Estimación de disponibilidad
3. Recibe retroalimentación de la comunidad (consenso tácito por 5 días).
4. Un mantenedor actual (Líder o propietario en funciones) confirmará el nombramiento según [GOVERNANCE.md](./GOVERNANCE.md).

**Expectativas:**
- Triagar *issues*, revisar PRs y ayudar con lanzamientos.
- Asistir (o revisar de forma asíncrona) las notas de planificación mensuales.
- Cumplir con [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md), [CONTRIBUTING.md](./CONTRIBUTING.md) y [SECURITY.md](./SECURITY.md)

## Inactivos / Alumni

Los mantenedores inactivos por ~6 meses pueden pasar a estado **Alumni** y podrán ser reintegrados más adelante si lo solicitan.

## Escalamiento

Si no se puede alcanzar consenso en una decisión técnica, decide el/la **Mantenedor/a Líder** (o delega en el propietario del paquete). Los cambios de gobernanza siguen el proceso de RFC.
