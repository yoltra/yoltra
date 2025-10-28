![Logotipo Quo.js](../../assets/logo.svg)

# Guia de Desenvolvimento (Monorepo Quo.js)

> [ 🇲🇽 Versión en Español](../es/DEVELOPER_GUIDE.md)&nbsp; |
> &nbsp; 👉 [ 🇵🇹 Versão Portuguesa](./DEVELOPER_GUIDE.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](../../DEVELOPER_GUIDE.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](../fr/DEVELOPER_GUIDE.md)

Única fonte de verdade para o SDLC, configuração local, _branching_, testes/cobertura e
lançamentos usando **Rush + PNPM**.

## SDLC (como entregamos)

1. Planejar → abrir/triar um Issue (bug/feat).
2.  Ramificar → `feature/<issue>-<slug>` ou `fix/<issue>-<slug>`.
3.  Codificar → testes + documentação; **Conventional Commits** com assinatura **DCO**.
4.  Portas locais → passam `rush build` e `rush test`; cobertura ≥ limiares.
5.  PR → completar o modelo de PR; vincular issues; CI deve estar verde (**alterar arquivos**
    verificados).
6.  Revisão → aprovações; _squash_ ou _rebase_ conforme critério do mantenedor.
7.  Lançamento → os mantenedores executam `rush version` e depois `rush publish` (ver
    "Lançamentos" abaixo).

## Configuração local

Instale o Rush (apenas uma vez):

```bash
npm i -g @microsoft/rush
```

Instale dependências (determinístico via PNPM + Rush):

```bash
instalar com pressa
```

Compile tudo (construa o grafo, incrementalmente; use o cache de compilação do Rush):

```bash
construção rápida
```

Executa testes para todos os pacotes (definidos via command-line.json):

```bash
teste de corrida
```

Lint para todos os pacotes que definem um script "lint":

```bash
linho apressado
```

Compilações focadas:

```bash
rush build --to @quojs/core
rush build --from @quojs/react
```

Trabalho a nível de pacote:

```bash
cd pacotes/quojs

rushx construir
teste rushx
rushx lint
```

## Estratégia de ramificação

- Ramo padrão: `main`.
- O trabalho ocorre em ramificações `feature/*` ou `fix/*`.
- Abra PRs contra `main`.
- Cada PR que alterar um pacote publicável deve incluir um **arquivo de alteração** (ver "Alterações e
   versionado").

## Commits convencionais + DCO (aplicado)

Cada commit deve:

- seguir **Conventional Commits** (lintado localmente via Husky e na CI), e
- incluir uma linha de assinatura **DCO**, por exemplo:

```
   Assinado por:  Tu Nombre <tu@tu-proveedor-de-email.com>
```

> Dica: use `git commit -s` para adicionar a linha DCO automaticamente.

Tipos permitidos:

- `feat`
- `corrigir`
- `perf`
- `refatorar`
- `docs`
- `teste`
- `construir`
- `tarefa`
- `reverter`

## Testes e cobertura

- _Executador de testes_: **Vitest**.
- Pruebas de UI: **@testing-library/react** (para `quojs-react`).
- Os limites de cobertura são aplicados na configuração do Vitest:
   - Linhas / Ramos / Funções / Sentenças: **≥ 95%** (sobre código tocado).
- _Snapshots_ apenas para saídas estáveis e determinísticas.

Executar:

```bash
teste de corrida
```

## Linting e Formatação

- ESLint (TypeScript), Prettier.
- Scripts por pacote são executados via `rushx`.

Exemplos:

```bash
linho apressado
cd packages/quojs-react && rushx lint
formato rushx
```

## Cache de compilação (Rush)

O repositório habilita o **cache local** de compilação do Rush.  A configuração está em:

- A nível do repositório: `common/config/rush/build-cache.json`
- _Saídas_ por pacote: `packages/<nome>/config/rush-project.json`

Os _outputs_ são armazenados em cache a partir de `dist/` para ambos os pacotes principais.  Para `@quojs/core`, a chave
O cache também inclui `BUILD_TARGET`.

Notas:

- `rush build` lerá/escreverá cache.
- `rush rebuild` **omite** o cache e recompila do zero (por design).

## Mudanças e versionamento (Rush)

### Arquivos de alteração

Crie entradas de mudança em `common/changes/`:

```bash
mudança urgente
```

CI verifica os arquivos de mudança nos PRs:

```bash
mudança rápida -v
```

### Políticas de versão

- `quojs-lockstep` (lockStepVersion): mantém **@quojs/core** e **@quojs/react** em
   sincronia.
- `lib-individual` (versão individual): reservado para futuros _adapters_ não atrelados ao ritmo do
   núcleo.

Os projetos são atribuídos em `rush.json` via `versionPolicyName`.

## Lançamentos

### Lançamento oficial (mantenedores)

1.  Incrementar versões/_changelogs_ a partir dos arquivos de mudança acumulados:

```bash
versão apressada
```

2.  Publicar no registro real (bandeiras de exemplo; adicione OTP/acesso conforme necessário):

```bash
publicar rapidamente --aplicar --publicar --ramo-alvo principal
```

> Dica: execute `rush publish` sem flags para um teste do plano.

### Teste de lançamento local (Verdaccio)

Existem duas formas seguras:

#### A) _Dry run_ de tarballs individuais (sem registro)

Gera arquivos `.tgz` para cada pacote público em `./dist-tarballs/`.

```bash
mudança urgente
publicar rapidamente --incluir-tudo --empacotar --pasta-de-lançamento ./dist-tarballs
```

Consumir em aplicativos:

```bash
pnpm add ./dist-tarballs/quojs-quojs-<ver>.tgz
pnpm add ./dist-tarballs/quojs-quojs-react-<ver>.tgz
```

#### B) Publicação em registro local (script Verdaccio)

Inicie o Verdaccio e faça login uma vez:

```bash
docker compose -f ops/verdaccio/docker-compose.yml up -d
pnpm adduser --registry http://localhost:4873/
```

Em seguida, execute o script:

```bash
common/scripts/publish-verdaccio.sh
```

Opções:

- `--skip-bump` para pular `rush version`
- `--skip-tests` para não executar exemplos contra o Verdaccio
- `--registry URL` se você não usar localhost

Restaurar registro:

```bash
docker compose -f ops/verdaccio/docker-compose.yml down -v
desativar npm_config_registry
```

Notas:

- Os registros não permitem republicar a mesma versão; carregue _patch_ para testes repetidos ou
   limpa o armazenamento do Verdaccio.
- O registro de instalação padrão é npmjs via `common/config/rush/.npmrc`.
- O registro de publicação é o Verdaccio via `common/config/rush/.npmrc-publish` usando
   `${NPM_AUTH_TOKEN}`.

## Relatório de bugs e PRs (GitHub)

- Use os modelos de **Relatório de Bug** e **Solicitação de Recurso**.
- Os PRs devem seguir o **modelo de Pull Request**.

Lista de verificação mínima para PR:

- _Commit convencional_ + assinatura DCO
- `rush build` e `rush test` são executados localmente
- Arquivo de alteração adicionada (se um pacote publicável foi alterado)
- A cobertura atende aos limites (caso contrário, o CI falhará)

## Segurança

Consulte [SEGURANÇA](./SEGURANÇA.md).  Não abra problemas públicos por vulnerabilidades.

## Solução de problemas (respostas rápidas)

- Falta arquivo de mudança → execute `rush change`; CI também verifica com `rush change -v`.
- Commit rejeitado localmente → corrija a mensagem para cumprir Conventional Commits e adicione a
   linha DCO; ou use `git commit -s`.
- O cache parece obsoleto → lembre-se que `rush rebuild` ignora o cache; use `rush build` para
   beneficiar-se do cache.
- Verdaccio "versão já existe" → incrementa a versão (via `rush change` + `rush version`) ou
   limpa o armazenamento do Verdaccio.
- As instalações apontam inesperadamente para o Verdaccio → certifique-se de não ter exportado
   `npm_config_registry`; elimina qualquer .npmrc por projeto.

## Dicas de DX

- As extensões recomendadas do VS Code estão em `.vscode/extensions.json`.
- A formatação é padronizada via `.prettierrc.json` e `.editorconfig`.
- As _project references_ do TypeScript estão configuradas para melhorar a navegação do IDE e
   constrói.
