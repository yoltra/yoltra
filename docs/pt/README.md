![Quo.js logo](../../assets/logo.svg)

# Quo.js

> [ 🇲🇽 Versión en Español](../es/README.md)&nbsp; | &nbsp; 👉
> [ 🇵🇹 Versão Portuguesa](./README.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](../../README.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](../fr/README.md)

Declarativo • Ultra-simples • Expressivo: Quo.js é uma biblioteca moderna de gerenciamento de
estado inspirada no Redux—mas sem a bagagem do Redux Toolkit. Traz de volta a simplicidade e o
poder do padrão Redux original enquanto introduz **canais + eventos**, **middleware assíncrono
nativo & efeitos**, **assinaturas granulares**, e **hooks React prontos para Suspense e Modo
Concorrente**.

## Pacotes

- **[@quojs/core](./packages/core/README.pt.md)** — Store central, reducers, middleware, efeitos
  (agnóstico de framework)
- **[@quojs/react](./packages/react/README.pt.md)** — Provider React & hooks (pronto para
  Suspense/Concorrente)
- **[examples/](./examples/)** — exemplos executáveis

## Por que Quo.js?

- 🗪 **Modelo de Canal + Evento** — ações são `{ channel, event, payload }`; reducers se
  inscrevem exatamente na granularidade que você precisa.
- 🎯 **Assinaturas de granularidade fina** — inscreva-se em props atômicos para evitar
  [**renderizações desnecessárias**](./examples/v0/quojs-in-react/redux-quojs-profiler.md).
- 🧭 **TypeScript em primeiro lugar** — tipagens ergonômicas e APIs previsíveis.
- ⚡ **Middleware & efeitos integrados** — assíncrono por padrão; sem boilerplate de thunk/saga.
- 🧩 **Reducers dinâmicos** — adicione/remova reducers em tempo de execução.
- 📌 **Leve** — superfície pequena e focada.
- 🧭 **Agnóstico de framework** — React hoje; mais adaptadores são bem-vindos.

## Como o **Quo.js** se compara a outros contêineres de estado?

Ao avaliar um gerenciador de estado, a superfície bruta da API não é toda a história. O que mais
importa é a filosofia por trás dele, as compensações que ele faz, e como essas escolhas afetam a
**experiência do desenvolvedor, desempenho e escalabilidade** em projetos reais.

Quo.js foi projetado como uma evolução pragmática das ideias originais do Redux: eventos
explícitos, transições de estado previsíveis, tipagem forte em TypeScript, e manipulação
integrada de async/efeitos — sem a "mágica" oculta ou boilerplate de outros ecossistemas.

Para ajudá-lo a decidir se Quo.js é a escolha certa, preparamos comparações diretas com outras
bibliotecas populares. Cada documento explora:

- **Modelo conceitual** (como o estado flui através de ações, reducers e efeitos)
- **Ergonomia do desenvolvedor** (boilerplate, tipagem, ferramentas de debug)
- **Desempenho** (granularidade das assinaturas, eficiência de renderização)
- **Async & efeitos** (como workflows e efeitos colaterais são expressos)
- **Integração com React** (seletores, Suspense, prontidão para modo concorrente)

👉 Confira as comparações [aqui](./examples/v0/quojs-in-react/redux-quojs-profiler.pt.md)

## Início Rápido (Monorepo)

```bash
npm i -g @microsoft/rush
rush install
rush build
rush test
```

Builds focados:

```bash
rush build --to @quojs/core
rush build --from @quojs/react
```

Veja o **Guia do Desenvolvedor** para SDLC, cache e releases:

- [Guia do Desenvolvedor](./DEVELOPER_GUIDE.md)

## Documentação

### Core

- [TypeDoc](./packages/core/docs/en/README.md): documentação mais técnica extraída usando
  TypeDoc.
- [Docs do Desenvolvedor (WIP)](https://www.quojs.dev?lang=pt): guia de início rápido, tutorial,
  receitas, etc.

### Bindings React

- [TypeDoc (WIP)](./packages/react/docs/en/README.md): documentação mais técnica extraída usando
  TypeDoc.
- [Docs do Desenvolvedor (WIP)](https://www.quojs.dev?lang=pt): guia de início rápido, tutorial,
  receitas, etc.

## Contribuindo

- Comece aqui — [Guia de Contribuição](./CONTRIBUTING.md)
- [Código de Conduta](./CODE_OF_CONDUCT.md)
- [Governança](./GOVERNANCE.md)
- [Mantenedores](./MAINTAINERS.md)
- [Segurança](./SECURITY.md)
- [Marcas Registradas](./TRADEMARKS.md)

## Status

Quo.js está em **estágio RC**. As APIs são estáveis, os tipos são estritos, e está sendo usado
em produção. Feedback e PRs são bem-vindos.

Feito no 🇲🇽, para o mundo.
