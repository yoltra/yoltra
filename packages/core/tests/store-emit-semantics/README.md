# store-emit-semantics

Guards the C3 emit contract:

- The **reduce phase** (middleware → reducers → subscribers → coarse listeners)
  runs **synchronously**, so `getState()` reflects the change the moment `emit()`
  returns — even when middleware is registered.
- Coarse subscribers are notified synchronously within `emit`.
- The promise returned by `emit()` resolves **after this event's effects
  complete** — including for re-entrant emits issued from inside an effect
  (which must not deadlock).
