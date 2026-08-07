# Benchmarks

```sh
rushx bench           # run them
rushx bench:check     # compare against baseline.json
rushx bench:record    # overwrite the baseline, deliberately
```

Reporting, not gating. The variance on a shared runner is not yet characterised, and a
benchmark gate that fails intermittently is one people learn to bypass — the same reasoning
that put the coverage thresholds at measured floors. Recording a baseline is manual so that a
regression cannot be normalised away by a routine re-run.

## What they showed

Numbers from the machine that recorded `baseline.json`; treat the ratios as the durable part.

**Wildcard subscriptions cost what the pattern count says.** Exact delivery is a map lookup
and stays flat at ~0.19 µs. Wildcard delivery walks every registered pattern:

| Patterns | Wildcard | vs exact |
| --- | --- | --- |
| 1 | 0.54 µs | 3.3× |
| 10 | 2.69 µs | 16× |
| 100 | 23.7 µs | 131× |
| 1000 | 241.8 µs | 1252× |

Cleanly linear, which is what a pattern index would flatten.

**Positional arrays are cheap to update and expensive to reorder.** At 1000 rows, updating one
element diffs in 20 µs; inserting at the front takes 1200 µs and reports nearly every index as
changed.

**Normalising trades one for the other.** The same insert costs 371 µs and reports two paths,
but a single-field update costs 470 µs against the array's 20 µs — the object branch of the
diff enumerates keys where the array branch indexes.

**Subscribers are not the cost; the diff is.** Fifty subscribers on untouched paths cost what
zero subscribers cost, fifty on the changed path add about 2%, and attaching an
instrumentation observer adds about 3%. Whatever is slow in a commit, it is not the
notification fan-out.
