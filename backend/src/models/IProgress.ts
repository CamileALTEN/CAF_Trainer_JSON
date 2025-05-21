export type ProgressState =
  | 'not-started'
  | 'in-progress'
  | 'struggling'
  | 'checking'
  | 'validated'
  | 'finished';

export interface IProgress {
  username: string;                 // identifiant CAF
  moduleId: string;
  states:   Record<string, ProgressState>; // état par item
}
