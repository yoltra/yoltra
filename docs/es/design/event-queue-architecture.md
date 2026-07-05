![Yoltra logo](../../../assets/yoltra-logo.png)

# Arquitectura del Pipeline de Eventos

> [ 🇲🇽 Versión en Español](https://github.com/yoltra/yoltra/blob/main/docs/es/design/event-queue-architecture.md)&nbsp; | &nbsp; 👉 🇺🇸 English Version

**Versión:** 0.8.0
**Última actualización:** Julio 2026
**Estado:** Estable

## Descripción General

Yoltra procesa cada evento en **dos fases**:

1. **Una fase de reducción síncrona** — el middleware, los reducers, los suscriptores de eventos
   confirmados/no confirmados y los oyentes gruesos se ejecutan todos **en el mismo tick, antes de
   que `emit()` retorne**. Así, `getState()` es correcto en el instante en que `emit()` retorna —
   con o sin middleware.
2. **Una fase de efectos asíncrona** — los efectos de cada evento confirmado se ejecutan después,
   como una **tarea independiente**. La promesa que devuelve `emit()` se resuelve cuando los
   efectos de _ese evento_ terminan.

Esta división es el núcleo del diseño: **las transiciones de estado son síncronas y predecibles**
(estilo Redux), mientras que **los efectos secundarios son asíncronos y no bloqueantes** (estilo
thunk/saga), sin una capa de orquestación aparte. Los reducers se mantienen puros y síncronos;
cualquier cosa asíncrona pertenece a un efecto.

> Esto reemplaza la anterior cola serializada totalmente asíncrona (≤ v0.7). Ahora el middleware es
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
  resolve: () => void; // deferred de finalización para este evento en concreto
}> = [];

private isReducing = false;   // guardia de reentrada para el drenado síncrono
private inFlightEffects = 0;   // numero de tareas de efectos en ejecucion
```

**Propiedades:**

- **Cola de reducción FIFO** — los eventos se reducen en el orden en que se emitieron; los emits
  reentrantes preservan el orden.
- **Guardia `isReducing`** — garantiza que haya un único drenado síncrono en curso; los emits
  reentrantes se anexan a la cola y los drena el mismo pase (sin intercalado de reducers).
- **Deferred de finalización por-evento** — cada evento lleva su propio `resolve`, así que
  `await emit(...)` se resuelve cuando los efectos de ese evento terminan — no antes, y no por un
  evento no relacionado.
- **Deduplicación opt-in** — desactivada por defecto; se activa por-store (`dedupWindowMs`) o
  por-emit (`dedupKey`). Ver [Deduplicación](#deduplicación-opt-in).

### El punto de entrada `emit()`

```typescript
public async emit<C, T>(channel: C, type: T, payload: EM[C][T], opts?: EmitOptions): Promise<void>
```

**Pasos:**

1. **Deduplicación (opt-in)** — si la dedup por contenido está activa (`dedupWindowMs > 0`) o se
   suministra un `dedupKey` explícito, se omite el evento cuando coincide con uno reciente.
   Desactivada por defecto.
2. **Asignar id + deferred de finalización** — un id único y una `Promise` cuyo `resolve` se
   dispara después de que corran los efectos de este evento.
3. **Encolar** — empujar el evento a `reduceQueue`.
4. **Drenar síncronamente** — llamar a `drainReduce()`, que reduce cada evento encolado en este
   tick.
5. **Devolver la promesa de finalización** — se resuelve cuando los efectos de este evento se
   asientan.

### Flujo de procesamiento

```
emit(channel, type, payload)
        │
        ▼
  ┌───────────────────────┐   duplicado
  │ chequeo dedup opt-in?  │ ───────────► return (omitido)
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
              │   mientras reduceQueue no este vacia:               │
              ▼                                                     │
     ┌────────────────────────────┐   veto    ┌───────────────────┐│
     │ middleware (sinc, veta)     │ ────────► │ suscriptores de   ││
     └────────────┬───────────────┘           │ evento no confirm.││
                  │ confirmado                 └───────────────────┘│
                  ▼                                                 │
     ┌────────────────────────────┐                                │
     │ reducers (clave + patron)   │                                │
     └────────────┬───────────────┘                                │
                  ▼                                                 │
     ┌────────────────────────────┐                                │
     │ suscriptores confirmados    │  (fire-and-forget)             │
     └────────────┬───────────────┘                                │
                  ▼                                                 │
     ┌────────────────────────────┐                                │
     │ oyentes gruesos (si el      │                                │
     │ estado cambio) + instrum.   │                                │
     └────────────┬───────────────┘                                │
                  ▼                                                 │
     void runEventEffects(event) ── async, tarea independiente ─────┘
                  │
                  ▼
  return promesa `done`  ── se resuelve cuando terminan los efectos de ESTE evento
```

## Fase 1 — Reducción síncrona

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

      const committed = this.applyEventSync(event);   // ← sincrono

      // Los efectos corren como tarea independiente; el bucle NO los espera.
      void this.runEventEffects(event, committed, resolve);
    }
  } finally {
    this.isReducing = false;
  }
}
```

`applyEventSync()` es el núcleo síncrono — middleware, reducers, suscriptores, oyentes gruesos:

```typescript
private applyEventSync(event): boolean {
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
      this.notifyEventSubscribers(event, "uncommitted"); // rechazado → subs no confirmados
      return false;                                       // no confirmar
    }
  }

  // Reducers — por clave + por patron; rastrea cambio de slice por igualdad de referencia.
  const stateBefore = this.state;
  this.reducerBus.emit(event.channel, event.type, event.payload);
  for (const [slice, when] of this.patternReducers) {
    if (this.matchesWhen(when, event)) this.forwardEvent(slice, event);
  }
  const changed = stateBefore !== this.state;

  // Suscriptores confirmados (fire-and-forget), luego oyentes gruesos si el estado cambio.
  this.notifyEventSubscribers(event, "committed");
  if (changed) this.listeners.forEach((l) => l());
  return true;
}
```

**Como todo esto corre antes de que `emit()` retorne:**

```typescript
store.emit("counter", "increment", 1);
store.getState().counter.value; // ← ya actualizado, incluso con middleware presente
```

## Fase 2 — Efectos asíncronos

Los efectos de cada evento confirmado corren en su **propia tarea asíncrona**, no en un bucle
serializado compartido:

```typescript
private async runEventEffects(event, committed, resolve): Promise<void> {
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
que un efecto haga `await` de un `emit()` reentrante **sin deadlock** — el evento reentrante se
reduce síncronamente por su cuenta y sus efectos se agendan de forma independiente.

## Reentrada y ordenamiento

Los emits anidados son seguros y ordenados:

- **Un `emit()` dentro de middleware o de un suscriptor** (es decir, durante la reducción síncrona)
  se anexa a `reduceQueue`; el pase activo de `drainReduce()` lo recoge y lo reduce después del
  evento actual — FIFO, sin intercalado de reducers.
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

La deduplicación está **desactivada por defecto** — Yoltra nunca descarta en silencio eventos
idénticos legítimos y rápidos (doble-clics, un slider emitiendo el mismo valor, dos `+1`). Te
suscribes de dos formas:

| Modo | Cómo | Cuándo se dispara |
| --- | --- | --- |
| **Por contenido** | `createStore({ dedupWindowMs: N })` (o `createYoltra`) | Omite un evento cuya huella `channel::type::payload` se repite dentro de `N` ms |
| **Por identidad** | `emit(c, t, p, { dedupKey })` | Omite un evento cuyo `dedupKey` explícito se repite dentro de la ventana de la clave |

```typescript
// Desactivada por defecto — ambos se despachan:
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

`emit()` devuelve una `Promise<void>` que se resuelve **cuando los efectos de ese evento en
concreto terminan**:

```typescript
await emit("api", "save", payload);
// ← se resuelve tras terminar los efectos de save (el estado ya se actualizo sincronamente)
```

Esto es honesto bajo concurrencia: cada evento tiene su propio deferred de finalización, así que
`await emit(b)` nunca se resuelve antes de tiempo porque otro evento `a` estuviera en vuelo. Si solo
te importa el cambio de estado (no los efectos), no necesitas hacer `await` en absoluto — el cambio
ya es visible.

## Suscripciones de eventos

Las suscripciones de eventos observan los eventos sin afectar el flujo. Se disparan durante la fase
**síncrona**.

| Fase | Cuándo se notifica | Caso de uso |
| --- | --- | --- |
| `'committed'` | Tras los reducers, antes de los efectos de este evento | Reaccionar a cambios de estado exitosos |
| `'uncommitted'` | Tras el veto del middleware | Reaccionar a eventos bloqueados (auth, validación) |
| `'all'` | Ambas fases (el handler recibe la fase) | Logging, analíticas, depuración |

```typescript
// Confirmado (por defecto)
store.onEvent("ui", "save", (event, getState) => {
  console.log("Save confirmado, nuevo estado:", getState());
});

// No confirmado — el middleware lo bloqueo
store.onEvent("ui", "delete", () => console.log("Delete bloqueado por middleware"), "uncommitted");

// Todos — con el parametro de fase
store.onEvent("ui", "action", (event, _get, _emit, phase) => {
  analytics.track(`event_${phase}`, { type: event.type });
}, "all");
```

Los errores de un suscriptor se capturan y registran, así que un suscriptor que lanza nunca detiene
a los demás.

## Modos de fallo

### Veto del middleware

Un middleware que devuelve `false` veta el evento: los reducers y efectos nunca lo ven, se disparan
los suscriptores no confirmados, y el evento no se confirma. El middleware es síncrono — haz aquí la
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

### Re-emisión descontrolada

Un efecto que re-emite incondicionalmente su propio disparador recurre sin límite. Yoltra no vigila
esto — protege las cadenas de emit recursivas en el código de la aplicación.

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
public async emit(channel, type, payload, opts?): Promise<void> {
  // 1. Dedup opt-in (ventana de contenido o dedupKey explicito); desactivada por defecto.
  if (this.dedupConfig.windowMs > 0 || opts?.dedupKey !== undefined) {
    if (this.shouldDedupe(/* fingerprint o #dedupKey */)) return;
  }

  // 2. id + deferred de finalizacion por-evento.
  const id = crypto.randomUUID();
  let resolve!: () => void;
  const done = new Promise<void>((r) => (resolve = r));

  // 3. Encolar, luego 4. drenar sincronamente.
  this.reduceQueue.push({ channel, type, payload, id, resolve });
  this.drainReduce();

  // 5. Se resuelve cuando terminan los efectos de ESTE evento.
  return done;
}

private drainReduce(): void {
  if (this.isReducing) return;
  this.isReducing = true;
  try {
    while (this.reduceQueue.length > 0) {
      const { resolve, ...ev } = this.reduceQueue.shift()!;
      const committed = this.applyEventSync(ev);   // sinc: middleware → reducers → subs → gruesos
      void this.runEventEffects(ev, committed, resolve); // async, tarea independiente por-evento
    }
  } finally {
    this.isReducing = false;
  }
}
```

---

## Glosario

**Fase de reducción** — la parte síncrona de `emit()`: middleware, reducers, suscriptores, oyentes
gruesos. Se completa antes de que `emit()` retorne.

**Fase de efectos** — la parte asíncrona: los efectos de cada evento confirmado, corridos como una
tarea independiente.

**Deferred de finalización** — el `resolve` por-evento que asienta la promesa que `emit()` devuelve,
una vez que los efectos de ese evento terminan.

**`isReducing`** — guardia de reentrada que garantiza un único drenado síncrono; los emits
reentrantes se anexan a la cola y los drena el mismo pase.

**FIFO** — First-In-First-Out; los reducers corren en el orden de emisión.

**Veto** — un middleware que devuelve `false`, produciendo un evento no confirmado.

---

## Historial de Revisiones

| Versión | Fecha | Cambios |
| --- | --- | --- |
| 0.8.0 | 2026-07 | Pipeline de dos fases: reducción síncrona (middleware síncrono, reducers confirman antes de que `emit()` retorne) + efectos asíncronos independientes; promesa de finalización por-evento honesta; deduplicación opt-in (`dedupWindowMs` / `dedupKey`) |
| 0.7.0 | 2026-01 | Suscripciones de eventos (fases confirmado/no confirmado/todos) |
| 0.5.0 | 2026-01 | Documentación inicial del pipeline de eventos |

---

**Licencia:** MIT
**Repositorio:** https://github.com/yoltra/yoltra
