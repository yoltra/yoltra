# Quo.js vs Redux Toolkit: Comparação de Perfilador

> [ 🇲🇽 Versión en Español](./redux-quojs-profiler.es.md)&nbsp; | &nbsp;[ 🇵🇹 Versão Portuguesa](./redux-quojs-profiler.pt.md)&nbsp; | &nbsp;[ 🇺🇸 English Version](./redux-quojs-profiler.md)&nbsp; | &nbsp;[ 🇫🇷 Version française](./redux-quojs-profiler.fr.md) 

## Cenário de Teste

Ambas as implementações renderizam a mesma lista de tarefas interativa:

- **Fábrica de TODOs** para criação de tarefas.
- **Filtros de TODOs** para filtrar _todos_ por status e categoria.
- **Lista de TODOs** com itens que podem ser alternados entre ativo/inativo.

Esse cenário coloca à prova o desempenho de re-renderização, e o Quo.js se destaca com
**assinaturas granulares nativas**.


## Flamegraphs do Quo.js (Quadros 1-19)

As atualizações do Quo.js são consistentemente **planas e localizadas**.
Cada commit toca apenas o componente que se inscreveu no *todo* que
realmente mudou. Assinaturas atômicas de propriedades vencem o jogo.

| Quadro | Notas                                                                                                                                               | Quo.js                                                                                          | Redux (RTK)                                                                                 |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 01      | Renderização inicial                                                                                                                               | ![Quo frame 01](./public/assets/profiler/quojs/profiler-quojs-frame-01.2025-10-20-22-48-17.png) | ![RTK frame 02](./public/assets/profiler/rtk/profiler-rtk-frame-01-2025-10-20-22-35-07.png) |
|         | Ambas as bibliotecas renderizam toda a interface inicialmente (ainda sem TODOs).                                                                    |                                                                                                 |                                                                                             |
| 02      | Buscar TODOs                                                                                                                                       | ![Quo frame 02](./public/assets/profiler/quojs/profiler-quojs-frame-02.2025-10-20-22-49-47.png) | ![RTK frame 02](./public/assets/profiler/rtk/profiler-rtk-frame-02.2025-10-20-22-36-36.png) |
|         | Uma ação assíncrona é despachada para buscar TODOs de um serviço externo.                                                                          |                                                                                                 |                                                                                             |
| 03      | TODOs recebidos                                                                                                                                     | ![Quo frame 03](./public/assets/profiler/quojs/profiler-quojs-frame-03.2025-10-20-22-50-31.png) | ![RTK frame 03](./public/assets/profiler/rtk/profiler-rtk-frame-03.2025-10-20-22-37-22.png) |
|         | Ambas as bibliotecas renderizam toda a lista.                                                                                                      |                                                                                                 |                                                                                             |
| 04      | Filtros ativados                                                                                                                                    | ![Quo frame 04](./public/assets/profiler/quojs/profiler-quojs-frame-04.2025-10-20-22-50-51.png) | ![RTK frame 04](./public/assets/profiler/rtk/profiler-rtk-frame-04.2025-10-20-22-37-51.png) |
|         | Os filtros são reconstruídos com a categoria dos TODOs recebidos. Ambas re-renderizam toda a lista.                                                |                                                                                                 |                                                                                             |
| 05      | Criar novo TODO, etapa #1                                                                                                                           | ![Quo frame 05](./public/assets/profiler/quojs/profiler-quojs-frame-05.2025-10-20-22-51-21.png) | ![RTK frame 05](./public/assets/profiler/rtk/profiler-rtk-frame-05.2025-10-20-22-38-17.png) |
|         | Na fábrica de TODOs, o nome (teste) é inserido no campo ‘title’. Ambas re-renderizam apenas a fábrica de TODOs.                                     |                                                                                                 |                                                                                             |
| 06      | Criar novo TODO, etapa #2                                                                                                                           | ![Quo frame 06](./public/assets/profiler/quojs/profiler-quojs-frame-06.2025-10-20-22-52-03.png) | ![RTK frame 06](./public/assets/profiler/rtk/profiler-rtk-frame-06.2025-10-20-22-38-49.png) |
|         | Na fábrica de TODOs, a categoria (teste) é inserida no campo ‘category’. Ambas re-renderizam apenas a fábrica.                                     |                                                                                                 |                                                                                             |
| 07      | Criar novo TODO, etapa #3                                                                                                                           | ![Quo frame 07](./public/assets/profiler/quojs/profiler-quojs-frame-07.2025-10-20-22-52-20.png) | ![RTK frame 07](./public/assets/profiler/rtk/profiler-rtk-frame-07.2025-10-20-22-40-00.png) |
|         | O botão ‘Adicionar’ foi clicado e o TODO é adicionado à lista. Ambas re-renderizam toda a lista + filtros + fábrica.                                |                                                                                                 |                                                                                             |
| 08      | TODO com chave `1` é alternado. Atualização automática.                                                      | ![Quo frame 08](./public/assets/profiler/quojs/profiler-quojs-frame-08.2025-10-20-22-52-40.png) | ![RTK frame 08](./public/assets/profiler/rtk/profiler-rtk-frame-08.2025-10-20-22-40-23.png) |
|         |                                                                                                                                                     | Quo.js re-renderiza apenas o TODO específico.                                                   | RTK re-renderiza toda a lista de TODOs.                                                     |
| 09      | TODO com chave `2` é alternado. Atualização automática.                                                      | ![Quo frame 09](./public/assets/profiler/quojs/profiler-quojs-frame-09.2025-10-20-22-53-09.png) | ![RTK frame 09](./public/assets/profiler/rtk/profiler-rtk-frame-09.2025-10-20-22-40-48.png) |
|         |                                                                                                                                                     | Quo.js re-renderiza apenas o TODO específico.                                                   | RTK re-renderiza toda a lista de TODOs.                                                     |
| 10      | TODO com chave `3` é alternado. Atualização automática.                                                      | ![Quo frame 10](./public/assets/profiler/quojs/profiler-quojs-frame-10.2025-10-20-22-53-32.png) | ![RTK frame 10](./public/assets/profiler/rtk/profiler-rtk-frame-10.2025-10-20-22-41-14.png) |
|         |                                                                                                                                                     | Quo.js re-renderiza apenas o TODO específico.                                                   | RTK re-renderiza toda a lista de TODOs.                                                     |
| 11      | TODO com chave `4` é alternado. Atualização automática.                                                      | ![Quo frame 11](./public/assets/profiler/quojs/profiler-quojs-frame-11.2025-10-20-22-54-03.png) | ![RTK frame 11](./public/assets/profiler/rtk/profiler-rtk-frame-11.2025-10-20-22-41-46.png) |
|         |                                                                                                                                                     | Quo.js re-renderiza apenas o TODO específico.                                                   | RTK re-renderiza toda a lista de TODOs.                                                     |
| 12      | TODO com chave `5` é alternado. Atualização automática.                                                      | ![Quo frame 12](./public/assets/profiler/quojs/profiler-quojs-frame-12.2025-10-20-22-54-27.png) | ![RTK frame 12](./public/assets/profiler/rtk/profiler-rtk-frame-12.2025-10-20-22-42-43.png) |
|         |                                                                                                                                                     | Quo.js re-renderiza apenas o TODO específico.                                                   | RTK re-renderiza toda a lista de TODOs.                                                     |
| 13      | TODO com chave `6` é alternado. Atualização automática.                                                      | ![Quo frame 13](./public/assets/profiler/quojs/profiler-quojs-frame-13.2025-10-20-22-54-47.png) | ![RTK frame 13](./public/assets/profiler/rtk/profiler-rtk-frame-13.2025-10-20-22-43-10.png) |
|         |                                                                                                                                                     | Quo.js re-renderiza apenas o TODO específico.                                                   | RTK re-renderiza toda a lista de TODOs.                                                     |
| 14      | TODO com chave `7` é alternado. Atualização automática.                                                      | ![Quo frame 14](./public/assets/profiler/quojs/profiler-quojs-frame-14.2025-10-20-22-55-10.png) | ![RTK frame 14](./public/assets/profiler/rtk/profiler-rtk-frame-14.2025-10-20-22-43-32.png) |
|         |                                                                                                                                                     | Quo.js re-renderiza apenas o TODO específico.                                                   | RTK re-renderiza toda a lista de TODOs.                                                     |
| 15      | TODO com chave `8` é alternado. Atualização automática.                                                      | ![Quo frame 15](./public/assets/profiler/quojs/profiler-quojs-frame-15.2025-10-20-22-55-33.png) | ![RTK frame 15](./public/assets/profiler/rtk/profiler-rtk-frame-15.2025-10-20-22-44-12.png) |
|         |                                                                                                                                                     | Quo.js re-renderiza apenas o TODO específico.                                                   | RTK re-renderiza toda a lista de TODOs.                                                     |
| 16      | TODO com chave `9` é alternado. Atualização automática.                                                      | ![Quo frame 16](./public/assets/profiler/quojs/profiler-quojs-frame-16.2025-10-20-22-55-59.png) | ![RTK frame 16](./public/assets/profiler/rtk/profiler-rtk-frame-16.2025-10-20-22-44-33.png) |
|         |                                                                                                                                                     | Quo.js re-renderiza apenas o TODO específico.                                                   | RTK re-renderiza toda a lista de TODOs.                                                     |
| 17      | TODO com chave `10` é alternado. Atualização automática.                                                     | ![Quo frame 17](./public/assets/profiler/quojs/profiler-quojs-frame-17.2025-10-20-22-56-20.png) | ![RTK frame 17](./public/assets/profiler/rtk/profiler-rtk-frame-17.2025-10-20-22-44-53.png) |
|         |                                                                                                                                                     | Quo.js re-renderiza apenas o TODO específico.                                                   | RTK re-renderiza toda a lista de TODOs.                                                     |
| 18      | TODO com chave `11` é alternado. Atualização automática.                                                     | ![Quo frame 18](./public/assets/profiler/quojs/profiler-quojs-frame-18.2025-10-20-22-56-44.png) | ![RTK frame 18](./public/assets/profiler/rtk/profiler-rtk-frame-18.2025-10-20-22-45-22.png) |
|         |                                                                                                                                                     | Quo.js re-renderiza apenas o TODO específico.                                                   | RTK re-renderiza toda a lista de TODOs.                                                     |
| 19      | TODO com chave `12` é alternado. (criado no quadro #7). Atualização automática.                               | ![Quo frame 19](./public/assets/profiler/quojs/profiler-quojs-frame-19.2025-10-20-22-57-05.png) | ![RTK frame 19](./public/assets/profiler/rtk/profiler-rtk-frame-19.2025-10-20-22-45-51.png) |
|         | Relatório do perfilador (JSON)                                                                                                                     | [Quo.js](./public/assets/profiler/quojs/profiling-data.quojs.10-20-2025.22-30-26.json)          | [RTK](./public/assets/profiler/rtk/profiling-data.rtk.10-20-2025.22-32-54.json)             |


## Observações Principais

Na implementação RTK, alternar cada TODO (12 no total) causou re-renderização dos outros 11,
totalizando **144 re-renderizações** --- sendo **132 desnecessárias**.

1.  **Assinaturas atômicas (Quo.js) vs Fábricas de seletores (RTK).**

    - **Quo.js**: Caminho direto (`todo.data.4.status`) → um único componente.
    - RTK: Precisa de `createSelector` + memoização; fácil de errar, fácil de despertar a lista.

2.  **Agregação curinga.**

    - **Quo.js**: `todo.filter.*` atualiza filtros automaticamente.
    - RTK: Requer seletores linha a linha; abordagem padrão causa recarregamento total.

3.  **Efeitos assíncronos.**

    - **Quo.js**: Semântica nativa de cancelamento/atraso.
    - RTK: Exige middleware personalizado ou cadeias de thunks; sem cancelamento natural.

4.  **Resultado do perfilador.**

    - **Quo.js**: flamegraphs planos, previsíveis, com atualizações limitadas.
    - RTK: flamegraphs amplos, commits inconsistentes, maior custo de CPU.

## Por Que Isso Importa

Em aplicativos pequenos, ambos parecem "rápidos o suficiente".

Mas em escala:

- **Quo.js escala linearmente** com o número de itens afetados.
- **RTK escala superlinearmente** a menos que se invista pesado em disciplina de seletores.

Esta demonstração ilustra **por que o Quo.js existe**: para fornecer assinaturas atômicas de
propriedades, efeitos assíncronos de primeira classe e agregação curinga **sem cerimônia de
desenvolvedor**.
