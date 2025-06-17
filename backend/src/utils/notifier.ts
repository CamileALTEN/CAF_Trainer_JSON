import { read, write } from '../config/dataStore';
import { sendMail } from './mailer';
import {
  INotification,
  NotificationCategory,
  NotificationType,
} from '../models/INotification';

const TABLE = 'notifications';

export interface NotifyOptions {
  username: string;
  category: NotificationCategory;
  message: string;
  to: string[];
  type?: NotificationType;
  cible?: string[];
}

export async function notify(options: NotifyOptions): Promise<void> {
  const list = read<INotification>(TABLE);
  const entry: INotification = {
    id: Date.now().toString(),
    username: options.username,
    date: new Date().toISOString(),
    dateEnvoi: new Date().toISOString(),
    category: options.category,
    type: options.type,
    cible: options.cible,
    etat: { luPar: [], nonLuPar: options.cible ? [...options.cible] : [] },
    message: options.message,
  };
  list.push(entry);
  write(TABLE, list);
  if (options.to.length > 0) {
    await sendMail(options.to, 'CAF\u2011Trainer notification', `<p>${options.message}</p>`);
  }
}
