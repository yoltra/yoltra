import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";

type Size = "md" | "sm";

/** Compose the field class list: base + size + block + caller className. */
function fieldClasses(base: string, size: Size, block: boolean, className?: string): string {
  return [base, size === "sm" && `${base}--sm`, block && `${base}--block`, className]
    .filter(Boolean)
    .join(" ");
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Visual size — distinct from the native numeric `size` attribute. */
  size?: Size;
  /** Stretch to fill the container (`display:block; width:100%`). */
  block?: boolean;
}

/** Text input styled from DS tokens. Server-safe — no state, no browser APIs. */
export function Input({ size = "md", block = false, className, ...rest }: InputProps) {
  return <input className={fieldClasses("yl-input", size, block, className)} {...rest} />;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /** Visual size — distinct from the native numeric `size` attribute. */
  size?: Size;
  block?: boolean;
  children: ReactNode;
}

/** Native select styled from DS tokens. */
export function Select({ size = "md", block = false, className, children, ...rest }: SelectProps) {
  return (
    <select className={fieldClasses("yl-select", size, block, className)} {...rest}>
      {children}
    </select>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: Size;
  block?: boolean;
}

/** Multiline text input styled from DS tokens. */
export function Textarea({ size = "md", block = false, className, ...rest }: TextareaProps) {
  return <textarea className={fieldClasses("yl-textarea", size, block, className)} {...rest} />;
}
