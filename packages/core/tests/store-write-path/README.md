# store-write-path

Guards the C1 write-path contract:

- Committing an event does **not** deep-clone the changed slice, so untouched
  sibling subtrees keep their identity (structural sharing) — writes cost
  O(change), not O(state size).
- Committed slices are still deep-frozen in development.
