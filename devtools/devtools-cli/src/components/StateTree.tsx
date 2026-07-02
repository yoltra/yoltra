/**
 * @module @yoltra/devtools-cli
 */

import { Box, Text } from "ink";

/**
 * Terminal state tree -- recursive key/value display.
 *
 * Renders the current store state as an indented, color-coded tree
 * in the terminal. Recursion is capped at `maxDepth` (4 levels) and
 * arrays are capped at 20 items to keep output manageable.
 *
 * @param props.state - The store state snapshot to display.
 * @param props.loading - Whether a state fetch is in progress.
 * @public
 */
export function StateTree({ state, loading }: { state: unknown; loading: boolean }) {
  if (loading && state == null) {
    return (
      <Box paddingX={1}>
        <Text dimColor>Loading state...</Text>
      </Box>
    );
  }

  if (state == null) {
    return (
      <Box paddingX={1}>
        <Text dimColor>No state available</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection='column' paddingX={1}>
      <StateNode value={state} depth={0} maxDepth={4} />
    </Box>
  );
}

function StateNode({
  value,
  keyName,
  depth,
  maxDepth,
}: {
  value: unknown;
  keyName?: string;
  depth: number;
  maxDepth: number;
}) {
  const indent = "  ".repeat(depth);
  const prefix = keyName != null ? <Text color='blue'>{keyName}: </Text> : null;

  if (value === null) {
    return (
      <Text>
        {indent}
        {prefix}
        <Text dimColor>null</Text>
      </Text>
    );
  }

  if (value === undefined) {
    return (
      <Text>
        {indent}
        {prefix}
        <Text dimColor>undefined</Text>
      </Text>
    );
  }

  if (typeof value === "string") {
    return (
      <Text>
        {indent}
        {prefix}
        <Text color='green'>&quot;{value}&quot;</Text>
      </Text>
    );
  }

  if (typeof value === "number") {
    return (
      <Text>
        {indent}
        {prefix}
        <Text color='yellow'>{String(value)}</Text>
      </Text>
    );
  }

  if (typeof value === "boolean") {
    return (
      <Text>
        {indent}
        {prefix}
        <Text color='cyan'>{String(value)}</Text>
      </Text>
    );
  }

  if (depth >= maxDepth) {
    return (
      <Text>
        {indent}
        {prefix}
        <Text dimColor>{JSON.stringify(value).slice(0, 60)}...</Text>
      </Text>
    );
  }

  if (Array.isArray(value)) {
    return (
      <Box flexDirection='column'>
        <Text>
          {indent}
          {prefix}Array({value.length})
        </Text>
        {value.slice(0, 20).map((item, i) => (
          <StateNode
            key={i}
            value={item}
            keyName={String(i)}
            depth={depth + 1}
            maxDepth={maxDepth}
          />
        ))}
        {value.length > 20 && (
          <Text>
            {indent} <Text dimColor>... {value.length - 20} more</Text>
          </Text>
        )}
      </Box>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <Box flexDirection='column'>
        <Text>
          {indent}
          {prefix}
          {`{${entries.length}}`}
        </Text>
        {entries.map(([k, v]) => (
          <StateNode key={k} value={v} keyName={k} depth={depth + 1} maxDepth={maxDepth} />
        ))}
      </Box>
    );
  }

  return (
    <Text>
      {indent}
      {prefix}
      {String(value)}
    </Text>
  );
}
