export interface IQuizResult {
  username: string;
  moduleId: string;
  itemId: string;
  score: number;
  answers: number[][];
  date: string;
}
