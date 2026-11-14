import { useId, type TextareaHTMLAttributes } from "react";

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string };

export function TextAreaField({ label, className = "", ...props }: TextAreaFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        className={`resize-y rounded-xl border border-line bg-bg px-3.5 py-2.5 text-fg placeholder:text-muted/70 focus:border-accent focus:outline-none ${className}`}
        {...props}
      />
    </div>
  );
}
