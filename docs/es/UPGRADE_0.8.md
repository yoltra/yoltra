![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Actualizar a 0.8.0

> 👉 🇲🇽 Versión en Español&nbsp; | &nbsp;[ 🇺🇸 English Version](../en/UPGRADE_0.8.md)

Cinco cambios de comportamiento, un riesgo si haces rollback, y algunas adiciones. La mayoría
de las aplicaciones no necesitan cambiar nada. Lee la primera sección de todos modos: es la que
puede morder en silencio.

Pre-1.0, así que esto es un bump MINOR según [la política del repositorio](../../CONTRIBUTING.md).

---

## Lee esto primero: hacer rollback pierde el estado binario

El estado persistido por 0.8.0 que contenga un `Uint8Array`, un `DataView` o un `ArrayBuffer`
lleva una etiqueta que 0.7.x no reconoce. Su decodificador devuelve `undefined` para una
etiqueta desconocida, así que **volver a la versión anterior pierde esa slice en silencio**. Sin
error y sin advertencia: la slice regresa vacía.

Esto solo importa si persistes datos binarios y luego despliegas una build anterior.

```ts
// Sube la versión de esquema antes de publicar 0.8.0, para que una build anterior
// descarte el payload en lugar de leerlo a medias.
persist(store, { key: "app", adapter, version: 4 /* antes 3 */ });
```

---

## `replace*` ya no elimina lo que registró una librería

**Lo notarás si:** llamas a `replaceReducers`, `replaceMiddleware`, `replaceEffects` o
`hotReplace`, *y* algo se registra en el store después de la construcción.

Un reducer, middleware o efecto agregado con `registerReducer`, `registerMiddleware` o
`registerEffect` ahora sobrevive a una llamada a `replace*`, junto con su estado. Esos registros
nunca formaron parte del conjunto que estás reemplazando.

Esto arregla mucho más de lo que cambia. La línea de HMR que la propia documentación del core
recomendaba borraba la slice de una librería **y su estado** al primer guardado de archivo, y
convertía en silencio los disposers de `registerMiddleware` en operaciones vacías.

```ts
// El comportamiento anterior, si de verdad lo quieres:
store.replaceReducers(next, { scope: "all" });
store.hotReplace({ reducer: next, scope: "all" }); // se reenvía a los tres
```

**Un error nuevo.** Si tu `next` declara una slice que una librería ya montó,
`replaceReducers` ahora lanza, nombrando la slice y su dueño, antes de mutar nada. Renombra la
slice, o pasa `{ scope: "all" }` deliberadamente.

---

## El middleware solo veta con un `false` explícito

**Lo notarás si:** algún middleware tuyo devuelve `undefined`, `0`, `""`, `null` o `NaN` y
dependías de eso para bloquear el evento.

```ts
// Antes: vetaba todo lo que coincidía, en silencio.
// Ahora:  permite el evento, que es casi seguro lo que se quería.
store.registerMiddleware((state, event) => {
  log(event);          // sin return
});

// Sin cambios: un false explícito sigue vetando, y lanzar también.
store.registerMiddleware(() => false);
```

El contrato documentado siempre dijo `false`. La prueba era `!result`, así que cualquier valor
falsy vetaba, y un middleware que hacía su trabajo y terminaba sin `return` se tragaba todos los
eventos que coincidían. El síntoma era que los reducers dejaban de ejecutarse para un canal, lo
que se lee como un problema de enrutamiento.

`MiddlewareFunction` ahora devuelve `boolean | void`, así que omitir el `return` es legal.

---

## El viaje en el tiempo ya no vuelve a ejecutar tus handlers de `onEvent`

**Lo notarás si:** usas `devtools: { allowReplay: true }` *y* tienes un handler de `onEvent`
que *sí* quieres que corra durante un recorrido.

El replay llamaba a cada handler igual que un evento real, así que arrastrar la línea de tiempo
volvía a publicar a los pares, a escribir en sockets y a disparar analítica por eventos que no
estaban ocurriendo de nuevo. No había forma de detectarlo desde dentro de un handler.

```ts
// Vuelve a activarlo, para un handler que deriva estado de vista y no hace E/S.
store.onEvent("ui", "save", handler, "committed", { duringReplay: true });

// En React:
useEvent("ui", "save", handler, "committed", { duringReplay: true });

// Y para lo que deba ramificar en lugar de omitirse:
if (store.isReplaying) { /* ... */ }
```

`subscribe` y `connect` siguen disparándose, así que la interfaz continúa siguiendo el
recorrido.

---

## `useAtomicProps` rechaza una lectura no declarada

**Lo notarás si:** un selector lee estado que no declaró, y obtienes tus hooks de
`createYoltra` o `createHooks`.

```ts
// Ahora lanza en desarrollo, nombrando la ruta.
useAtomicProps([{ reducer: "user", property: "name" }], (s) => s.user.email);
```

Este guard ya existía en los hooks a nivel de paquete. Faltaba en los que entrega
`createYoltra`, que es el camino que la documentación recomienda, así que el camino recomendado
era el desprotegido. En producción esa lectura era `undefined` y el componente simplemente
dejaba de actualizarse, porque está suscrito solo a lo que declaró. Declara la ruta, o deja de
leerla.

---

## Adiciones que quizá quieras

**Saber por qué un emit no se confirmó.** `committed: false` llegaba desde tres causas
distintas a través de un mismo objeto.

```ts
const result = await store.emit("orders", "submit", order);
if (!result.committed) {
  if (result.reason === "vetoed") showError(`Bloqueado por ${result.vetoedBy ?? "un guard"}`);
  // "deduped" es un doble clic. No digas nada.
  // "cascade" significa que el evento excedió el techo de profundidad.
}
```

**Decorar un store, con tipos.** `registerSlice`, `withSlice`, `withMiddleware` y `withEffect`
devuelven el store re-tipado, así que una slice agregada en runtime es visible para `getState()`
y sus canales pasan a ser emitibles. Ve la [guía de decoración](./DECORATION_GUIDE.md).

**Observar los registros.** `store.onRegistrationChange(observer, { emitCurrent: true })` avisa
cuando el store gana o pierde un reducer, middleware o efecto.

**Un hook para errores de suscriptores.** `createStore({ onSubscriberError })` se suma a
`onEffectError`, `onReducerError`, `onRejected` y `onCascade`.

**Binario en el estado y en el almacenamiento.** Los nueve typed arrays más `DataView` y
`ArrayBuffer` viajan de ida y vuelta por persistencia y viaje en el tiempo. Además ya no lanzan
al construir el store, cosa que hacían en desarrollo porque congelar una vista es un
`TypeError`.

**Deduplicación honesta.** `dedupWindowMs` compara por contenido para payloads `Map`, `Set`,
`Date`, `BigInt`, binarios y cíclicos. Todos ellos se serializaban a `{}`, así que **payloads
distintos colisionaban y el segundo evento se descartaba en silencio.** Si usas deduplicación
por contenido, puede que ahora veas llegar eventos que antes se tragaban. Eso es el arreglo, no
una regresión.

---

## Nada que hacer para

`createStore`, `emit`, `getState`, `subscribe`, `connect`, el entity adapter, los hooks de
Suspense, `store.call`, y cada sitio de llamada existente de `registerX`. Los métodos de
registro ahora devuelven un objeto invocable en lugar de una función pelada, así que
`const off = store.registerEffect(spec); off();` compila y se ejecuta exactamente igual que
antes.

> **`store.call` no cambió en 0.8.0; no es que no exista.** Llegó en **0.6.0** con
> especificaciones de respuesta, progreso en streaming con contrapresión real, un timeout de
> inactividad en lugar de total, `AbortSignal` y `cancel()`, y nada de eso se ha movido desde
> entonces. Si te lo encuentras por primera vez al actualizar, está documentado por completo en la
> [guía de Petición y Respuesta](./REQUEST_REPLY_GUIDE.md) — esta página guarda silencio sobre él
> solo porque no hay nada que hacer.
