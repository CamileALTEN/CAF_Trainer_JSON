export interface IValidationLog {
  id: string;
  date: string;
  managerId: string;
  userId: string;
  itemId: string;
  oldStatus: string;
  newStatus: string;
  comment?: string;
}
