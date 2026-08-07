// @vitest-environment jsdom
/**
 * The counter as a user drives it. The component subscribes through `useAtomicProp` to the
 * one leaf it renders, against the same module singleton the app uses — no providers, which
 * is the example's whole pitch.
 */

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { Counter } from "../src/components/Counter";
import { store } from "../src/state/yoltra";

beforeEach(async () => {
  await store.emit("counter", "reset", null);
});

describe("the Counter component", () => {
  it("renders the value and moves it with the buttons", async () => {
    render(<Counter />);
    const output = screen.getByText("0");

    fireEvent.click(screen.getByRole("button", { name: "Increment" }));
    await waitFor(() => expect(output).toHaveTextContent("1"));

    fireEvent.click(screen.getByRole("button", { name: "Increment" }));
    fireEvent.click(screen.getByRole("button", { name: "Decrement" }));
    await waitFor(() => expect(output).toHaveTextContent("1"));

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => expect(output).toHaveTextContent("0"));
  });
});
