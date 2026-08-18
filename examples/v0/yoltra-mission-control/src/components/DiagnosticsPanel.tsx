import { useCallback, useRef, useState } from "react";
import { Badge, Button, Card, Heading, Inline, Stack, Text } from "@yoltra/ds";

import { store } from "../state/store";

/**
 * `store.call()` — request/reply over the event bus, in both of its shapes.
 *
 * A scan is one request that produces many replies: one `scanStep` per subsystem, then a
 * terminal `scanReport`. The call object is **awaitable** for the report and **async-iterable**
 * for the steps, so this component does both at once — iterate to render progress, then await
 * for the result.
 *
 * Two things are worth noticing in the responder (`src/state/effects.ts`):
 *
 * - **There is no correlation id.** It replies through the `emit` it was handed, and the store
 *   stamps causality on the way out. Nothing to mint, echo, or forget.
 * - **It goes at this component's pace.** `highWaterMark: 1` means the effect's
 *   `await emit("diagnostics", "scanStep", …)` does not resolve until the loop below has taken
 *   the step. Turn on "slow render" and watch the whole scan stretch out — the producer is
 *   waiting on the UI, not filling a buffer.
 */
export function DiagnosticsPanel({ satelliteId }: { satelliteId: string }) {
  const [steps, setSteps] = useState<Array<{ subsystem: string; ok: boolean }>>([]);
  const [report, setReport] = useState<{ faults: string[]; checked: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "scanning" | "failed">("idle");
  const [slow, setSlow] = useState(false);

  // Held so the scan can be cancelled from the button, and on unmount.
  const active = useRef<{ cancel: (reason?: string) => void } | null>(null);

  const scan = useCallback(async () => {
    setSteps([]);
    setReport(null);
    setStatus("scanning");

    const call = store.call(
      "diagnostics",
      "scan",
      { id: satelliteId },
      {
        // Only `scanReport` ends the call; every other correlated event on the channel is
        // progress and arrives through the loop below.
        reply: ["diagnostics", "scanReport"],
        // One step in flight. The responder cannot run ahead of this component.
        highWaterMark: 1,
        // Idle, not total: the scan may take as long as it likes, provided it keeps reporting.
        timeoutMs: 4000,
      },
    );
    active.current = call;

    try {
      for await (const step of call) {
        const { subsystem, ok } = step.payload as { subsystem: string; ok: boolean };
        setSteps((prev) => [...prev, { subsystem, ok }]);
        if (slow) await new Promise((r) => setTimeout(r, 600));
      }

      const done = await call;
      setReport(done.payload as { faults: string[]; checked: number });
      setStatus("idle");
    } catch {
      // Timeout, abort, or cancel — all arrive here, and the subscription is already gone.
      setStatus("failed");
    } finally {
      active.current = null;
    }
  }, [satelliteId, slow]);

  return (
    <Card>
      <Stack gap={2}>
        <Inline gap={2}>
          <Heading level={3}>Diagnostics</Heading>
          {status === "scanning" && <Badge>scanning…</Badge>}
          {status === "failed" && <Badge variant="brand">stopped</Badge>}
        </Inline>

        <Text>
          One <code>store.call()</code>: awaited for the report, iterated for the steps.
        </Text>

        <Inline gap={2}>
          <Button onClick={scan} disabled={status === "scanning"}>
            Run scan
          </Button>
          <Button
            variant="ghost"
            onClick={() => active.current?.cancel("cancelled by operator")}
            disabled={status !== "scanning"}
          >
            Cancel
          </Button>
          <label>
            <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} />
            {" slow render (watch the producer wait)"}
          </label>
        </Inline>

        {steps.length > 0 && (
          <Stack gap={1}>
            {steps.map((s) => (
              <Inline key={s.subsystem} gap={2}>
                <Badge variant={s.ok ? undefined : "brand"}>{s.ok ? "ok" : "fault"}</Badge>
                <Text>{s.subsystem}</Text>
              </Inline>
            ))}
          </Stack>
        )}

        {report !== null && (
          <Text>
            {report.faults.length === 0
              ? `All ${report.checked} subsystems nominal.`
              : `${report.faults.length} of ${report.checked} reporting faults: ${report.faults.join(", ")}.`}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
