import type { InputHTMLAttributes, ReactNode } from "react";

/**
 * What a field hands back for wiring a control.
 *
 * @remarks
 * Passed to {@link FormField}'s render function rather than injected by cloning the child.
 * Cloning looks tidier at the call site and breaks the moment a caller wraps their control in
 * anything — a fragment, a styled div, a component of their own — because the props land on
 * the wrapper instead of the input, and nothing reports it. Handing them over explicitly makes
 * the wiring visible and type-checked.
 */
export interface FieldControlProps {
  id: string;
  /** Points at the hint and error text, so both are announced with the control. */
  "aria-describedby": string | undefined;
  /** `true` while the field has an error. */
  "aria-invalid": boolean | undefined;
}

export interface FormFieldProps {
  /**
   * Identifier for the control.
   *
   * @remarks
   * Required rather than generated, because generating one needs `useId`, and a hook would
   * push this component behind the client entry for the sake of a string the caller almost
   * always has. On the client, pass `useId()`.
   */
  id: string;
  label: ReactNode;
  /** Guidance shown under the control, announced with it. */
  hint?: ReactNode;
  /** Validation message. Its presence is what marks the field invalid. */
  error?: ReactNode;
  /** Marks the control required, visually and to assistive technology. */
  required?: boolean;
  children: (control: FieldControlProps) => ReactNode;
}

/**
 * A labelled control, with its hint and error wired to it.
 *
 * @remarks
 * The wiring is the point. A hint sitting next to an input is invisible to a screen reader
 * unless something points at it, and an error announced only in colour is not announced at
 * all. This connects `label`, `aria-describedby` and `aria-invalid` so that a field cannot be
 * built half-accessible by accident.
 *
 * The error is announced through a live region, so a message appearing after a failed submit
 * reaches a reader who has already moved past the field.
 *
 * @example
 * ```tsx
 * <FormField id="host" label="Hub host" hint="Usually 127.0.0.1" error={errors.host}>
 *   {(control) => <Input {...control} name="host" block />}
 * </FormField>
 * ```
 *
 * @public
 */
export function FormField({ id, label, hint, error, required, children }: FormFieldProps) {
  const hintId = hint !== undefined ? `${id}-hint` : undefined;
  const errorId = error !== undefined ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="yl-field">
      <label className="yl-label" htmlFor={id}>
        {label}
        {required === true && (
          <span className="yl-field__required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error !== undefined ? true : undefined,
      })}
      {hint !== undefined && (
        <p className="yl-field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {/* Always rendered, so a message appearing later is an update to a region the reader is
          already watching rather than a new node they may never be told about. */}
      <p className="yl-field__error" id={errorId} role="alert">
        {error}
      </p>
    </div>
  );
}

export interface FieldsetProps {
  /** Names the group. Rendered as a `<legend>`. */
  legend: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * A group of related controls.
 *
 * @remarks
 * A real `<fieldset>` with a `<legend>`, which is the one construct that gets a group name
 * announced before each control inside it. A `<div>` with a heading looks identical and tells
 * a screen-reader user nothing about where one group ends and the next begins.
 *
 * @example
 * ```tsx
 * <Fieldset legend="Transport security" hint="Both apply off loopback.">
 *   <Checkbox name="tls" label="Require TLS" />
 *   <Checkbox name="mtls" label="Require client certificates" />
 * </Fieldset>
 * ```
 *
 * @public
 */
export function Fieldset({ legend, hint, children, className }: FieldsetProps) {
  return (
    <fieldset className={["yl-fieldset", className].filter(Boolean).join(" ")}>
      <legend className="yl-fieldset__legend">{legend}</legend>
      {hint !== undefined && <p className="yl-field__hint">{hint}</p>}
      <div className="yl-fieldset__body">{children}</div>
    </fieldset>
  );
}

/**
 * Shared by the boxed controls: checkbox, radio and switch.
 *
 * @public
 */
export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** The visible, clickable label. */
  label: ReactNode;
  /** Guidance under the label, announced with the control. */
  hint?: ReactNode;
}

export type CheckboxProps = ToggleProps;

/**
 * A checkbox.
 *
 * @remarks
 * A native `<input type="checkbox">` inside its own `<label>`, styled with `accent-color`
 * rather than replaced. A div dressed as a checkbox has to re-implement keyboard handling,
 * the indeterminate state, form participation and every assistive-technology behaviour the
 * native control already has — and usually re-implements some of them.
 *
 * @example
 * ```tsx
 * <Checkbox name="autoReconnect" label="Reconnect automatically" defaultChecked />
 * ```
 *
 * @public
 */
export function Checkbox({ label, hint, className, id, ...rest }: CheckboxProps) {
  const hintId = hint !== undefined && id !== undefined ? `${id}-hint` : undefined;
  return (
    <div className={["yl-toggle", className].filter(Boolean).join(" ")}>
      <label className="yl-toggle__label">
        <input
          type="checkbox"
          className="yl-checkbox"
          id={id}
          aria-describedby={hintId}
          {...rest}
        />
        <span>{label}</span>
      </label>
      {hint !== undefined && (
        <p className="yl-field__hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
}

export type RadioProps = ToggleProps;

/**
 * One option in a radio group.
 *
 * @remarks
 * Every radio in a group must share a `name` — that is what makes them one control rather than
 * several checkboxes, and what lets arrow keys move between them. {@link RadioGroup} does not
 * set it for you: doing so would mean cloning children, which breaks as soon as a caller wraps
 * an option in anything.
 *
 * @public
 */
export function Radio({ label, hint, className, id, ...rest }: RadioProps) {
  const hintId = hint !== undefined && id !== undefined ? `${id}-hint` : undefined;
  return (
    <div className={["yl-toggle", className].filter(Boolean).join(" ")}>
      <label className="yl-toggle__label">
        <input type="radio" className="yl-radio" id={id} aria-describedby={hintId} {...rest} />
        <span>{label}</span>
      </label>
      {hint !== undefined && (
        <p className="yl-field__hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
}

export interface RadioGroupProps {
  /** Names the group, announced before each option. */
  legend: ReactNode;
  hint?: ReactNode;
  /** Lay the options out in a row rather than a column. */
  inline?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * A set of mutually exclusive options.
 *
 * @remarks
 * A `<fieldset>` carrying `role="radiogroup"`, so the group is announced by name and the
 * options are understood as alternatives. Give every {@link Radio} inside it the same `name`.
 *
 * @example
 * ```tsx
 * <RadioGroup legend="Theme">
 *   <Radio name="theme" value="light" label="Light" defaultChecked />
 *   <Radio name="theme" value="dark" label="Dark" />
 * </RadioGroup>
 * ```
 *
 * @public
 */
export function RadioGroup({ legend, hint, inline = false, children, className }: RadioGroupProps) {
  return (
    <fieldset
      className={["yl-fieldset", className].filter(Boolean).join(" ")}
      role="radiogroup"
    >
      <legend className="yl-fieldset__legend">{legend}</legend>
      {hint !== undefined && <p className="yl-field__hint">{hint}</p>}
      <div className={["yl-fieldset__body", inline && "yl-fieldset__body--inline"].filter(Boolean).join(" ")}>
        {children}
      </div>
    </fieldset>
  );
}

export type SwitchProps = ToggleProps;

/**
 * An on/off control that takes effect immediately.
 *
 * @remarks
 * A native checkbox carrying `role="switch"`, which is what makes a reader hear "on"/"off"
 * rather than "checked"/"unchecked". Use it for a setting that applies the moment it is
 * flipped; a checkbox is the right control for something that takes effect when a form is
 * submitted.
 *
 * @example
 * ```tsx
 * <Switch name="verbose" label="Verbose diagnostics" onChange={(e) => setVerbose(e.target.checked)} />
 * ```
 *
 * @public
 */
export function Switch({ label, hint, className, id, ...rest }: SwitchProps) {
  const hintId = hint !== undefined && id !== undefined ? `${id}-hint` : undefined;
  return (
    <div className={["yl-toggle", className].filter(Boolean).join(" ")}>
      <label className="yl-toggle__label yl-toggle__label--switch">
        <input
          type="checkbox"
          role="switch"
          className="yl-switch"
          id={id}
          aria-describedby={hintId}
          {...rest}
        />
        <span>{label}</span>
      </label>
      {hint !== undefined && (
        <p className="yl-field__hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
}

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /**
   * Spoken form of the current value.
   *
   * @remarks
   * Set it whenever the number alone does not carry the meaning — "3 of 5", "250 ms", "high".
   * Without it a reader hears the bare number, which for a scale like `0–4` says nothing.
   */
  valueText?: string;
}

/**
 * A control for choosing from a range.
 *
 * @remarks
 * A native `<input type="range">`. Keyboard support, the value announcement and form
 * participation come with it; a custom track and thumb would have to earn all three back.
 *
 * Needs a label like any other control — pair it with {@link FormField}.
 *
 * @example
 * ```tsx
 * <FormField id="depth" label="Replay buffer">
 *   {(control) => <Slider {...control} min={0} max={4} valueText={`${labels[depth]}`} />}
 * </FormField>
 * ```
 *
 * @public
 */
export function Slider({ valueText, className, ...rest }: SliderProps) {
  return (
    <input
      type="range"
      className={["yl-slider", className].filter(Boolean).join(" ")}
      aria-valuetext={valueText}
      {...rest}
    />
  );
}
