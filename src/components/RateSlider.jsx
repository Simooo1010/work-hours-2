import React from 'react';

export const RATE_STEPS = [2.5, 2.6, 2.7, 2.8, 2.9, 3.0];

// Finds the closest step index for a given rate value
export function rateToIndex(rate) {
  const r = Number(rate);
  let best = 0;
  let bestDiff = Infinity;
  RATE_STEPS.forEach((step, i) => {
    const diff = Math.abs(step - r);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  });
  return best;
}

export default function RateSlider({ value, onChange }) {
  const index = rateToIndex(value);

  return (
    <div className="rate-slider-wrap">
      <div className="rate-slider-header">
        <span className="rate-slider-label">Tariffa sessione</span>
        <span className="rate-slider-value">
          €{RATE_STEPS[index].toFixed(2)}
          <span className="rate-slider-unit">/h</span>
        </span>
      </div>

      <div className="rate-slider-track-area">
        <input
          type="range"
          className="rate-slider-input"
          min={0}
          max={RATE_STEPS.length - 1}
          step={1}
          value={index}
          onChange={(e) => onChange(RATE_STEPS[Number(e.target.value)])}
        />

        {/* Dot markers at each step position */}
        <div className="rate-slider-dots-row" aria-hidden>
          {RATE_STEPS.map((_, i) => (
            <span key={i} className={`rate-slider-dot${i === index ? ' active' : ''}`} />
          ))}
        </div>

        <div className="rate-slider-labels">
          <span className="rate-slider-end-label">€{RATE_STEPS[0].toFixed(2)}</span>
          <span className="rate-slider-end-label">€{RATE_STEPS[RATE_STEPS.length - 1].toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
