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
  /** IDs d’items visités (ancien suivi) */
  visited:  string[];
  /** Statut avancé de chaque item */
  statuses?: Record<string, ItemStatus>;
}
