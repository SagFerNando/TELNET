/**
 * API utilities para interactuar con el backend de Supabase
 * Centraliza todas las operaciones de datos
 */

import { fetchFromServer } from './supabase/client';
import { Ticket, Expert, Message, TicketActivity } from '../types';

// ============================================
// TICKETS
// ============================================

export interface CreateTicketData {
  title: string;
  description: string;
  problemType: 'internet' | 'telefono' | 'ambos';
  priority: 'baja' | 'media' | 'alta' | 'critica';
  location: string;
  serviceProvider?: string;
}

export interface TicketFilters {
  status?: string;
  problemType?: string;
  priority?: string;
}

/**
 * Crear un nuevo ticket
 */
export async function createTicket(data: CreateTicketData): Promise<Ticket> {
  const response = await fetchFromServer('/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.ticket;
}

/**
 * Obtener lista de tickets con filtros opcionales
 */
export async function getTickets(filters?: TicketFilters): Promise<Ticket[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.problemType) params.append('problemType', filters.problemType);
  if (filters?.priority) params.append('priority', filters.priority);

  const queryString = params.toString();
  const endpoint = queryString ? `/tickets?${queryString}` : '/tickets';
  
  const response = await fetchFromServer(endpoint);
  return response.tickets || [];
}

/**
 * Obtener un ticket específico por ID
 */
export async function getTicket(ticketId: string): Promise<Ticket> {
  const response = await fetchFromServer(`/tickets/${ticketId}`);
  return response.ticket;
}

/**
 * Asignar ticket a un experto (solo operadores)
 */
export async function assignTicket(ticketId: string, expertId: string): Promise<Ticket> {
  const response = await fetchFromServer(`/tickets/${ticketId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ expertId }),
  });
  return response.ticket;
}

/**
 * Actualizar estado de un ticket
 */
export async function updateTicketStatus(
  ticketId: string,
  status: 'pendiente' | 'asignado' | 'en_progreso' | 'resuelto' | 'cerrado'
): Promise<Ticket> {
  const response = await fetchFromServer(`/tickets/${ticketId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  return response.ticket;
}

/**
 * Obtener actividades de un ticket
 */
export async function getTicketActivities(ticketId: string): Promise<TicketActivity[]> {
  const response = await fetchFromServer(`/tickets/${ticketId}/activities`);
  return response.activities || [];
}

// ============================================
// MENSAJES
// ============================================

/**
 * Enviar un mensaje en un ticket
 */
export async function sendMessage(ticketId: string, content: string): Promise<Message> {
  const response = await fetchFromServer('/messages', {
    method: 'POST',
    body: JSON.stringify({ ticketId, content }),
  });
  return response.message;
}

/**
 * Obtener mensajes de un ticket
 */
export async function getMessages(ticketId: string): Promise<Message[]> {
  const response = await fetchFromServer(`/messages/${ticketId}`);
  return response.messages || [];
}

// ============================================
// EXPERTOS
// ============================================

/**
 * Obtener lista de todos los expertos
 */
export async function getExperts(): Promise<Expert[]> {
  const response = await fetchFromServer('/experts');
  return response.experts || [];
}

/**
 * Obtener expertos filtrados por especialización
 */
export async function getExpertsBySpecialization(specialization: string): Promise<Expert[]> {
  const experts = await getExperts();
  return experts.filter(expert => 
    expert.specializations.includes(specialization)
  );
}

// ============================================
// ESTADÍSTICAS
// ============================================

export interface UserStats {
  totalTickets: number;
  pendientes: number;
  enProgreso: number;
  resueltos: number;
}

export interface OperatorStats {
  totalTickets: number;
  pendientes: number;
  asignados: number;
  enProgreso: number;
  resueltos: number;
  cerrados: number;
}

export interface ExpertStats {
  activeTickets: number;
  totalResolved: number;
  enProgreso: number;
  resueltos: number;
}

/**
 * Obtener estadísticas según el rol del usuario
 */
export async function getStats(): Promise<UserStats | OperatorStats | ExpertStats> {
  const response = await fetchFromServer('/stats');
  return response.stats;
}

// ============================================
// HELPERS
// ============================================

/**
 * Obtener prioridad con color
 */
export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    baja: 'bg-gray-100 text-gray-800',
    media: 'bg-blue-100 text-blue-800',
    alta: 'bg-orange-100 text-orange-800',
    critica: 'bg-red-100 text-red-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}

/**
 * Obtener estado con color
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    asignado: 'bg-blue-100 text-blue-800',
    en_progreso: 'bg-purple-100 text-purple-800',
    resuelto: 'bg-green-100 text-green-800',
    cerrado: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Formatear fecha relativa
 */
export function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  
  return then.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: diffDays > 365 ? 'numeric' : undefined
  });
}

/**
 * Formatear fecha completa
 */
export function formatFullDate(date: string): string {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
