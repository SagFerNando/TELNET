import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Ticket } from '../../types';
import { Calendar, MapPin, Phone, User, Wifi, PhoneCall } from 'lucide-react';

interface TicketCardProps {
  ticket: Ticket;
  onViewDetails?: (ticket: Ticket) => void;
  showActions?: boolean;
  onAssign?: (ticket: Ticket) => void;
  onTakeTicket?: (ticket: Ticket) => void;
}

const priorityColors = {
  baja: 'bg-green-100 text-green-800',
  media: 'bg-yellow-100 text-yellow-800',
  alta: 'bg-orange-100 text-orange-800',
  critica: 'bg-red-100 text-red-800'
};

const statusColors = {
  pendiente: 'bg-gray-100 text-gray-800',
  asignado: 'bg-blue-100 text-blue-800',
  en_progreso: 'bg-purple-100 text-purple-800',
  resuelto: 'bg-green-100 text-green-800',
  cerrado: 'bg-slate-100 text-slate-800'
};

const problemTypeIcons = {
  internet: <Wifi className="h-4 w-4" />,
  telefono: <PhoneCall className="h-4 w-4" />,
  ambos: <div className="flex gap-1"><Wifi className="h-3 w-3" /><PhoneCall className="h-3 w-3" /></div>
};

export function TicketCard({ ticket, onViewDetails, showActions = false, onAssign, onTakeTicket }: TicketCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{ticket.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{ticket.id}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                {problemTypeIcons[ticket.problemType]}
                <span className="capitalize">{ticket.problemType}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Badge className={priorityColors[ticket.priority]}>
              {ticket.priority.toUpperCase()}
            </Badge>
            <Badge className={statusColors[ticket.status]}>
              {ticket.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {ticket.description}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{ticket.userName}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{ticket.userPhone}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{ticket.location}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(ticket.createdAt)}</span>
          </div>
        </div>

        {ticket.assignedExpertName && (
          <div className="bg-blue-50 p-2 rounded-md">
            <p className="text-sm">
              <span className="font-medium">Asignado a:</span> {ticket.assignedExpertName}
            </p>
          </div>
        )}

        {showActions && (
          <div className="flex gap-2 pt-2">
            {onViewDetails && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onViewDetails(ticket)}
              >
                Ver Detalles
              </Button>
            )}
            
            {onAssign && ticket.status === 'pendiente' && (
              <Button 
                size="sm"
                onClick={() => onAssign(ticket)}
              >
                Asignar
              </Button>
            )}
            
            {onTakeTicket && ticket.status === 'asignado' && (
              <Button 
                size="sm"
                onClick={() => onTakeTicket(ticket)}
              >
                Tomar Ticket
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}