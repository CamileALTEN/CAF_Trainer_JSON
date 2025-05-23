export type NotificationCategory = 'ticket' | 'password' | 'help';

export interface INotification {
  id: string;
  username: string;
  date: string;
  category: NotificationCategory;
  message?: string;
}
