import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";

/** Field scale. @public */
export type FieldSize = "md" | "sm";

/** Compose the field class list: base + size + block + caller className. */
function fieldClasses(base: string, size: FieldSize, block: boolean, className?: string): string {
  return [base, size === "sm" && `${base}--sm`, block && `${base}--block`, className]
    .filter(Boolean)
    .join(" ");
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Visual size — distinct from the native numeric `size` attribute. */
  size?: FieldSize;
  /** Stretch to fill the container (`display:block; width:100%`). */
  block?: boolean;
}

/** Text input styled from DS tokens. Server-safe — no state, no browser APIs. */
/**
 * A text input.
 *
 * @remarks
 * Every field needs a label a screen reader can reach. Pair it with a `<label htmlFor>`, or
 * with {@link VisuallyHidden} where the design leaves no room for visible text — a
 * `placeholder` is not a label: it disappears the moment somebody types.
 *
 * @example
 * ```tsx
 * <label className="yl-label" htmlFor="host">Hub host</label>
 * <Input id="host" name="host" block placeholder="127.0.0.1" />
 * ```
 *
 * @public
 */
export function Input({ size = "md", block = false, className, ...rest }: InputProps) {
  return <input className={fieldClasses("yl-input", size, block, className)} {...rest} />;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /** Visual size — distinct from the native numeric `size` attribute. */
  size?: FieldSize;
  block?: boolean;
  children: ReactNode;
}

/** Native select styled from DS tokens. */
/**
 * A native select.
 *
 * @example
 * ```tsx
 * <Select id="theme" defaultValue="light">
 *   <option value="light">Light</option>
 *   <option value="dark">Dark</option>
 * </Select>
 * ```
 *
 * @public
 */
export function Select({ size = "md", block = false, className, children, ...rest }: SelectProps) {
  return (
    <select className={fieldClasses("yl-select", size, block, className)} {...rest}>
      {children}
    </select>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: FieldSize;
  block?: boolean;
}

/** Multiline text input styled from DS tokens. */
/**
 * A multi-line text input. Resizes vertically only, so it cannot break a layout sideways.
 *
 * @example
 * ```tsx
 * <Textarea id="payload" rows={6} block defaultValue={JSON.stringify(event, null, 2)} />
 * ```
 *
 * @public
 */
export function Textarea({ size = "md", block = false, className, ...rest }: TextareaProps) {
  return <textarea className={fieldClasses("yl-textarea", size, block, className)} {...rest} />;
}
