import type { HTMLAttributes } from "react";

export interface ProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  /** How far along, between `0` and `max`. */
  value: number;
  /** The end of the range. Defaults to `100`. */
  max?: number;
  /**
   * What is progressing, in words.
   *
   * @remarks
   * Required. A bar with no name is announced as a percentage with no subject, and a reader who
   * cannot see which section it sits in has no way to find out what it measures.
   */
  label: string;
  /**
   * A human reading of the value, for assistive technology.
   *
   * @remarks
   * Becomes `aria-valuetext`. "3 of 12 files" is more use than "25", and a percentage rarely is.
   */
  valueText?: string;
}

/**
 * A determinate progress bar.
 *
 * @remarks
 * Determinate only, and that is the point: it is the counterpart to {@link Spinner}, which says
 * that something is happening, where this says how much of it is done. A consuming project put the
 * distinction well while arguing against a spinner for long work: a spinner would hide a stuck job,
 * where the word "running" beside a task id does not.
 *
 * The value is clamped rather than trusted. A bar rendered past its end is a layout bug that
 * arrives with production data, long after the component was reviewed.
 *
 * @example
 * ```tsx
 * <ProgressBar label="Downloading model" value={done} max={total} valueText={`${done} of ${total} files`} />
 * ```
 *
 * @public
 */
export function ProgressBar({ value, max = 100, label, valueText, className, style, ...rest }: ProgressBarProps) {
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const fraction = clamped / safeMax;

  return (
    <div
      className={["yl-progress", className].filter(Boolean).join(" ")}
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuetext={valueText}
      style={{ ...style, ["--progress-fraction" as string]: `${fraction}` }}
      {...rest}
    >
      <span className="yl-progress__fill" />
    </div>
  );
}
