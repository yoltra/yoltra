import { Suspense } from "react";
import { Card, Heading, Inline, Skeleton, Stack, Text } from "@yoltra/ds";

import { useSuspenseAtomicProp } from "../state/store";
import type { AppState } from "../state/types";

/**
 * How long the "computation" takes, so the loading state is visible rather than theoretical.
 */
const ANALYSIS_MS = 900;

interface Forecast {
  window: string;
  confidence: number;
  advisory: string;
}

/**
 * Something genuinely asynchronous, derived from state.
 *
 * A real deployment would call a flight-dynamics service here. The shape is what matters: the
 * loader receives the value at the subscribed path, returns a promise, and the component reads
 * the result as an ordinary value — no loading flag, no error flag, no `undefined` to guard.
 */
async function analyse(panelsDeployed: number): Promise<Forecast> {
  await new Promise((resolve) => setTimeout(resolve, ANALYSIS_MS));
  return {
    window: panelsDeployed > 1 ? "T+04:20 → T+06:00" : "T+09:10 → T+10:30",
    confidence: Math.min(99, 62 + panelsDeployed * 11),
    advisory:
      panelsDeployed > 1
        ? "Array output sufficient for a high-burn transfer."
        : "Deploy more panels before the next transfer window.",
  };
}

/**
 * The suspending half.
 *
 * `useSuspenseAtomicProp` throws a promise while the loader runs, so React shows the nearest
 * fallback and this component's body only ever sees a settled value. The cache is keyed on the
 * subscribed path, so the analysis re-runs when — and only when — the panel count changes.
 *
 * The hook comes from `../state/store` — the set `createYoltra` returned — rather than from the
 * `@yoltra/react` barrel. The barrel's copy reads the package-level context, which this app
 * never fills; this one already knows the store, which is also why the reducer name and the
 * state shape need no type arguments here.
 */
function ForecastBody() {
  const forecast = useSuspenseAtomicProp(
    // A wildcard, and the choice matters. Subscribing to `satellites` would re-run the
    // analysis on every telemetry tick, because a battery reading is a change to that array.
    // `satellites.*.panelsDeployed` wakes only when a panel is deployed or stowed, which is
    // the only input the forecast actually reads.
    { reducer: "fleet", property: "satellites.*.panelsDeployed" },
    {
      load: (_matched, slice) =>
        analyse((slice as AppState["fleet"]).satellites.filter((s) => s.panelsDeployed).length),
      // Held until the subscribed path changes, rather than re-run on a clock.
      staleTime: 0,
    },
  );

  return (
    <Stack gap={2}>
      <Inline justify="between">
        <Text size="sm" weight="medium">
          {forecast.window}
        </Text>
        <Text size="sm" tone={forecast.confidence > 80 ? "brand" : "secondary"}>
          {forecast.confidence}% confidence
        </Text>
      </Inline>
      <Text size="sm" tone="secondary">
        {forecast.advisory}
      </Text>
    </Stack>
  );
}

/** The skeleton React shows while the analysis runs. */
function ForecastSkeleton() {
  return (
    <Stack gap={2}>
      <Inline justify="between">
        <Skeleton width="14rem" />
        <Skeleton width="8rem" />
      </Inline>
      <Skeleton width="100%" />
    </Stack>
  );
}

/**
 * Transfer-window forecast, recomputed whenever the fleet deploys or stows panels.
 *
 * The Suspense boundary lives here rather than at the app root on purpose: a boundary placed
 * high turns one slow value into a blank page, while one placed at the edge of the thing that
 * is loading leaves the rest of the interface interactive.
 */
export function OrbitalForecast() {
  return (
    <Card padding={4} elevation="sm">
      <Stack gap={3}>
        <Inline justify="between">
          <Heading level={3} size="sm">
            Transfer window
          </Heading>
          <Text size="xs" tone="muted">
            useSuspenseAtomicProp
          </Text>
        </Inline>
        <Suspense fallback={<ForecastSkeleton />}>
          <ForecastBody />
        </Suspense>
      </Stack>
    </Card>
  );
}
