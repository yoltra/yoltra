![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Actualizar a 0.10.0

> 👉 🇲🇽 Versión en Español&nbsp; | &nbsp;[ 🇺🇸 English Version](../en/UPGRADE_0.10.md)

Un cambio puede aparecer al arrancar: un reducer o un efecto con un matcher que nunca podría
coincidir ahora lanza al registrarse. Lee esa sección primero. Lo demás es un aviso que ahora nombra
su store, dos arreglos de tipos, los typed arrays que ahora cambian como un solo valor y una opción
nueva en `store.call()`. La mayoría de las aplicaciones
no necesitan cambiar código.

Antes de 1.0, así que es un incremento MINOR según [la política del repositorio](../CONTRIBUTING.md).

---

## Un reducer o un efecto con `channelPattern` ahora lanza

**Lo notarás si:** registras un reducer o un efecto con `when: { channelPattern }`, o con un `when`
que no tiene ninguna de las cinco formas. `createStore`, `registerReducer`, `registerSlice`,
`registerEffect`, `replaceReducers`, `replaceEffects` y `hotReplace` lanzan un `Error` que nombra
el registro. TypeScript lo reporta antes: `ReducerSpec.when` y `EffectSpec.when` ahora tienen el
tipo `ExactWhen`.

Solo el middleware ha respetado `channelPattern`. En un reducer o un efecto se aceptaba sin aviso
y **no manejaba nada**: el reducer nunca se ejecutaba, así que su slice se quedaba en su estado
inicial, y el efecto ni siquiera se reportaba a `onRegistrationChange`. Si tu código registraba
uno, nunca funcionó, y esta versión lo hace visible.

Los reducers siguen siendo exactos a propósito. Su conjunto de entrada tiene que seguir cerrado,
para que reproducir un log con el mismo código pliegue los mismos eventos sin importar lo que una
decoración agregue después. Los efectos de un evento se ejecutan en secuencia, y un patrón
enrolaría a un efecto en la cadena de cada canal que coincidiera.

```ts
// Antes: se aceptaba, y el reducer nunca se ejecutaba.
store.registerReducer("plans", { state, when: { channelPattern: "*plan" }, reducer });

// Después: nombra los canales que pliega el slice.
store.registerReducer("plans", { state, when: { channels: ["plan", "bb::plan"] }, reducer });
```

Si los canales no se pueden nombrar de antemano, deja el patrón en un middleware, donde sí está
soportado.

**La misma verificación cubre ahora todas las costuras.** Un `when` que no es ninguna de las cinco
formas, como `{}`, `{ any: false }` o `{ keys: "plan" }`, lanza en reducers, efectos y middleware
por igual. Antes no coincidía con nada. `{ keys: [] }` y `{ channels: [] }` se siguen aceptando,
porque están bien formados y una lista puede estar vacía legítimamente.

**Una llamada rechazada no cambia nada.** Cada punto de entrada verifica el lote completo antes de
tocar el store, así que un `replaceReducers` o `hotReplace` que lanza deja instalados y
funcionando los reducers, efectos y middleware anteriores.

---

## El aviso de colisión de claves se lleva por store

**Lo notarás si:** un proceso ejecuta varios stores en desarrollo, como una suite de pruebas o un
servidor que renderiza más de uno, y dos pares `(channel, type)` de un mismo store se unen en la misma
clave interna.

El aviso se recordaba para todo el proceso. Una vez que un store había reportado una clave, un segundo
store con la misma colisión no decía nada; y dos stores que usaban cada uno *uno* de los pares, que
no pueden interferir, se reportaban como en colisión. Ahora se lleva por store y nombra el store. No
hace falta cambiar código; quizá veas un aviso que antes se suprimía, o dejes de ver uno que era
incorrecto.

---

## `replaceReducers` y `hotReplace` tipan cada slice por separado

**Lo notarás si:** llamas `replaceReducers` o `hotReplace({ reducer })` en un store con dos o más
slices, o en un store que una librería decoró.

El argumento exigía todos los nombres de slice y tipaba cada reducer con la unión de los estados de
todas las slices. Un reducer anotado no compilaba en ningún store con dos slices, un reducer de una
slice podía devolver el estado de otra, y en un store decorado la única llamada que compilaba
nombraba la slice de la librería, que el runtime rechaza. Ahora es `ReducerReplacement`: toda clave
opcional, cada una tipada con el estado de su propia slice, que es lo que el runtime hace desde
0.8.0. El código que compilaba sigue compilando, salvo que un reducer devolviera el estado de otra
slice.

`EventFromWhen` gana además su rama para `channelPattern`: resuelve a la unión completa de eventos,
que es lo que recibe un handler de middleware, en lugar de `never`.

---

## Un typed array en el estado cambia como un solo valor

**Lo notarás si:** el estado guarda un typed array, un `DataView` o un `ArrayBuffer`, y lees
`changedPaths`, `prevValues` o `nextValues` desde `store.instrument()`, o te conectas a una ruta
dentro de uno.

Los índices de un typed array son sus propias llaves, así que el detector de cambios lo recorría
como un objeto: reemplazar un `Uint8Array` de 4 bytes reportaba cuatro rutas, una por byte, y un
observador de instrumentación copiaba cada byte distinto. Ahora una vista es un solo valor en su
propia ruta, comparado por referencia, que es como ya se trataban `Map` y `Set`. Reemplazarla
reporta su ruta una vez, con la vista vieja y la nueva como valores; devolver la misma vista no es
un cambio. Una suscripción a un índice dentro de una vista, como `buf.0`, ya no se notifica;
suscríbete a la ruta de la vista.

El aviso de payload guardado por referencia también distingue los datos binarios. Una vista no se
puede congelar, así que el mensaje anterior ("it is now frozen ... will throw") era falso para ella:
nada lanza, y una escritura posterior en el buffer cambia el slice en su lugar, sin que los
suscriptores se enteren. Ahora el aviso dice eso, y también detecta un buffer conservado desde un
campo del payload, como hace `{ ...payload }`.

---

## Adiciones que podrías querer

**`ExactWhen<EM>`**, las formas de `When` que aceptan un reducer o un efecto (`When` sin
`channelPattern`). Úsalo para tipar un helper que construye specs de reducers o efectos.

**`correlation` en `store.call()`.** `"either"` (por defecto, sin cambios), `"causal"` o `"id"`.
Usa `"id"` cuando el protocolo de un `Quien Responde` lleva su propio id de petición y tiene varias
peticiones en curso en un canal: ahí, el vínculo con el padre puede apuntar a la petición
equivocada. Consulta la [guía de Petición y Respuesta](./REQUEST_REPLY_GUIDE.md).

**`ReducerReplacement<R, S, EM>`**, el argumento que toma `replaceReducers`, para tipar un handler
de HMR que construye el mapa antes de llamarlo.

**`clock` y `scheduler` en `createStore`**, con los tipos `Clock`, `Scheduler` y `TimerHandle`. El
store lee la hora y arma todos sus timers a través de ellos: las ventanas de deduplicación, la
limpieza de la caché de deduplicación y el timeout de inactividad de `store.call()`. `persist` también
toma una opción `scheduler`. Los valores por defecto se comportan como antes. Consulta
[Tiempo y timers](../../packages/core/README.es.md#tiempo-y-timers).

**`at`, `parentId` y `depth` en los eventos instrumentados.** `InstrumentedEvent.at` es la hora del
reloj a la que el store procesó el evento, y `event.parentId` y `event.depth` llevan su posición
causal, ausentes en un evento raíz como lo están en `Event`. Un observador que registra o traza
eventos ya no tiene que tomar su propia marca de tiempo ni perder la cadena. Si construyes valores
`InstrumentedEvent` tú mismo, para alimentar un observador falso en un test, agrega `at`.
