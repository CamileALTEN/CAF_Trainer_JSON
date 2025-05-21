export type ProgressState =
  | 'not_started'
  | 'in_progress'
  | 'stuck'
  | 'checking'
  | 'validated'
  | 'finished';

export interface IProgress {
  username: string;           // identifiant CAF
  moduleId: string;
  states:   Record<string, ProgressState>; // itemId -> état
}
