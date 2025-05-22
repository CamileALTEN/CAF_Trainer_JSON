export type TicketStatus = 'open' | 'pending' | 'closed';

export interface ITicket {
  id: string;
  username: string;       // auteur
  managerId?: string;     // manager référent éventuel
  target: 'admin' | 'manager' | 'both';
  title: string;
  message: string;
  status: TicketStatus;
  date: string;
}
