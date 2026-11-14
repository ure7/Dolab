import { useId, type SelectHTMLAttributes } from "react";

export type Option = { value: string; label: string };

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: Option[];
  placeholder?: string;
  hideLabel?: boolean;
};

export function SelectField({ label, options, placeholder, hideLabel = false, className = "", ...props }: SelectFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={hideLabel ? "sr-only" : "text-sm font-medium"}>
        {label}
      </label>
      <select
        id={id}
        className={`rounded-xl border border-line bg-bg px-3 py-2.5 text-fg focus:border-accent focus:outline-none ${className}`}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
