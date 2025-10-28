![Logotipo Quo.js](../../assets/logo.svg)

# Governança de Quo.js!

> [ 🇲🇽 Versión en Español](../es/GOVERNANCE.md)&nbsp; |
> &nbsp; 👉 [ 🇵🇹 Versão Portuguesa](./GOVERNANCE.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](../../GOVERNANCE.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](../fr/GOVERNANCE.md)

Este documento explica como as decisões são tomadas e como as pessoas colaboradoras se tornam mantenedoras.

## Papéis

- **Colaboradores/as**: Qualquer pessoa que envia PRs, issues ou documentação.  
- **Mantenedores/as**: Pessoas colaboradoras de confiança com permissões de *merge* em um ou mais pacotes.  
- **Mantenedor/a Líder**: Coordina la hoja de ruta (*roadmap*) y los lanzamientos (inicialmente **@pixerael / Erael Group.**).

A lista de mantenedores/as atuais é mantida em [MAINTAINERS.md](./MAINTAINERS.md) (se existir) ou na organização/equipe do GitHub.

## Tomada de decisões

Visamos o **consenso tácito** (*lazy consensus*):
1.  Proponha a mudança via PR ou RFC (para mudanças substanciais na API).
2.  Mantenha uma janela curta de discussão (tipicamente 3–7 dias para RFCs).
3.  Se não houver objeções bem fundamentadas, a proposta será aceita.

Se não for possível chegar a um consenso, o/a **Mantenedor/a Líder** (ou o/a mantenedor/a delegado/a para o pacote) decide.

## RFCs

Use um RFC quando:
- Mude APIs públicas ou o comportamento de forma incompatível.
- Introduza dependências maiores ou mudanças arquitetônicas.
- Proponha novos pacotes centrais.

Modelo de RFC:
- Motivação e objetivos
- Design e alternativas
- Rascunho da API e exemplos
- Plano de migração e riscos
- Estratégia de testes

## Lançamentos e Versionamento

- A versão segue o **SemVer**.
- Cada pacote é versionado de forma independente.
- O/A **Responsável pelo Lançamento** (rotativo entre os/as mantenedores/as) prepara *changelogs* e etiquetas (*tags*).
- As mudanças incompatíveis requerem:
   - Um RFC ou uma justificativa clara
   - Notas de migração no *changelog*
   - Provas que demonstrem a mudança

## Expectativas de Manutenção

- Ser respeitoso/a e seguir o **Código de Conduta**.
- Revisar PRs com rapidez e de forma construtiva.
- Manter alta cobertura de testes e qualidade da documentação.
- Declarar conflitos de interesse.

## Adicionar/Remover Mantenedores/as

- **Nomeação**: Qualquer mantenedor/a pode nomear uma pessoa colaboradora.
- **Critérios**: Contribuições consistentes de qualidade (código/documentos/revisões), boa comunicação, valores alinhados com o projeto.
- **Aprovação**: Consenso tácito entre mantenedores/as.  O/A Mantenedor/a Líder confirma as alterações de acesso.
- **Inatividade**: Mantenedores/as inativos/as por ~6 meses podem passar para o estado "alumni" (podem retornar mais tarde).

## Marcas e Branding

Os nomes "Quo.js" e "quojs-react" são marcas do Erael Group.  Consulte [TRADEMARKS.md](./TRADEMARKS.md).  A governança não implica uma licença de marca.

## Mudanças na Governança

As mudanças de governança seguem o processo de RFC e requerem aprovação explícita do/da Mantenedor/a Líder.
