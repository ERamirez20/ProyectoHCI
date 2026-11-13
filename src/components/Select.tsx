interface Option<T> {
  value: T;
  label: string;
}

interface SelectProps<T extends string | number> {
  value: T;
  options: readonly Option<T>[] | readonly string[];
  onChange: (value: T) => void;
  label: string;
  disabled?: boolean;
}

export default function Select<T extends string | number>({
  value,
  options,
  onChange,
  label,
  disabled,
}: SelectProps<T>) {
  const normalized = options.map((o) =>
    typeof o === 'string' ? { value: o as T, label: o } : o,
  );
  const index = normalized.findIndex((o) => o.value === value);

  return (
    <select
      className="select"
      aria-label={label}
      disabled={disabled}
      value={index}
      onChange={(e) => onChange(normalized[Number(e.target.value)].value)}
    >
      {normalized.map((o, i) => (
        <option key={String(o.value)} value={i}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
