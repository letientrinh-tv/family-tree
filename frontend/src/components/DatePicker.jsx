import { useEffect, useRef, useState } from 'react'

// Convert stored value (D/M/YYYY or YYYY-MM-DD) → YYYY-MM-DD for <input type="date">
function toISO(val) {
  if (!val) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val
  const p = val.split('/')
  if (p.length === 3) {
    const [d, m, y] = p
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return ''
}

// Convert YYYY-MM-DD → D/M/YYYY for storage
function fromISO(val) {
  if (!val) return ''
  const [y, m, d] = val.split('-')
  return `${parseInt(d)}/${parseInt(m)}/${y}`
}

export default function DatePicker({ value, onChange, disabled, placeholder }) {
  const inputRef = useRef()
  const lastEmitted = useRef(value || '')
  const [inputVal, setInputVal] = useState(toISO(value || ''))

  useEffect(() => {
    if ((value || '') !== lastEmitted.current) {
      setInputVal(toISO(value || ''))
      lastEmitted.current = value || ''
    }
  }, [value])

  const handleChange = (e) => {
    const iso = e.target.value
    setInputVal(iso)
    const stored = fromISO(iso)
    lastEmitted.current = stored
    onChange(stored)
  }

  const handleClick = () => {
    try { inputRef.current?.showPicker() } catch (_) {}
  }

  return (
    <input
      ref={inputRef}
      type="date"
      value={inputVal}
      onChange={handleChange}
      onClick={handleClick}
      disabled={disabled}
      title={placeholder || ''}
      style={{
        padding: '5px 8px',
        border: '1px solid #C4A882',
        borderRadius: '6px',
        background: disabled ? '#F0EBE3' : '#FDFAF5',
        fontSize: '0.85rem',
        color: '#3C2415',
        outline: 'none',
        height: '32px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: '100%',
        fontFamily: 'Lora, Georgia, serif',
      }}
    />
  )
}
