import { DevtoolsApp } from "@yoltra/devtools-storeview";

import { loopback } from "../state/store";

/**
 * The embedded DevTools panel — the SAME UI as the browser extension, but wired
 * to the in-page loopback hub via `config.WebSocket` instead of a real socket.
 */
export function DevtoolsPanel() {
  return (
    <div className="devtools-pane">
      <DevtoolsApp config={{ port: 0, WebSocket: loopback.WebSocket }} />
    </div>
  );
}
