![Logotipo Quo.js](../../assets/logo.svg)

# Contribuir para o Quo.js!

> [ 🇲🇽 Versión en Español](../es/CONTRIBUTING.md)&nbsp; |
> &nbsp; 👉 [ 🇵🇹 Versão Portuguesa](./CONTRIBUTING.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](../../CONTRIBUTING.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](../fr/CONTRIBUTING.md)

Obrigado pelo seu interesse em contribuir! 🎉 Este projeto é de código aberto sob a **MIT** com um modelo de governança leve e acolhedor.

- **Licença de código:** MIT 
- **Licença de documentação:** CC BY 4.0 (salvo indicação) 
- **Código de Conduta:** Contributor Covenant v2.1 
- **DCO:** Declaração de Origem do Desenvolvedor 1.1 (requer *sign-off* em cada *commit*)

> Para o fluxo completo de engenharia e o processo de publicação, consulte o **Guia do Desenvolvedor**: [./DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md).  Este arquivo é um guia rápido para contribuidores e autores de PR.

## Início rápido (monorepo Rush)

```bash
# instale o rush uma vez
npm i -g @microsoft/rush

# instala todas as dependências (pnpm via Rush)
instalação rápida

# compila tudo (incremental, usa cache do Rush)
construção rápida

# executa testes em todo o repositório
teste de corrida

# lint para todos os pacotes que definem um script 'lint'
pelúcia de rush

# compilações focadas
rush build --to @quojs/core
rush build --from @quojs/react

# trabalha dentro de um único pacote
cd packages/quojs
rushx construir
teste rushx
rushx lint
```

Cada pacote publicável tem seu próprio `package.json`.  A pasta raiz é privada e **não** é publicada.

## Fluxo de trabalho

1.  **Crie um branch** a partir de `main`: `feature/<issue>-<slug>` ou `fix/<issue>-<slug>`.
2.  **Desenvolva** com provas e documentação.
3.  **Verifique** se os seguintes comandos devem ser executados: `rush build`, `rush test`, `rush lint`.
4.  **Arquivo de alterações** (se um pacote publicável foi alterado): 
    ```bash
    mudança urgente
    ```
5.  **Abra um Pull Request** (preencha o modelo, vincule issues/RFCs).  CI aplica estilo de *commits*, DCO, arquivos de mudanças, testes e cobertura.
6.  Revisão e *merge* (squash ou rebase, a critério do mantenedor).

## Estilo de *Commits* (Conventional Commits) + DCO (obrigatório)

Use o formato convencional:

```
tipo(escopo): breve resumo

corpo (opcional)
```

**Tipos permitidos:** `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `chore`, `revert`

**Exemplos**
- `feat(quojs): adicionar assinaturas de curingas de caminho profundo`
- `fix(quojs-react): normaliza o ponto inicial em useAtomicProp`
- `test(store): cobrir devtools DISPATCH aplicar estado`

**Assinatura DCO** — cada *commit* deve incluir uma linha de assinatura:

```
Assinado por:  Your Name <you@example.com>
```

Sugestão: use `git commit -s` para adicioná-la automaticamente.  As mensagens de *commit* são verificadas localmente (Husky) e no CI.

## Testes e Cobertura

- *Test runner*: **Vitest** 
- Pruebas de UI: **@testing-library/react** (para `quojs-react`) 
- Umbrales de cobertura aplicados en la configuración de Vitest: 
  - Líneas / Ramas / Funciones / Sentencias: **≥ 95%** (en código tocado) 
- Prefiere pruebas enfocadas y robustas; usa *snapshots* solo para salidas estables y deterministas.

Ejecuta todas las pruebas:

```bash 
rush test 
```

## Linting y Formateo

- Lint: **ESLint** (TypeScript) 
- Formato: **Prettier**

```bash 
rush lint 
rushx format 
```

## Reporte de *Issues* y PRs

- Usa las plantillas de **Bug Report** y **Feature Request**. 
- Los PRs deben seguir la **plantilla de Pull Request** e incluir: 
  - Título con *Conventional Commit* + *DCO* *sign-off* 
  - *Checks* locales en verde: `rush build`, `rush test`, `rush lint` 
  - **Archivo de cambios** si cambió un paquete publicable 
  - Pruebas y actualizaciones de docs adecuadas

## Seguridad

Si encuentras un problema de seguridad, **no abras un *issue* público**. Sigue **[SECURITY.md](./SECURITY.md)** para divulgación responsable.

¡Gracias por contribuir! ❤️ 
