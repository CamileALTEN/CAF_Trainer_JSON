import axios from 'axios';

export type ItemStatus =
  | 'non_commencé'
  | 'en_cours'
  | 'besoin_aide'
  | 'terminé'
  | 'soumis_validation'
  | 'en_attente'
  | 'validé';

export const updateItemStatus = async (
  userId: string,
  itemId: string,
  status: ItemStatus
) => {
  await axios.patch(`/api/user-progress/${userId}/items/${itemId}/status`, { status });
};

export const sendHelpRequest = async (
  userId: string,
  itemId: string,
  message: string,
  email?: string
) => {
  await axios.post(`/api/user-progress/${userId}/items/${itemId}/help-request`, { message, email });
};

export const getUserProgress = async (
  opts?: { userId?: string; managerId?: string }
): Promise<IUserProgress[]> => {
  if (opts?.userId) {
    return (await axios.get(`/api/user-progress/${opts.userId}`)).data;
  }
  if (opts?.managerId) {
    return (await axios.get(`/api/user-progress`, { params: { managerId: opts.managerId } })).data;
  }
  return (await axios.get('/api/user-progress')).data;
};

export interface IUserProgress {
  userId: string;
  itemId: string;
  status: ItemStatus;
}
