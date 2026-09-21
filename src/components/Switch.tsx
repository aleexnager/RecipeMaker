interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}

/** Interruptor estilo iOS (pill + knob deslizante) sobre un checkbox nativo accesible. */
export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <label className="relative inline-flex h-[1.6rem] w-[2.75rem] shrink-0 cursor-pointer items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="peer sr-only"
      />
      <span className="absolute inset-0 rounded-full bg-zinc-300 transition-colors duration-200 peer-checked:bg-brand-500 dark:bg-zinc-700" />
      <span className="absolute left-0.5 h-[1.35rem] w-[1.35rem] rounded-full bg-white shadow-md transition-transform duration-200 peer-checked:translate-x-[1.15rem]" />
    </label>
  )
}
