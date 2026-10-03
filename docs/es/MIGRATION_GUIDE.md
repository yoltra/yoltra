![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Guía de Migración

> [🇺🇸 English](../en/MIGRATION_GUIDE.md) &nbsp;|&nbsp; 👉 Español

¿Vienes de Redux, Zustand o Jotai? Esta guía mapea los conceptos que ya conoces a Yoltra y muestra
un antes/después; la guía completa trae la traducción para cada librería.

> **Guía completa:** [Migración en yoltra.dev](https://yoltra.dev/es/yoltra/docs/migration/)

## El único cambio de mentalidad

Yoltra es **event-sourced**. No haces `set` del estado directamente: **emites un evento**
`(channel, type, payload)`, y un **reducer puro** calcula el siguiente estado. Las lecturas son
**suscripciones a rutas de grano fino**: un componente se re-renderiza solo cuando cambia la hoja
exacta que lee. El trabajo asíncrono vive en los **effects**.

```tsx
emit("todos", "add", { title: "Comprar leche" }); // 1. emite un evento
// 2. un reducer calcula el siguiente estado (de forma síncrona)
const title = useAtomicProp({ reducer: "todos", property: "items.0.title" }); // 3. lee una ruta
```

## Mapa de conceptos

| Concepto            | Redux / RTK              | Zustand            | Jotai              | Yoltra                                    |
| ------------------- | ------------------------ | ------------------ | ------------------ | ----------------------------------------- |
| Definir estado      | `createSlice`            | `create(set => …)` | `atom(inicial)`    | slice de reducer en `createYoltra`        |
| Cambiar estado      | `dispatch(action)`       | `set(...)`         | `set(atom, v)`     | `emit(channel, type, payload)`            |
| Lógica de update    | reducer (switch)         | inline en `set`    | write atom         | reducer (puro `(state, event) => next`)   |
| Leer estado         | `useSelector`            | `useStore(sel)`    | `useAtomVal(atom)` | `useAtomicProp` (grano fino)              |
| Valor derivado      | `reselect`               | selector fn        | `atom` derivado    | `useAtomicProps(specs, selector)`         |
| Async / efectos     | thunk / RTK Query / saga | dentro de acciones | `atomWith...`      | **effect** (`effects: [...]`)             |
| Interceptar / guard | middleware               | (manual)           | (manual)           | **middleware** (síncrono, puede rechazar) |
| Provider            | requerido                | no necesario       | requerido          | opcional (los hooks usan el store)        |

## Desde Redux / Redux Toolkit

**Mapeo:** `action → event`, `dispatch → emit`, `slice reducer → reducer`,
`useSelector → useAtomicProp`, `thunk / RTK Query → effect`,
`middleware → middleware (síncrono) o effect (async)`.

```tsx
// Redux
const value = useSelector((s: RootState) => s.counter.value);
const dispatch = useDispatch();
dispatch(increment(1));
```

```tsx
// Yoltra: se re-renderiza solo cuando counter.value cambia; sin memo, sin reselect
const value = useAtomicProp({ reducer: "counter", property: "value" });
const emit = useEmit();
emit("counter", "increment", 1);
```

Los thunks se vuelven **effects**, que corren después del reducer y emiten eventos de seguimiento.
RTK Query no tiene equivalente, porque es una capa de fetching de datos: consérvalo (con su store de
Redux) o usa TanStack Query junto a Yoltra. El middleware de Yoltra es **síncrono**, y solo un
`false` explícito rechaza un evento, que se vuelve un evento "uncommitted" al que tu UI puede reaccionar.

## Más en yoltra.dev

- [Redux completo](https://yoltra.dev/es/yoltra/docs/migration/#desde-redux--redux-toolkit): store y slice, [thunks a effects](https://yoltra.dev/es/yoltra/docs/migration/#thunks--effects), [RTK Query](https://yoltra.dev/es/yoltra/docs/migration/#rtk-query--nada-y-esa-es-la-respuesta-honesta), [middleware](https://yoltra.dev/es/yoltra/docs/migration/#middleware).
- [Desde Zustand](https://yoltra.dev/es/yoltra/docs/migration/#desde-zustand): `create(set => …) → createYoltra`, `set(...) → emit + reducer`, `useStore(selector) → useAtomicProp`.
- [Desde Jotai](https://yoltra.dev/es/yoltra/docs/migration/#desde-jotai): un `atom` es una **ruta** en un slice; los átomos derivados se vuelven `useAtomicProps(specs, selector)`; `useSetAtom → useEmit`.
- [Adoptarlo junto a lo que ya tienes](https://yoltra.dev/es/yoltra/docs/migration/#adoptarlo-junto-a-lo-que-ya-tienes): dos stores en una app, mueve un slice acotado entero, conecta en una sola dirección con un effect.
- [Persistencia: reemplazar redux-persist](https://yoltra.dev/es/yoltra/docs/migration/#persistencia-reemplazar-redux-persist): `hydrate` y `persist`; el store nace hidratado, una versión distinta requiere `migrate`, nada lanza al arrancar.
- [Detalles y FAQ](https://yoltra.dev/es/yoltra/docs/migration/#detalles-y-faq): no hay `setState` por diseño, los reducers son puros, `getState()` es correcto justo después de `emit()`, el Provider es opcional, los channels dan namespace por dominio.

## Siguientes pasos

- [Guía de Inicio Rápido](./QUICK_START_GUIDE.md): de la instalación a una app funcionando en tres pasos
- [Guía de Testing](./TESTING_GUIDE.md): prueba stores, effects y componentes
- [`yoltra-in-react`](../../examples/v0/yoltra-in-react): la misma app en Redux y en Yoltra, lado a lado
- [API de @yoltra/core](../../packages/core/README.es.md) · [API de @yoltra/react](../../packages/react/README.es.md)
- [Comparación de Librerías](./design/state-management-library-comparison.md): las compensaciones arquitectónicas

> **Guía completa:** [Migración en yoltra.dev](https://yoltra.dev/es/yoltra/docs/migration/)
