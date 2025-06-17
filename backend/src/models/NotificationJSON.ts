import { Notification } from './Notification';

export type NotificationJSON = Omit<Notification, 'dateEnvoi' | 'expireraLe'> & {
  dateEnvoi: string;
  expireraLe?: string;
};
