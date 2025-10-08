import { useState } from 'react';
import { CreateTicketForm } from '../user/CreateTicketForm';
import { TicketCard } from '../shared/TicketCard';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { mockTickets } from '../../data/mockData';
import { Plus, Ticket, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export function UserDashboard() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // En un sistema real, estos serían los tickets del usuario actual
  const userTickets = mockTickets.filter(ticket => 
    ['user1', 'user2', 'user3', 'user4'].includes(ticket.userId)
  );

  const ticketStats = {
    total: userTickets.length,
    pending: userTickets.filter(t => t.status === 'pendiente').length,
    inProgress: userTickets.filter(t => ['asignado', 'en_progreso'].includes(t.status)).length,
    resolved: userTickets.filter(t => ['resuelto', 'cerrado'].includes(t.status)).length
  };

  if (showCreateForm) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setShowCreateForm(false)}
            className="mb-4"
          >
            ← Volver al Dashboard
          </Button>
        </div>
        <CreateTicketForm onSuccess={() => setShowCreateForm(false)} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1>Panel de Usuario</h1>
          <p className="text-muted-foreground">
            Gestiona tus reportes de problemas de red
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{ticketStats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{ticketStats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{ticketStats.inProgress}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{ticketStats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
              <TabsTrigger value="proceso">En Proceso</TabsTrigger>
              <TabsTrigger value="resuelto">Resueltos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4 mt-6">
              {userTickets.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3>No tienes tickets</h3>
                  <p className="text-muted-foreground mb-4">
                    Crea tu primer ticket para reportar un problema
                  </p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Ticket
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {userTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="pendiente" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {userTickets
                  .filter(ticket => ticket.status === 'pendiente')
                  .map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="proceso" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {userTickets
                  .filter(ticket => ['asignado', 'en_progreso'].includes(ticket.status))
                  .map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="resuelto" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {userTickets
                  .filter(ticket => ['resuelto', 'cerrado'].includes(ticket.status))
                  .map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}