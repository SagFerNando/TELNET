export type TicketStatus = 'pendiente' | 'asignado' | 'en_progreso' | 'resuelto' | 'cerrado';
export type TicketPriority = 'baja' | 'media' | 'alta' | 'critica';
export type ProblemType = 'internet' | 'telefono' | 'ambos';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'usuario' | 'operador' | 'experto';
}

export interface Expert {
  id: string;
  name: string;
  email: string;
  specializations: string[];
  activeTickets: number;
  totalResolved: number;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  problemType: ProblemType;
  priority: TicketPriority;
  status: TicketStatus;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  assignedExpertId?: string;
  assignedExpertName?: string;
  createdAt: string;
  updatedAt: string;
  location: string;
  serviceProvider?: string;
}

export interface Message {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: 'usuario' | 'experto';
  content: string;
  timestamp: string;
}

export interface TicketActivity {
  id: string;
  ticketId: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}