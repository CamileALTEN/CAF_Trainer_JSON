export type TicketStatus =
  | 'open'
  | 'pending'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export interface ITicket {
  id: string;
  username: string;
  managerId?: string;
  target: 'admin' | 'manager' | 'both';
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'normal' | 'high';
  assignedTo?: string;
  attachments?: string[];
  status: TicketStatus;
  date: string;
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
