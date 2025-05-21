import axios from 'axios';

export type ProgressState =
  | 'not-started'
  | 'in-progress'
  | 'struggling'
  | 'checking'
  | 'validated'
  | 'finished';

export interface IProgress {
  username: string;
  moduleId: string;
  states: Record<string, ProgressState>;
}

export const getProgress = async (username: string): Promise<IProgress[]> =>
  (await axios.get(`/api/progress/${username}`)).data;

export const updateItemState = async (
  username: string,
  moduleId: string,
  itemId: string,
  state: ProgressState,
): Promise<void> => {
  await axios.patch('/api/progress', { username, moduleId, itemId, state });
};
