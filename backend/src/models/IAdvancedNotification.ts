export type NotificationType =
  | 'info'
  | 'succès'
  | 'alerte'
  | 'erreur'
  | 'rappel'
  | 'système'
  | 'boost'
  | 'recommandation';

export interface NotificationAction {
  type: string;
  url?: string;
}

export interface IAdvancedNotification {
  id: string;
  type: NotificationType;
  message: string;
  cible: string[];
  action: NotificationAction;
  origine: string;
  dateEnvoi: Date;
  expireraLe: Date | null;
  luPar: string[];
  nonLuPar: string[];
  tags: string[];
}
