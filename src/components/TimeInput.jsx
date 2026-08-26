import React from 'react';

// A masked "HH:MM" text input, used instead of <input type="time">.
// iOS Safari's native time-picker control has an intrinsic minimum
// rendering width that ignores CSS width/box-sizing, so it can overflow
// its container regardless of layout. A plain text input has no such
// native widget and always respects normal CSS box sizing.
export default function TimeInput({ id, value, onChange, required, placeholder = 'HH:MM', style }) {
  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
    onChange(formatted);
  };

  const handleBlur = () => {
    if (!value) return;
    const [hStr = '', mStr = ''] = value.split(':');
    if (!hStr && !mStr) return;
    const h = Math.min(23, parseInt(hStr, 10) || 0);
    const m = Math.min(59, parseInt(mStr, 10) || 0);
    const pad = (n) => String(n).padStart(2, '0');
    onChange(`${pad(h)}:${pad(m)}`);
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      required={required}
      maxLength={5}
      style={style}
    />
  );
}
