![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Actualizar a 0.8.0

> 👉 🇲🇽 Versión en Español&nbsp; | &nbsp;[ 🇺🇸 English Version](../en/UPGRADE_0.8.md)

Cinco cambios de comportamiento, un riesgo si haces rollback, y algunas adiciones. La mayoría de las
aplicaciones no necesitan cambiar nada. Pre-1.0, así que esto es un bump MINOR según [la política del repositorio](../../CONTRIBUTING.md).

> **Guía completa:** [Actualizar a 0.8.0 en yoltra.dev](https://yoltra.dev/es/yoltra/releases/0.8/migration/)

## Cambios de comportamiento

- [ ] **[Lee esto primero: hacer rollback pierde el estado binario](https://yoltra.dev/es/yoltra/releases/0.8/migration/#lee-esto-primero-hacer-rollback-pierde-el-estado-binario).**
  Si persistes datos binarios, sube la `version` de esquema de `persist` antes de publicar 0.8.0.
- [ ] **[`replace*` ya no elimina lo que registró una librería](https://yoltra.dev/es/yoltra/releases/0.8/migration/#replace-ya-no-elimina-lo-que-registró-una-librería).**
  Pasa `{ scope: "all" }` para el comportamiento anterior; declarar una slice que una librería montó ahora lanza.
- [ ] **[El middleware solo veta con un `false` explícito](https://yoltra.dev/es/yoltra/releases/0.8/migration/#el-middleware-solo-veta-con-un-false-explícito).**
  Un middleware que devuelve `undefined` u otro valor falsy ahora permite el evento.
- [ ] **[El viaje en el tiempo ya no vuelve a ejecutar tus handlers de `onEvent`](https://yoltra.dev/es/yoltra/releases/0.8/migration/#el-viaje-en-el-tiempo-ya-no-vuelve-a-ejecutar-tus-handlers-de-onevent).**
  Vuelve a activarlo con `{ duringReplay: true }`, o ramifica según `store.isReplaying`.
- [ ] **[`useAtomicProps` rechaza una lectura no declarada](https://yoltra.dev/es/yoltra/releases/0.8/migration/#useatomicprops-rechaza-una-lectura-no-declarada).**
  Los hooks de `createYoltra` o `createHooks` lanzan en desarrollo; declara la ruta que lees.

## Adiciones que quizá quieras

[Completas en yoltra.dev](https://yoltra.dev/es/yoltra/releases/0.8/migration/#adiciones-que-quizá-quieras):
`reason` y `vetoedBy` en `EmitResult`; decoración tipada con `registerSlice` y `with*` (ve la
[guía de decoración](./DECORATION_GUIDE.md)); `store.onRegistrationChange`; `onSubscriberError`;
typed arrays, `DataView` y `ArrayBuffer` en el estado y el almacenamiento; deduplicación por
contenido que compara bien payloads `Map`, `Set`, `Date`, `BigInt`, binarios y cíclicos.

## Nada que hacer para

`createStore`, `emit`, `getState`, `subscribe`, `connect`, el entity adapter, los hooks de Suspense,
`store.call` (ve la [guía de Petición y Respuesta](./REQUEST_REPLY_GUIDE.md)) y cada sitio de llamada
existente de `registerX`. [Más](https://yoltra.dev/es/yoltra/releases/0.8/migration/#nada-que-hacer-para).

> **Guía completa:** [Actualizar a 0.8.0 en yoltra.dev](https://yoltra.dev/es/yoltra/releases/0.8/migration/)
