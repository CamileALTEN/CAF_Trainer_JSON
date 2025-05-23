import { ItemStatus } from './types';

export interface IUserProgress {
  userId: string;
  itemId: string;
  status: ItemStatus;
}
