import { useState } from 'react';
import { TicketCard } from '../shared/TicketCard';
import { TicketChat } from '../expert/TicketChat';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { mockTickets } from '../../data/mockData';
import { Ticket, TicketStatus } from '../../types';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function ExpertDashboard() {
  const [tickets, setTickets] = useState(mockTickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // En un sistema real, esto sería basado en el experto actual logueado
  const expertId = 'exp2'; // Miguel Torres
  const expertName = 'Miguel Torres';
  
  const expertTickets = tickets.filter(ticket => 
    ticket.assignedExpertId === expertId || ticket.status === 'asignado'
  );

  const handleTakeTicket = (ticket: Ticket) => {
    setTickets(prev => prev.map(t => 
      t.id === ticket.id 
        ? { 
            ...t, 
            status: 'en_progreso' as const,
            assignedExpertId: expertId,
            assignedExpertName: expertName,
            updatedAt: new Date().toISOString()
          }
        : t
    ));
    toast.success(`Ticket ${ticket.id} tomado. Ahora está en progreso.`);
  };

  const handleStatusChange = (ticketId: string, newStatus: TicketStatus) => {
    setTickets(prev => prev.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString() }
        : ticket
    ));
  };

  const myTickets = expertTickets.filter(t => t.assignedExpertId === expertId);
  const availableTickets = tickets.filter(t => t.status === 'asignado' && !t.assignedExpertId);

  const ticketStats = {
    assigned: myTickets.filter(t => t.status === 'asignado').length,
    inProgress: myTickets.filter(t => t.status === 'en_progreso').length,
    resolved: myTickets.filter(t => ['resuelto', 'cerrado'].includes(t.status)).length,
    available: availableTickets.length
  };

  if (selectedTicket) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setSelectedTicket(null)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
        <TicketChat 
          ticket={selectedTicket} 
          onStatusChange={handleStatusChange}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1>Panel de Experto</h1>
        <p className="text-muted-foreground">
          Bienvenido {expertName}, gestiona tus tickets asignados
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asignados</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{ticketStats.assigned}</div>
            <p className="text-xs text-muted-foreground">
              Listos para trabajar
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <AlertCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{ticketStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Trabajando activamente
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{ticketStats.resolved}</div>
            <p className="text-xs text-muted-foreground">
              Completados exitosamente
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <Star className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{ticketStats.available}</div>
            <p className="text-xs text-muted-foreground">
              Para tomar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Rendimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-medium text-green-600">89</div>
              <p className="text-sm text-muted-foreground">Tickets Resueltos</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-medium text-blue-600">4.8</div>
              <p className="text-sm text-muted-foreground">Calificación Promedio</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-medium text-purple-600">2.3h</div>
              <p className="text-sm text-muted-foreground">Tiempo Promedio de Resolución</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="assigned" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="assigned">
                Asignados ({ticketStats.assigned})
              </TabsTrigger>
              <TabsTrigger value="progress">
                En Progreso ({ticketStats.inProgress})
              </TabsTrigger>
              <TabsTrigger value="available">
                Disponibles ({ticketStats.available})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completados ({ticketStats.resolved})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="assigned" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {myTickets
                  .filter(ticket => ticket.status === 'asignado')
                  .map((ticket) => (
                    <TicketCard 
                      key={ticket.id} 
                      ticket={ticket}
                      showActions={true}
                      onViewDetails={setSelectedTicket}
                      onTakeTicket={handleTakeTicket}
                    />
                  ))}
                {myTickets.filter(t => t.status === 'asignado').length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3>No tienes tickets asignados</h3>
                    <p className="text-muted-foreground">
                      Revisa los tickets disponibles para tomar uno nuevo
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="progress" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {myTickets
                  .filter(ticket => ticket.status === 'en_progreso')
                  .map((ticket) => (
                    <TicketCard 
                      key={ticket.id} 
                      ticket={ticket}
                      showActions={true}
                      onViewDetails={setSelectedTicket}
                    />
                  ))}
                {myTickets.filter(t => t.status === 'en_progreso').length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3>No tienes tickets en progreso</h3>
                    <p className="text-muted-foreground">
                      Toma un ticket asignado para comenzar a trabajar
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="available" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {availableTickets.map((ticket) => (
                  <TicketCard 
                    key={ticket.id} 
                    ticket={ticket}
                    showActions={true}
                    onViewDetails={setSelectedTicket}
                    onTakeTicket={handleTakeTicket}
                  />
                ))}
                {availableTickets.length === 0 && (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3>No hay tickets disponibles</h3>
                    <p className="text-muted-foreground">
                      Todos los tickets han sido asignados. Revisa más tarde.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {myTickets
                  .filter(ticket => ['resuelto', 'cerrado'].includes(ticket.status))
                  .map((ticket) => (
                    <TicketCard 
                      key={ticket.id} 
                      ticket={ticket}
                      showActions={true}
                      onViewDetails={setSelectedTicket}
                    />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}