"use client";

import { useCallback, useState } from "react";

export interface ControllableStateOptions<T> {
  /** The controlled value. Passing it makes the caller the owner. */
  value?: T;
  /** The starting value when uncontrolled. */
  defaultValue: T;
  /** Called on every change, controlled or not. */
  onChange?: (next: T) => void;
}

/**
 * State a component owns until its caller decides to.
 *
 * @remarks
 * The pattern is small and easy to get subtly wrong, which is why it is here rather than in each
 * component: it was found solved three different ways across two consuming projects, and one of
 * them only half. A surface that needs to know the value passes `value` and `onChange` and owns it;
 * one that does not passes neither and the component keeps it.
 *
 * Two details that the half-solutions missed. `onChange` fires in **both** modes, so a caller can
 * observe without taking ownership. And the controlled value wins on every render rather than being
 * copied into state once, which is what makes a parent able to reject or transform a change instead
 * of watching the component move anyway.
 *
 * @example
 * ```tsx
 * function Disclosure({ open, defaultOpen = false, onOpenChange, children }) {
 *   const [isOpen, setOpen] = useControllableState({
 *     value: open,
 *     defaultValue: defaultOpen,
 *     onChange: onOpenChange,
 *   });
 *   return <button onClick={() => setOpen(!isOpen)}>{children}</button>;
 * }
 * ```
 *
 * @public
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<T>): [T, (next: T) => void] {
  const [own, setOwn] = useState<T>(defaultValue);
  const controlled = value !== undefined;
  // Read from the prop every render rather than syncing it into state, so a caller that declines a
  // change sees the component stay put instead of moving and snapping back.
  const current = controlled ? value : own;

  const set = useCallback(
    (next: T) => {
      if (!controlled) setOwn(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );

  return [current, set];
}
