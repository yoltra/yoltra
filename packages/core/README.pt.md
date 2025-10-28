![Logotipo Quo.js](../../assets/logo.svg)

# Quo.js O estado das coisas, reescrito.

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; | &nbsp; 👉
> [ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; | &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp;
> | &nbsp; > [ 🇫🇷 Version française](./README.fr.md)

**@quojs/core** es una biblioteca moderna de gestión de estado, **agnóstica de framework** e
inspirada en Redux — pero sin el peso de Toolkit. Introduza **canais + eventos**, **middleware e
efeitos assíncronos nativos** e **assinaturas atômicas**.

Funciona em **navegadores e no Node**. Não assume o DOM. Adequado para Node 18+, Bun e Deno (com
ESM).

## Instalação

```bash
npm i @quojs/core
```

## Por que Quo.js?

- 🔗 **Modelo Canal + Evento** — `{ canal, evento, carga útil }` para modularidade natural
- 🎯 **assinaturas atômicas** — rastreamento atômico de mudanças
- ⚡ **Middleware e efeitos assíncronos** — integrados, sem _thunk/saga_
- 🛡 **TypeScript primeiro** — tipos ergonômicos e previsíveis
- 🧩 **Redutores dinâmicos** — adiciona/remove redutores em tempo de execução
- 🧭 **Agnóstico de framework** — use-o com `@quojs/react` ou sem UI no Node

## Documentação

- [Desenvolvedor](https://quojs.dev/?lang=pt): guia de início rápido, tutorial, gists, etc.
- [TypeDoc](./docs/pt/README.md): uma documentação mais técnica extraída usando TypeDoc.

## Links

- [Monorepo](../../docs/pt/README.md)
- [Governança](../../docs/pt/GOVERNANCE.md)
- [Código de conduta](../../docs/pt/CODE_OF_CONDUCT.md)
- [Guia de Contribuição](../../docs/pt/CONTRIBUTING.md)

## Estado

Fase RC. APIs estáveis (potencialmente mutáveis), tipos estritos, uso em produção. Comentários e
PRs são bem-vindos.

Feito com ❤️ no 🇲🇽 para o 🌎.
