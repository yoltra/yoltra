# warnOnce Utility Test Suite

## Purpose

`warnOnce` provides development-time diagnostics without spamming the console.

This utility is heavily used for:

- Deprecation warnings
- Migration guides
- Performance hints
- Feature flag diagnostics

---

## Scenarios Tested

### ✓ Logs once per key

Ensures:

```ts
warnOnce("x", "msg");
warnOnce("x", "msg");
```

produces **1 log**, not 2. Prevents console floods when the code path runs repeatedly.

### ✓ Is a no-op in production

Production builds must not emit logs.  
Avoids both performance and UX regression in user-facing environments.

The test explicitly toggles `process.env.NODE_ENV` to `production` and asserts that no warnings are logged, even when `warnOnce` is called.

---

## Why This Matters

This utility is critical during the v0.5 → v0.6 → v1.0 migration phases, where backward compatibility warnings guide users forward.

Proper logging discipline here improves DX without penalizing runtime performance.