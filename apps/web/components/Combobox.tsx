'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'

export interface ComboOption {
  /** Identificador del registro. */
  id: string
  /** Texto principal: se muestra y es la base de la búsqueda. */
  label: string
  /** Texto secundario (se muestra a la derecha y también se busca). */
  hint?: string
}

/**
 * Normaliza texto para buscar sin acentos ni mayúsculas, replicando el
 * comportamiento de `matches()` en la API (SQLite/Postgres no normalizan).
 */
export function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

interface ComboboxProps {
  /** Opciones a elegir. El componente filtra en memoria, sin peticiones. */
  options: ComboOption[]
  /** Texto del input (controlado por el padre). */
  query: string
  onQueryChange: (text: string) => void
  /** Opción seleccionada, o `null`. */
  value: ComboOption | null
  onChange: (option: ComboOption | null) => void
  placeholder?: string
  /** Mensaje cuando la búsqueda no tiene coincidencias. */
  emptyText?: string
  /** Campos adicionales por los que buscar, además de `label` y `hint`. */
  searchText?: (option: ComboOption) => string
  /** Máximo de sugerencias visibles. */
  maxResults?: number
  className?: string
  disabled?: boolean
  ariaLabel?: string
}

/**
 * Cuadro de búsqueda con sugerencias: escribes para filtrar y eliges una
 * opción, o la limpias con la «×». Con teclado: ↑/↓ para moverse, Enter para
 * elegir y Esc para cerrar.
 */
export function Combobox({
  options,
  query,
  onQueryChange,
  value,
  onChange,
  placeholder,
  emptyText = 'Sin coincidencias.',
  searchText,
  maxResults = 50,
  className,
  disabled,
  ariaLabel,
}: ComboboxProps) {
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  // Cierra al pulsar fuera.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  /**
   * Si el texto coincide exactamente con la opción elegida (por ejemplo justo
   * después de seleccionarla), al abrir mostramos todas para poder cambiar.
   */
  const effectiveQuery =
    open && value && normalizeText(query) === normalizeText(value.label)
      ? ''
      : normalizeText(query)

  const filtered = useMemo(() => {
    if (!effectiveQuery) return options.slice(0, maxResults)
    return options
      .filter((o) =>
        normalizeText([o.label, o.hint, searchText?.(o)].join(' ')).includes(
          effectiveQuery,
        ),
      )
      .slice(0, maxResults)
  }, [options, effectiveQuery, searchText, maxResults])

  const select = (option: ComboOption) => {
    onChange(option)
    onQueryChange(option.label)
    setOpen(false)
  }

  const clear = () => {
    onChange(null)
    onQueryChange('')
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (filtered.length ? Math.min(i + 1, filtered.length - 1) : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (open && filtered[active]) {
        e.preventDefault()
        select(filtered[active])
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false)
    }
  }

  const showClear = Boolean(query || value)

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <input
        className="input pr-9"
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && filtered[active] ? `${listboxId}-${active}` : undefined
        }
        aria-label={ariaLabel}
        onChange={(e) => {
          onQueryChange(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => {
          setActive(0)
          setOpen(true)
        }}
        onKeyDown={onKeyDown}
      />

      {showClear && !disabled && (
        <button
          type="button"
          onClick={clear}
          aria-label="Limpiar búsqueda"
          className="absolute inset-y-0 right-0 grid w-9 place-items-center rounded-r-lg text-slate-400 hover:text-slate-700"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-4 w-4"
            aria-hidden
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-slate-400">{emptyText}</li>
          ) : (
            filtered.map((o, i) => (
              <li
                key={o.id}
                id={`${listboxId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => select(o)}
                className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 ${
                  i === active
                    ? 'bg-brand-light text-brand-dark'
                    : 'text-slate-700'
                }`}
              >
                <span className="truncate">{o.label}</span>
                {o.hint && (
                  <span className="shrink-0 text-xs text-slate-400">
                    {o.hint}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
