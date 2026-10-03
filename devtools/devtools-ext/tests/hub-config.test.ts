import { describe, expect, it } from "vitest";

import { DEFAULT_HOST, DEFAULT_PORT, SETTINGS_KEYS, hubConnection } from "../src/hub-config";

/**
 * The connection the panel mounts with when it talks to a hub.
 *
 * A hub started with a token refuses any panel that does not present it, and the panel had no
 * way to: the popup saved a host and a port only. The token is now saved beside them and sent.
 */

describe("hubConnection", () => {
  it("presents the saved token", () => {
    const config = hubConnection({ hubHost: "devbox", hubPort: 9900, hubToken: "s3cret" });

    expect(config).toMatchObject({ host: "devbox", port: 9900, authToken: "s3cret" });
  });

  it("reads the token from the key beside the host and port", () => {
    expect(SETTINGS_KEYS).toEqual(["hubHost", "hubPort", "hubToken"]);
  });

  it("sends no token when none is saved, or the saved one is empty", () => {
    expect("authToken" in hubConnection({})).toBe(false);
    expect("authToken" in hubConnection({ hubToken: "" })).toBe(false);
  });

  it("falls back to the defaults for anything missing or malformed", () => {
    expect(hubConnection({ hubHost: "", hubPort: "9900", hubToken: 42 })).toEqual({
      host: DEFAULT_HOST,
      port: DEFAULT_PORT,
      extensionName: "Browser DevTools",
      autoReconnect: true,
    });
  });
});
