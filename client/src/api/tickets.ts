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
  username: string;
  managerId?: string;
  target: 'admin' | 'manager' | 'both';
  category?: string;
  priority: TicketPriority;
  attachment?: string | null;
  title: string;
  message: string;
  status: TicketStatus;
  date: string;
  replies: TicketReply[];
}

export async function getTickets(): Promise<ITicket[]> {
  const res = await fetch('/api/tickets');
  return res.json();
}

export async function createTicket(data: Omit<ITicket, 'id' | 'status' | 'date'>): Promise<ITicket> {
  const res = await fetch('/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateTicket(id: string, status: TicketStatus): Promise<ITicket> {
  const res = await fetch(`/api/tickets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return res.json();
}

export async function patchTicket(id: string, data: Partial<Omit<ITicket, 'id' | 'username' | 'managerId' | 'date' | 'replies'>>): Promise<ITicket> {
  const res = await fetch(`/api/tickets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function replyTicket(id: string, data: Omit<TicketReply, 'date'>): Promise<TicketReply> {
  const res = await fetch(`/api/tickets/${id}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}
