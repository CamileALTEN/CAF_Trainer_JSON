import axios from 'axios';

export interface IQuizResult {
  username: string;
  moduleId: string;
  itemId: string;
  score: number;
  answers: number[][];
  date?: string;
}

export const saveQuizResult = async (data: IQuizResult) => {
  await axios.post('/api/quiz-results', data);
};

export const getQuizResults = async (username: string): Promise<IQuizResult[]> =>
  (await axios.get(`/api/quiz-results/${username}`)).data;

export const deleteQuizResult = async (username: string, moduleId: string, itemId: string) => {
  await axios.delete('/api/quiz-results', { data: { username, moduleId, itemId } });
};
