import axios from 'axios';
import { ItemStatus } from './userProgress';

export interface IUserItem {
  userId: string;
  itemId: string;
  status: ItemStatus;
}

export interface ValidationPayload {
  action: 'approve' | 'reject' | 'rollback';
  targetStatus?: ItemStatus;
  comment?: string;
  managerId: string;
}

export const getPending = async (): Promise<IUserItem[]> =>
  (await axios.get('/api/validations/pending')).data;

export const getCompleted = async (): Promise<IUserItem[]> =>
  (await axios.get('/api/validations/completed')).data;

export const sendValidation = async (
  userId: string,
  itemId: string,
  data: ValidationPayload
): Promise<IUserItem> =>
  (await axios.post(`/api/validations/${userId}/${itemId}`, data)).data;
