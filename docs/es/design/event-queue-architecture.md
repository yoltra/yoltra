# Arquitectura de Cola de Eventos

>  👉 [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/design/event-queue-architecture.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/design/event-queue-architecture.md)&nbsp; |
> &nbsp;[ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/docs/en/design/event-queue-architecture.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/design/event-queue-architecture.md)

**Versión:** 0.7.0
**Última actualización:** Enero 2026
**Estado:** Estable

## Descripción General

Quo.js emplea una **cola de eventos asíncrona y serializada** con un guardia de reentrada para control de contrapresión. Esta arquitectura garantiza un ordenamiento predecible de eventos y previene condiciones de carrera mientras soporta middleware y efectos asíncronos.

## Mecanismo Central

### Estructura de la Cola

```typescript
private readonly eventQueue: Array<{
  channel: string;
  type: string;
  payload: any;
  id: symbol;
}> = [];

private isProcessingQueue = false;
```

**Propiedades:**
- **Cola FIFO sin límites** - Eventos encolados en el orden recibido
- **Bandera de procesamiento única** - Previene operaciones de drenaje concurrentes
- **Deduplicación de eventos** - IDs de símbolos únicos previenen el doble procesamiento (seguridad en Modo Estricto de React)

### Pipeline de Emisión

```typescript
public async emit<C, T>(
  channel: C,
  type: T,
  payload: EM[C][T]
): Promise<void>
```

**Pasos:**

1. **Generación de ID** - Asignar `Symbol` único al evento
2. **Encolar** - Agregar a `eventQueue` (siempre ocurre)
3. **Verificación de Contrapresión** - Si `isProcessingQueue === true`, retornar inmediatamente
4. **Adquirir Bloqueo** - Establecer `isProcessingQueue = true`
5. **Bucle de Drenaje** - Procesar todos los eventos encolados secuencialmente
6. **Liberar Bloqueo** - Establecer `isProcessingQueue = false`

### Flujo de Procesamiento

```
┌─────────────────────────────────────────────────────────────┐
│ emit(channel, type, payload)                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Generar ID    │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │ Encolar Evento│
         └───────┬───────┘
                 │
                 ▼
         ┌────────────────────┐
         │ isProcessingQueue? │
         └───────┬────────┬───┘
                 │        │
            SÍ   │        │ NO
                 │        │
                 ▼        ▼
         ┌────────┐  ┌──────────────┐
         │ Retorno│  │ Flag=true    │
         └────────┘  └──────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ while(queue)  │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │ Deduplicación     │
                    └───────┬───────────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │ Middleware        │──────────────────┐
                    │ (puede cancelar)  │                  │
                    └───────┬───────────┘                  │
                            │                              │
                            │ (permitido)                  │ (rechazado)
                            │                              │
                            ▼                              ▼
                    ┌───────────────────┐      ┌─────────────────────────┐
                    │ Reducers (sync)   │      │ Suscriptores de Eventos │
                    └───────┬───────────┘      │ No Confirmados + Subs   │
                            │                  │ 'all' (phase=           │
                            ▼                  │    'uncommitted')       │
                    ┌───────────────────┐      └─────────────┬───────────┘
                    │ Suscriptores de   │                    │
                    │ Eventos Confirma- │                    ▼
                    │ dos + Subs 'all'  │            ┌───────────────┐
                    │ (phase='committed')│            │ DevTools      │
                    └───────┬───────────┘            │ [CANCELADO]   │
                            │                        └───────┬───────┘
                            ▼                                │
                    ┌───────────────────┐            ┌───────────────┐
                    │ Efectos (async)   │            │ Continuar Loop│
                    └───────┬───────────┘            └───────────────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │ Suscriptores      │
                    │ (si estado cambió)│
                    └───────┬───────────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │ DevTools          │
                    └───────┬───────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Flag=false    │
                    └───────────────┘
```

## Modelo de Contrapresión

### Guardia de Reentrada

El store usa una **bandera booleana** (`isProcessingQueue`) para implementar contrapresión:

```typescript
if (this.isProcessingQueue) return;  // Contrapresión aplicada aquí
```

**Mecanismo:**

- **Primera llamada a `emit()`** adquiere el bloqueo y comienza el drenaje
- **Llamadas subsecuentes a `emit()`** (durante el drenaje) encolan y retornan inmediatamente
- **Llamadas anidadas a `emit()`** (desde middleware/efectos) se encolan para procesamiento posterior

### Modelo de Ejecución

Quo.js usa un modelo de **"paso de testigo"** donde la primera llamada desbloqueada a `emit()` consume toda la cola:

```
Línea de tiempo:

T0: emit('evento1') [Componente A]
    → isProcessingQueue = false
    → Adquirir bloqueo
    → Comenzar bucle de drenaje
   
T1: emit('evento2') [Middleware durante evento1]
    → isProcessingQueue = true (BLOQUEADO)
    → Solo encolar
    → Retornar inmediatamente
   
T2: emit('evento3') [Efecto durante evento1]
    → isProcessingQueue = true (BLOQUEADO)
    → Solo encolar
    → Retornar inmediatamente
   
T3: Continúa bucle de drenaje [emit('evento1') original]
    → Procesar evento1
    → Procesar evento2 (tomado de la cola)
    → Procesar evento3 (tomado de la cola)
    → Liberar bloqueo
    → Retornar
```

**Propiedad Clave:** No hay **hilo consumidor separado o worker**. El consumo de la cola es impulsado enteramente por llamadas a `emit()`.

## Garantías de Ordenamiento

### Ordenamiento FIFO

Los eventos se procesan en estricto orden de encolamiento:

```typescript
await emit('ui', 'evento1', p1);  // Encolado en índice 0
await emit('ui', 'evento2', p2);  // Encolado en índice 1
await emit('ui', 'evento3', p3);  // Encolado en índice 2

// Orden de procesamiento: evento1 → evento2 → evento3 (garantizado)
```

### Serialización

Los eventos **nunca** se procesan concurrentemente:

```typescript
while (this.eventQueue.length) {
  const event = this.eventQueue.shift()!;
 
  // Deduplicación
  if (this.processedEventIds.has(event.id)) continue;
  this.processedEventIds.add(event.id);
 
  // Middleware (async)
  for (const mw of this.middleware) {
    const ok = await mw(state, event, emit);  // ← Espera cada uno
    if (!ok) break;
  }
 
  // Reducers (sync)
  this.reducerBus.emit(event.channel, event.type, event.payload);
 
  // Efectos (async)
  await this.notifyEffects(event);  // ← Espera completación
 
  // Suscriptores (sync)
  if (stateChanged) this.listeners.forEach(l => l());
 
  // DevTools (sync)
  this.devtools?.send(action, state);
}
```

**Propiedad:** El siguiente evento en la cola no comienza a procesarse hasta que el evento actual completa todo su pipeline (incluyendo efectos asíncronos).

### Seguridad de Reentrada

Las llamadas anidadas a `emit()` durante el procesamiento de eventos son seguras:

```typescript
// Middleware que emite
const middleware: MiddlewareFunction = async (state, event, emit) => {
  if (event.type === 'fetchData') {
    await emit('ui', 'loading', true);     // ← Emit anidado
    const data = await fetch('/api');
    await emit('data', 'loaded', data);    // ← Emit anidado
  }
  return true;
};

// Código de usuario
await emit('api', 'fetchData', { url: '/todos' });
// Resultado: 'fetchData' → 'loading' → 'loaded' (en orden)
```

## Modelo de Concurrencia

### JavaScript de un Solo Hilo

El bucle de eventos de JavaScript asegura que solo una llamada a `emit()` se ejecute a la vez:

```typescript
// Componente A (microtarea 1)
emit('evento1');

// Componente B (microtarea 2)
emit('evento2');

// Ejecución real:
// 1. emit('evento1') se ejecuta hasta completarse (o cede a await)
// 2. emit('evento2') se ejecuta (puede encolarse si evento1 aún está drenando)
```

### Programación de Microtareas

Async/await coloca continuaciones en la cola de microtareas:

```typescript
async function ejemplo() {
  await emit('evento1');  // Cede aquí
  // Continuación programada como microtarea
  console.log('después de evento1');
}
```

**Implicación:** Múltiples llamadas a `emit()` desde diferentes componentes pueden intercalarse en límites de await, pero el ordenamiento de la cola se preserva.

## Deduplicación de Eventos

### Protección del Modo Estricto de React

React 18+ Modo Estricto ejecuta efectos dos veces en desarrollo:

```typescript
useEffect(() => {
  emit('analytics', 'pageView', { page });  // ¡Se dispara 2 veces en dev!
}, [page]);
```

**Solución:** El seguimiento de IDs de eventos previene el doble procesamiento:

```typescript
private readonly processedEventIds = new Set<symbol>();

// En el bucle de drenaje:
if (this.processedEventIds.has(event.id)) continue;  // Saltar duplicado
this.processedEventIds.add(event.id);
```

### Estrategia de Limpieza

Los IDs se limpian periódicamente para prevenir fugas de memoria:

```typescript
// Constructor
this.eventIdCleanupTimer = setInterval(() => {
  this.processedEventIds.clear();
}, cleanupInterval);  // 30s dev, 5min prod

// Disposición
public dispose(): void {
  if (this.eventIdCleanupTimer) {
    clearInterval(this.eventIdCleanupTimer);
    this.eventIdCleanupTimer = null;
  }
  this.processedEventIds.clear();
}
```

**Suposición:** Los eventos más antiguos que el intervalo de limpieza nunca serán re-emitidos (seguro para la mayoría de las aplicaciones).

## Características de Rendimiento

### Complejidad Temporal

| Operación | Complejidad | Notas |
|-----------|------------|-------|
| `emit()` encolar | O(1) | Push de array |
| `emit()` drenar (cola vacía) | O(n×m) | n = eventos, m = middleware+efectos |
| `emit()` drenar (cola tiene eventos) | O(1) | Retorna inmediatamente |
| Deduplicación de eventos | O(1) | Búsqueda en Set |
| Pipeline de middleware | O(k) | k = número de middleware |
| Despacho de reducer | O(1) | Emisión directa de EventBus |
| Despacho de efecto | O(1) | Búsqueda en Map por clave |

### Complejidad Espacial

| Estructura | Complejidad | Notas |
|-----------|------------|-------|
| `eventQueue` | O(n) | n = eventos encolados (sin límite) |
| `processedEventIds` | O(m) | m = eventos desde última limpieza |
| `middleware` | O(k) | k = middleware registrado |
| `effects` | O(e) | e = efectos registrados |

### Cuellos de Botella

1. **Reducers Lentos** - Bloquean toda la cola (síncrono)
2. **Middleware Lento** - Bloquea el procesamiento de eventos (asíncrono pero secuencial)
3. **Efectos Lentos** - Bloquea el siguiente evento en la cola (asíncrono pero secuencial)
4. **Crecimiento de Cola** - Uso de memoria sin límite si los eventos se encolan más rápido que el procesamiento

## Modos de Falla

### Desbordamiento de Cola (Crecimiento Sin Límite)

**Escenario:** Los eventos se encolan más rápido de lo que pueden procesarse.

```typescript
// Caso patológico: Emisión recursiva
registerEffect({
  events: [['ui', 'tick']],
  effect: async (evt, getState, emit) => {
    await emit('ui', 'tick', evt.payload + 1);  // ¡Recursión infinita!
  }
});

emit('ui', 'tick', 0);  // La cola crece sin límite
```

**Síntomas:**
- Uso creciente de memoria
- Rendimiento degradado
- Eventual fallo por OOM

**Mitigación:** La aplicación debe evitar bucles infinitos. El store no tiene protección incorporada.

### Inanición del Bucle de Eventos

**Escenario:** Un reducer de larga ejecución bloquea el bucle de eventos.

```typescript
reducer: (state, event) => {
  // Computación síncrona y costosa
  for (let i = 0; i < 1e9; i++) {
    // Trabajo intensivo de CPU
  }
  return { ...state, result: i };
}
```

**Síntomas:**
- UI se congela
- Otros eventos atascados en la cola
- Mala experiencia de usuario

**Mitigación:** Mantener reducers rápidos y puros. Mover computación pesada a efectos o Web Workers.

### Cancelación de Middleware

**Escenario:** El middleware cancela el evento retornando `false`.

```typescript
const authMiddleware: MiddlewareFunction = (state, event) => {
  if (!state.auth.isAuthenticated) {
    console.warn('Evento no autorizado:', event);
    return false;  // Cancelar propagación
  }
  return true;
};
```

**Comportamiento:**
- El evento se desencola pero no se procesa
- Los reducers y efectos nunca ven el evento
- Los suscriptores no son notificados
- El evento se pierde (sin mecanismo de reintento)

**Consideración:** Asegurar que la cancelación sea intencional y apropiadamente registrada.

### Errores de Efectos

**Escenario:** Un efecto lanza un error.

```typescript
registerEffect({
  events: [['api', 'fetch']],
  effect: async (evt) => {
    const res = await fetch(evt.payload.url);
    const data = await res.json();  // Puede lanzar si no es JSON
    // ...
  }
});
```

**Comportamiento:**
- El error se captura y registra: `console.error("Error de efecto:", err);`
- Otros efectos aún se ejecutan
- El drenaje de cola continúa
- La aplicación debe manejar el estado de error mediante eventos de error

**Mejor Práctica:** Los efectos deben capturar errores y emitir eventos de falla:

```typescript
effect: async (evt, getState, emit) => {
  try {
    const data = await fetchData(evt.payload.url);
    await emit('api', 'fetchSuccess', data);
  } catch (error) {
    await emit('api', 'fetchFailure', { error: error.message });
  }
}
```

## Suscripciones a Eventos (v0.7.0+)

### Descripción General

Las suscripciones a eventos proporcionan una forma de observar eventos sin afectar el flujo de eventos. A diferencia del middleware (que puede cancelar eventos) y los efectos (que se ejecutan después del pipeline de eventos), las suscripciones a eventos son puramente observacionales.

### Fases de Suscripción

| Fase | Cuándo se Notifica | Caso de Uso |
|------|-------------------|-------------|
| `'committed'` | Después de reducers, antes de efectos | Reaccionar a cambios de estado exitosos |
| `'uncommitted'` | Después de rechazo del middleware | Reaccionar a eventos bloqueados |
| `'all'` | Ambas fases (con parámetro phase) | Logging, analíticas, depuración |

### Orden de Procesamiento

**Para eventos confirmados:**
```
Middleware (permite) → Reducers → Subs de Eventos Confirmados → Efectos → Suscriptores Gruesos
```

**Para eventos no confirmados:**
```
Middleware (rechaza) → Subs de Eventos No Confirmados → DevTools [CANCELADO]
```

### Firma del Handler

```typescript
type EventSubscriptionHandler = (
  event: EventUnion<EM>,
  getState: () => S,
  emit: Emit<EM>,
  phase: 'committed' | 'uncommitted'
) => void | Promise<void>;
```

**Parámetros:**
- `event` - El objeto de evento completo `{ channel, type, payload, id }`
- `getState` - Retorna el estado actual (después de reducers para confirmados, sin cambios para no confirmados)
- `emit` - Permite emitir nuevos eventos desde el handler
- `phase` - La fase que activó esta notificación

### Manejo de Errores

Los errores en suscripciones de eventos se capturan y registran, permitiendo que otras suscripciones continúen:

```typescript
// Si una suscripción lanza error, las demás aún se ejecutan
store.onEvent('ui', 'click', () => { throw new Error('boom'); });
store.onEvent('ui', 'click', () => { console.log('aún se ejecuta'); }); // ✅
```

### Ejemplo de Uso

```typescript
// Eventos confirmados (por defecto)
store.onEvent('ui', 'save', (event, getState, emit, phase) => {
  console.log('Guardado confirmado, nuevo estado:', getState());
});

// Eventos no confirmados
store.onEvent('ui', 'delete', (event, getState, emit, phase) => {
  console.log('Eliminación fue bloqueada por el middleware');
}, 'uncommitted');

// Todos los eventos
store.onEvent('ui', 'action', (event, getState, emit, phase) => {
  analytics.track(`event_${phase}`, { type: event.type });
}, 'all');
```

## Comparación con Otras Bibliotecas

### Redux (Síncrono)

```typescript
// Redux: Procesamiento inmediato y síncrono
dispatch({ type: 'ADD_TODO', payload: todo });
// ↑ Bloquea hasta que todos los reducers completan
// ↑ Sin cola, sin soporte asíncrono

const state = store.getState();  // Refleja el cambio inmediatamente
```

**Propiedades:**
- ✅ Temporización predecible
- ✅ Modelo mental simple
- ❌ Sin soporte de middleware asíncrono (requiere redux-thunk/saga)
- ❌ Bloquea el bucle de eventos si el reducer es lento

### Zustand (Síncrono)

```typescript
// Zustand: Actualizaciones de estado inmediatas y síncronas
set({ todos: [...todos, newTodo] });
// ↑ Mutación síncrona + notificación

get().todos;  // Tiene inmediatamente el nuevo todo
```

**Propiedades:**
- ✅ Sobrecarga mínima
- ✅ API simple
- ❌ Sin patrones asíncronos incorporados
- ❌ Sin garantías de ordenamiento de eventos con actualizaciones concurrentes

### XState (Modelo de Actor)

```typescript
// XState: Buzón de actor asíncrono
actor.send({ type: 'FETCH' });
actor.send({ type: 'UPDATE' });
// ↑ Eventos encolados en el buzón del actor
// ↑ Procesados asincrónicamente por la máquina de estado

// Múltiples actores pueden procesar concurrentemente
```

**Propiedades:**
- ✅ Verdadero procesamiento concurrente (múltiples actores)
- ✅ Semántica de máquina de estado asíncrona incorporada
- ❌ Modelo mental complejo
- ❌ Mayor sobrecarga de memoria (un buzón por actor)

### Quo.js (Cola Asíncrona)

```typescript
// Quo.js: Cola asíncrona serializada
await emit('todo', 'add', todo);
// ↑ Retorna promesa cuando el procesamiento se completa
// ↑ Encolado si otro evento está procesándose

await emit('todo', 'delete', id);
// ↑ Garantizado procesar después de 'add'
```

**Propiedades:**
- ✅ Soporte de middleware/efectos asíncronos
- ✅ Garantías estrictas de ordenamiento
- ✅ Seguro para reentrada
- ❌ Cola sin límites (riesgo de memoria)
- ❌ Sin procesamiento paralelo (cola única)

## Justificación del Diseño

### ¿Por Qué Asíncrono?

**Requisito:** Soportar middleware y efectos asíncronos sin bloquear la aplicación.

**Alternativa Considerada:** Modelo síncrono (como Redux)
- **Rechazada:** Requiere capa de orquestación asíncrona separada (thunks, sagas)
- **Elegida:** Soporte asíncrono incorporado mediante tipo de retorno `Promise<void>`

### ¿Por Qué Cola Única?

**Requisito:** Garantizar ordenamiento de eventos para transiciones de estado predecibles.

**Alternativa Considerada:** Múltiples colas (por canal o por reducer)
- **Rechazada:** Semántica de ordenamiento compleja, potenciales condiciones de carrera
- **Elegida:** Cola única asegura ordenamiento global

### ¿Por Qué Guardia de Reentrada?

**Requisito:** Prevenir corrupción de cola por llamadas anidadas a `emit()`.

**Alternativa Considerada:** Prohibir emits anidados (lanzar error)
- **Rechazada:** Rompe patrones comunes (middleware emitiendo eventos)
- **Elegida:** Encolar y diferir eventos anidados

### ¿Por Qué Sin Límite de Cola?

**Requisito:** Nunca descartar eventos en producción (riesgo de pérdida de datos).

**Alternativa Considerada:** Buffer circular de tamaño fijo con política de desbordamiento
- **Considerada:** Podría descartar eventos o lanzar errores en desbordamiento
- **Elegida:** Cola sin límites prioriza corrección sobre seguridad de memoria
- **Futuro:** Puede agregar límites opcionales con políticas configurables


-------


## Apéndice: Referencia de Implementación

### Bucle de Eventos Central

```typescript
public async emit<C extends keyof EM, T extends keyof EM[C]>(
  channel: C,
  type: T,
  payload: EM[C][T],
): Promise<void> {
  const id = Symbol("event");
 
  this.eventQueue.push({
    channel: channel as string,
    type: type as string,
    payload,
    id,
  });

  if (this.isProcessingQueue) return;

  this.isProcessingQueue = true;
  try {
    while (this.eventQueue.length) {
      const { channel, type, payload, id } = this.eventQueue.shift()!;

      if (this.processedEventIds.has(id)) {
        continue;
      }

      this.processedEventIds.add(id);

      const event = { channel, type, payload, id } as Event<EM, C, T>;
      let propagate = true;

      for (const mw of this.middleware) {
        try {
          const ok = await mw(this.state, event, this.emit);
          if (!ok) {
            propagate = false;
            break;
          }
        } catch (err) {
          console.error("Error de middleware:", err);
          propagate = false;
          break;
        }
      }

      if (!propagate) {
        this.devtools?.send(
          { type: `Channel: ${channel} - Type: ${type} [CANCELADO]`, payload },
          this.state,
        );
        continue;
      }

      const stateBefore = this.state;
      this.reducerBus.emit(channel as C, type as T, payload);
      const stateAfter = this.state;
      const anySliceChanged = stateBefore !== stateAfter;

      await this.notifyEffects(event as any);

      if (anySliceChanged) {
        this.listeners.forEach((l) => l());
      }

      this.devtools?.send(
        { type: `Channel: ${channel} - Type: ${type}`, payload },
        this.state,
      );
    }
  } catch (err) {
    console.error("Error de cola de emit:", err);
  } finally {
    this.isProcessingQueue = false;
  }
}
```

### Deduplicación de Eventos

```typescript
private readonly processedEventIds = new Set<symbol>();
private eventIdCleanupTimer: ReturnType<typeof setInterval> | null = null;

constructor(spec: StoreSpec<R, S, EM>) {
  // ...
 
  const cleanupInterval =
    process.env.NODE_ENV === "production" ? 5 * 60 * 1000 : 30 * 1000;
   
  this.eventIdCleanupTimer = setInterval(() => {
    this.processedEventIds.clear();
  }, cleanupInterval);
}

public dispose(): void {
  if (this.eventIdCleanupTimer) {
    clearInterval(this.eventIdCleanupTimer);
    this.eventIdCleanupTimer = null;
  }
  this.processedEventIds.clear();
}
```

---

## Glosario

**Contrapresión**: Mecanismo para prevenir desbordamiento de cola ralentizando o bloqueando la producción de eventos.

**Paso de Testigo**: Modelo de ejecución donde el control se transfiere de una operación asíncrona a otra.

**Bucle de Drenaje**: El bucle `while` que procesa todos los eventos encolados secuencialmente.

**FIFO**: First-In-First-Out - los eventos se procesan en orden de encolamiento.

**Reentrada**: Propiedad que permite que una función sea llamada mientras ya se está ejecutando.

**Serialización**: Procesar eventos uno a la vez, nunca concurrentemente.

---

## Historial de Revisiones

| Versión | Fecha | Cambios |
|---------|------|---------|
| 0.7.0 | 2026-01 | Añadida característica de Suscripciones a Eventos (fases committed/uncommitted/all) |
| 0.5.0 | 2026-01 | Documentación inicial de arquitectura de cola asíncrona |

---

**Autor**: Equipo Quo.js 
**Licencia**: MIT 
**Repositorio**: https://github.com/quojs/quojs