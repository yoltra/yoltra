![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Actualizar a 0.10.0

> 👉 🇲🇽 Versión en Español&nbsp; | &nbsp;[ 🇺🇸 English Version](../en/UPGRADE_0.10.md)

Un cambio puede aparecer al arrancar: un reducer o un efecto con un matcher que nunca podría
coincidir ahora lanza al registrarse. Lee esa sección primero. Otros tres cambian el
comportamiento en los bordes: un store liberado es inerte, la persistencia nunca escribe un estado
parcial, y un typed array en el estado cambia como un solo valor. Después vienen un aviso que ahora
nombra su store, dos arreglos de tipos, y las adiciones: tiempo y timers inyectables, una sola
costura de diagnósticos, `store.signal` y `ctx.signal`, cancelación para `store.call()`, canales
efímeros y una revisión de tamaños. La mayoría de las aplicaciones no necesitan cambiar código.

Antes de 1.0, así que es un incremento MINOR según [la política del repositorio](./CONTRIBUTING.md).

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

## Un store liberado es inerte

**Lo notarás si:** algo emite, llama o registra en un store después de `dispose()`, o una llamada
sigue esperando respuesta cuando su store se libera.

`dispose()` vaciaba los registros del store y dejaba lo demás funcionando. Un `emit` posterior
seguía ejecutando el middleware y los reducers que quedaran, un `call` pendiente esperaba hasta su
timeout de inactividad, y nada avisaba al trabajo atado al store de que ya no existía. Ahora:

- `emit()` se resuelve con `{ committed: false, written: false }` sin ejecutar nada.
- `call()` se rechaza de inmediato con `CallAbortedError("store disposed")`, y una llamada todavía
  pendiente cuando el store se libera se rechaza igual.
- `registerReducer`, `registerSlice`, `registerMiddleware`, `registerEffect`, los helpers `with*` y
  `onEffect`, `replace*` y `hotReplace` lanzan un `Error` que nombra el store.
- Un `emit` o un `call` tardío se reporta una vez por método en desarrollo, como
  `use-after-dispose`.
- `dispose()` es idempotente.

Nuevo: `store.signal`, un `AbortSignal` que se aborta al final de `dispose()`, para atar recursos a
la vida del store. Consulta [Atar recursos al store](../../packages/core/README.es.md#atar-recursos-al-store).

Un `call()` cuyo propio `signal` ya está abortado tampoco envía su petición ni arma un timer: antes
se rechazaba y la enviaba de todos modos.

---

## La persistencia nunca escribe un estado parcial

**Lo notarás si:** un estado persistido puede crecer más allá de 100 000 valores, o haces
aserciones sobre lo que recibe `onError` en la fase `"encode"`, o sobre cuántas veces se escribe un
adaptador.

`persist` codificaba el estado hasta un presupuesto de nodos y escribía lo que cupiera,
reemplazando una instantánea anterior completa por una cortada a la mitad. Esa instantánea se
hidrataba después en un estado que ningún reducer produjo. Un estado más allá del presupuesto
ahora **no se escribe**: el almacenamiento conserva su valor anterior, y `onError` recibe un
`PersistEncodeError` (nuevo) con `truncated: true` y `written: false`. El presupuesto es
`maxNodes`, nuevo en `PersistOptions`, con el valor de 100 000 que siempre tuvo. `dehydrate`
devuelve `""` en ese caso, que se hidrata como nada que restaurar.

Un valor sin representación fiel se sigue escribiendo, como antes, y ahora se reporta como un
`PersistEncodeError` con `written: true` y sus rutas en `unsupported`, en lugar de un `Error`
simple. Su mensaje sigue nombrando las rutas.

`persist` además escribe solo después de un evento que cambió el estado. Un evento vetado o
rechazado, o un reducer que devuelve su entrada, programaba antes una reescritura de lo que el
almacenamiento ya tenía.

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

**`diagnostics` en `createStore`, y `store.onDiagnostic`.** Cada fallo que el store contiene, cada
rechazo y cada aviso de desarrollo es ahora un `Diagnostic` con un `code` estable. El sink
`diagnostics` del dueño reemplaza la salida a consola; sin él, la salida a consola no cambia.
`store.onDiagnostic` permite que código conectado después, como una decoración, observe los mismos
diagnósticos sin silenciar nada. Los hooks existentes se siguen disparando. Consulta
[Errores y diagnósticos](../../packages/core/README.es.md#errores-y-diagnósticos).

`EventBus` y `LooseEventBus` aceptan un callback opcional para errores de handlers en su
constructor. Usa la consola por defecto, como antes.

**`ctx` para los efectos, con `ctx.signal`.** Un efecto recibe un cuarto argumento, un
`EffectContext` (nuevo), cuyo `signal` se aborta cuando el efecto deja de estar registrado: corre
su disposer, `replaceEffects` o `hotReplace` lo quitan, o el store se libera. Los handlers de
`onEffect` lo reciben como quinto argumento. Los efectos escritos con tres parámetros no se ven
afectados. Si llamas un `EffectFunction` tú mismo, en un test, pásale un contexto:
`{ signal: new AbortController().signal }`.

**`cancel` en `store.call()`**, con los tipos `CallCancellation` y `CancelKey`. Nombra un evento y
la llamada lo emite, con el id de la petición y la razón, cuando se cancela, se aborta o expira,
para que `Quien Responde` pueda dejar de trabajar. Consulta la
[guía de Petición y Respuesta](./REQUEST_REPLY_GUIDE.md#avisarle-a-quien-responde-que-te-rendiste).

**Canales `ephemeral`, y `store.instrument(observer, { ephemeral })`.** Los eventos de un canal
efímero se manejan como siempre pero llegan solo a los observadores de instrumentación que se
suscriben a ellos, y el replay los omite. Los agentes de devtools no se suscriben; `persist` sí.
[Tráfico que no es historia](../../packages/core/README.es.md#tráfico-que-no-es-historia) y
[Valores que cambian muchas veces por segundo](../../packages/core/README.es.md#valores-que-cambian-muchas-veces-por-segundo)
en el README describen el patrón para valores de alta frecuencia. Un `PersistableStore` que
implementes tú mismo debe aceptar el nuevo segundo argumento opcional de `instrument`.

**`warnOnLargeValues(store, limits?)`**, una revisión solo de desarrollo para payloads y slices que
crecieron demasiado, como un import aparte. Consulta
[Valores que crecieron demasiado](../../packages/core/README.es.md#valores-que-crecieron-demasiado).

**`matchesWhen` y `describeWhenProblem`**, el matcher y el validador del propio store, con el tipo
`WhenConsumer`, para código que filtra eventos con un `When` fuera del store. Consulta
[Coincidir fuera del store](../../packages/core/README.es.md#coincidir-fuera-del-store).

**`store.instrumentEffects(observer, options?)`**, con los tipos `InstrumentedEffects`,
`InstrumentedEffect` y `EffectsObserver`: cuando todos los efectos de un evento terminaron, el
nombre, el origen, la duración de cada efecto y si falló. Consulta
[Observar la fase de efectos](../../packages/core/README.es.md#observar-la-fase-de-efectos).
