export type TicketStatus = 'pendiente' | 'asignado' | 'en_progreso' | 'resuelto' | 'cerrado';
export type TicketPriority = 'baja' | 'media' | 'alta' | 'critica';
export type ProblemType = 
  | 'internet_sin_conexion' 
  | 'internet_lento' 
  | 'internet_intermitente'
  | 'router_apagado'
  | 'router_configuracion'
  | 'router_wifi_debil'
  | 'router_reinicio_constante'
  | 'fibra_sin_señal'
  | 'fibra_ont_apagado'
  | 'adsl_desconexiones'
  | 'adsl_lento'
  | 'telefono_sin_linea'
  | 'telefono_ruido'
  | 'telefono_no_recibe'
  | 'telefono_no_realiza'
  | 'telefono_spam'
  | 'cableado_dañado'
  | 'cableado_instalacion'
  | 'otro';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'usuario' | 'operador' | 'experto';
  city?: string;
}

export interface Expert {
  id: string;
  name: string;
  email: string;
  city?: string;
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
  
  // Usuario (normalizado - solo ID, datos vienen de profiles)
  userId: string;
  user?: {
    name: string;
    email: string;
    phone: string;
    city?: string;
  };
  
  // Experto asignado (normalizado - solo ID, datos vienen de profiles + experts)
  assignedExpertId?: string;
  assignedExpert?: {
    name: string;
    email: string;
    city?: string;
    specializations: string[];
  };
  assignedAt?: string;
  
  // Operador que asignó (normalizado)
  assignedById?: string;
  
  // Ubicación del problema
  city: string;          // Ciudad donde está el problema
  address: string;       // Dirección completa del problema
  serviceProvider?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface Message {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: 'usuario' | 'experto';
  content: string;
  imageUrl?: string;  // URL de imagen adjunta (opcional)
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