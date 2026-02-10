# Logotipo Cinético do Quo.js (React + SVG)

![Quo.js logo](./public/assets/quojs-dots.gif)

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; |
> &nbsp; 👉 [ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; | &nbsp;
> [ 🇺🇸 English Version](./README.md)&nbsp; | &nbsp; [ 🇫🇷 Version française](./README.fr.md)

**Um logotipo cinético feito com ~1,5k círculos SVG, guiado por um mini motor de simulação e sincronizado com um store do Quo.js.**  
Este exemplo está no monorepo do Rush em:

```
examples/v0/quojs-dots
```

Mostra o Quo.js como um contêiner de estado **previsível, tipado e orientado a eventos** com **assinaturas granulares** que mantêm os re‑renders do React enxutos — mesmo quando milhares de itens atualizam a cada frame.

---

## Por que Quo.js aqui?

- **Canais + eventos (sem sopa de action types):** despachamos no canal `"logo"` com eventos como `"batchUpdate"`, `"fps"`, etc.
- **Seletores granulares:** cada `<Circle/>` assina seu **próprio** nó `logo[group][id]` via `useAtomicProp`, evitando re‑renders do slice inteiro.
- **Reducer imutável e ergonômico:** um único reducer (`Logo.reducer.ts`) lida com updates atômicos e em lote sem mágica.
- **Hooks tipados:** `createQuoHooks` gera `useStore`, `useEmit`, `useSelector`, `useAtomicProp`, `useAtomicProps` com inferência total de TS.
- **Efeitos de eventos:** o motor escuta efeitos do store (ex.: `"logo":"start" | "stop"`) para coordenar o ciclo de vida da simulação.

Resultado: **60fps suaves** em máquinas capazes, com o React tocando o DOM apenas para os círculos que realmente se moveram.

---

## Como funciona (visão geral)

1. **Engine + Simulation**  
   - `Engine` roda um loop de `rAF`, suaviza FPS e despacha `logo/fps` a cada ~250ms.
   - `Simulation` possui itens `Circle`. Cada item sai de um início aleatório até seu pixel “casa” (o logo) e então fica ocioso — repelido pelo mouse e relaxando de volta.

2. **Imagem → specs (uma vez)**  
   - `extractCircleSpecsFromImage()` amostra um PNG transparente (`assets/logo.png`) para produzir `CircleSpec[]` com `group: "d" | "u" | "x"`.  
   - Despachamos `logo/size` e `logo/count` para a UI saber o tamanho da tela e os totais por grupo.

3. **Updates por frame → gravações em lote no store**  
   - Em cada frame, `Simulation.loop()` coleta updates e despacha **um** `logo/batchUpdate` com muitas mudanças.  
   - O reducer faz upsert apenas dos nós que mudaram, mantendo o store pequeno e o React preciso.

4. **Renderização granular**  
   - Cada `<Circle group id>` assina `logo[group][id]` via `useAtomicProp`. Se um círculo não se moveu, ele **não re‑renderiza**.

5. **Conclusão da intro + métricas**  
   - Enquanto a intro ocorre, `logo/introProgress` acompanha o restante. Quando todos chegam em casa, despachamos `logo/introComplete`.

---

## Executar (monorepo Rush)

> Pressupõe que você está na **raiz** do monorepo do Quo.js.

1) **Instalar + compilar pacotes** (para o exemplo resolver os workspaces `@quojs/*`)
```bash
rush install
rush build     # ou: rush build -t quojs-dots
```

2) **Iniciar o dev server do exemplo**
```bash
cd examples/v0/quojs-dots
rushx dev      # roda Vite
```

3) Abra a URL local impressa (geralmente `http://localhost:5173`). Mova o mouse sobre o logo — os pontos orbitam/evitam e depois retornam à casa.

> Alternativa a partir da raiz do monorepo:
```bash
rushx -p quojs-dots dev
```

---

## Estrutura do projeto (arquivos-chave)

```
src/
  App.tsx                       # inicia Engine, extrai specs do PNG do logo, liga Simulation → Store
  components/screen/Screen.*    # invólucro de tela (SVG), lê store.size, renderiza a lista de <Circle/>
  components/screen/items/circle/
    Circle.component.tsx        # assina seu próprio nó logo[group][id] via useAtomicProp
  context/Store.context.tsx     # contexto React para o store tipado do Quo
  state/
    types.ts                    # AppState, LogoState, mapas de ações tipados (LogoAM, AppAM)
    logo/Logo.reducer.ts        # reducer imutável; updates atômicos + em lote, fps, intro, size
    hooks.ts                    # createQuoHooks(...): hooks React tipados
    store.ts                    # createStore(...) com o reducer de logo
  utils/
    engine/                     # Engine (loop rAF), Simulation (itens + quadtree), comportamento do Circle
    image/                      # PNG → ImageData + extractor → CircleSpec[]
    Quadtree.ts                 # índice espacial para consultar círculos próximos ao mover o mouse
    index.ts                    # utilitários numéricos (expApproach, orbit/avoid, etc.)
  assets/logo.png               # imagem base para amostragem
```

---

## Específicos do Quo.js aqui

- **`batchUpdate`**: uma ação, muitos updates → menos trabalho do reducer e menos commits do React.
- **`useAtomicProp`**: assinatura direta em um caminho profundo (`logo["d"]["circle_d_42"]`). Sem pegadinhas de memo, sem seletores que alocam objetos novos a cada render.
- **API de efeitos** (`store.onEffect("logo", "start" | "stop")`): o motor reage a eventos de estado através do pipeline async integrado do Quo.js.
- **Reducer puro e imutável**: `upsertItem()` garante no‑op quando nada mudou → menos atualizações se propagam.

Se você curte esse padrão em um demo, ele escala bem para UIs reais com milhares de nós, workloads de streaming/animação e orçamentos de render rigorosos.

---

## Solução de problemas

- **Tela em branco ou erro de fetch**: verifique se `assets/logo.png` resolve (Vite dev server) e se o navegador suporta `createImageBitmap`. Há um fallback, mas algumas CSPs podem bloquear.
- **Lento em máquinas modestas**: reduza `maxCircles` em `App.tsx` (ex.: 800) ou aumente o `spacing` do extractor (ex.: de `3` para `5`).