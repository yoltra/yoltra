![Logotipo Quo.js](../../assets/logo.svg)

# Fluxo de trabalho contínuo

> [ 🇲🇽 Versión en Español](../es/WORKFLOW.md)&nbsp; | &nbsp; 👉
> [ 🇵🇹 Versão Portuguesa](./WORKFLOW.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](../../WORKFLOW.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](../fr/WORKFLOW.md)

Este documento descreve o fluxo de desenvolvimento e publicação de pacotes Quo.js usando
**versionamento independente** em um monorepo com Rush.

## Desenvolvimento diário

- **Ramos de feature/fix** criados a partir de `main`:
  - Exemplos de nomes de branch:
    - `feat(core): ...`
    - `fix(react): ...`
  - Gerar arquivos de mudança:
    ```bash
    rush change -v
    ```
    - Use **patch** para correções.
    - Use **minor** para novas funcionalidades.
    - Use **minor** para mudanças incompatíveis (enquanto `<1.0.0`, todas as mudanças que
      quebram contam como minor).
  - Abra um PR → faça o merge após a revisão.

## Ciclo de versionamento e publicação

Pode ser manual ou automatizado em CI:

```bash
versão rush --garantir-política-de-versão
publicar com urgência --publicar --aplicar --ramo-alvo principal
```

- Apenas os pacotes com arquivos de alteração são versionados.
- Os pacotes sem alterações mantêm a sua versão.

## Mudanças incompatíveis em `@quojs/core`

- Aumenta o **minor** no core (ex: `0.2.x → 0.3.0`).
- Atualize os adaptadores validados para:

```json
   "dependências de pares": {
     "@quojs/core": "^0.3.0"
   }
```

- Gere arquivos de alteração para esses adaptadores (patch ou menor, dependendo do caso).
- Publique apenas os adaptadores validados.
- **Não adicione adaptadores que você ainda não verificou**; a verificação de dependências pelos
  consumidores os protegerá.

## Pré-lançamentos

- Para trabalho experimental ou arriscado, publique pré-lançamentos:
  ```bash
  0.2.0-alfa.0
  ```
  usando `--tag next` (no npm) ou publicando no Verdaccio.
- Os adaptadores podem adotar a nova gama de dependências de forma progressiva.

# Por que este fluxo funciona

- **Versionamento independente** → apenas os pacotes modificados mudam de versão.
- **Começar em `0.1.0`** → os intervalos com caret funcionam como esperado (`^0.1.0` permite
  flutuação de patch, não de minor).
- **Arquivos de alterações desde o primeiro dia** → Rush mantém a consistência e gera notas de
  versão claras.
- **Etiquetas por pacote** → facilitam o bisect e a geração de changelogs.
