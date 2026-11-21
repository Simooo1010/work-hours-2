import { roundHours, roundToQuarterEuro } from './rounding';

const DAY_LABELS = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

const iso = (d) => d.toLocaleDateString('sv-SE');

export function mondayOf(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

export function buildWeek(sessions, monday) {
  const days = DAY_LABELS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = iso(d);
    const daySessions = sessions.filter((s) => s.date === key);
    const hours = daySessions.reduce((a, s) => a + roundHours(Number(s.duration_hours)), 0);
    return { key, label, sessions: daySessions, hours };
  });
  const all = days.flatMap((d) => d.sessions);
  const hours = days.reduce((a, d) => a + d.hours, 0);
  const earnings = all.reduce(
    (a, s) => a + roundToQuarterEuro(roundHours(Number(s.duration_hours)) * Number(s.hourly_rate)),
    0
  );
  return { days, count: all.length, hours, earnings };
}
