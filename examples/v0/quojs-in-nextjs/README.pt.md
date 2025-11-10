![Quo.js logo](https://quojs.dev/assets/logo.svg)

# Quo.js no Next.js (React 19)

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; |
> &nbsp; 👉 [ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp; | &nbsp;[ 🇫🇷 Version française](./README.fr.md)

Um exemplo mínimo que mostra como **[Quo.js](https://quojs.dev)** — o contêiner de estado declarativo e baseado em TypeScript — pode ser executado **dentro de uma aplicação Next.js (App Router)**, incluindo componentes cliente compatíveis com SSR.

Esta demonstração implementa um simples **alternador de tema** (claro ↔ escuro) alimentado por `@quojs/core` e `@quojs/react`, provando que o Quo.js pode gerenciar o estado do aplicativo perfeitamente em **React 19 + Next.js 16**.

---

## 🎯 Propósito

Este exemplo foi criado para:

- ✅ Demonstrar que **Quo.js funciona com SSR do Next.js** (Server-Side Rendering)  
- ⚡ Mostrar **assinaturas atômicas** — a UI atualiza apenas os componentes cujas propriedades mudam  
- 🌗 Implementar um **sistema de temas** usando reducers e seletores atômicos do Quo.js  

---

## 🧠 Visão Geral do Conceito

O aplicativo define um `themeReducer` com dois eventos:

| Evento | Propósito |
|:--|:--|
| `theme.set` | Define o tema preferido (`light`, `dark` ou `system`) |
| `theme.resolve` | Resolve o tema efetivo com base na preferência do sistema |

O tema selecionado é aplicado em `document.documentElement.classList` (`theme-light` / `theme-dark`) e mantido de forma reativa por meio da **assinatura atômica** do Quo.js usando `useAtomicProp`.

---

## 📂 Estrutura

```
quojs-in-nextjs/
├── src/
│   ├── components/
│   │   ├── Head.component.tsx
│   │   ├── Header.component.tsx
│   │   └── Content.component.tsx
│   ├── context/
│   │   └── Store.context.ts
│   ├── state/
│   │   ├── theme/Theme.reducer.ts
│   │   ├── hooks.ts
│   │   ├── store.ts
│   │   └── types.ts
│   └── pages/
│       └── index.tsx
└── package.json
```

---

## ⚙️ Como Executar

Primeiro, instale as dependências:

```bash
rush update
```

Depois, abra um terminal neste diretório e execute:

```bash
rush dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.

### 3. Alternar Tema

Clique no ícone 🌙 / 🌞 no cabeçalho para alternar entre os modos claro e escuro.  
A mudança é gerenciada pelo **Quo.js** através de uma atualização atômica de propriedades.