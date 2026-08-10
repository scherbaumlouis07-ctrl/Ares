export const WEEKDAYS_DE = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
] as const;

export const WEEKDAYS_SHORT_DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;

export const MONTHS_SHORT_DE = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
] as const;

export type TrainingKind = "push" | "pull" | "legs" | "arms" | "rest";

export interface TrainingDay {
  weekday: number; // 0 = Monday
  label: string;
  kind: TrainingKind;
}

export const TRAINING_PLAN: TrainingDay[] = [
  { weekday: 0, label: "Circle Training + Push", kind: "push" },
  { weekday: 1, label: "Rest", kind: "rest" },
  { weekday: 2, label: "Circle Training + Pull", kind: "pull" },
  { weekday: 3, label: "Rest", kind: "rest" },
  { weekday: 4, label: "Circle Training + Legs", kind: "legs" },
  { weekday: 5, label: "Rest", kind: "rest" },
  { weekday: 6, label: "Arme", kind: "arms" },
];

export const MUSCLE_GROUPS_BY_KIND: Record<TrainingKind, string[]> = {
  push: ["chest", "shoulders", "triceps"],
  pull: ["back", "lats", "biceps"],
  legs: ["quads", "hamstrings", "glutes", "calves"],
  arms: ["biceps", "triceps", "forearms"],
  rest: [],
};

export const OUTREACH_CHANNELS = [
  { key: "email", label: "Cold Email", target: 20 },
  { key: "loom", label: "Cold Loom", target: 20 },
  { key: "linkedin", label: "Cold LinkedIn", target: 20 },
] as const;

export const HEATMAP_CATEGORIES = ["Deep Work", "Training", "Sleep"] as const;

export interface DefaultTask {
  id: string;
  time: string;
  label: string;
}

export const DEFAULT_TASKS: DefaultTask[] = [
  { id: "morning-routine", time: "06:00", label: "Morning Routine" },
  { id: "arbeit", time: "08:00", label: "Arbeit" },
  { id: "outreach", time: "14:00", label: "Outreach Block" },
  { id: "deep-work", time: "18:00", label: "Deep Work" },
  { id: "training", time: "19:30", label: "Training" },
  { id: "journal", time: "21:30", label: "Journal" },
];
