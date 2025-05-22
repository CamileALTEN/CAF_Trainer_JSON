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
  title: string;
  message: string;
  status: TicketStatus;
  date: string;
  replies: TicketReply[];
  archived?: boolean;
}

export async function getTickets(search?: string): Promise<ITicket[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`/api/tickets${query}`);
  return res.json();
}

export async function createTicket(data: Omit<ITicket, 'id' | 'status' | 'date' | 'archived'>): Promise<ITicket> {
  const res = await fetch('/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateTicket(
  id: string,
  data: {
    status?: TicketStatus;
    archived?: boolean;
    title?: string;
    message?: string;
    category?: string;
    priority?: TicketPriority;
  }
): Promise<ITicket> {
  const res = await fetch(`/api/tickets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function exportTicket(id: string): Promise<Blob> {
  const res = await fetch(`/api/tickets/${id}/export`);
  return res.blob();
}

export async function replyTicket(id: string, data: Omit<TicketReply, 'date'>): Promise<TicketReply> {
  const res = await fetch(`/api/tickets/${id}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}
