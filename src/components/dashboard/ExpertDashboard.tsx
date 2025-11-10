import { useState, useEffect } from 'react';
import { TicketCard } from '../shared/TicketCard';
import { TicketChat } from '../expert/TicketChat';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Wrench, CheckCircle, Clock, Trophy, Loader2, ArrowLeft, Search } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [problemTypeFilter, setProblemTypeFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('newest');

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

  const filteredAndSortedTickets = tickets
    .filter(ticket => {
      const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = !priorityFilter || priorityFilter === 'all' || ticket.priority === priorityFilter;
      const matchesProblemType = !problemTypeFilter || problemTypeFilter === 'all' || ticket.problemType === problemTypeFilter;
      const matchesCity = !cityFilter || ticket.city.toLowerCase().includes(cityFilter.toLowerCase());
      
      return matchesSearch && matchesPriority && matchesProblemType && matchesCity;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      
      if (sortOrder === 'newest') {
        return dateB - dateA; // Más reciente primero
      } else {
        return dateA - dateB; // Más antiguo primero
      }
    });

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

        <TicketChat ticket={selectedTicket} onStatusChange={handleStatusChange} />
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

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros y Ordenamiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las prioridades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Ciudad..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />

            <Select value={problemTypeFilter} onValueChange={setProblemTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="internet_sin_conexion">Internet - Sin conexión</SelectItem>
                <SelectItem value="internet_lento">Internet - Lento</SelectItem>
                <SelectItem value="internet_intermitente">Internet - Intermitente</SelectItem>
                <SelectItem value="router_apagado">Router - No enciende</SelectItem>
                <SelectItem value="router_configuracion">Router - Configuración</SelectItem>
                <SelectItem value="router_wifi_debil">Router - WiFi débil</SelectItem>
                <SelectItem value="fibra_sin_señal">Fibra - Sin señal</SelectItem>
                <SelectItem value="telefono_sin_linea">Teléfono - Sin línea</SelectItem>
                <SelectItem value="telefono_ruido">Teléfono - Ruido</SelectItem>
                <SelectItem value="cableado_dañado">Cableado - Dañado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por fecha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Más recientes primero</SelectItem>
                <SelectItem value="oldest">Más antiguos primero</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Todos ({filteredAndSortedTickets.length})
          </TabsTrigger>
          <TabsTrigger value="asignado">
            Asignados ({filteredAndSortedTickets.filter(t => t.status === 'asignado').length})
          </TabsTrigger>
          <TabsTrigger value="en_progreso">
            En Progreso ({filteredAndSortedTickets.filter(t => t.status === 'en_progreso').length})
          </TabsTrigger>
          <TabsTrigger value="resuelto">
            Resueltos ({filteredAndSortedTickets.filter(t => t.status === 'resuelto').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredAndSortedTickets.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No tienes tickets asignados</h3>
                <p className="text-muted-foreground">
                  {searchTerm || priorityFilter || problemTypeFilter || cityFilter
                    ? 'No se encontraron tickets con los filtros aplicados'
                    : 'Espera a que un operador te asigne tickets'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedTickets.map(ticket => (
              <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="cursor-pointer">
                <TicketCard ticket={ticket} />
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="asignado" className="space-y-4">
          {filteredAndSortedTickets.filter(t => t.status === 'asignado').map(ticket => (
            <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="cursor-pointer">
              <TicketCard ticket={ticket} />
            </div>
          ))}
          {filteredAndSortedTickets.filter(t => t.status === 'asignado').length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No hay tickets asignados
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="en_progreso" className="space-y-4">
          {filteredAndSortedTickets.filter(t => t.status === 'en_progreso').map(ticket => (
            <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="cursor-pointer">
              <TicketCard ticket={ticket} />
            </div>
          ))}
          {filteredAndSortedTickets.filter(t => t.status === 'en_progreso').length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No hay tickets en progreso
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resuelto" className="space-y-4">
          {filteredAndSortedTickets.filter(t => t.status === 'resuelto').map(ticket => (
            <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="cursor-pointer">
              <TicketCard ticket={ticket} />
            </div>
          ))}
          {filteredAndSortedTickets.filter(t => t.status === 'resuelto').length === 0 && (
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