import { MONTHS_SHORT_DE } from "./constants";

/** Deterministic pseudo-random mock series, stable across renders. */
function seededSeries(seed: number, length: number, min: number, max: number): number[] {
  let value = seed;
  return Array.from({ length }, () => {
    value = (value * 9301 + 49297) % 233280;
    const rnd = value / 233280;
    return Math.round(min + rnd * (max - min));
  });
}

export function outreachKonstanzMock() {
  const values = seededSeries(17, 12, 55, 98);
  return MONTHS_SHORT_DE.map((label, i) => ({ label, value: values[i] }));
}

export function trainingDisciplineYearlyMock() {
  const values = seededSeries(88, 12, 60, 96);
  return MONTHS_SHORT_DE.map((label, i) => ({ label, value: values[i] }));
}

export interface PricePoint {
  label: string;
  value: number;
}

export function weeklyPriceMock(seed: number, base: number, volatility: number): PricePoint[] {
  const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const deltas = seededSeries(seed, 7, -volatility, volatility);
  let running = base;
  return days.map((label, i) => {
    running += deltas[i];
    return { label, value: Math.max(0, Math.round(running)) };
  });
}
