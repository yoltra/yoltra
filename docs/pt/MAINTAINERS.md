![Logotipo Quo.js](../../assets/logo.svg)

# Mantenedores
> [ 🇲🇽 Versión en Español](../es/MAINTAINERS.md)&nbsp; |
> &nbsp; 👉 [ 🇵🇹 Versão Portuguesa](./MAINTAINERS.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](../../MAINTAINERS.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](../fr/MAINTAINERS.md)

Este arquivo lista os mantenedores ativos e as áreas de responsabilidade do monorepo do Quo.js.

- **Mantenedor/a Líder:** Manu Ramirez (@pixerael), Erael Group.
- **Correo del proyecto:** [opensource@quojs.dev](mailto:opensource@quojs.dev)
- **Contacto de seguridad:** seguridad@quojs.dev (ver [SECURITY.md](./SECURITY.md))
- **Código de Conduta:** [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

Es esperado que os mantenedores sigam os fluxos de trabalho definidos em [GOVERNANCE.md](./GOVERNANCE.md) e [CONTRIBUTING.md](./CONTRIBUTING.md).

## Mantenedores/as atuais

| Handle do GitHub | Nome       | Área(s)                                   | Notas                          |
|------------------|--------------|-------------------------------------------|------------------------------------------------|
| @pixerael | Manu Ramirez | Geral, lançamentos, marcas registradas | Proprietário em funções de todos os pacotes |

### Vagas de Mantenedor/a

Estamos convidando mantenedores da comunidade para os seguintes papéis.  Ver **Como ser Mantenedor/a**.

| ID do papel | Área(s) | Tempo estimado | Status |
|------------------|-----------------------------------------------|-------------------|----------|
| @co-maintainer | núcleo quojs (loja/redutor/barramento/utilitários) | ~2–4 h/semana | **ABERTO** |
| @react-maint | quojs-react (hooks, suspense, docs/ejemplos) | ~2–4 h/semana | **ABERTO** |

## Propriedade de Pacotes

| Pacote / Rota | Proprietários |
|--------------------------|--------------------------------------------------------|
| `packages/quojs` | @pixerael (em funções), **@co-maintainer (ABERTO)** |
| `packages/react`         | @pixerael (em funções), **@react-maint (ABERTO)**   |
| `examples/*`             | @pixerael (em funções), **@react-maint (ABERTO)**   |
| `docs/*`                 | @pixerael (em funções), **@react-maint (ABERTO)**   |

> Até que as vagas sejam preenchidas, @pixerael é o proprietário interino e revisor final.

## Gestão de Lançamentos

- **Rotação:** Os proprietários rotacionam o papel de "Responsável pelo Lançamento" a cada *minor*.
- **Tarefas:** *changelog*, incremento de versões, *tags*, notas de lançamento no GitHub, publicação no npm (se aplicável).
- **SemVer:** obrigatório.  Mudanças incompatíveis exigem notas de migração e (geralmente) um RFC.

## Como ser um Mantenedor/a

Damos as boas-vindas a candidaturas para os lugares de **@co-maintainer** e **@react-maint**.

**Elegibilidade (indicativa):**
- Contribuições sustentadas e de alta qualidade (código/documentos/revisões) na área relevante.
- Colaboração construtiva alinhada com o Código de Conduta.
- Familiaridade com a arquitetura e o roteiro do projeto.

**Como se candidatar:**
1.  Abra uma discussão no GitHub intitulada **“Solicitação de Mantenedor: <função> – <seu nome de usuário>”**.
2.  Inclui:
    - Sua experiência e fuso horário
    - Experiência OSS relevante / links
    - Áreas que você gostaria de liderar / melhorar
    - Estimativa de disponibilidade
3.  Receba feedback da comunidade (consenso tácito por 5 dias).
4.  Um mantenedor atual (Líder ou proprietário em exercício) confirmará a nomeação de acordo com [GOVERNANCE.md](./GOVERNANCE.md).

**Expectativas:**
- Triagar *issues*, revisar PRs e ajudar com lançamentos.
- Assistir (ou revisar de forma assíncrona) as notas de planejamento mensais.
- Cumprir com [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md), [CONTRIBUTING.md](./CONTRIBUTING.md) e [SECURITY.md](./SECURITY.md)

## Inativos / Ex-alunos

Os mantenedores inativos por ~6 meses podem passar para o status **Alumni** e poderão ser reintegrados posteriormente se solicitarem.

## Escalabilidade

Se não for possível chegar a um consenso em uma decisão técnica, o/a **Mantenedor/a Líder** decide (ou delega ao proprietário do pacote). As mudanças de governança seguem o processo de RFC.
