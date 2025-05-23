export type ValidationStatus = 'pending' | 'approved' | 'rejected';

export interface IValidation {
  id: string;
  username: string;
  moduleId: string;
  itemId: string;
  itemTitle: string;
  date: string;
  status: ValidationStatus;
}
