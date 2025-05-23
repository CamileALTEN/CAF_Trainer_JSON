export type ItemStatus =
  | 'not_started'
  | 'in_progress'
  | 'need_help'
  | 'to_validate'
  | 'validated'
  | 'auto_done';

export interface IProgress {
  username: string;           // identifiant CAF
  moduleId: string;
  statuses: Record<string, ItemStatus>; // ID d'item -> statut
}
