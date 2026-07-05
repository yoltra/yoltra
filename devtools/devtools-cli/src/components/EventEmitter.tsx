/**
 * @module @yoltra/devtools-cli
 */

import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { useState } from "react";

/**
 * Terminal event emitter form.
 *
 * Provides channel, type, and JSON payload fields using `ink-text-input`.
 * Enter advances between fields and submits from the payload field.
 * Validates JSON before emitting and shows inline success/error feedback.
 *
 * Note: `ink-text-input` is an optional peer dependency.
 *
 * @param props.onEmit - Callback invoked with the channel, type, and parsed payload.
 * @public
 */
export function EventEmitter({
  onEmit,
}: {
  onEmit: (channel: string, type: string, payload: unknown) => void;
}) {
  const [channel, setChannel] = useState("");
  const [type, setType] = useState("");
  const [payload, setPayload] = useState("{}");
  const [activeField, setActiveField] = useState<"channel" | "type" | "payload">("channel");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    if (!channel.trim() || !type.trim()) {
      setError("Channel and type are required");
      return;
    }
    try {
      const parsed = JSON.parse(payload);
      setError(null);
      setSuccess(true);
      onEmit(channel.trim(), type.trim(), parsed);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("Invalid JSON payload");
    }
  };

  return (
    <Box flexDirection='column' paddingX={1} gap={1}>
      <Box gap={1}>
        <Text dimColor>Channel:</Text>
        {activeField === "channel" ? (
          <TextInput
            value={channel}
            onChange={setChannel}
            onSubmit={() => setActiveField("type")}
            placeholder='e.g., counter'
          />
        ) : (
          <Text color='blue'>{channel || "(empty)"}</Text>
        )}
      </Box>

      <Box gap={1}>
        <Text dimColor>Type:</Text>
        {activeField === "type" ? (
          <TextInput
            value={type}
            onChange={setType}
            onSubmit={() => setActiveField("payload")}
            placeholder='e.g., increment'
          />
        ) : (
          <Text color='blue'>{type || "(empty)"}</Text>
        )}
      </Box>

      <Box gap={1}>
        <Text dimColor>Payload:</Text>
        {activeField === "payload" ? (
          <TextInput
            value={payload}
            onChange={setPayload}
            onSubmit={handleSubmit}
            placeholder='{ "amount": 1 }'
          />
        ) : (
          <Text color='blue'>{payload}</Text>
        )}
      </Box>

      {error && <Text color='red'>{error}</Text>}
      {success && <Text color='green'>Event emitted!</Text>}
      <Text dimColor>Enter: next field / submit | Tab: switch panel</Text>
    </Box>
  );
}
