import { useRef, useState } from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { useEvent } from "../../../src/hooks/hooks";
import { StoreProvider } from "../../../src/context/StoreProvider";
import { createMockStore } from "../../helpers/mockStore";

describe("useEvent", () => {
  it("subscribes to events on mount", () => {
    const { store } = createMockStore({});

    function Test() {
      useEvent("ui" as any, "click" as any, vi.fn());
      return <span data-testid="test">test</span>;
    }

    render(
      <StoreProvider store={store}>
        <Test />
      </StoreProvider>,
    );

    expect(store.onEvent).toHaveBeenCalledTimes(1);
    expect(store.onEvent).toHaveBeenCalledWith(
      "ui",
      "click",
      expect.any(Function),
      "committed", // default phase
    );
  });

  it("unsubscribes on unmount", () => {
    const { store } = createMockStore({});
    const unsubscribe = vi.fn();
    store.onEvent.mockReturnValue(unsubscribe);

    function Test() {
      useEvent("ui" as any, "click" as any, vi.fn());
      return <span data-testid="test">test</span>;
    }

    const { unmount } = render(
      <StoreProvider store={store}>
        <Test />
      </StoreProvider>,
    );

    expect(unsubscribe).not.toHaveBeenCalled();
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("invokes handler when event fires", () => {
    const { store } = createMockStore({ counter: { value: 0 } });
    const handler = vi.fn();

    function Test() {
      useEvent("ui" as any, "increment" as any, handler);
      return <span data-testid="test">test</span>;
    }

    render(
      <StoreProvider store={store}>
        <Test />
      </StoreProvider>,
    );

    act(() => {
      store.notifyEvent("ui", "increment", 5, "committed");
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ channel: "ui", type: "increment", payload: 5 }),
      expect.any(Function),
      expect.any(Function),
      "committed",
    );
  });

  it("subscribes with specified phase", () => {
    const { store } = createMockStore({});

    function Test() {
      useEvent("ui" as any, "delete" as any, vi.fn(), "uncommitted");
      return <span data-testid="test">test</span>;
    }

    render(
      <StoreProvider store={store}>
        <Test />
      </StoreProvider>,
    );

    expect(store.onEvent).toHaveBeenCalledWith(
      "ui",
      "delete",
      expect.any(Function),
      "uncommitted",
    );
  });

  it("subscribes with 'all' phase", () => {
    const { store } = createMockStore({});
    const handler = vi.fn();

    function Test() {
      useEvent("ui" as any, "action" as any, handler, "all");
      return <span data-testid="test">test</span>;
    }

    render(
      <StoreProvider store={store}>
        <Test />
      </StoreProvider>,
    );

    expect(store.onEvent).toHaveBeenCalledWith(
      "ui",
      "action",
      expect.any(Function),
      "all",
    );

    // Should receive both committed and uncommitted events
    act(() => {
      store.notifyEvent("ui", "action", {}, "committed");
    });
    expect(handler).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      "committed",
    );

    act(() => {
      store.notifyEvent("ui", "action", {}, "uncommitted");
    });
    expect(handler).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      "uncommitted",
    );
  });

  it("re-subscribes when channel changes", () => {
    const { store } = createMockStore({});
    const unsubscribe = vi.fn();
    store.onEvent.mockReturnValue(unsubscribe);

    function Test({ channel }: { channel: string }) {
      useEvent(channel as any, "click" as any, vi.fn());
      return <span data-testid="test">{channel}</span>;
    }

    const { rerender } = render(
      <StoreProvider store={store}>
        <Test channel="ui" />
      </StoreProvider>,
    );

    expect(store.onEvent).toHaveBeenCalledTimes(1);
    expect(store.onEvent).toHaveBeenLastCalledWith("ui", "click", expect.any(Function), "committed");

    rerender(
      <StoreProvider store={store}>
        <Test channel="data" />
      </StoreProvider>,
    );

    // Should unsubscribe from old and subscribe to new
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(store.onEvent).toHaveBeenCalledTimes(2);
    expect(store.onEvent).toHaveBeenLastCalledWith("data", "click", expect.any(Function), "committed");
  });

  it("re-subscribes when type changes", () => {
    const { store } = createMockStore({});
    const unsubscribe = vi.fn();
    store.onEvent.mockReturnValue(unsubscribe);

    function Test({ type }: { type: string }) {
      useEvent("ui" as any, type as any, vi.fn());
      return <span data-testid="test">{type}</span>;
    }

    const { rerender } = render(
      <StoreProvider store={store}>
        <Test type="click" />
      </StoreProvider>,
    );

    expect(store.onEvent).toHaveBeenLastCalledWith("ui", "click", expect.any(Function), "committed");

    rerender(
      <StoreProvider store={store}>
        <Test type="hover" />
      </StoreProvider>,
    );

    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(store.onEvent).toHaveBeenLastCalledWith("ui", "hover", expect.any(Function), "committed");
  });

  it("re-subscribes when phase changes", () => {
    const { store } = createMockStore({});
    const unsubscribe = vi.fn();
    store.onEvent.mockReturnValue(unsubscribe);

    function Test({ phase }: { phase: "committed" | "uncommitted" | "all" }) {
      useEvent("ui" as any, "click" as any, vi.fn(), phase);
      return <span data-testid="test">{phase}</span>;
    }

    const { rerender } = render(
      <StoreProvider store={store}>
        <Test phase="committed" />
      </StoreProvider>,
    );

    expect(store.onEvent).toHaveBeenLastCalledWith("ui", "click", expect.any(Function), "committed");

    rerender(
      <StoreProvider store={store}>
        <Test phase="uncommitted" />
      </StoreProvider>,
    );

    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(store.onEvent).toHaveBeenLastCalledWith("ui", "click", expect.any(Function), "uncommitted");
  });

  it("does not re-subscribe when handler changes (uses ref)", () => {
    const { store } = createMockStore({});
    const unsubscribe = vi.fn();
    store.onEvent.mockReturnValue(unsubscribe);

    function Test({ onEvent }: { onEvent: () => void }) {
      useEvent("ui" as any, "click" as any, onEvent);
      return <span data-testid="test">test</span>;
    }

    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { rerender } = render(
      <StoreProvider store={store}>
        <Test onEvent={handler1} />
      </StoreProvider>,
    );

    expect(store.onEvent).toHaveBeenCalledTimes(1);

    rerender(
      <StoreProvider store={store}>
        <Test onEvent={handler2} />
      </StoreProvider>,
    );

    // Should NOT re-subscribe - handler is stored in ref
    expect(store.onEvent).toHaveBeenCalledTimes(1);
    expect(unsubscribe).not.toHaveBeenCalled();
  });

  it("uses latest handler (avoids stale closures)", () => {
    const { store } = createMockStore({ counter: { value: 0 } });
    const calls: number[] = [];

    function Test() {
      const [count, setCount] = useState(0);

      useEvent("ui" as any, "increment" as any, () => {
        calls.push(count);
      });

      return (
        <button data-testid="btn" onClick={() => setCount((c) => c + 1)}>
          {count}
        </button>
      );
    }

    render(
      <StoreProvider store={store}>
        <Test />
      </StoreProvider>,
    );

    // Initial count is 0
    act(() => {
      store.notifyEvent("ui", "increment", {}, "committed");
    });
    expect(calls).toEqual([0]);

    // Click to increment count to 1
    act(() => {
      screen.getByTestId("btn").click();
    });

    // Fire event again - should see updated count
    act(() => {
      store.notifyEvent("ui", "increment", {}, "committed");
    });
    expect(calls).toEqual([0, 1]);

    // Click again to increment count to 2
    act(() => {
      screen.getByTestId("btn").click();
    });

    // Fire event again - should see updated count
    act(() => {
      store.notifyEvent("ui", "increment", {}, "committed");
    });
    expect(calls).toEqual([0, 1, 2]);
  });

  it("handler receives getState function", () => {
    const { store } = createMockStore({ counter: { value: 42 } });
    let capturedValue: number | undefined;

    function Test() {
      useEvent("ui" as any, "check" as any, (_event, getState) => {
        capturedValue = getState().counter.value;
      });
      return <span data-testid="test">test</span>;
    }

    render(
      <StoreProvider store={store}>
        <Test />
      </StoreProvider>,
    );

    act(() => {
      store.notifyEvent("ui", "check", {}, "committed");
    });

    expect(capturedValue).toBe(42);
  });

  it("handler receives emit function", () => {
    const { store } = createMockStore({});

    function Test() {
      useEvent("ui" as any, "trigger" as any, (_event, _getState, emit) => {
        emit("ui", "triggered", { from: "handler" });
      });
      return <span data-testid="test">test</span>;
    }

    render(
      <StoreProvider store={store}>
        <Test />
      </StoreProvider>,
    );

    act(() => {
      store.notifyEvent("ui", "trigger", {}, "committed");
    });

    expect(store.emit).toHaveBeenCalledWith("ui", "triggered", { from: "handler" });
  });
});
