import { useState, useEffect } from "react";
import { TicketCard } from "../shared/TicketCard";
import { AssignTicketDialog } from "../operator/AssignTicketDialog";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Ticket,
  ClipboardList,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
} from "lucide-react";
import { getTickets, getStats } from "../../utils/api";
import { Ticket as TicketType } from "../../types";
import { toast } from "sonner@2.0.3";

interface OperatorStats {
  totalTickets: number;
  pendientes: number;
  asignados: number;
  enProgreso: number;
  resueltos: number;
  cerrados: number;
}

export function OperatorDashboard() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [stats, setStats] = useState<OperatorStats>({
    totalTickets: 0,
    pendientes: 0,
    asignados: 0,
    enProgreso: 0,
    resueltos: 0,
    cerrados: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [problemTypeFilter, setProblemTypeFilter] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [ticketsData, statsData] = await Promise.all([
        getTickets(),
        getStats(),
      ]);

      setTickets(ticketsData);
      setStats(statsData as OperatorStats);
    } catch (error: any) {
      console.error("Error cargando dashboard:", error);
      toast.error(
        "Error al cargar los datos: " + (error.message || "Error desconocido")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTicketAssigned = () => {
    loadDashboardData(); // Recargar datos después de asignar
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority =
      !priorityFilter ||
      priorityFilter === "all" ||
      ticket.priority === priorityFilter;
    const matchesProblemType =
      !problemTypeFilter ||
      problemTypeFilter === "all" ||
      ticket.problemType === problemTypeFilter;
    const matchesCity =
      !cityFilter ||
      ticket.city.toLowerCase().includes(cityFilter.toLowerCase());

    return (
      matchesSearch && matchesPriority && matchesProblemType && matchesCity
    );
  });

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
        <h1>Panel de Operador</h1>
        <p className="text-muted-foreground">
          Gestiona y asigna tickets a expertos técnicos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <ClipboardList className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendientes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asignados</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.asignados}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enProgreso}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resueltos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cerrados</CardTitle>
            <XCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cerrados}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <Select
              value={problemTypeFilter}
              onValueChange={setProblemTypeFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="internet_sin_conexion">
                  Internet - Sin conexión
                </SelectItem>
                <SelectItem value="internet_lento">Internet - Lento</SelectItem>
                <SelectItem value="internet_intermitente">
                  Internet - Intermitente
                </SelectItem>
                <SelectItem value="router_apagado">
                  Router - No enciende
                </SelectItem>
                <SelectItem value="router_configuracion">
                  Router - Configuración
                </SelectItem>
                <SelectItem value="router_wifi_debil">
                  Router - WiFi débil
                </SelectItem>
                <SelectItem value="fibra_sin_señal">
                  Fibra - Sin señal
                </SelectItem>
                <SelectItem value="telefono_sin_linea">
                  Teléfono - Sin línea
                </SelectItem>
                <SelectItem value="telefono_ruido">Teléfono - Ruido</SelectItem>
                <SelectItem value="cableado_dañado">
                  Cableado - Dañado
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Todos ({filteredTickets.length})
          </TabsTrigger>
          <TabsTrigger value="pendiente">
            Pendientes (
            {filteredTickets.filter((t) => t.status === "pendiente").length})
          </TabsTrigger>
          <TabsTrigger value="asignado">
            Asignados (
            {filteredTickets.filter((t) => t.status === "asignado").length})
          </TabsTrigger>
          <TabsTrigger value="en_progreso">
            En Progreso (
            {filteredTickets.filter((t) => t.status === "en_progreso").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No hay tickets</h3>
                <p className="text-muted-foreground">
                  {searchTerm ||
                  priorityFilter ||
                  problemTypeFilter ||
                  cityFilter
                    ? "No se encontraron tickets con los filtros aplicados"
                    : "No hay tickets en el sistema"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredTickets.map((ticket) => (
              <div key={ticket.id} className="relative">
                <TicketCard ticket={ticket} />
                {ticket.status === "pendiente" && (
                  <div className="absolute top-4 right-4">
                    <AssignTicketDialog
                      ticketId={ticket.id}
                      onAssigned={handleTicketAssigned}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="pendiente" className="space-y-4">
          {filteredTickets
            .filter((t) => t.status === "pendiente")
            .map((ticket) => (
              <div key={ticket.id} className="relative">
                <TicketCard ticket={ticket} />
                <div className="absolute top-4 right-4">
                  <AssignTicketDialog
                    ticketId={ticket.id}
                    onAssigned={handleTicketAssigned}
                  />
                </div>
              </div>
            ))}
          {filteredTickets.filter((t) => t.status === "pendiente").length ===
            0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No hay tickets pendientes
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="asignado" className="space-y-4">
          {filteredTickets
            .filter((t) => t.status === "asignado")
            .map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          {filteredTickets.filter((t) => t.status === "asignado").length ===
            0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No hay tickets asignados
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="en_progreso" className="space-y-4">
          {filteredTickets
            .filter((t) => t.status === "en_progreso")
            .map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          {filteredTickets.filter((t) => t.status === "en_progreso").length ===
            0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No hay tickets en progreso
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
