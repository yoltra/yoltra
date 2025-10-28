# Quo.js vs Redux Toolkit – Demo React Vite

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; | &nbsp;[ 🇺🇸 English Version](./README.md)&nbsp; | &nbsp;[ 🇫🇷 Version française](./README.fr.md) 

Uma pequena demonstração focada em React que hospeda **ambas as implementações de estado** lado
a lado:

- **Quo.js** (store personalizado tipo Redux com canais/eventos e assinaturas de granularidade
  fina)
- **Redux Toolkit (RTK)** (stack padrão Redux com `createSlice` + `createAsyncThunk`)

Use este projeto para executar a UI localmente e reproduzir a
**[Análise do Profiler React](./redux-quojs-profiler.pt.md)**.

## Estrutura do projeto

Ambas as implementações expõem a mesma UI e fluxos de usuário (listar, adicionar, atualizar,
deletar). A aplicação de comparação monta cada página sob rotas separadas para que você possa
perfilá-las isoladamente.

- Rota **/quojs** → Página Quo.js envolvida em seu próprio provider
- Rota **/rtk** → Página RTK envolvida em seu próprio provider

A aplicação é um projeto **Vite** que vive dentro de um monorepo **Rush**.

## Pré-requisitos

- **Node.js**: LTS recomendado (ex. 18.x).
- **pnpm**: usado pelo Rush para gerenciamento de dependências
  ```bash
  npm i -g pnpm
  ```
- **Rush** (CLI global)
  ```bash
  npm i -g @microsoft/rush
  ```

## Clonar e inicializar

Clone este repositório, depois navegue até a pasta do repo e execute os seguintes comandos no
terminal:

```bash

# Instalar todas as dependências do monorepo
rush install          # ou: rush update

# (opcional) Construir tudo
rush build
```

## Executar a aplicação (desenvolvimento)

A aplicação de comparação é uma app Vite que roteia para cada implementação.

```bash
cd examples/quojs-in-react
rushx dev             # mesmo que: pnpm dev
```

Abra **http://localhost:5173** (ou o que o Vite imprimir).

- Visite **/quojs** para a página Quo.js.
- Visite **/rtk** para a página RTK.

## Build de produção e preview (para números estáveis de profiling)

Builds de desenvolvimento incluem verificações extras (ex., efeitos do Modo Estrito do React e
transformações de desenvolvimento). Para tempos mais estáveis, perfile um build de **produção**:

```bash
cd examples/quojs-in-react
rushx build           # Build de produção Vite
rushx preview         # Serve o build de produção
# padrão: http://localhost:4173
```

Depois abra `/quojs` ou `/rtk` no servidor de preview.

## Usando o Profiler do React

1. **Instale o React DevTools** no seu navegador (Chrome/Edge/Firefox).
2. Abra sua aplicação, depois abra DevTools → aba **Profiler**.
3. Na barra de ferramentas do Profiler:
   - Ative **"Record profiling"**.
   - Pressione `Refresh` para que o profiler também capture a etapa de carregamento
   - (Opcional) Habilite _"Record why each component rendered"_ para insights mais ricos.
4. Interaja com a página para capturar frames específicos:
5. Inspecione o flamegraph para cada commit:
   - Quais componentes re-renderizaram?
   - Quanto tempo levou o commit?
   - Quanto da árvore foi invalidado?

### Exportar perfis

No Profiler, clique em **Save profile…** para exportar um `.json` que você pode guardar para
reprodutibilidade.

## Fonte de dados

O exemplo de fetch usa MSW com dados simulados de
`https://jsonplaceholder.typicode.com/todos?id=0` por padrão. Você pode mudar isso nas
actions/hooks se necessário. Acesso à rede não é requerido por padrão e deve ser permitido pelo
seu navegador / proxy de desenvolvimento se você desabilitar o MSW.

## Licença

Esta demonstração é para propósitos de comparação/documentação. Veja a raiz do repositório para
detalhes da licença.
