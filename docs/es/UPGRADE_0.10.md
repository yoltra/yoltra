![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Actualizar a 0.10.0

> 👉 🇲🇽 Versión en Español&nbsp; | &nbsp;[ 🇺🇸 English Version](../en/UPGRADE_0.10.md)

La mayoría de las aplicaciones no necesitan cambiar código. Un cambio puede aparecer al arrancar: un
reducer o un efecto con un matcher que nunca podría coincidir ahora lanza al registrarse. Revisa eso
primero. Antes de 1.0, así que es un incremento MINOR según [la política del repositorio](./CONTRIBUTING.md).

> **Guía completa:** [Actualizar a 0.10.0 en yoltra.dev](https://yoltra.dev/es/yoltra/releases/0.10/migration/)

## Cambios de comportamiento

- [ ] **[Un reducer o un efecto con `channelPattern` ahora lanza](https://yoltra.dev/es/yoltra/releases/0.10/migration/#un-reducer-o-un-efecto-con-channelpattern-ahora-lanza).**
  Nunca manejó nada. Nombra los canales (`when: { channels: ["plan", "bb::plan"] }`) o deja el patrón
  en un middleware. Un `when` que no es ninguna de las cinco formas (`{}`, `{ any: false }`) lanza
  ahora en todas las costuras, y un `replaceReducers` o `hotReplace` rechazado deja el store intacto.
- [ ] **[Un store liberado es inerte](https://yoltra.dev/es/yoltra/releases/0.10/migration/#un-store-liberado-es-inerte).**
  Después de `dispose()`, `emit()` se resuelve con `{ committed: false, written: false }`, `call()` se
  rechaza con `CallAbortedError("store disposed")` y los métodos de registro lanzan. Deja de usar un
  store después de liberarlo; ata los recursos al nuevo `store.signal`.
- [ ] **[La persistencia nunca escribe un estado parcial](https://yoltra.dev/es/yoltra/releases/0.10/migration/#la-persistencia-nunca-escribe-un-estado-parcial).**
  Un estado más allá de `maxNodes` (100 000 por defecto) no se escribe y `onError` recibe un
  `PersistEncodeError`. Solo se escribe después de un evento que cambió el estado.
- [ ] **[Un typed array en el estado cambia como un solo valor](https://yoltra.dev/es/yoltra/releases/0.10/migration/#un-typed-array-en-el-estado-cambia-como-un-solo-valor).**
  Suscríbete a la ruta de la vista, no a un índice dentro de ella como `buf.0`.
- [ ] **[El aviso de colisión de claves se lleva por store](https://yoltra.dev/es/yoltra/releases/0.10/migration/#el-aviso-de-colisión-de-claves-se-lleva-por-store).**
  No hace falta cambiar código; puede aparecer un aviso que antes se suprimía, y nombra el store.
- [ ] **[`replaceReducers` y `hotReplace` tipan cada slice por separado](https://yoltra.dev/es/yoltra/releases/0.10/migration/#replacereducers-y-hotreplace-tipan-cada-slice-por-separado).**
  Toda clave es opcional (`ReducerReplacement`); corrige un reducer que devolvía el estado de otra
  slice. `EventFromWhen` ahora resuelve `channelPattern` a la unión completa de eventos.

## Adiciones que podrías querer

Todas se describen en la [guía completa](https://yoltra.dev/es/yoltra/releases/0.10/migration/#adiciones-que-podrías-querer):

- `ExactWhen<EM>` y `ReducerReplacement<R, S, EM>`, para tipar builders de specs y handlers de HMR.
- `correlation` y `cancel` en `store.call()` (consulta la [guía de Petición y Respuesta](./REQUEST_REPLY_GUIDE.md)).
- `clock` y `scheduler` en `createStore`, y una opción `scheduler` en `persist`.
- `at`, `parentId` y `depth` en los eventos instrumentados.
- `diagnostics` en `createStore` y `store.onDiagnostic`; un callback de errores de handlers en `EventBus`.
- `ctx.signal` para los efectos, y `store.signal` para el store.
- Canales `ephemeral`, y `store.instrument(observer, { ephemeral })`.
- `warnOnLargeValues(store, limits?)`, una revisión de tamaños solo de desarrollo.
- `matchesWhen` y `describeWhenProblem`, para coincidir fuera del store.
- `store.instrumentEffects()`, `store.metrics()` y `store.whenIdle()`.
- La función que detiene `persist()` devuelve una promesa que se resuelve tras la última escritura.

## Más en yoltra.dev

- [Actualizar a 0.10.0](https://yoltra.dev/es/yoltra/releases/0.10/migration/), con cada cambio explicado.
- [Notas de la versión 0.10](https://yoltra.dev/es/yoltra/releases/0.10/notes/) y [novedades de 0.10](https://yoltra.dev/es/yoltra/releases/0.10/).

> **Guía completa:** [Actualizar a 0.10.0 en yoltra.dev](https://yoltra.dev/es/yoltra/releases/0.10/migration/)
