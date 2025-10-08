import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { toast } from 'sonner@2.0.3';
import { ProblemType, TicketPriority } from '../../types';

interface CreateTicketFormProps {
  onSuccess: () => void;
}

export function CreateTicketForm({ onSuccess }: CreateTicketFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problemType: '' as ProblemType,
    priority: 'media' as TicketPriority,
    location: '',
    serviceProvider: '',
    contactName: '',
    contactEmail: '',
    contactPhone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulación de envío
    setTimeout(() => {
      const ticketId = `TK-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
      toast.success(`Ticket ${ticketId} creado exitosamente. Te contactaremos pronto.`);
      setIsLoading(false);
      onSuccess();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        problemType: '' as ProblemType,
        priority: 'media',
        location: '',
        serviceProvider: '',
        contactName: '',
        contactEmail: '',
        contactPhone: ''
      });
    }, 1500);
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
                <Label htmlFor="title">Título del Problema</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Describe brevemente tu problema"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción Detallada</Label>
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
                <Label>Tipo de Problema</Label>
                <RadioGroup
                  value={formData.problemType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, problemType: value as ProblemType }))}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="internet" id="internet" />
                    <Label htmlFor="internet">Solo Internet</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="telefono" id="telefono" />
                    <Label htmlFor="telefono">Solo Teléfono</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ambos" id="ambos" />
                    <Label htmlFor="ambos">Internet y Teléfono</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as TicketPriority }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja - Puedo esperar</SelectItem>
                    <SelectItem value="media">Media - Normal</SelectItem>
                    <SelectItem value="alta">Alta - Urgente</SelectItem>
                    <SelectItem value="critica">Crítica - Emergencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Información de Ubicación y Servicio */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Colonia, Ciudad, Estado"
                  required
                />
              </div>

              <div>
                <Label htmlFor="serviceProvider">Proveedor de Servicio</Label>
                <Select value={formData.serviceProvider} onValueChange={(value) => setFormData(prev => ({ ...prev, serviceProvider: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telmex">Telmex</SelectItem>
                    <SelectItem value="megacable">Megacable</SelectItem>
                    <SelectItem value="izzi">Izzi</SelectItem>
                    <SelectItem value="totalplay">Totalplay</SelectItem>
                    <SelectItem value="at&t">AT&T</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="contactName">Nombre Completo</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                  placeholder="Tu nombre completo"
                  required
                />
              </div>

              <div>
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="contactPhone">Teléfono</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="+52 555 123 4567"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Enviando...' : 'Crear Ticket de Soporte'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}