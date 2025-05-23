export interface IValidationEntry {
  id: string;
  username: string;
  moduleId: string;
  itemId: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}
