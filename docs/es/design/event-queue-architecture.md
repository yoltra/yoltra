![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Arquitectura del Pipeline de Eventos

> [🇺🇸 English](../../en/design/event-queue-architecture.md) &nbsp;|&nbsp; 👉 Español

**Aplica a:** `@yoltra/core` 0.6.0
**Última actualización:** Agosto 2026
**Estado:** Estable

## Descripción General

Yoltra procesa cada evento en **dos fases**:

1. **Una fase de reducción síncrona** - el middleware, los reducers, los suscriptores de eventos y
   los oyentes gruesos se ejecutan todos **en el mismo tick, antes de que `emit()` retorne**. Así,
   `getState()` es correcto en el instante en que `emit()` retorna - con o sin middleware. Los
   reducers **preparan** su resultado; todas las slices se escriben bajo una sola raíz nueva antes
   de notificar nada, así que ningún suscriptor puede observar un evento a medio aplicar.
2. **Una fase de efectos asíncrona** - los efectos de cada evento confirmado se ejecutan después,
   como una **tarea independiente**. La promesa que devuelve `emit()` se resuelve cuando los
   efectos de _ese evento_ terminan.

Esta división es el núcleo del diseño: **las transiciones de estado son síncronas y predecibles**
(estilo Redux), mientras que **los efectos secundarios son asíncronos y no bloqueantes** (estilo
thunk/saga), sin una capa de orquestación aparte. Los reducers se mantienen puros y síncronos;
cualquier cosa asíncrona pertenece a un efecto.

> Esto reemplaza la anterior cola serializada totalmente asíncrona (antes de 0.2.0). Ahora el middleware es
> síncrono, los reducers confirman antes de que `emit()` retorne, y la promesa de finalización es
> por-evento y honesta.

## Mecanismo Central

### Estructuras

```typescript
// Cola FIFO de eventos que esperan la fase de reducción síncrona.
private readonly reduceQueue: Array<{
  channel: string;
  type: string;
  payload: unknown;
  id: string;
  resolve: (result: EmitResult) => void; // deferred de finalización para este evento
  parentId?: string;   // presente solo en un evento causado
  depth?: number;      // 0 para un emit raiz, uno mas que su causa por debajo
}> = [];

private isReducing = false;   // guardia de reentrada para el drenado síncrono
private inFlightEffects = 0;   // numero de tareas de efectos en ejecucion
```

**Propiedades:**

- **Cola de reducción FIFO** - los eventos se reducen en el orden en que se emitieron; los emits
  reentrantes preservan el orden.
- **Guardia `isReducing`** - garantiza que haya un único drenado síncrono en curso; los emits
  reentrantes se anexan a la cola y los drena el mismo pase (sin intercalado de reducers).
- **Deferred de finalización por-evento** - cada evento lleva su propio `resolve`, así que
  `await emit(...)` se resuelve cuando los efectos de ese evento terminan - no antes, y no por un
  evento no relacionado.
- **Deduplicación opt-in** - desactivada por defecto; se activa por-store (`dedupWindowMs`) o
  por-emit (`dedupKey`). Ver [Deduplicación](#deduplicación-opt-in).

### El punto de entrada `emit()`

```typescript
public async emit<C, T>(channel: C, type: T, payload: EM[C][T], opts?: EmitOptions): Promise<EmitResult>
```

**Pasos:**

1. **Deduplicación (opt-in)** - si la dedup por contenido está activa (`dedupWindowMs > 0`) o se
   suministra un `dedupKey` explícito, se omite el evento cuando coincide con uno reciente.
   Desactivada por defecto.
2. **Asignar id + deferred de finalización** - un id único y una `Promise` cuyo `resolve` se
   dispara después de que corran los efectos de este evento.
3. **Encolar** - empujar el evento a `reduceQueue`.
4. **Drenar síncronamente** - llamar a `drainReduce()`, que reduce cada evento encolado en este
   tick.
5. **Devolver la promesa de finalización** - se resuelve cuando los efectos de este evento se
   asientan.

### Flujo de procesamiento

```
emit(channel, type, payload)
        │
        ▼
  ┌───────────────────────┐   duplicado
  │ chequeo dedup opt-in? │ ───────────► return (omitido)
  └───────────┬───────────┘
              │ no es duplicado
              ▼
  asignar id + deferred de finalizacion
              │
              ▼
  empujar a reduceQueue
              │
              ▼
  drainReduce()  ── SINCRONO, en este tick ────────────────────────┐
              │   mientras reduceQueue no este vacia:              │
              ▼                                                    │
     ┌────────────────────────────┐   veto    ┌───────────────────┐│
     │ middleware (sinc, veta)    │ ────────► │ suscriptores de   ││
     └────────────┬───────────────┘           │ evento no conf.   ││
                  │ confirmado                └───────────────────┘│
                  ▼                                                │
     ┌────────────────────────────┐  rechazo  ┌───────────────────┐│
     │ PREPARAR reducers - aun    │ ────────► │ nada se escribe   ││
     │ no se escribe nada         │           │ onRejected avisa  ││
     └────────────┬───────────────┘           └───────────────────┘│
                  │ sin rechazo                                    │
                  ▼                                                │
     ┌────────────────────────────┐                                │
     │ CONFIRMAR todo, 1 raiz     │                                │
     └────────────┬───────────────┘                                │
                  ▼                                                │
     ┌────────────────────────────┐                                │
     │ suscriptores confirmados   │  (fire-and-forget)             │
     └────────────┬───────────────┘                                │
                  ▼                                                │
     ┌────────────────────────────┐                                │
     │ subs written + oyentes     │  (solo si el estado cambio)    │
     │ gruesos + instrumentacion  │                                │
     └────────────┬───────────────┘                                │
                  ▼                                                │
     void runEventEffects(event) ── async, tarea independiente ────┘
                  │
                  ▼
  return promesa `done`  ── se resuelve cuando terminan los efectos de ESTE evento
```

## Fase 1 - Reducción síncrona

`drainReduce()` ejecuta toda la fase de reducción de cada evento encolado en un único pase
síncrono, protegido por `isReducing`:

```typescript
private drainReduce(): void {
  if (this.isReducing) return;        // ya hay un drenado en curso
  this.isReducing = true;
  try {
    while (this.reduceQueue.length > 0) {
      const { channel, type, payload, id, resolve } = this.reduceQueue.shift()!;
      const event = { channel, type, payload, id };

      // (la instrumentacion captura estado previo, rutas cambiadas y tiempos aqui —
      //  se omite por completo cuando no hay observadores adjuntos)

      this.currentEvent = event;                      // para que un emit re-entrante conozca su causa
      const result = this.applyEventSync(event);      // ← sincrono

      // Los efectos corren como tarea independiente; el bucle NO los espera.
      void this.runEventEffects(event, result, resolve);
    }
  } finally {
    this.isReducing = false;
  }
}
```

`applyEventSync()` es el núcleo síncrono - middleware, reducers, suscriptores, oyentes gruesos.
Prepara todas las slices que aplican antes de escribir cualquiera, así que un rechazo que llega del
último reducer todavía puede impedir la escritura del primero:

```typescript
private applyEventSync(event): EmitResult {
  // Middleware (sincrono). Devolver false para vetar; el trabajo async va en efectos.
  for (const mw of this.matchingMiddleware(event)) {
    let ok: boolean;
    try {
      ok = mw(this.state, event, this.emit);   // ← boolean, no una Promise
    } catch (err) {
      console.error("Middleware error:", err);
      ok = false;
    }
    if (!ok) {
      this.notifyEventSubscribers(event, "uncommitted"); // vetado → subs no confirmados
      return NOT_COMMITTED;                              // no confirmar
    }
  }

  // PREPARAR - los reducers por clave y por patron calculan su siguiente slice. No se escribe nada.
  const staged = [];
  let rejection = null;
  for (const [slice, when] of this.matchingReducers(event)) {
    const refused = this.stageSlice(slice, event, staged);
    if (refused) { rejection = refused; break; }   // un rechazo detiene la preparacion
  }

  // Un rechazo descarta TODAS las slices preparadas, no solo la que rechazo: autorizar la escritura
  // de una slice mientras una hermana la registra como aceptada no es autorizar.
  if (rejection) {
    this.onRejected?.(rejection, event, rejectedBy);
    this.notifyEventSubscribers(event, "committed");   // no fue vetado - llego a los reducers
    return { committed: true, written: false, rejected: rejection };
  }

  // CONFIRMAR - una sola raiz nueva para todo el evento, y despues notificar. Cada notificacion
  // ocurre despues de cada escritura, asi que un handler que lea getState() ve el evento completo.
  const written = this.commitStaged(staged, event);

  this.notifyEventSubscribers(event, "committed");
  if (written) {
    this.notifyEventSubscribers(event, "written");
    this.listeners.forEach((l) => l());
  }
  return written ? WRITTEN : COMMITTED_UNWRITTEN;
}
```

**Como todo esto corre antes de que `emit()` retorne:**

```typescript
store.emit("counter", "increment", 1);
store.getState().counter.value; // ← ya actualizado, incluso con middleware presente
```

## Fase 2 - Efectos asíncronos

Los efectos de cada evento confirmado corren en su **propia tarea asíncrona**, no en un bucle
serializado compartido:

```typescript
private async runEventEffects(event, result, resolve): Promise<void> {
  this.inFlightEffects++;
  try {
    if (committed) await this.notifyEffects(event);
  } catch (err) {
    console.error("Effect error:", err);   // que un efecto falle nunca rompe el pipeline
  } finally {
    this.inFlightEffects--;
    resolve();                              // asienta la promesa de emit() para ESTE evento
  }
}
```

Las tareas independientes por-evento (en lugar de un único bucle serializado compartido) permiten
que un efecto haga `await` de un `emit()` reentrante **sin deadlock** - el evento reentrante se
reduce síncronamente por su cuenta y sus efectos se agendan de forma independiente.

## Reentrada y ordenamiento

Los emits anidados son seguros y ordenados:

- **Un `emit()` dentro de middleware o de un suscriptor** (es decir, durante la reducción síncrona)
  se anexa a `reduceQueue`; el pase activo de `drainReduce()` lo recoge y lo reduce después del
  evento actual - FIFO, sin intercalado de reducers.
- **Un `emit()` dentro de un efecto** (asíncrono) encola y llama a `drainReduce()` de nuevo, que
  inicia un nuevo pase síncrono (el anterior ya terminó).

```typescript
await emit("ui", "event1", p1); // reducido primero
await emit("ui", "event2", p2); // reducido despues de event1
// Orden de reduccion: event1 → event2 (garantizado, sincrono)
```

> **Concurrencia de efectos:** como los efectos son tareas independientes, los efectos de event1 y
> los de event2 pueden estar en vuelo al mismo tiempo. Si un efecto debe correr estrictamente
> después de que otro termine, modela ese orden explícitamente (p. ej. emite el siguiente desde
> dentro del primer efecto). El orden de los reducers siempre es estricto; el orden de finalización
> de los efectos no lo es.

## Deduplicación (opt-in)

La deduplicación está **desactivada por defecto** - Yoltra nunca descarta en silencio eventos
idénticos legítimos y rápidos (doble-clics, un slider emitiendo el mismo valor, dos `+1`). Te
suscribes de dos formas:

| Modo              | Cómo                                                   | Cuándo se dispara                                                                    |
| ----------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| **Por contenido** | `createStore({ dedupWindowMs: N })` (o `createYoltra`) | Omite un evento cuya huella `channel::type::payload` se repite dentro de `N` ms      |
| **Por identidad** | `emit(c, t, p, { dedupKey })`                          | Omite un evento cuyo `dedupKey` explícito se repite dentro de la ventana de la clave |

```typescript
// Desactivada por defecto - ambos se despachan:
await emit("counter", "increment", 1);
await emit("counter", "increment", 1);

// Dedup por identidad para un doble-invoke de React Strict Mode en un efecto:
useEffect(() => {
  emit("analytics", "pageView", { page }, { dedupKey: `pageView:${page}` });
}, [page]);
```

La dedup por identidad es la herramienta correcta para la doble-invocación (solo en desarrollo) de
efectos de Strict Mode: el mismo emit lógico reutiliza la clave, mientras que dos acciones reales
del usuario no.

## El contrato de la promesa de `emit()`

`emit()` devuelve una `Promise<EmitResult>` que se resuelve **cuando los efectos de ese evento en
concreto terminan**:

```typescript
const { committed, written, rejected } = await emit("api", "save", payload);
// ← se resuelve tras terminar los efectos de save (el estado ya se actualizo sincronamente)
```

| Campo       | Significado                                                                  |
| ----------- | ---------------------------------------------------------------------------- |
| `committed` | El middleware lo permitió - llegó a los reducers                             |
| `written`   | El estado cambió de verdad. Es `false` para un evento que ningún reducer atendió, y para un store sin reducers |
| `rejected`  | El `Rejection` que devolvió un reducer, cuando alguno rechazó                 |

Los dos son distintos a propósito. `committed` es `true` para todo evento que el middleware
permite, que es de lo que depende un bus de notificaciones o de analíticas; `written` es el hecho
más estricto que necesita quien llama cuando una actualización perdida importa. Ampliar el antiguo
`Promise<void>` es compatible en fuente - nada podía depender de la ausencia de un valor.

Esto es honesto bajo concurrencia: cada evento tiene su propio deferred de finalización, así que
`await emit(b)` nunca se resuelve antes de tiempo porque otro evento `a` estuviera en vuelo. Si solo
te importa el cambio de estado (no los efectos), no necesitas hacer `await` en absoluto - el cambio
ya es visible.

## Suscripciones de eventos

Las suscripciones de eventos observan los eventos sin afectar el flujo. Se disparan durante la fase
**síncrona**.

| Fase            | Cuándo se notifica                                     | Caso de uso                                        |
| --------------- | ------------------------------------------------------ | -------------------------------------------------- |
| `'committed'`   | Tras los reducers, antes de los efectos de este evento - se haya escrito algo o no | Toasts, analíticas, cualquier señal de "esto ocurrió" |
| `'written'`     | Tras la confirmación, solo si el estado cambió de verdad | Reaccionar a un cambio real; `getState()` ya lo muestra |
| `'uncommitted'` | Tras el veto del middleware                            | Reaccionar a eventos bloqueados (auth, validación) |
| `'all'`         | `committed` **y** `uncommitted` (el handler recibe la fase) | Logging, analíticas, depuración               |

`'all'` deliberadamente **no** incluye `'written'`. Si lo hiciera, cada suscriptor `all` existente
recibiría una segunda notificación por evento escrito y contaría doble; `written` es solo opt-in.

```typescript
// Confirmado (por defecto)
store.onEvent("ui", "save", (event, getState) => {
  console.log("Save confirmado, nuevo estado:", getState());
});

// No confirmado - el middleware lo bloqueo
store.onEvent("ui", "delete", () => console.log("Delete bloqueado por middleware"), "uncommitted");

// Todos - con el parametro de fase
store.onEvent("ui", "action", (event, _get, _emit, phase) => {
  analytics.track(`event_${phase}`, { type: event.type });
}, "all");
```

Los errores de un suscriptor se capturan y registran, así que un suscriptor que lanza nunca detiene
a los demás.

## Modos de fallo

### Veto del middleware

Un middleware que devuelve `false` veta el evento: los reducers y efectos nunca lo ven, se disparan
los suscriptores no confirmados, y el evento no se confirma. El middleware es síncrono - haz aquí la
autorización y validación, no I/O.

```typescript
const auth: MiddlewareFunction = (state, event) => {
  if (!state.auth.isAuthenticated) return false; // veto → no confirmado
  return true;
};
```

### Errores de efectos

Un efecto que lanza se captura y registra (`Effect error:`); los demás efectos y el pipeline
continúan. Los efectos deben capturar sus propios errores y emitir eventos de fallo:

```typescript
effect: async (evt, getState, emit) => {
  try {
    await emit("api", "fetchSuccess", await fetchData(evt.payload.url));
  } catch (error) {
    await emit("api", "fetchFailure", { error: String(error) });
  }
};
```

### Reducers síncronos y largos

Los reducers corren en el hilo principal durante la fase síncrona. Un reducer con mucho CPU bloquea
ese tick y la UI. Manten los reducers rápidos y puros; mueve el trabajo pesado o asíncrono a los
efectos (o a un Web Worker).

### Rechazo de un reducer

Un reducer puede devolver `Rejected(reason)` en lugar de estado. **El evento entero** cede: no se
escribe ninguna slice, no se dispara ninguna notificación de cambio, y a quien llamó se le dice por
qué mediante `EmitResult.rejected`. Esto es deliberadamente distinto de las dos cosas entre las que
se sitúa - devolver el estado sin cambios, que es indistinguible de "este evento no me concernía", y
lanzar, que es un bug. Un reducer que lanza queda aislado y sus hermanos igual confirman; un reducer
que rechaza ha tomado una decisión que el evento entero respeta. Los rechazos también llegan a
`onRejected` para logging y a `InstrumentedEvent.rejected` para las DevTools.

### Re-emisión descontrolada

Dos consumidores conectados entre sí - un suscriptor que emite lo que su propio reducer contesta, o
dos slices que se contestan mutuamente - producen una cadena sin fin. Como la cola de reducción se
drena de forma síncrona, eso no es un programa lento sino una pestaña congelada o un núcleo
clavado, sin error y sin stack al que atribuirlo.

Por eso cada evento lleva su posición causal: `parentId` nombra la causa y `depth` es uno más que
ella, o ambos están ausentes en un evento emitido por el código de la aplicación. **`maxReduceDepth`
vale 64 por defecto** y se niega a extender una cadena más allá - un modo de fallo así de grave no
debería requerir configuración para evitarse. Superarlo se reporta por `onCascade` y por consola en
vez de lanzar, porque el throw aterrizaría en cualquier suscriptor o efecto que estuviera emitiendo.

La causalidad se rastrea de dos maneras, porque el drenaje es síncrono y los efectos no: dentro de
un drenaje el store sabe qué evento está procesando, así que incluso un emit hecho a través de una
referencia capturada a `store` se atribuye correctamente; entre drenajes, el `emit` que reciben los
efectos lleva la causa a través del `await`. Un efecto que recurre a `store.emit` *después* de un
await inicia una cadena nueva - un límite documentado, no disimulado.

`maxTransitionsPerDrain` acota el ancho de una ráfaga y sigue siendo **opt-in**: un fan-out es
legítimamente ancho donde una cascada es estrecha y profunda, así que la profundidad los separa y un
conteo no puede. Nunca rechaza el evento que inicia un drenaje - ese es el emit de quien llamó, y
rechazarlo sería una falla en vez de una protección.

> Nota que un bucle síncrono de emits **no** es un solo drenaje. `emit()` drena por completo antes
> de retornar, así que `for (const x of xs) store.emit(...)` son N drenajes de un evento, todos raíz
> a profundidad 0. La cola solo se acumula con emits re-entrantes.

## Comparación con otras librerías

### Redux (síncrono)

Reducers síncronos; `getState()` refleja el cambio de inmediato. Lo asíncrono necesita
thunks/sagas. **Yoltra iguala el timing de estado síncrono de Redux** a la vez que provee una fase
de efectos asíncrona integrada.

### Zustand (síncrono)

`set()` síncrono; overhead mínimo, sin orquestación async integrada ni ordenamiento de eventos.
Yoltra añade un log de eventos, ordenamiento y la fase de efectos.

### XState (mailbox de actores)

Mailboxes asíncronos por-actor; potente pero con un modelo mental más pesado. Yoltra mantiene una
única ruta de reducción ordenada con efectos asíncronos ligeros.

### Yoltra (reducción síncrona + efectos asíncronos)

```typescript
emit("todo", "add", todo);        // estado actualizado sincronamente, antes de retornar
await emit("todo", "add", todo);  // haz await para esperar tambien los efectos de add
```

- ✅ Transiciones de estado síncronas y predecibles (`getState()` correcto tras `emit`)
- ✅ Efectos asíncronos integrados sin una capa de orquestación aparte
- ✅ Orden estricto de reducers; seguro ante reentrada
- ✅ Promesa de finalización por-evento honesta
- ⚠️ El orden de finalización de efectos entre eventos no está serializado (por diseño)

## Justificación de diseño

### ¿Por qué reducción síncrona + efectos asíncronos?

Una versión anterior hacía todo el pipeline asíncrono, incluyendo el middleware. Eso hacía que
`getState()` tras `emit()` dependiera de si existía middleware, y la promesa de finalización se
resolvía antes de tiempo para eventos encolados. Dividir las fases arregla ambas cosas: los reducers
confirman síncronamente (estado predecible), los efectos siguen siendo asíncronos (no bloqueantes),
y cada `emit()` obtiene una promesa de finalización veraz.

### ¿Por qué middleware síncrono?

El middleware controla las confirmaciones (autorización, validación, veto). Hacerlo síncrono
mantiene la decisión de confirmar en el mismo tick que el cambio de estado; el trabajo genuinamente
asíncrono (I/O) es un efecto, igualando la división reducer/thunk de Redux.

### ¿Por qué una única cola de reducción?

Una sola cola FIFO garantiza el orden global de los reducers y una semántica simple y sin carreras.
Los emits reentrantes se unen al mismo pase en lugar de intercalarse.

### ¿Por qué dedup opt-in?

La dedup silenciosa por contenido cambiaba una garantía de corrección por un artefacto de Strict
Mode exclusivo de desarrollo. Hacerla opt-in (y añadir la dedup por identidad `dedupKey`) restaura
"cada emit se despacha" como comportamiento por defecto y a la vez resuelve Strict Mode en su
origen.

---

## Apéndice: referencia de implementación

El drenado síncrono y la tarea de efectos asíncrona, condensados:

```typescript
public async emit(channel, type, payload, opts?): Promise<EmitResult> {
  // 1. Dedup opt-in (ventana de contenido o dedupKey explicito); desactivada por defecto.
  if (this.dedupConfig.windowMs > 0 || opts?.dedupKey !== undefined) {
    if (this.shouldDedupe(/* fingerprint o #dedupKey */)) return NOT_COMMITTED;
  }

  // 2. Posicion causal. Un evento raiz no lleva ninguno de los dos campos, asi que queda
  //    byte-identico a uno construido antes de que existieran - el precedente que sento `meta`.
  const cause = this.currentEvent;               // no-nulo mientras hay un drenaje en curso
  const depth = cause ? cause.depth + 1 : 0;
  if (cause && depth > this.maxReduceDepth) {
    this.reportCascade("maxReduceDepth", /* … */);  // veta este emit; no lanza
    return NOT_COMMITTED;
  }

  // 3. id + deferred de finalizacion por-evento.
  const id = crypto.randomUUID();
  let resolve!: (r: EmitResult) => void;
  const done = new Promise<EmitResult>((r) => (resolve = r));

  // 4. Encolar, luego 5. drenar sincronamente.
  this.reduceQueue.push({ channel, type, payload, id, resolve, ...(cause && { parentId: cause.id, depth }) });
  this.drainReduce();

  // 6. Se resuelve cuando terminan los efectos de ESTE evento.
  return done;
}

private drainReduce(): void {
  if (this.isReducing) return;
  this.isReducing = true;
  try {
    while (this.reduceQueue.length > 0) {
      const { resolve, ...ev } = this.reduceQueue.shift()!;
      this.currentEvent = ev;                      // para que un emit re-entrante conozca su causa
      const result = this.applyEventSync(ev);      // sinc: middleware → preparar → confirmar → subs
      void this.runEventEffects(ev, result, resolve); // async, tarea independiente por-evento
    }
  } finally {
    this.isReducing = false;
  }
}
```

---

## Glosario

**Fase de reducción** - la parte síncrona de `emit()`: middleware, reducers, suscriptores, oyentes
gruesos. Se completa antes de que `emit()` retorne.

**Fase de efectos** - la parte asíncrona: los efectos de cada evento confirmado, corridos como una
tarea independiente.

**Deferred de finalización** - el `resolve` por-evento que asienta la promesa que `emit()` devuelve,
una vez que los efectos de ese evento terminan.

**`isReducing`** - guardia de reentrada que garantiza un único drenado síncrono; los emits
reentrantes se anexan a la cola y los drena el mismo pase.

**FIFO** - First-In-First-Out; los reducers corren en el orden de emisión.

**Veto** - un middleware que devuelve `false`, produciendo un evento no confirmado.

**Preparación (staging)** - calcular el siguiente valor de una slice sin escribirlo. Todas las
slices que aplican se preparan primero y luego se asignan bajo una sola raíz nueva, así que ningún
suscriptor observa un evento parcial.

**Rechazo** - un reducer que devuelve `Rejected(reason)`. Distinto de un veto (middleware, antes de
los reducers) y de un throw (un bug, aislado a su slice).

**Profundidad causal** - el `depth` de un evento: 0 para uno emitido por el código de la aplicación,
uno más que su causa por debajo, con `parentId` nombrando la causa. Ambos están ausentes en un
evento raíz. Acotarla es lo que impide que una cascada se convierta en un proceso colgado.

---

## Historial de Revisiones

| `@yoltra/core` | Fecha   | Cambios                                                                                                                                                                                                                                                |
| ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0.6.0   | 2026-08 | Cascadas acotadas por profundidad causal (`maxReduceDepth`, activo por defecto; `parentId`/`depth` en cada evento causado); confirmaciones preparadas y aplicadas atómicamente entre slices; `Rejected(reason)` desde un reducer; `emit()` resuelve a un `EmitResult`; nueva fase de evento `written` |
| 0.2.0   | 2026-07 | Pipeline de dos fases: reducción síncrona (middleware síncrono, reducers confirman antes de que `emit()` retorne) + efectos asíncronos independientes; promesa de finalización por-evento honesta; deduplicación opt-in (`dedupWindowMs` / `dedupKey`) |
| previo al cambio de nombre | 2026-01 | Suscripciones de eventos (fases confirmado/no confirmado/todos)                                                                                                                                                                                        |
| previo al cambio de nombre | 2026-01 | Documentación inicial del pipeline de eventos                                                                                                                                                |

Las últimas dos filas son anteriores a febrero de 2026, cuando este proyecto se renombró de
`@quojs/*` (entonces en 0.8.0) y reinició en `@yoltra/*` 0.1.0. Aquella secuencia no continúa
aquí; esta tabla usa la versión que puedes instalar.

---

**Licencia:** MIT
**Repositorio:** https://github.com/yoltra/yoltra
