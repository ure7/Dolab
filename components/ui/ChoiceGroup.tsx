import type { Option } from "./SelectField";

type ChoiceGroupProps = {
  legend: string;
  name: string;
  options: Option[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

// A row of pill buttons that behaves like radio buttons (one choice).
// Real radio inputs underneath keep it keyboard- and screen-reader-friendly.
export function ChoiceGroup({ legend, name, options, value, defaultValue, onChange }: ChoiceGroupProps) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === undefined ? undefined : value === option.value}
              defaultChecked={value === undefined ? defaultValue === option.value : undefined}
              onChange={() => onChange?.(option.value)}
              className="peer sr-only"
            />
            <span className="block rounded-full border border-line px-3.5 py-1.5 text-sm text-muted transition peer-checked:border-accent peer-checked:bg-accent/15 peer-checked:text-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
