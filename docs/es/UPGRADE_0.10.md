![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Actualizar a 0.10.0

> 👉 🇲🇽 Versión en Español&nbsp; | &nbsp;[ 🇺🇸 English Version](../en/UPGRADE_0.10.md)

Qué cambió, cómo lo notarías, y qué hacer. Antes de 1.0, así que es un incremento MINOR según
[la política del repositorio](../CONTRIBUTING.md).

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

## Adiciones que podrías querer

**`ExactWhen<EM>`**, las formas de `When` que aceptan un reducer o un efecto (`When` sin
`channelPattern`). Úsalo para tipar un helper que construye specs de reducers o efectos.

**`ReducerReplacement<R, S, EM>`**, el argumento que toma `replaceReducers`, para tipar un handler
de HMR que construye el mapa antes de llamarlo.
