export type MuscleRegion =
  | "shoulders"
  | "chest"
  | "back"
  | "biceps"
  | "triceps"
  | "forearms"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves";

/** Normalizes constants.ts muscle group names (which include "lats") onto the region set this SVG draws. */
export function normalizeRegions(groups: string[]): Set<MuscleRegion> {
  const map: Record<string, MuscleRegion> = {
    shoulders: "shoulders",
    chest: "chest",
    back: "back",
    lats: "back",
    biceps: "biceps",
    triceps: "triceps",
    forearms: "forearms",
    quads: "quads",
    hamstrings: "hamstrings",
    glutes: "glutes",
    calves: "calves",
  };
  const result = new Set<MuscleRegion>();
  groups.forEach((g) => {
    const region = map[g];
    if (region) result.add(region);
  });
  return result;
}
