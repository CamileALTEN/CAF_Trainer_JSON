export type NotificationType =
  | 'info'
  | 'succès'
  | 'alerte'
  | 'erreur'
  | 'système'
  | 'rappel'
  | 'boost'
  | 'recommandation';

export interface NotificationTarget {
  userIds?: string[];
  roles?: ('CAF' | 'Manager' | 'Admin')[];
}

export interface NotificationAction {
  type: 'link' | 'none';
  url?: string;
}

export interface NotificationState {
  luPar: string[];
  nonLuPar: string[];
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  cible: NotificationTarget;
  action?: NotificationAction;
  tags?: string[];
  origine: string;
  dateEnvoi: Date;
  expireraLe?: Date;
  etat: NotificationState;
}
