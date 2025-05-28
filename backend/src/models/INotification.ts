export type NotificationCategory = 'ticket' | 'password' | 'validation';

export interface INotification {
  id: string;
  username: string;
  date: string;
  category: NotificationCategory;
  message?: string;
}
