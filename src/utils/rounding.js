/**
 * Arrotonda le ore alla mezz'ora/ora decimale più vicina.
 * Esempi:
 * - 4 ore e 35 minuti (4.58 ore) -> 4.5 ore
 * - 5 ore e 54 minuti (5.90 ore) -> 6.0 ore
 * - 7 ore e 10 minuti (7.17 ore) -> 7.0 ore
 * 
 * @param {number} hours - Ore in formato decimale
 * @returns {number} Ore arrotondate al più vicino 0.5
 */
export const roundHours = (hours) => {
  if (isNaN(hours) || hours === null) return 0;
  return Math.round(Number(hours) * 2) / 2;
};

/**
 * Calcola i guadagni basati sulle ore arrotondate e sulla tariffa oraria.
 * 
 * @param {number} hours - Ore in formato decimale
 * @param {number} rate - Tariffa oraria
 * @returns {number} Guadagni arrotondati
 */
export const getRoundedEarnings = (hours, rate) => {
  if (isNaN(hours) || hours === null) return 0;
  const rounded = roundHours(hours);
  return rounded * Number(rate);
};

/**
 * Formatta le ore decimali in stringa leggibile HHh MMm
 * 
 * @param {number} hoursDecimal 
 * @returns {string} Esempio: "4h 30m"
 */
export const formatHoursAndMinutes = (hoursDecimal) => {
  if (isNaN(hoursDecimal) || hoursDecimal === null) return '0m';
  const totalMinutes = Math.round(hoursDecimal * 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};
