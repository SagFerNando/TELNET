import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { UserCheck, Loader2 } from "lucide-react";
import { getExperts, assignTicket } from "../../utils/api";
import { Expert } from "../../types";
import { toast } from "sonner@2.0.3";

interface AssignTicketDialogProps {
  ticketId: string;
  onAssigned?: () => void;
}

export function AssignTicketDialog({
  ticketId,
  onAssigned,
}: AssignTicketDialogProps) {
  const [open, setOpen] = useState(false);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [selectedExpertId, setSelectedExpertId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingExperts, setLoadingExperts] = useState(false);

  useEffect(() => {
    if (open) {
      loadExperts();
    }
  }, [open]);

  const loadExperts = async () => {
    try {
      setLoadingExperts(true);
      const data = await getExperts();
      setExperts(data);
    } catch (error: any) {
      console.error("Error cargando expertos:", error);
      toast.error(
        "Error al cargar expertos: " + (error.message || "Error desconocido")
      );
    } finally {
      setLoadingExperts(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedExpertId) {
      toast.error("Selecciona un experto");
      return;
    }

    try {
      setLoading(true);
      await assignTicket(ticketId, selectedExpertId);
      toast.success("Ticket asignado exitosamente");
      setOpen(false);
      setSelectedExpertId("");
      onAssigned?.();
    } catch (error: any) {
      console.error("Error asignando ticket:", error);
      toast.error(
        "Error al asignar ticket: " + (error.message || "Error desconocido")
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedExpert = experts.find((e) => e.id === selectedExpertId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserCheck className="mr-2 h-4 w-4" />
          Asignar a Experto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Asignar Ticket a Experto</DialogTitle>
          <DialogDescription>
            Selecciona un experto técnico para asignar este ticket
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loadingExperts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : experts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay expertos disponibles. Registra expertos primero.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Experto Técnico</label>
                <Select
                  value={selectedExpertId}
                  onValueChange={setSelectedExpertId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un experto" />
                  </SelectTrigger>
                  <SelectContent>
                    {experts.map((expert) => (
                      <SelectItem key={expert.id} value={expert.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{expert.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {expert.activeTickets} activos
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedExpert && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Email:</span>
                    <span className="text-sm text-muted-foreground">
                      {selectedExpert.email}
                    </span>
                  </div>
                  {selectedExpert.city && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Ciudad:</span>
                      <span className="text-sm text-muted-foreground">
                        {selectedExpert.city}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">
                      Tickets Activos:
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {selectedExpert.activeTickets}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">
                      Total Resueltos:
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {selectedExpert.totalResolved}
                    </span>
                  </div>
                  <div className="pt-2">
                    <span className="text-sm font-medium">
                      Especializaciones:
                    </span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedExpert.specializations.map((spec, index) => (
                        <Badge key={index} variant="secondary">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={
              !selectedExpertId ||
              loading ||
              loadingExperts ||
              experts.length === 0
            }
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Asignando...
              </>
            ) : (
              "Asignar Ticket"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
