![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Decorar un store

> 👉 🇲🇽 Versión en Español&nbsp; | &nbsp;[ 🇺🇸 English Version](../en/DECORATION_GUIDE.md)

Un store lo crea una aplicación. Una capacidad a menudo la escribe alguien más: una
transferencia de archivos, una tubería de telemetría, una sesión de medios. Esa librería
necesita agregar una slice, vetar algunos eventos y reaccionar a otros, sobre un store que no
creó y cuya definición no puede cambiar.

Yoltra ya tenía esas costuras. Lo que no tenía eran tipos que sobrevivieran a usarlas, ni la
garantía de que una recarga en caliente no deshiciera todo en silencio.

---

## La forma del problema

Antes de 0.8.0, decorar un store se veía así:

```typescript
// Ya no escribas esto.
store.registerReducer("transfers", transfersSpec as any);
store.registerMiddleware(guard as any);
```

Dos casts, y un tercero en cada lugar donde la aplicación tocara después la slice, porque
`registerReducer` recibía un `string` y no devolvía más que un disposer. Nada aguas abajo
sabía que `transfers` existía, qué forma tenía, ni a qué canales respondía.

0.8.0 eliminó el cast del middleware y casi todo lo demás. `registerReducer` conservó su cast
durante 0.8.x: estaba tipado contra el mapa de eventos del propio store, así que un spec que
nombraba un canal que la aplicación nunca había visto no podía pasar el chequeo de tipos. Desde
0.9.0 es genérico sobre su spec, como `registerSlice`, y devuelve el mismo `{ store, dispose }`. La
clase `Store` exportada ahora tiene las mismas firmas de decoración que `StoreInstance`, así que el
código tipado contra la clase también decora sin cast.

Y entonces la persona guardaba un archivo:

```typescript
if (import.meta.hot) {
  import.meta.hot.accept("./reducers", (mod) => {
    store.replaceReducers(mod.reducers, { preserveState: true });
  });
}
```

Esa línea, que la propia documentación del core recomendaba, borraba la slice de la librería
**y su estado**. Sin error y sin advertencia. La capacidad funcionaba hasta la primera recarga.

---

## Declarar lo que aporta una decoración

Empieza por los builders de spec. Existen por una razón que vale la pena entender, porque
explica la forma completa de la API.

El `when` de un spec lleva *cadenas* de canal y tipo:

```typescript
when: { keys: [["transfer", "granted"]] }
```

Cadenas, sin tipos de payload. Ahí no hay nada de lo que inferir un mapa de eventos. Y
TypeScript no tiene inferencia parcial de argumentos de tipo, así que un hipotético
`registerSlice<Nombre, Estado, MapaDeEventos>` te obligaría a escribir a mano el nombre y el
tipo de estado cada vez que quisieras nombrar el mapa de eventos.

`defineSlice` coloca el mapa de eventos en posición de **valor**, donde la inferencia sí
funciona:

```typescript
import { defineSlice } from "@yoltra/core";

type TransferEM = {
  transfer: { granted: { id: string }; revoked: { id: string } };
};

export const transfers = defineSlice<TransferEM>()({
  state: { granted: [] as string[] },
  when: { keys: [["transfer", "granted"]] },
  reducer: (s, e) => (e.type === "granted" ? { granted: [...s.granted, e.payload.id] } : s),
});
```

Se nombra una vez. Cada sitio de registro infiere de ahí, sin argumento de tipo y sin cast.

`defineMiddleware` y `defineEffect` hacen lo mismo. **Una consecuencia conviene conocerla
antes de que te sorprenda: una función de middleware sin spec nunca puede ampliar el mapa de
eventos.**

```typescript
// Se registra bien. No aporta canales, y no puede.
store.withMiddleware((state, event) => true);

// Aporta sus canales.
store.withMiddleware(defineMiddleware<TransferEM>()({
  when: { channel: "transfer" },
  middleware: () => true,
}));
```

El parámetro de evento de `MiddlewareFunction` es `EventUnion<EM>`, un tipo mapeado del que no
se puede inferir nada de vuelta. Solo la forma de spec lleva el mapa.

---

## Hacer crecer el tipo del store

```typescript
const app = store.withSlice("transfers", transfers, { owner: "@scope/transfers" });

app.getState().transfers.granted;               // string[]
app.emit("transfer", "granted", { id: "a1" });  // el canal nuevo ya es emitible
```

`withSlice`, `withMiddleware` y `withEffect` devuelven el store con sus tipos ampliados, así
que las llamadas se encadenan:

```typescript
const app = store
  .withSlice("transfers", transfers)
  .withMiddleware(quota)
  .withEffect(uploader);
```

**Es el mismo objeto.** Decorar es una operación a nivel de tipos: nada se vuelve a suscribir,
ningún estado se mueve, la caché de deduplicación queda intacta y una `store.call()` en vuelo
continúa. Solo cambia el tipo.

```typescript
store.withSlice("transfers", transfers) === store; // true
```

---

## Publicar un decorador

Una librería exporta una función que recibe un store y devuelve otro:

```typescript
import type { EventMapBase, StoreInstance } from "@yoltra/core";

export function withTransfers<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase,
>(store: StoreInstance<R, S, EM>, config: TransfersConfig) {
  return store.withSlice("transfers", transfers, { owner: "@scope/transfers" });
}
```

Genérica sobre el store que entra, que es la parte que importa. `R`, `S` y `EM` son sitios de
inferencia, así que toman lo que quien llama realmente tiene, y los decoradores se componen
anidándose en cualquier orden:

```typescript
const decorated = withTransfers(withTelemetry(store, tConfig), config);
// o
const decorated = withTelemetry(withTransfers(store, config), tConfig);
```

Ambos llegan al mismo tipo. Un decorador que solo agrega eventos, envolviendo a uno que además
agrega una slice, infiere los valores ya ampliados y los deja pasar.

`withDevtools(store, config)` es el caso degenerado de este contrato: no agrega nada y
devuelve el store tal cual.

### No hay `pipe`

Se consideró y se descartó. Todo decorador recibe `(store, config)`, así que cada paso de un
pipe necesita una lambda para volverse unario:

```typescript
pipe(store, s => withA(s, cfgA), s => withB(s, cfgB))  // más largo
withB(withA(store, cfgA), cfgB)                        // más corto
```

Un pipe solo compensa con decoradores *currificados*, lo que sería una convención distinta de
la que `withDevtools` ya estableció, y cada capa genérica extra es otro lugar donde la
inferencia puede degradarse. Si anidar cuatro niveles llega a ser común, un pipe es puramente
aditivo y puede llegar entonces.

### Requerir otra decoración

Restringe la entrada. Sin registro y sin tabla de orden:

```typescript
export function withAudit<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase & TransferEM,   // ← la dependencia
>(store: StoreInstance<R, S, EM>) {
  return store.withEffect(auditor);
}
```

Aplicada a un store sin decorar, falla en el sitio de la llamada y nombra los canales que
faltan. Sigue componiendo, porque TypeScript infiere `EM` del argumento y *después* verifica
la restricción.

Para una dependencia que no deja rastro en los tipos, una decoración que se engancha con
`onEvent` y no agrega canales, verifica en tiempo de ejecución:

```typescript
store.onRegistrationChange(
  (changes) => {
    /* reacciona, o lanza nombrando lo que falta */
  },
  { emitCurrent: true },
);
```

---

### Cuando el decorador es dueño de algo que el store no debe guardar

Todo lo anterior asume que el único producto de un decorador es el store. A veces no lo es. Una
decoración que es dueña de un ciclo de vida, de una conexión o de una credencial necesita una forma
de devolverla, y no debe dejarla en el estado reducido: el estado se fotografía, se congela, se
difunde y se envía a un panel de devtools, así que un token en una slice es un token en una
transcripción.

Tres librerías independientes de este ecosistema chocaron con el mismo muro — una necesitaba
`drain()` como llamada de primera clase para que un despliegue progresivo pueda anunciar su salida
y vaciar la cola *sin* desmontar el store, otra necesitaba `suspend()`/`resume()`/`reattach()` en un
handle vivo, otra introspección de su cola. Las tres devolvieron un par:

```typescript
export function withMesh<R extends string, S extends Record<R, any>, EM extends EventMapBase>(
  store: StoreInstance<R, S, EM>,
  config: MeshConfig,
) {
  const grown = store.withSlice("mesh", meshSlice).withMiddleware(meshGuard);
  const handle: MeshHandle = { drain, announce, close };
  return { store: grown, handle };
}
```

**Conviene ser claro sobre lo que eso cuesta.** `StoreDecorator<D>` devuelve `Decorated<…>`, que es
un store y nada más, así que un par no es un `StoreDecorator` y se pierden las dos propiedades sobre
las que está construida esta guía:

- **El anidamiento.** `withB(withA(store))` ya no compila, porque el parámetro de la llamada externa
  es un store. Quien llama desestructura:
  `const { store: s1, handle } = withMesh(store); const s2 = withLog(s1);`
  Como explica `No hay pipe`, el anidamiento es el único mecanismo de composición, así que perderlo
  significa componer a mano.
- **La dependencia por restricción.** El truco `EM extends EventMapBase & RequiredEM` de arriba
  funciona porque el argumento *es* un store. Contra un par hay que replantear la restricción sobre
  `typeof pair.store`, que es más maquinaria de la que vale.

El ensanchamiento en sí sobrevive: `.store` lleva el tipo crecido, así que una cadena sigue
funcionando si cada paso se enhebra a mano.

Si puedes evitarlo, evítalo. Un decorador que solo necesita limpiar debería devolver el store y
mantener su disposer privado, como describe `Disposición, y lo único que los tipos no pueden
expresar`. Recurre a un handle cuando lo que devuelves genuinamente no es el store — y cuando lo
hagas, devuelve `{ store, handle }` en lugar de un handle con `.store`, para que el store siga
siendo lo obvio que pasar adelante.

---

## Sobrevivir a una recarga en caliente

`replace*` reemplaza **lo que escribió la aplicación**. Todo lo registrado después de la
construcción sobrevive, junto con su estado:

```typescript
store.registerSlice("transfers", transfers);   // la slice de una librería
store.replaceReducers(appReducers);            // la recarga de la app
store.getState().transfers;                    // sigue ahí
```

No lo declaras tú ni lo declara la librería. La procedencia se registra internamente, porque
la corrección no debe depender de que alguien recuerde pasar una cadena.

De ahí se siguen cuatro detalles:

- **`{ scope: "all" }`** restaura exactamente el comportamiento previo a 0.8.0, para un arnés
  de pruebas que reinicia un store entre casos. `hotReplace` lo reenvía a los tres.
- **Una colisión lanza.** Si la aplicación declara una slice que una librería ya montó,
  obtienes un error que nombra la slice y su dueño, lanzado antes de mutar nada. Una
  apropiación silenciosa dejaría a la librería con un disposer de algo que ya no es suyo.
- **Una línea de debug** dice qué se preservó, en desarrollo, para que "por qué sigue
  disparándose ese efecto tras la recarga" tenga respuesta.
- **Los tipos coinciden.** Desde 0.10.0 `replaceReducers` y `hotReplace({ reducer })` toman un
  `ReducerReplacement`: cada slice es opcional y se tipa con el estado de su propia slice. Omitir
  la slice de la librería compila, que es la llamada que espera el runtime.

---

## React

```typescript
// state/yoltra.ts - ámbito de módulo, una sola vez.
export const app = createYoltra({ name: "App", reducer: { counter } })
  .withSlice("transfers", transfers);

export const { useAtomicProp, useEmit, useEvent } = app;
```

`useAtomicProp({ reducer: "transfers", property: "granted" })` queda tipado, sobre una slice
que la aplicación nunca declaró.

Tres cosas que conviene saber:

- **Ámbito de módulo, una vez, antes del primer render.** Cada `with*` construye un conjunto
  nuevo de hooks, porque `createHooks` asigna funciones nuevas. Llamarlo dentro de un
  componente le daría a React un `useAtomicProp` distinto en cada render.
- **Los providers son intercambiables.** El objeto de contexto se re-tipa, nunca se recrea,
  así que un `<StoreProvider>` de cualquier vista de la cadena sirve a los hooks de todas las
  demás. La caché de Suspense se comparte por lo mismo: se indexa por identidad del store.
- **Existen las funciones libres** para una librería que recibe un `Yoltra` que no creó:
  `withSlice(yoltra, name, spec)`.

---

## Apuntar a un canal que no puedes nombrar por adelantado

`when` compara de forma exacta: `{ channel: "plan" }` coincide con `plan` y con nada más. Eso es un
problema para un guard cuyos canales llegan con namespace — el `bb::plan` de un par federado junto a
un `plan` local — porque los alias los inventa quien federa, así que ninguna lista se puede escribir
por adelantado.

`channelPattern` existe para eso, donde `*` representa cero o más caracteres. `*` es el único
metacarácter; todo lo demás en el patrón es literal, así que `"*::plan"` cubre solo las formas con
namespace, y ningún patrón puede convertirse en una expresión que haga backtracking. Sigue siendo una
cadena y no un predicado porque un matcher se reporta a los observadores y viaja hasta un panel de
devtools, donde una función sería opaca. Además no tiene tipos por construcción: existe para
coincidir con canales que el mapa de eventos no nombra.

```typescript
export const rateGuard: MiddlewareSpec<S, EM> = {
  when: { channelPattern: "*plan" },   // `plan` y `bb::plan`
  middleware: (state, event) => withinBudget(event.channel),
};
```

**Solo para middleware.** Los reducers y los efectos toman las cuatro formas exactas, tipadas como
`ExactWhen`, y desde 0.10.0 registrar cualquiera de ellos con un `channelPattern` lanza un error que
lo nombra. Antes se aceptaba y no manejaba nada: el reducer nunca se ejecutaba, y el efecto ni
siquiera se reportaba a `onRegistrationChange`. El conjunto de entrada de un reducer tiene que
seguir cerrado, para que reproducir un log con el mismo código pliegue los mismos eventos sin
importar lo que una decoración agregue después; y todos los efectos de un evento se ejecutan en
secuencia, así que un patrón enrolaría a uno en la cadena de cada canal que coincidiera. Nombra los
canales, o deja el patrón en un middleware. Un `when` que no es ninguna de las cinco formas, como
`{}` o `{ any: false }`, lanza en todas las costuras por la misma razón: antes no coincidía con
nada.

**Aquí hay una trampa que vale más que la función.** Un guard que ya filtra en su propio cuerpo,
sobre un canal base sin el namespace, parece que iría más rápido con `when` — y convertirlo a
`{ channel: "plan" }` deja de ver en silencio todos los canales con namespace. Nada lanza. El guard
sigue ejecutándose, sigue devolviendo `true`, y deja de proteger el tráfico para el que se escribió.
Un runtime consumidor estuvo a una revisión de enviar exactamente eso, en la única defensa que su
diseño asignaba a limitar el tráfico de los pares.

Así que si un middleware filtra sobre algo menos que la cadena completa del canal, no es candidato
para `{ channel }`. Usa `channelPattern`, o deja el filtro en el cuerpo.

Coincidir con todo y filtrar a mano tiene un segundo costo además del salto previo a la llamada: el
matcher es lo que reporta `onRegistrationChange`, así que un guard escrito así le dice a todo
observador que coincide con el store entero.

---

## Observar lo que está instalado

`onRegistrationChange` avisa cuando un store gana o pierde un reducer, middleware o efecto.
DevTools lo usa para mantener su panel al día; una librería puede usarlo para reaccionar a
otra librería.

```typescript
const off = store.onRegistrationChange(
  (changes) => {
    for (const c of changes) {
      if (c.origin === "internal") continue;   // maquinaria propia del store
      console.log(c.op, c.kind, c.name, c.owner, c.when);
    }
  },
  { emitCurrent: true },
);
```

- **Los cambios llegan en lotes**, uno por llamada pública. `replaceReducers` actualiza una
  slice desmontándola y volviéndola a montar, así que una vista por cambio mostraría
  desaparecer algo que solo se estaba actualizando.
- **`emitCurrent`** sintetiza un cambio "mounted" por cada cosa ya instalada, entregado antes
  de que la llamada retorne. Los registros del spec ocurren dentro de `createStore`, así que
  un decorador aplicado después nunca los vio llegar.
- **`state` tiene cuatro valores** para un reducer, y el cuarto es el que hay que vigilar:
  `"retained"` significa que el estado de la slice sobrevivió al desmontaje, `"deleted"` que
  no. Tratar todo desmontaje como destrucción desarmará una suscripción que estás a punto de
  necesitar.
- **Registrar desde dentro de un observer está bien.** Se encola, no se entrega de forma
  reentrante, así que nadie ve nunca una topología a medio construir.
- **`when` es el matcher normalizado**, lo que de verdad va a coincidir y no lo que decía el
  spec. Una slice con claves reporta `{ keys }`, y un middleware registrado como función simple
  reporta `{ any: true }`, como siempre lo hizo un efecto sin filtro. Antes de 0.9.0 ninguno de
  los dos reportaba nada útil. `__devtoolsIntrospect` reporta los mismos matchers.
- El replay no produce cambios. Altera el estado, nunca la topología.

---

## Disposición, y lo único que los tipos no pueden expresar

`withSlice` no devuelve disposer. Es deliberado.

Después de ejecutar un disposer, el tipo ampliado sigue prometiendo una slice que ya no está,
y ningún sistema de tipos puede decir "válido hasta esa llamada". Así que la API de
encadenamiento no entrega uno, y el riesgo queda fuera del camino que la mayoría toma.

Cuando la slice es tuya y necesitas desmontarla, usa `registerSlice`:

```typescript
const reg = store.registerSlice("transfers", transfers, { owner: "@scope/transfers" });
reg.store;      // el store re-tipado
reg.dispose();  // privado a la librería: no lo exportes
```

**Mantén ese disposer dentro de la librería.** Dárselo a la aplicación es darle la capacidad
de invalidar tipos de los que la aplicación sigue dependiendo.

Leer una slice desmontada lanza un error con nombre en desarrollo, en lugar de devolver
`undefined` desde un tipo que prometía un valor:

> `[yoltra] Slice "transfers" was unmounted by its owner (@scope/transfers). Hooks and
> subscriptions widened for it are no longer valid.`

---

## Orden

Decora en el ámbito del módulo, al importar, antes del primer render. Entre `createStore` y la
decoración la slice realmente no existe, y un componente que la lea verá `undefined` hasta que
exista. Esa ventana es segura, no está rota, y se cierra en cuanto la slice se monta.
