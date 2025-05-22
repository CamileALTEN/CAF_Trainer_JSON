export type NotificationCategory = 'ticket' | 'password';

export interface INotification {
  id: string;
  username: string;
  date: string;
  category: NotificationCategory;
  message?: string;
}
