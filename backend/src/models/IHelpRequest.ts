export interface IHelpRequest {
  id: string;
  username: string;
  moduleId: string;
  itemId: string;
  itemTitle: string;
  message: string;
  notifyManager: boolean;
  email?: string;
  date: string;
}
