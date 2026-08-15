import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'

export function Section({
  num,
  title,
  children,
  accent,
  defaultOpen = true,
}: {
  num?: string
  title: string
  children: ReactNode
  accent?: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = useId()

  return (
    <section className={`panel-section ${open ? 'is-open' : 'is-collapsed'}`}>
      <button
        type="button"
        className="section-head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((value) => !value)}
      >
        {num && (
          <span className="section-num" style={accent ? { background: accent } : undefined}>
            {num}
          </span>
        )}
        <span className="section-title">{title}</span>
        <span className="section-chevron" aria-hidden="true">
          ▾
        </span>
      </button>
      <div id={bodyId} className="section-body" hidden={!open}>
        {children}
      </div>
    </section>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  fmt,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  fmt?: (v: number) => string
  onChange: (v: number) => void
}) {
  const id = useId()
  return (
    <div className="ctl slider-ctl">
      <label htmlFor={id}>
        <span>{label}</span>
        <output>{fmt ? fmt(value) : value.toFixed(2)}</output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onPointerUp={(e) => e.currentTarget.blur()}
        onKeyUp={(e) => {
          // After finishing a keyboard tweak, release focus so Space/Y work again.
          if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur()
        }}
        onDoubleClick={() => onChange(Math.min(max, Math.max(min, (min + max) / 2)))}
      />
    </div>
  )
}

export function Select({
  label,
  value,
  options,
  onChange,
  onPreview,
}: {
  label: string
  value: number | string
  options: { value: number | string; label: string }[]
  onChange: (v: string) => void
  onPreview?: (v: string | null) => void
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => String(option.value) === String(value))

  const close = useCallback(() => {
    setOpen(false)
    onPreview?.(null)
  }, [onPreview])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close])

  return (
    <div className="ctl select-ctl" ref={rootRef}>
      <label id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      <div className={`select-wrap ${open ? 'is-open' : ''}`}>
        <button
          id={id}
          type="button"
          className="select-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${id}-label ${id}`}
          onClick={() => {
            if (open) close()
            else setOpen(true)
          }}
        >
          <span>{selected?.label ?? '—'}</span>
          <span className="select-arrow" aria-hidden="true">
            ▾
          </span>
        </button>
        {open && (
          <div
            className="select-flyout"
            role="listbox"
            aria-labelledby={`${id}-label`}
            onPointerLeave={() => onPreview?.(null)}
          >
          {options.map((o) => (
              <button
                type="button"
                role="option"
                aria-selected={String(o.value) === String(value)}
                className={`select-option ${String(o.value) === String(value) ? 'is-selected' : ''}`}
                key={o.value}
                onPointerEnter={() => onPreview?.(String(o.value))}
                onFocus={() => onPreview?.(String(o.value))}
                onClick={() => {
                  onChange(String(o.value))
                  close()
                }}
              >
                <span className="select-option-mark" aria-hidden="true">
                  {String(o.value) === String(value) ? '✓' : ''}
                </span>
                <span>{o.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
