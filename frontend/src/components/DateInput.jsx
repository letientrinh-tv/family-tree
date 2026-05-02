import { useState, useEffect } from 'react'

const DATE_RE = [
  /^\d{4}$/,                                                          // 1950
  /^([1-9]|0[1-9]|1[0-2])\/\d{4}$/,                                 // 3/1950 hoặc 03/1950
  /^([1-9]|0[1-9]|[12]\d|3[01])\/([1-9]|0[1-9]|1[0-2])\/\d{4}$/,  // 5/3/1950 hoặc 15/03/1950
]

function isValid(val) {
  if (!val.trim()) return true
  return DATE_RE.some(re => re.test(val.trim()))
}

// Auto-insert "/" after day and month digits while typing
function autoFormat(raw) {
  // Keep only digits and slashes
  const clean = raw.replace(/[^\d/]/g, '')
  const digits = clean.replace(/\//g, '')
  if (digits.length <= 2) return digits            // D or DD — wait
  if (digits.length <= 4) {
    // Could be DD/MM or YYYY — if first 2 digits > 31 treat as year start
    const dd = parseInt(digits.slice(0, 2), 10)
    if (dd > 31) return digits                     // year-only path
    return digits.slice(0, 2) + '/' + digits.slice(2)
  }
  if (digits.length <= 6) {
    const dd = parseInt(digits.slice(0, 2), 10)
    if (dd > 31) return digits.slice(0, 4)         // only keep 4-digit year
    return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)
  }
  // Full DD/MM/YYYY
  const dd = parseInt(digits.slice(0, 2), 10)
  if (dd > 31) return digits.slice(0, 4)
  return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8)
}

export default function DateInput({ value, onChange, label, placeholder, inputClassName, inputStyle, disabled }) {
  const [local, setLocal] = useState(value || '')
  const [touched, setTouched] = useState(false)
  const [focused, setFocused] = useState(false)

  useEffect(() => { setLocal(value || '') }, [value])

  const handleChange = (e) => {
    const raw = e.target.value
    // On deletion just pass through
    const next = raw.length < local.length ? raw : autoFormat(raw)
    setLocal(next)
    onChange(next)
    setTouched(false)
  }

  const handleBlur = () => {
    setTouched(true)
    setFocused(false)
  }

  const error = touched && !isValid(local)

  return (
    <div>
      <input
        value={local}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        placeholder={placeholder || 'VD: 1950 hoặc 15/3/1950'}
        className={inputClassName}
        maxLength={10}
        disabled={disabled}
        style={{
          ...inputStyle,
          borderColor: error ? '#C0392B' : undefined,
        }}
      />

      {/* Error */}
      {error && (
        <p style={{ margin: '3px 0 0', fontSize: '0.7rem', color: '#C0392B' }}>
          Định dạng không hợp lệ
        </p>
      )}

      {/* Hint — always visible */}
      <p style={{ margin: '3px 0 0', fontSize: '0.68rem', color: focused ? '#8B4513' : '#9a7c60', lineHeight: 1.5 }}>
        Chấp nhận: <strong>1950</strong> (năm) · <strong>3/1950</strong> (tháng/năm) · <strong>15/3/1950</strong> (ngày/tháng/năm)
      </p>
    </div>
  )
}
