import { useState, useEffect } from 'react';
import { TicketCard } from '../shared/TicketCard';
import { TicketChat } from '../expert/TicketChat';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Wrench, CheckCircle, Clock, Trophy, Loader2, ArrowLeft } from 'lucide-react';
import { getTickets, getStats, updateTicketStatus } from '../../utils/api';
import { Ticket as TicketType } from '../../types';
import { toast } from 'sonner@2.0.3';

interface ExpertStats {
  activeTickets: number;
  totalResolved: number;
  enProgreso: number;
  resueltos: number;
}

export function ExpertDashboard() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [stats, setStats] = useState<ExpertStats>({
    activeTickets: 0,
    totalResolved: 0,
    enProgreso: 0,
    resueltos: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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
      setStats(statsData as ExpertStats);
    } catch (error: any) {
      console.error('Error cargando dashboard:', error);
      toast.error('Error al cargar los datos: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      setUpdatingStatus(true);
      await updateTicketStatus(ticketId, newStatus as any);
      toast.success('Estado actualizado correctamente');
      await loadDashboardData();
      
      // Si estamos viendo el ticket, actualizarlo
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (error: any) {
      toast.error('Error al actualizar estado: ' + (error.message || 'Error desconocido'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (selectedTicket) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setSelectedTicket(null)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Tickets
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Estado:</span>
            <Select 
              value={selectedTicket.status} 
              onValueChange={(value) => handleStatusChange(selectedTicket.id, value)}
              disabled={updatingStatus}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asignado">Asignado</SelectItem>
                <SelectItem value="en_progreso">En Progreso</SelectItem>
                <SelectItem value="resuelto">Resuelto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TicketChat ticket={selectedTicket} />
      </div>
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
      <div>
        <h1>Panel de Experto</h1>
        <p className="text-muted-foreground">
          Gestiona tus tickets asignados
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTickets}</div>
            <p className="text-xs text-muted-foreground">
              Tickets asignados
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
              Trabajando ahora
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
              Este periodo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resueltos</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResolved}</div>
            <p className="text-xs text-muted-foreground">
              Histórico total
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
          <TabsTrigger value="asignado">
            Asignados ({tickets.filter(t => t.status === 'asignado').length})
          </TabsTrigger>
          <TabsTrigger value="en_progreso">
            En Progreso ({tickets.filter(t => t.status === 'en_progreso').length})
          </TabsTrigger>
          <TabsTrigger value="resuelto">
            Resueltos ({tickets.filter(t => t.status === 'resuelto').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {tickets.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No tienes tickets asignados</h3>
                <p className="text-muted-foreground">
                  Espera a que un operador te asigne tickets
                </p>
              </CardContent>
            </Card>
          ) : (
            tickets.map(ticket => (
              <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="cursor-pointer">
                <TicketCard ticket={ticket} />
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="asignado" className="space-y-4">
          {tickets.filter(t => t.status === 'asignado').map(ticket => (
            <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="cursor-pointer">
              <TicketCard ticket={ticket} />
            </div>
          ))}
          {tickets.filter(t => t.status === 'asignado').length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No hay tickets asignados
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="en_progreso" className="space-y-4">
          {tickets.filter(t => t.status === 'en_progreso').map(ticket => (
            <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="cursor-pointer">
              <TicketCard ticket={ticket} />
            </div>
          ))}
          {tickets.filter(t => t.status === 'en_progreso').length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No hay tickets en progreso
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resuelto" className="space-y-4">
          {tickets.filter(t => t.status === 'resuelto').map(ticket => (
            <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="cursor-pointer">
              <TicketCard ticket={ticket} />
            </div>
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
