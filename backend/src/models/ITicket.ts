export type TicketStatus =
  | 'open'
  | 'pending'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export interface ITicket {
  id: string;
  username: string;       // auteur
  managerId?: string;     // manager référent éventuel
  target: 'admin' | 'manager' | 'both';
  title: string;
  description: string; // texte riche
  category: string;
  priority: 'low' | 'normal' | 'high';
  assignedTo?: string;
  attachments?: string[];
  status: TicketStatus;
  date: string;
}
