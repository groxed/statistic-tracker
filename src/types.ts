export interface StatEntry {
  id: string;
  date: string; // YYYY-MM-DD format for robust sorting and native inputs
  value?: number | null; // Nullable or optional for non-statistic checkpoint events
  isCheckpoint?: boolean; // Numerical/statistic checkpoint
  isEvent?: boolean; // Non-statistic checkpoint event
  eventName?: string; // Descriptive name/label for the event
}

export type TimeRange = 'all' | '1m' | '3m' | '6m' | '1y' | 'custom';
