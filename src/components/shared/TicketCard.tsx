import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Ticket } from '../../types';
import { Calendar, MapPin, User, Clock } from 'lucide-react';

interface TicketCardProps {
  ticket: Ticket;
}

export function TicketCard({ ticket }: TicketCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{ticket.title}</h3>
            <p className="text-sm text-muted-foreground">
              Reportado por: {ticket.user_name || ticket.user?.name || 'Usuario'}
            </p>
            <p className="text-xs text-muted-foreground">
              {ticket.user_email || ticket.user?.email || 'Sin email'} • {ticket.user_phone || ticket.user?.phone || 'Sin teléfono'}
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Badge className={getPriorityColor(ticket.priority)}>
              {ticket.priority}
            </Badge>
            <Badge className={getStatusColor(ticket.status)}>
              {getStatusLabel(ticket.status)}
            </Badge>
          </div>
        </div>

        {/* Descripción */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {ticket.description}
        </p>

        {/* Tipo de Problema y Prioridad */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="capitalize">
            {getProblemTypeLabel(ticket.problemType)}
          </Badge>
        </div>

        {/* Ubicación */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <MapPin className="h-4 w-4" />
          <span>{ticket.city} - {ticket.address}</span>
        </div>

        {/* Experto Asignado */}
        {(ticket.assigned_expert_name || ticket.assignedExpert?.name) && (
          <div className="flex items-center gap-2 text-sm mb-2">
            <User className="h-4 w-4 text-blue-500" />
            <span>
              Asignado a: <span className="font-medium">{ticket.assigned_expert_name || ticket.assignedExpert?.name}</span>
            </span>
          </div>
        )}

        {/* Fecha */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Creado: {formatDate(ticket.createdAt)}</span>
          {ticket.updatedAt !== ticket.createdAt && (
            <>
              <Clock className="h-3 w-3 ml-2" />
              <span>Actualizado: {formatDate(ticket.updatedAt)}</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    baja: 'bg-gray-100 text-gray-800',
    media: 'bg-blue-100 text-blue-800',
    alta: 'bg-orange-100 text-orange-800',
    critica: 'bg-red-100 text-red-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    asignado: 'bg-blue-100 text-blue-800',
    en_progreso: 'bg-purple-100 text-purple-800',
    resuelto: 'bg-green-100 text-green-800',
    cerrado: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pendiente: 'Pendiente',
    asignado: 'Asignado',
    en_progreso: 'En Progreso',
    resuelto: 'Resuelto',
    cerrado: 'Cerrado',
  };
  return labels[status] || status;
}

function getProblemTypeLabel(problemType: string): string {
  const labels: Record<string, string> = {
    'internet_sin_conexion': 'Sin Conexión',
    'internet_lento': 'Internet Lento',
    'internet_intermitente': 'Intermitente',
    'router_apagado': 'Router Apagado',
    'router_configuracion': 'Config. Router',
    'router_wifi_debil': 'WiFi Débil',
    'router_reinicio_constante': 'Router Reinicia',
    'fibra_sin_señal': 'Sin Señal Fibra',
    'fibra_ont_apagado': 'ONT Apagado',
    'adsl_desconexiones': 'ADSL Desconexiones',
    'adsl_lento': 'ADSL Lento',
    'telefono_sin_linea': 'Sin Línea',
    'telefono_ruido': 'Ruido Telefónico',
    'telefono_no_recibe': 'No Recibe Llamadas',
    'telefono_no_realiza': 'No Puede Llamar',
    'cableado_dañado': 'Cable Dañado',
    'cableado_instalacion': 'Instalación',
    'otro': 'Otro'
  };
  return labels[problemType] || problemType;
}
