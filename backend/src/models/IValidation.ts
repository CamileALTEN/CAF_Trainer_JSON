export interface IValidation {
  id: string;
  username: string;
  managerId?: string;
  moduleId: string;
  itemId: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  date: string;
}
