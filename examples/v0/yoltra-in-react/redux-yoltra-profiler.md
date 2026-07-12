# Yoltra vs Redux Toolkit: Profiler Comparison

![Frame #20 - Profiler](./public/assets/profiler/yoltra/profiler-yoltra-frame-10.2025-10-20-22-53-32.png)

> [ 🇲🇽 Versión en Español](./redux-yoltra-profiler.es.md)&nbsp; | &nbsp; 👉 🇺🇸 English Version
> &nbsp;

## Test Scenario

Both implementations render the same interactive todo list:

- **Todo Factory** for todo creation.
- **Todo Filters** to filter _todos_ by status and category.
- **Todo list** todo items that can be toggled active/inactive.

This scenario stresses re-render performance, Yoltra shines on native **Granular
subscriptions**.

## Yoltra Flamegraphs (Frames 01–19)

Yoltra’s updates are consistently **flat and localized**. Each commit touches only the component
that subscribed to the _todo_ that actually changed. Atomic property subscriptions for the win.

| Frame | Notes                                                                                                                            | Yoltra                                                                                            | Redux (RTK)                                                                                 |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 01    | Initial Render                                                                                                                   | ![Yoltra frame 01](./public/assets/profiler/yoltra/profiler-yoltra-frame-01.2025-10-20-22-48-17.png) | ![RTK frame 02](./public/assets/profiler/rtk/profiler-rtk-frame-01-2025-10-20-22-35-07.png) |
|       | Both libraries render the entire UI initially (no TODOs yet).                                                                    |                                                                                                   |                                                                                             |
| 02    | Fetch TODOs                                                                                                                      | ![Yoltra frame 02](./public/assets/profiler/yoltra/profiler-yoltra-frame-02.2025-10-20-22-49-47.png) | ![RTK frame 02](./public/assets/profiler/rtk/profiler-rtk-frame-02.2025-10-20-22-36-36.png) |
|       | An async action id dispatched to fetch TODOs from an external service                                                            |                                                                                                   |                                                                                             |
| 03    | TODOs arrive                                                                                                                     | ![Yoltra frame 03](./public/assets/profiler/yoltra/profiler-yoltra-frame-03.2025-10-20-22-50-31.png) | ![RTK frame 03](./public/assets/profiler/rtk/profiler-rtk-frame-03.2025-10-20-22-37-22.png) |
|       | Both libraries render the whole list                                                                                             |                                                                                                   |                                                                                             |
| 04    | Filters engage                                                                                                                   | ![Yoltra frame 04](./public/assets/profiler/yoltra/profiler-yoltra-frame-04.2025-10-20-22-50-51.png) | ![RTK frame 04](./public/assets/profiler/rtk/profiler-rtk-frame-04.2025-10-20-22-37-51.png) |
|       | Filters are re-built with the incoming TODOs category. Both libraries re-render the whole list                                   |                                                                                                   |                                                                                             |
| 05    | Create new TODO, step #1                                                                                                         | ![Yoltra frame 05](./public/assets/profiler/yoltra/profiler-yoltra-frame-05.2025-10-20-22-51-21.png) | ![RTK frame 05](./public/assets/profiler/rtk/profiler-rtk-frame-05.2025-10-20-22-38-17.png) |
|       | In TODO factory, the todo name (test) is pasted into the 'title' field. Both libraries re-render TODO factory only.              |                                                                                                   |                                                                                             |
| 06    | Create new TODO, step #2                                                                                                         | ![Yoltra frame 06](./public/assets/profiler/yoltra/profiler-yoltra-frame-06.2025-10-20-22-52-03.png) | ![RTK frame 06](./public/assets/profiler/rtk/profiler-rtk-frame-06.2025-10-20-22-38-49.png) |
|       | In TODO factory, the todo category (test) is pasted into the 'catgegory' field. Both libraries re-render TODO factory only.      |                                                                                                   |                                                                                             |
| 07    | Create new TODO, step #3                                                                                                         | ![Yoltra frame 07](./public/assets/profiler/yoltra/profiler-yoltra-frame-07.2025-10-20-22-52-20.png) | ![RTK frame 07](./public/assets/profiler/rtk/profiler-rtk-frame-07.2025-10-20-22-40-00.png) |
|       | The 'Add' button was clicked and the TODO is added to the list. Both libraries re-render the whole list + filters + todo factor. |                                                                                                   |                                                                                             |
| 08    | TODO with key `1` is toggled. Automatic update.                                                                                  | ![Yoltra frame 08](./public/assets/profiler/yoltra/profiler-yoltra-frame-08.2025-10-20-22-52-40.png) | ![RTK frame 08](./public/assets/profiler/rtk/profiler-rtk-frame-08.2025-10-20-22-40-23.png) |
|       |                                                                                                                                  | Yoltra re-renders the specific TODO only                                                          | RTK re-renders the whole TODO list                                                          |
| 09    | TODO with key `2` is toggled. Automatic update.                                                                                  | ![Yoltra frame 09](./public/assets/profiler/yoltra/profiler-yoltra-frame-09.2025-10-20-22-53-09.png) | ![RTK frame 09](./public/assets/profiler/rtk/profiler-rtk-frame-09.2025-10-20-22-40-48.png) |
|       |                                                                                                                                  | Yoltra re-renders the specific TODO only                                                          | RTK re-renders the whole TODO list                                                          |
| 10    | TODO with key `3` is toggled. Automatic update.                                                                                  | ![Yoltra frame 10](./public/assets/profiler/yoltra/profiler-yoltra-frame-10.2025-10-20-22-53-32.png) | ![RTK frame 10](./public/assets/profiler/rtk/profiler-rtk-frame-10.2025-10-20-22-41-14.png) |
|       |                                                                                                                                  | Yoltra re-renders the specific TODO only                                                          | RTK re-renders the whole TODO list                                                          |
| 11    | TODO with key `4` is toggled. Automatic update.                                                                                  | ![Yoltra frame 11](./public/assets/profiler/yoltra/profiler-yoltra-frame-11.2025-10-20-22-54-03.png) | ![RTK frame 11](./public/assets/profiler/rtk/profiler-rtk-frame-11.2025-10-20-22-41-46.png) |
|       |                                                                                                                                  | Yoltra re-renders the specific TODO only                                                          | RTK re-renders the whole TODO list                                                          |
| 12    | TODO with key `5` is toggled. Automatic update.                                                                                  | ![Yoltra frame 12](./public/assets/profiler/yoltra/profiler-yoltra-frame-12.2025-10-20-22-54-27.png) | ![RTK frame 12](./public/assets/profiler/rtk/profiler-rtk-frame-12.2025-10-20-22-42-43.png) |
|       |                                                                                                                                  | Yoltra re-renders the specific TODO only                                                          | RTK re-renders the whole TODO list                                                          |
| 13    | TODO with key `6` is toggled. Automatic update.                                                                                  | ![Yoltra frame 13](./public/assets/profiler/yoltra/profiler-yoltra-frame-13.2025-10-20-22-54-47.png) | ![RTK frame 13](./public/assets/profiler/rtk/profiler-rtk-frame-13.2025-10-20-22-43-10.png) |
|       |                                                                                                                                  | Yoltra re-renders the specific TODO only                                                          | RTK re-renders the whole TODO list                                                          |
| 14    | TODO with key `7` is toggled. Automatic update.                                                                                  | ![Yoltra frame 14](./public/assets/profiler/yoltra/profiler-yoltra-frame-14.2025-10-20-22-55-10.png) | ![RTK frame 14](./public/assets/profiler/rtk/profiler-rtk-frame-14.2025-10-20-22-43-32.png) |
|       |                                                                                                                                  | Yoltra re-renders the specific TODO only                                                          | RTK re-renders the whole TODO list                                                          |
| 15    | TODO with key `8` is toggled. Automatic update.                                                                                  | ![Yoltra frame 15](./public/assets/profiler/yoltra/profiler-yoltra-frame-15.2025-10-20-22-55-33.png) | ![RTK frame 15](./public/assets/profiler/rtk/profiler-rtk-frame-15.2025-10-20-22-44-12.png) |
|       |                                                                                                                                  | Yoltra re-renders the specific TODO only                                                          | RTK re-renders the whole TODO list                                                          |
| 16    | TODO with key `9` is toggled. Automatic update.                                                                                  | ![Yoltra frame 16](./public/assets/profiler/yoltra/profiler-yoltra-frame-16.2025-10-20-22-55-59.png) | ![RTK frame 16](./public/assets/profiler/rtk/profiler-rtk-frame-16.2025-10-20-22-44-33.png) |
|       |                                                                                                                                  | Yoltra re-renders the specific TODO only                                                          | RTK re-renders the whole TODO list                                                          |
| 17    | TODO with key `10` is toggled. Automatic update.                                                                                 | ![Yoltra frame 17](./public/assets/profiler/yoltra/profiler-yoltra-frame-17.2025-10-20-22-56-20.png) | ![RTK frame 17](./public/assets/profiler/rtk/profiler-rtk-frame-17.2025-10-20-22-44-53.png) |
|       |                                                                                                                                  | Yoltra re-renders the specific TODO only                                                          | RTK re-renders the whole TODO list                                                          |
| 18    | TODO with key `11` is toggled. Automatic update.                                                                                 | ![Yoltra frame 18](./public/assets/profiler/yoltra/profiler-yoltra-frame-18.2025-10-20-22-56-44.png) | ![RTK frame 18](./public/assets/profiler/rtk/profiler-rtk-frame-18.2025-10-20-22-45-22.png) |
|       |                                                                                                                                  | Yoltra re-renders the specific TODO only                                                          | RTK re-renders the whole TODO list                                                          |
| 19    | TODO with key `12` is toggled. (creada en el frame #7). Automatic update.                                                        | ![Yoltra frame 19](./public/assets/profiler/yoltra/profiler-yoltra-frame-19.2025-10-20-22-57-05.png) | ![RTK frame 19](./public/assets/profiler/rtk/profiler-rtk-frame-19.2025-10-20-22-45-51.png) |
|       | Profiler report (JSON)                                                                                                           | [Yoltra](./public/assets/profiler/yoltra/profiling-data.yoltra.10-20-2025.22-30-26.json)          | [RTK](./public/assets/profiler/rtk/profiling-data.rtk.10-20-2025.22-32-54.json)             |

## Key Observations

In RTK's implementation, toggling each todo (12 in total) caused the other 11 to re-render,
giving a total of 12 re-renders per toggled todo item. That is 144 re-renders in total! 132
unnecessary re-renders.

1. **Atomic subscriptions (Yoltra) vs Selector factories (RTK).**
   - **Yoltra**: Direct path (`todo.data.4.status`) → one component.
   - RTK: Needs `createSelector` + memoization; easy to get wrong, easy to wake the list.

2. **Wildcard aggregation.**
   - **Yoltra**: `todo.filter.*` updates filters automatically.
   - RTK: Must hand-roll per-row selectors; default approach causes whole list churn.

3. **Async effects.**
   - **Yoltra**: Built-in cancel/delay semantics.
   - RTK: Must wire custom middleware or thunk chains; no natural cancellation.

4. **Profiler outcome.**
   - **Yoltra** flamegraphs: flat, predictable, bounded updates.
   - RTK flamegraphs: broad re-renders, inconsistent commit sizes, higher CPU cost.

## Why This Matters

For small apps, both look “fast enough.”

At scale:

- **Yoltra scales linearly** with the number of affected items.
- **RTK scales superlinearly** unless you invest heavily in selector discipline.

This demo illustrates **why Yoltra exists**: to give atomic property subscriptions, async-first
effects, and wildcard aggregation **without developer ceremony**.
