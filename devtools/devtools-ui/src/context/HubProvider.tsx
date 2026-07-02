/**
 * Provider component that manages the WebSocket connection to the DevTools hub
 * and exposes it to the React tree via {@link HubContext}.
 *
 * @remarks
 * `HubProvider` owns the full connection lifecycle: initial handshake,
 * exponential-backoff reconnection, message fan-out to subscribers, and
 * graceful teardown on unmount. All DevTools UI hooks depend on this
 * provider being present in the ancestor tree.
 *
 * @module @yoltra/devtools-ui
 */

import {
  DevtoolsRole,
  PROTOCOL_VERSION,
  type DevtoolsMessage,
  type ExtensionCapabilities,
} from "@yoltra/devtools-protocol";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { HubConnectionConfig, HubConnectionStatus, HubContextValue } from "../types";
import { HubContext } from "./HubContext";

/** @internal Default extension capabilities advertised during handshake. */
const DEFAULT_CAPABILITIES: ExtensionCapabilities = {
  timeTravel: true,
  eventReplay: true,
  stateExplorer: true,
  eventEmit: true,
  performanceMetrics: true,
};

/** @internal Base delay (ms) for exponential backoff reconnection. */
const RECONNECT_BASE_MS = 750;

/** @internal Maximum delay (ms) cap for exponential backoff reconnection. */
const RECONNECT_MAX_MS = 30_000;

/**
 * Provides hub connection context to all child hooks and components.
 *
 * @remarks
 * On mount the provider opens a WebSocket to the hub, performs the protocol
 * handshake, and begins dispatching incoming messages to all subscribers. If
 * the connection drops and `autoReconnect` is enabled (default), it
 * reconnects with exponential backoff up to `maxReconnectAttempts`.
 *
 * @example
 * ```tsx
 * import { HubProvider } from "@yoltra/devtools-ui";
 *
 * function App() {
 *   return (
 *     <HubProvider config={{ port: 8900 }}>
 *       <DevToolsPanel />
 *     </HubProvider>
 *   );
 * }
 * ```
 *
 * @param props.config - Connection configuration (see {@link HubConnectionConfig}).
 * @param props.children - React children that will have access to the hub context.
 * @returns A React element wrapping children in {@link HubContext.Provider}.
 *
 * @public
 */
export function HubProvider({
  config,
  children,
}: {
  config: HubConnectionConfig;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<HubConnectionStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const subscribersRef = useRef<Set<(msg: DevtoolsMessage) => void>>(new Set());
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const extensionIdRef = useRef(crypto.randomUUID());
  const configRef = useRef(config);
  configRef.current = config;

  const connect = useCallback(() => {
    const cfg = configRef.current;
    const host = cfg.host ?? "localhost";
    const url = `ws://${host}:${cfg.port}`;
    const WS =
      cfg.WebSocket ??
      (typeof globalThis.WebSocket !== "undefined" ? globalThis.WebSocket : undefined);

    if (!WS) {
      console.error(
        "[Yoltra DevTools] No WebSocket implementation available. In Node.js, pass { WebSocket } from 'ws' via config.WebSocket.",
      );
      return;
    }

    setStatus("connecting");

    try {
      const ws = new WS(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;

        const handshake = JSON.stringify({
          type: "HANDSHAKE_REQUEST",
          protocolVersion: PROTOCOL_VERSION,
          role: DevtoolsRole.EXTENSION,
          extension: {
            id: extensionIdRef.current,
            name: cfg.extensionName ?? "DevTools UI",
            capabilities: DEFAULT_CAPABILITIES,
          },
        });
        ws.send(handshake);
      };

      ws.onmessage = (event) => {
        try {
          // Handle both string (browser) and Buffer (Node.js ws package) data
          const raw = typeof event.data === "string" ? event.data : String(event.data);
          const msg: DevtoolsMessage = JSON.parse(raw);

          if (msg.type === "HANDSHAKE_RESPONSE") {
            if (msg.success) {
              setStatus("connected");
            } else {
              ws.close();
            }
            return;
          }

          subscribersRef.current.forEach((handler) => handler(msg));
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        setStatus("disconnected");

        const autoReconnect = cfg.autoReconnect ?? true;
        const maxAttempts = cfg.maxReconnectAttempts ?? Infinity;

        if (autoReconnect && reconnectAttemptRef.current < maxAttempts) {
          const attempt = reconnectAttemptRef.current++;
          const delay = Math.min(
            RECONNECT_BASE_MS * Math.pow(2, attempt) + Math.random() * 500,
            RECONNECT_MAX_MS,
          );
          reconnectTimerRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        // onclose will fire after onerror
      };
    } catch {
      setStatus("disconnected");
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttemptRef.current = Infinity; // Prevent auto-reconnect
    wsRef.current?.close();
    wsRef.current = null;
    setStatus("disconnected");
  }, []);

  const reconnect = useCallback(() => {
    reconnectAttemptRef.current = 0;
    wsRef.current?.close();
    wsRef.current = null;
    connect();
  }, [connect]);

  const send = useCallback((message: DevtoolsMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === 1 /* OPEN */) {
      ws.send(JSON.stringify(message));
    }
  }, []);

  const subscribe = useCallback((handler: (msg: DevtoolsMessage) => void) => {
    subscribersRef.current.add(handler);
    return () => {
      subscribersRef.current.delete(handler);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      reconnectAttemptRef.current = Infinity;
      wsRef.current?.close();
    };
  }, [connect]);

  const value: HubContextValue = {
    status,
    send,
    subscribe,
    disconnect,
    reconnect,
  };

  return <HubContext.Provider value={value}>{children}</HubContext.Provider>;
}
