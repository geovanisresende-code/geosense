// Primitivos de formulário do painel — mantêm a identidade visual da plataforma.

export function Field({ label, value, onChange, placeholder, type = 'text', hint }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-semibold text-text">{label}</span>}
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-brand"
      />
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function TextArea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-semibold text-text">{label}</span>}
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-brand"
      />
    </label>
  )
}

export function Select({ label, value, onChange, options, placeholder }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-semibold text-text">{label}</span>}
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-brand"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

export function SectionTitle({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-extrabold text-text">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
