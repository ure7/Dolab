import { useId, type InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

// A labelled input. The label is linked to the input by id, so screen readers
// announce it and tapping the label focuses the field.
export function TextField({ label, hint, className = "", ...inputProps }: TextFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hintId}
        className={`rounded-xl border border-line bg-bg px-3.5 py-2.5 text-fg placeholder:text-muted/70 focus:border-accent focus:outline-none ${className}`}
        {...inputProps}
      />
      {hint && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
