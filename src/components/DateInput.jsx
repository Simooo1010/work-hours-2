import React, { useState, useEffect } from 'react';

// Masked DD/MM/YYYY text input that converts to/from YYYY-MM-DD (ISO).
// Avoids <input type="date"> whose native iOS widget has an intrinsic
// minimum width that CSS width/box-sizing cannot override.
export default function DateInput({ id, value, onChange, required, style }) {
  const toDisplay = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return '';
    return `${d}/${m}/${y}`;
  };

  const toISO = (digits) => {
    if (digits.length < 8) return null;
    const d = digits.slice(0, 2);
    const m = digits.slice(2, 4);
    const y = digits.slice(4, 8);
    const date = new Date(`${y}-${m}-${d}`);
    if (isNaN(date.getTime())) return null;
    return `${y}-${m}-${d}`;
  };

  const [display, setDisplay] = useState(() => toDisplay(value));

  useEffect(() => {
    setDisplay(toDisplay(value));
  }, [value]);

  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setDisplay(formatted);
    const iso = toISO(digits);
    if (iso) onChange(iso);
  };

  const handleBlur = () => {
    const digits = display.replace(/\D/g, '');
    if (digits.length === 8) {
      const d = Math.min(31, Math.max(1, parseInt(digits.slice(0, 2), 10) || 1));
      const m = Math.min(12, Math.max(1, parseInt(digits.slice(2, 4), 10) || 1));
      const y = parseInt(digits.slice(4, 8), 10) || new Date().getFullYear();
      const pad = (n) => String(n).padStart(2, '0');
      const iso = `${y}-${pad(m)}-${pad(d)}`;
      const date = new Date(iso);
      if (!isNaN(date.getTime())) {
        onChange(iso);
        setDisplay(toDisplay(iso));
      }
    }
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="GG/MM/AAAA"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      required={required}
      maxLength={10}
      style={style}
    />
  );
}
