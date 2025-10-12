import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import { ProblemType, TicketPriority } from '../../types';
import { createTicket } from '../../utils/api';
import { Loader2, MapPin, Building } from 'lucide-react';

interface CreateTicketFormProps {
  onSuccess: () => void;
}

const PROBLEM_TYPES: { value: ProblemType; label: string; category: string }[] = [
  // Internet
  { value: 'internet_sin_conexion', label: 'Sin conexión', category: 'Internet' },
  { value: 'internet_lento', label: 'Baja velocidad', category: 'Internet' },
  { value: 'internet_intermitente', label: 'Conexión intermitente', category: 'Internet' },
  
  // Router
  { value: 'router_apagado', label: 'No enciende', category: 'Router' },
  { value: 'router_configuracion', label: 'Problema de configuración', category: 'Router' },
  { value: 'router_wifi_debil', label: 'WiFi débil', category: 'Router' },
  { value: 'router_reinicio_constante', label: 'Se reinicia constantemente', category: 'Router' },
  
  // Fibra
  { value: 'fibra_sin_señal', label: 'Sin señal', category: 'Fibra Óptica' },
  { value: 'fibra_ont_apagado', label: 'ONT sin luz', category: 'Fibra Óptica' },
  
  // ADSL
  { value: 'adsl_desconexiones', label: 'Desconexiones frecuentes', category: 'ADSL' },
  { value: 'adsl_lento', label: 'Baja velocidad', category: 'ADSL' },
  
  // Teléfono
  { value: 'telefono_sin_linea', label: 'Sin línea', category: 'Teléfono' },
  { value: 'telefono_ruido', label: 'Ruido/Interferencias', category: 'Teléfono' },
  { value: 'telefono_no_recibe', label: 'No recibe llamadas', category: 'Teléfono' },
  { value: 'telefono_no_realiza', label: 'No puede realizar llamadas', category: 'Teléfono' },
  
  // Cableado
  { value: 'cableado_dañado', label: 'Cable dañado', category: 'Cableado' },
  { value: 'cableado_instalacion', label: 'Instalación nueva', category: 'Cableado' },
  
  // Otro
  { value: 'otro', label: 'Otro problema', category: 'Otro' }
];

// Agrupar por categoría
const GROUPED_PROBLEMS = PROBLEM_TYPES.reduce((acc, problem) => {
  if (!acc[problem.category]) {
    acc[problem.category] = [];
  }
  acc[problem.category].push(problem);
  return acc;
}, {} as Record<string, typeof PROBLEM_TYPES>);

export function CreateTicketForm({ onSuccess }: CreateTicketFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problemType: '' as ProblemType,
    priority: 'media' as TicketPriority,
    city: '',
    address: '',
    serviceProvider: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.city || !formData.address) {
      toast.error('Por favor completa la ciudad y dirección del problema');
      return;
    }

    setIsLoading(true);

    try {
      await createTicket(formData);
      toast.success('Ticket creado exitosamente. Te contactaremos pronto.');
      onSuccess();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        problemType: '' as ProblemType,
        priority: 'media',
        city: '',
        address: '',
        serviceProvider: ''
      });
    } catch (error: any) {
      toast.error(error.message || 'Error al crear el ticket');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Reportar Problema de Red</CardTitle>
          <p className="text-muted-foreground">
            Completa la información para que podamos ayudarte de la mejor manera
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del Problema */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título del Problema *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Router sin conexión desde ayer"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción Detallada *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Explica detalladamente el problema, cuándo comenzó, qué has intentado hacer..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="problemType">Tipo de Problema *</Label>
                <Select 
                  value={formData.problemType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, problemType: value as ProblemType }))}
                  required
                >
                  <SelectTrigger id="problemType">
                    <SelectValue placeholder="Selecciona el tipo de problema" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GROUPED_PROBLEMS).map(([category, problems]) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 font-medium text-sm text-muted-foreground">
                          {category}
                        </div>
                        {problems.map((problem) => (
                          <SelectItem key={problem.value} value={problem.value}>
                            {problem.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Prioridad *</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as TicketPriority }))}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja - Puede esperar</SelectItem>
                    <SelectItem value="media">Media - Atención normal</SelectItem>
                    <SelectItem value="alta">Alta - Urgente</SelectItem>
                    <SelectItem value="critica">Crítica - Sin servicio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ubicación del Problema */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">Ubicación del Problema</span>
              </div>

              <div>
                <Label htmlFor="city">Ciudad *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Ej: Madrid, Barcelona, Valencia"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Dirección Completa *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Calle, número, piso, puerta"
                  required
                />
              </div>
            </div>

            {/* Información Adicional */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building className="h-4 w-4" />
                <span className="text-sm font-medium">Información Adicional (Opcional)</span>
              </div>

              <div>
                <Label htmlFor="serviceProvider">Proveedor de Servicio</Label>
                <Input
                  id="serviceProvider"
                  value={formData.serviceProvider}
                  onChange={(e) => setFormData(prev => ({ ...prev, serviceProvider: e.target.value }))}
                  placeholder="Ej: Movistar, Vodafone, Orange"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando ticket...
                </>
              ) : (
                'Crear Ticket'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
