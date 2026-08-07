import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // Type declarations and re-export barrels compile to nothing executable, so counting them
      // measures how much of the package is types rather than how much of its logic is tested.
      exclude: [
        "src/index.ts",
        "src/messages.ts",
        "src/handshake.ts",
        "src/capabilities.ts",
        "src/json-patch.ts",
        "src/wire.ts",
        "src/roles.ts",
        "src/version.ts",
      ],
      // Set at what is actually met, so a regression fails the build. The codec and the patch
      // utilities sit above 95%; the reconnecting transport sits near 28% and is what holds the
      // total down. It is deliberately *not* excluded — hiding an untested module makes the
      // number look better and the package no safer.
      // Raised back after `ws-transport` was given the socket-simulation tests it had never
      // had. It sat at 28% while the state codec's coverage carried the package aggregate to
      // 66%; when the codec moved to `@yoltra/core` the average went with it and the honest
      // number was 43%. Now the reconnect state machine — backoff, epoch guard, handshake
      // refusal, buffering — is actually exercised, and the floor is the measurement rather
      // than whatever the neighbours happened to average out to.
      thresholds: { lines: 94, statements: 94, branches: 82, functions: 95 },
    },
  },
});
