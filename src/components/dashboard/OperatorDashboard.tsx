import { useState } from 'react';
import { TicketCard } from '../shared/TicketCard';
import { AssignTicketDialog } from '../operator/AssignTicketDialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { mockTickets, mockExperts } from '../../data/mockData';
import { Ticket } from '../../types';
import { Search, Users, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export function OperatorDashboard() {
  const [tickets, setTickets] = useState(mockTickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const handleAssignTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowAssignDialog(true);
  };

  const handleTicketAssigned = (ticketId: string, expertId: string) => {
    const expert = mockExperts.find(e => e.id === expertId);
    setTickets(prev => prev.map(ticket => 
      ticket.id === ticketId 
        ? { 
            ...ticket, 
            status: 'asignado' as const,
            assignedExpertId: expertId,
            assignedExpertName: expert?.name,
            updatedAt: new Date().toISOString()
          }
        : ticket
    ));
  };

  // Filtrar tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const ticketStats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === 'pendiente').length,
    assigned: tickets.filter(t => t.status === 'asignado').length,
    inProgress: tickets.filter(t => t.status === 'en_progreso').length,
    resolved: tickets.filter(t => ['resuelto', 'cerrado'].includes(t.status)).length
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1>Panel de Operador</h1>
        <p className="text-muted-foreground">
          Gestiona y asigna tickets a expertos especializados
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
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
            <Badge variant="outline" className="mt-1">
              Requieren asignación
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asignados</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{ticketStats.assigned}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-purple-500" />
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ticket, usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="asignado">Asignados</SelectItem>
                <SelectItem value="en_progreso">En Progreso</SelectItem>
                <SelectItem value="resuelto">Resueltos</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">
                Pendientes ({ticketStats.pending})
              </TabsTrigger>
              <TabsTrigger value="assigned">
                Asignados ({ticketStats.assigned})
              </TabsTrigger>
              <TabsTrigger value="progress">
                En Proceso ({ticketStats.inProgress})
              </TabsTrigger>
              <TabsTrigger value="all">Todos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {filteredTickets
                  .filter(ticket => ticket.status === 'pendiente')
                  .map((ticket) => (
                    <TicketCard 
                      key={ticket.id} 
                      ticket={ticket}
                      showActions={true}
                      onAssign={handleAssignTicket}
                    />
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="assigned" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {filteredTickets
                  .filter(ticket => ticket.status === 'asignado')
                  .map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="progress" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {filteredTickets
                  .filter(ticket => ticket.status === 'en_progreso')
                  .map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="all" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {filteredTickets.map((ticket) => (
                  <TicketCard 
                    key={ticket.id} 
                    ticket={ticket}
                    showActions={ticket.status === 'pendiente'}
                    onAssign={ticket.status === 'pendiente' ? handleAssignTicket : undefined}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <AssignTicketDialog
        ticket={selectedTicket}
        isOpen={showAssignDialog}
        onClose={() => {
          setShowAssignDialog(false);
          setSelectedTicket(null);
        }}
        onAssign={handleTicketAssigned}
      />
    </div>
  );
}