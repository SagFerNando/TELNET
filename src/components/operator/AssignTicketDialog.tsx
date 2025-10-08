import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Ticket, Expert } from '../../types';
import { mockExperts } from '../../data/mockData';
import { User, Award, Clock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AssignTicketDialogProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (ticketId: string, expertId: string) => void;
}

export function AssignTicketDialog({ ticket, isOpen, onClose, onAssign }: AssignTicketDialogProps) {
  const [selectedExpertId, setSelectedExpertId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAssign = async () => {
    if (!ticket || !selectedExpertId) return;
    
    setIsLoading(true);
    
    // Simulación de asignación
    setTimeout(() => {
      onAssign(ticket.id, selectedExpertId);
      const expert = mockExperts.find(e => e.id === selectedExpertId);
      toast.success(`Ticket ${ticket.id} asignado a ${expert?.name}`);
      setIsLoading(false);
      setSelectedExpertId('');
      onClose();
    }, 1000);
  };

  const getRecommendedExperts = () => {
    if (!ticket) return mockExperts;
    
    return mockExperts
      .filter(expert => {
        const hasRelevantSpecialization = expert.specializations.some(spec => {
          if (ticket.problemType === 'internet') return spec.toLowerCase().includes('internet') || spec.toLowerCase().includes('redes');
          if (ticket.problemType === 'telefono') return spec.toLowerCase().includes('telefonía') || spec.toLowerCase().includes('voip');
          return true; // Para 'ambos' todos son relevantes
        });
        return hasRelevantSpecialization;
      })
      .sort((a, b) => a.activeTickets - b.activeTickets); // Priorizar menos carga de trabajo
  };

  if (!ticket) return null;

  const recommendedExperts = getRecommendedExperts();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Asignar Ticket {ticket.id}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Ticket */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h4>Detalles del Ticket</h4>
            <p className="text-sm">{ticket.title}</p>
            <div className="flex gap-2">
              <Badge>{ticket.problemType}</Badge>
              <Badge variant="outline">{ticket.priority}</Badge>
            </div>
          </div>

          {/* Selección de Experto */}
          <div className="space-y-3">
            <Label>Asignar a Experto</Label>
            <Select value={selectedExpertId} onValueChange={setSelectedExpertId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un experto" />
              </SelectTrigger>
              <SelectContent>
                {recommendedExperts.map((expert) => (
                  <SelectItem key={expert.id} value={expert.id}>
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1">
                        <div className="font-medium">{expert.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {expert.specializations.join(', ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {expert.activeTickets}
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {expert.totalResolved}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Expertos Recomendados */}
          <div className="space-y-3">
            <h4>Expertos Recomendados</h4>
            <div className="grid gap-3">
              {recommendedExperts.slice(0, 3).map((expert) => (
                <div 
                  key={expert.id} 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedExpertId === expert.id ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedExpertId(expert.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{expert.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Especialidades: {expert.specializations.join(', ')}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {expert.activeTickets} activos
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Award className="h-3 w-3" />
                        {expert.totalResolved} resueltos
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedExpertId || isLoading}
          >
            {isLoading ? 'Asignando...' : 'Asignar Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}