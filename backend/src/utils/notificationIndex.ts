import { NotificationJSON } from '../models/NotificationJSON';
import { NotificationType } from '../models/Notification';

export interface NotificationIndexes {
  byUserId: Record<string, string[]>;
  byUnread: Record<string, string[]>;
  byType: Record<NotificationType, string[]>;
  byTag: Record<string, string[]>;
}

const ALL = '*';

export function buildIndexes(list: NotificationJSON[]): NotificationIndexes {
  const indexes: NotificationIndexes = {
    byUserId: {},
    byUnread: {},
    byType: {} as Record<NotificationType, string[]>,
    byTag: {},
  };

  for (const n of list) {
    const users = n.cible?.userIds ?? [ALL];
    for (const uid of users) {
      if (!indexes.byUserId[uid]) indexes.byUserId[uid] = [];
      indexes.byUserId[uid].push(n.id);
    }
    if (n.etat?.nonLuPar) {
      for (const uid of n.etat.nonLuPar) {
        if (!indexes.byUnread[uid]) indexes.byUnread[uid] = [];
        indexes.byUnread[uid].push(n.id);
      }
    }
    if (n.type) {
      if (!indexes.byType[n.type]) indexes.byType[n.type] = [];
      indexes.byType[n.type].push(n.id);
    }
    if (n.tags) {
      for (const tag of n.tags) {
        if (!indexes.byTag[tag]) indexes.byTag[tag] = [];
        indexes.byTag[tag].push(n.id);
      }
    }
  }
  return indexes;
}
