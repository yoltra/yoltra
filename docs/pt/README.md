![Quo.js logo](https://quojs.dev/assets/logo.svg)

# Quo.js

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/README.md)  |
>   👉 [ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/README.md)  |  
> [ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/README.md)  |  [ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/README.md)

![Bundle size](https://badgen.net/bundlephobia/min/@quojs/core)
![Bundle size](https://badgen.net/bundlephobia/minzip/@quojs/core)
![Bundle size](https://badgen.net/bundlephobia/tree-shaking/@quojs/core)
![Bundle size](https://badgen.net/bundlephobia/dependency-count/@quojs/core)
![npm downloads](https://badgen.net/npm/dm/@quojs/core)
![License](https://img.shields.io/npm/l/@quojs/core)

Declarativo • Ultra-simples • Expressivo: Quo.js é uma biblioteca moderna de gerenciamento de
estado inspirada no Redux—mas sem a bagagem do Redux Toolkit. Traz de volta a simplicidade e o
poder do padrão Redux original enquanto introduz **canais + eventos**, **middleware assíncrono
nativo & efeitos**, **assinaturas granulares**, e **hooks React prontos para Suspense e Modo
Concorrente**.

## Pacotes

* **[@quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.pt.md)** — Store central, reducers, middleware, efeitos
  (agnóstico de framework)
* **[@quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.pt.md)** — Provider React & hooks (pronto para
  Suspense/Concorrente)

  ## [Exemplos Executáveis](https://github.com/quojs/quojs/tree/main/packages)

| Example                                                                                | Description                                                                                                             | Screenshot                                                                    |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **[Quo.js em React](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/README.pt.md)**                          | Um aplicativo de tarefas simples (Confira a [comparação do React Profiler](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.pt.md)) | ![Quo.js logo](https://quojs.dev/assets/examples/profiler-quojs-frame-15.png) |
| **[Logotipo Cinético do Quo.js (React + SVG)](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo/README.pt.md)** | Um logotipo cinético composto por aproximadamente 1.500 círculos SVG, controlado por um pequeno mecanismo de simulação e sincronizado com um armazenamento Quo.js. | ![Quo.js logo](https://quojs.dev/assets/examples/quojs-dots.gif)              |

## Por que Quo.js?

* 🗪 **Modelo de Canal + Evento** — ações são `{ channel, event, payload }`; reducers se
  inscrevem exatamente na granularidade que você precisa.
* 🎯 **Assinaturas de granularidade fina** — inscreva-se em props atômicos para evitar
  [**renderizações desnecessárias**](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md).
* 🧭 **TypeScript em primeiro lugar** — tipagens ergonômicas e APIs previsíveis.
* ⚡ **Middleware & efeitos integrados** — assíncrono por padrão; sem boilerplate de thunk/saga.
* 🧩 **Reducers dinâmicos** — adicione/remova reducers em tempo de execução.
* 📌 **Leve** — superfície pequena e focada.
* 🧭 **Agnóstico de framework** — React hoje; mais adaptadores são bem-vindos.

## Como o **Quo.js** se compara a outros contêineres de estado?

Ao avaliar um gerenciador de estado, a superfície bruta da API não é toda a história. O que mais
importa é a filosofia por trás dele, as compensações que ele faz, e como essas escolhas afetam a
**experiência do desenvolvedor, desempenho e escalabilidade** em projetos reais.

Quo.js foi projetado como uma evolução pragmática das ideias originais do Redux: eventos
explícitos, transições de estado previsíveis, tipagem forte em TypeScript, e manipulação
integrada de async/efeitos — sem a "mágica" oculta ou boilerplate de outros ecossistemas.

Para ajudá-lo a decidir se Quo.js é a escolha certa, preparamos comparações diretas com outras
bibliotecas populares. Cada documento explora:

* **Modelo conceitual** (como o estado flui através de ações, reducers e efeitos)
* **Ergonomia do desenvolvedor** (boilerplate, tipagem, ferramentas de debug)
* **Desempenho** (granularidade das assinaturas, eficiência de renderização)
* **Async & efeitos** (como workflows e efeitos colaterais são expressos)
* **Integração com React** (seletores, Suspense, prontidão para modo concorrente)

👉 Confira as comparações [aqui](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.pt.md)

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

* [Guia do Desenvolvedor](https://github.com/quojs/quojs/blob/main/docs/pt/DEVELOPER_GUIDE.md)

## Documentação

### Core

* [TypeDoc](https://github.com/quojs/quojs/blob/main/packages/core/docs/README.md): documentação mais técnica extraída usando
  TypeDoc.
* [Docs do Desenvolvedor (WIP)](https://www.quojs.dev?lang=pt): guia de início rápido, tutorial,
  receitas, etc.

### Bindings React

* [TypeDoc](https://github.com/quojs/quojs/blob/main/packages/react/docs/README.md): documentação mais técnica extraída usando
  TypeDoc.
* [Docs do Desenvolvedor (WIP)](https://www.quojs.dev?lang=pt): guia de início rápido, tutorial,
  receitas, etc.

## Contribuindo

* Comece aqui — [Guia de Contribuição](https://github.com/quojs/quojs/blob/main/docs/pt/CONTRIBUTING.md)
* [Código de Conduta](https://github.com/quojs/quojs/blob/main/docs/pt/CODE_OF_CONDUCT.md)
* [Governança](https://github.com/quojs/quojs/blob/main/docs/pt/GOVERNANCE.md)
* [Mantenedores](https://github.com/quojs/quojs/blob/main/docs/pt/MAINTAINERS.md)
* [Segurança](https://github.com/quojs/quojs/blob/main/docs/pt/SECURITY.md)
* [Marcas Registradas](https://github.com/quojs/quojs/blob/main/docs/pt/TRADEMARKS.md)

## Status

Quo.js está em **estágio RC**. As APIs são estáveis ​​e **provavelmente sofrerão alterações**, os tipos são estritos e está sendo usado em produção.
Feedback e PRs são bem-vindos.

Feito no 🇲🇽, para o mundo.
