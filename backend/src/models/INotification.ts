export type NotificationCategory = 'ticket' | 'password' | 'validation';

export type NotificationType =
  | 'info'
  | 'success'
  | 'alert'
  | 'error'
  | 'system'
  | 'rappel'
  | 'boost'
  | 'recommandation';

export interface NotificationAction {
  type: string;
  url?: string;
}

export interface NotificationState {
  luPar: string[];
  nonLuPar: string[];
}

export interface INotification {
  id: string;
  /** Utilisateur ayant généré la notification (optionnel pour compat) */
  username?: string;
  /** Ancien champ de date conservé pour compatibilité */
  date?: string;
  category?: NotificationCategory;
  type?: NotificationType;
  message?: string;
  /** Liste d'utilisateurs ciblés par la notification */
  cible?: string[];
  action?: NotificationAction;
  tags?: string[];
  etat?: NotificationState;
  origine?: string;
  dateEnvoi?: string;
  expireraLe?: string;
}
