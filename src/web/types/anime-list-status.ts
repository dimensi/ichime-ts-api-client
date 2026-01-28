export type AnimeListEntryStatus =
  | "watching"
  | "completed"
  | "onHold"
  | "dropped"
  | "planned"
  | "notInList";

export const AnimeListEntryStatusNumericId: Record<AnimeListEntryStatus, number> = {
  planned: 0,
  watching: 1,
  completed: 2,
  onHold: 3,
  dropped: 4,
  notInList: 99,
};

export function animeListEntryStatusFromNumericId(id: number): AnimeListEntryStatus | null {
  switch (id) {
    case 0:
      return "planned";
    case 1:
      return "watching";
    case 2:
      return "completed";
    case 3:
      return "onHold";
    case 4:
      return "dropped";
    case 99:
      return "notInList";
    default:
      return null;
  }
}

export type AnimeListCategory = "watching" | "completed" | "onHold" | "dropped" | "planned";

export const AnimeListCategoryWebPath: Record<AnimeListCategory, string> = {
  watching: "watching",
  completed: "completed",
  onHold: "onhold",
  dropped: "dropped",
  planned: "planned",
};

export const AnimeListCategoryNumericId: Record<AnimeListCategory, number> = {
  planned: 0,
  watching: 1,
  completed: 2,
  onHold: 3,
  dropped: 4,
};

export function animeListCategoryFromNumericId(id: number): AnimeListCategory | null {
  switch (id) {
    case 0:
      return "planned";
    case 1:
      return "watching";
    case 2:
      return "completed";
    case 3:
      return "onHold";
    case 4:
      return "dropped";
    default:
      return null;
  }
}
