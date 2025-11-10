import { useState, useEffect } from 'react';
import { CreateTicketForm } from '../user/CreateTicketForm';
import { UserTicketChat } from '../user/UserTicketChat';
import { TicketCard } from '../shared/TicketCard';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Plus, Ticket, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getTickets, getStats } from '../../utils/api';
import { Ticket as TicketType } from '../../types';
import { toast } from 'sonner@2.0.3';

interface UserStats {
  totalTickets: number;
  pendientes: number;
  enProgreso: number;
  resueltos: number;
}

export function UserDashboard() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalTickets: 0,
    pendientes: 0,
    enProgreso: 0,
    resueltos: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [ticketsData, statsData] = await Promise.all([
        getTickets(),
        getStats()
      ]);
      
      setTickets(ticketsData);
      setStats(statsData as UserStats);
    } catch (error: any) {
      console.error('Error cargando dashboard:', error);
      toast.error('Error al cargar los datos: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleTicketCreated = () => {
    setShowCreateForm(false);
    loadDashboardData(); // Recargar datos
    toast.success('Ticket creado exitosamente');
  };

  const handleTicketClick = (ticket: TicketType) => {
    setSelectedTicket(ticket);
  };

  const handleBackFromChat = () => {
    setSelectedTicket(null);
    loadDashboardData(); // Recargar datos al volver
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
        <CreateTicketForm onSuccess={handleTicketCreated} />
      </div>
    );
  }

  if (selectedTicket) {
    return (
      <UserTicketChat ticket={selectedTicket} onBack={handleBackFromChat} />
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
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
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Ticket
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              Todos tus reportes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendientes}</div>
            <p className="text-xs text-muted-foreground">
              Esperando asignación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enProgreso}</div>
            <p className="text-xs text-muted-foreground">
              Siendo atendidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resueltos}</div>
            <p className="text-xs text-muted-foreground">
              Completados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Todos ({tickets.length})
          </TabsTrigger>
          <TabsTrigger value="pendiente">
            Pendientes ({tickets.filter(t => t.status === 'pendiente').length})
          </TabsTrigger>
          <TabsTrigger value="en_progreso">
            En Progreso ({tickets.filter(t => ['asignado', 'en_progreso'].includes(t.status)).length})
          </TabsTrigger>
          <TabsTrigger value="resuelto">
            Resueltos ({tickets.filter(t => t.status === 'resuelto').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {tickets.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No tienes tickets</h3>
                <p className="text-muted-foreground mb-4">
                  Comienza creando tu primer reporte de problema
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primer Ticket
                </Button>
              </CardContent>
            </Card>
          ) : (
            tickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} onClick={() => handleTicketClick(ticket)} />
            ))
          )}
        </TabsContent>

        <TabsContent value="pendiente" className="space-y-4">
          {tickets.filter(t => t.status === 'pendiente').map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} onClick={() => handleTicketClick(ticket)} />
          ))}
          {tickets.filter(t => t.status === 'pendiente').length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No hay tickets pendientes
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="en_progreso" className="space-y-4">
          {tickets.filter(t => ['asignado', 'en_progreso'].includes(t.status)).map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} onClick={() => handleTicketClick(ticket)} />
          ))}
          {tickets.filter(t => ['asignado', 'en_progreso'].includes(t.status)).length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No hay tickets en progreso
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resuelto" className="space-y-4">
          {tickets.filter(t => t.status === 'resuelto').map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} onClick={() => handleTicketClick(ticket)} />
          ))}
          {tickets.filter(t => t.status === 'resuelto').length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No hay tickets resueltos
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}