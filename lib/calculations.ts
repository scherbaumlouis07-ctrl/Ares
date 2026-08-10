export function percentage(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

export function taskCompletionPercentage(tasks: { done: boolean }[]): number {
  return percentage(tasks.filter((t) => t.done).length, tasks.length);
}

export interface HeatmapCell {
  completed: boolean;
}

export function weeklyPerformancePercentage(cells: HeatmapCell[]): number {
  return percentage(cells.filter((c) => c.completed).length, cells.length);
}

export function outreachConsistencyPercentage(counts: number[], target: number): number {
  if (counts.length === 0) return 0;
  const ratios = counts.map((c) => Math.min(c / target, 1));
  const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  return Math.round(avg * 100);
}

export function trainingDisciplinePercentage(scheduled: number, completed: number): number {
  return percentage(completed, scheduled);
}
