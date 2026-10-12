import type { HistoryEntry } from "../history/types.js";
import type { DayView, NextBooking } from "../settings/types.js";

export interface Overview {
  days: DayView[];
  next: NextBooking | null;
  history: HistoryEntry[];
}
