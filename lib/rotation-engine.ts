import { cropProfiles } from "@/lib/crops";
import type { CropProfile } from "@/lib/crops";

export type RotationSequence = {
  crops: CropProfile[];
  familyChanges: number;
  repeatedAdjacentFamily: boolean;
  explanation: string[];
};

export function buildRotationSequences(length = 3): RotationSequence[] {
  const candidates = cropProfiles.filter((crop) => crop.type === "Annual");
  const sequences: RotationSequence[] = [];

  function visit(path: CropProfile[]) {
    if (path.length === length) {
      const familyChanges = path.slice(1).filter((crop, index) => crop.family !== path[index].family).length;
      const repeatedAdjacentFamily = familyChanges !== length - 1;
      sequences.push({
        crops: [...path],
        familyChanges,
        repeatedAdjacentFamily,
        explanation: path.slice(1).map((crop, index) =>
          crop.family === path[index].family
            ? `The sequence keeps two consecutive crops in the ${crop.family} family; this is a family-repetition flag, not an automatic agronomic rejection.`
            : `The sequence changes botanical family from ${path[index].family} to ${crop.family}; this describes botanical diversity only.`
        )
      });
      return;
    }
    for (const crop of candidates) {
      if (path.some((item) => item.id === crop.id)) continue;
      visit([...path, crop]);
    }
  }

  visit([]);
  return sequences.sort((a, b) => Number(a.repeatedAdjacentFamily) - Number(b.repeatedAdjacentFamily) || b.familyChanges - a.familyChanges);
}
