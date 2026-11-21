export const pad2 = (n) => String(n).padStart(2, '0');

export function formatEuro(n) {
  return Number(n || 0).toFixed(2).replace('.', ',');
}

export function formatHoursIt(h) {
  return Number(h || 0).toFixed(1).replace('.', ',');
}

export function formatClock(ms) {
  const neg = ms < 0;
  const total = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${neg ? '-' : ''}${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}
