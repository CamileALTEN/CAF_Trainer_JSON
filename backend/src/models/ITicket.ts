export type TicketStatus = 'open' | 'pending' | 'closed';

export type TicketPriority = 'low' | 'normal' | 'high';

export interface TicketReply {
  author: string;
  role: 'admin' | 'manager' | 'caf';
  message: string;
  date: string;
}

export interface ITicket {
  id: string;
  username: string;       // auteur
  managerId?: string;     // manager référent éventuel
  target: 'admin' | 'manager' | 'both';
  category?: string;
  priority: TicketPriority;
  attachment?: string;
  title: string;
  message: string;
  status: TicketStatus;
  date: string;
  replies: TicketReply[];
}
