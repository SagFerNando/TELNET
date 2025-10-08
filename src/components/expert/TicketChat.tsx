import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Ticket, Message, TicketStatus } from '../../types';
import { mockMessages } from '../../data/mockData';
import { Send, User, Wrench, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface TicketChatProps {
  ticket: Ticket;
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
}

export function TicketChat({ ticket, onStatusChange }: TicketChatProps) {
  const [messages, setMessages] = useState<Message[]>(
    mockMessages.filter(msg => msg.ticketId === ticket.id)
  );
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);
    
    const message: Message = {
      id: `msg-${Date.now()}`,
      ticketId: ticket.id,
      senderId: 'current-expert',
      senderName: 'Miguel Torres', // En un sistema real vendría del usuario actual
      senderRole: 'experto',
      content: newMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simular respuesta del usuario después de un tiempo
    setTimeout(() => {
      const userResponse: Message = {
        id: `msg-${Date.now()}-response`,
        ticketId: ticket.id,
        senderId: ticket.userId,
        senderName: ticket.userName,
        senderRole: 'usuario',
        content: 'Perfecto, gracias por la información. Estaré pendiente.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userResponse]);
      setIsLoading(false);
    }, 2000);
  };

  const handleStatusChange = (newStatus: TicketStatus) => {
    onStatusChange(ticket.id, newStatus);
    
    // Agregar mensaje del sistema
    const systemMessage: Message = {
      id: `msg-system-${Date.now()}`,
      ticketId: ticket.id,
      senderId: 'system',
      senderName: 'Sistema',
      senderRole: 'experto',
      content: `Estado del ticket cambiado a: ${newStatus.replace('_', ' ').toUpperCase()}`,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, systemMessage]);
    toast.success(`Estado del ticket actualizado a ${newStatus}`);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: TicketStatus) => {
    const colors = {
      pendiente: 'bg-gray-100 text-gray-800',
      asignado: 'bg-blue-100 text-blue-800',
      en_progreso: 'bg-purple-100 text-purple-800',
      resuelto: 'bg-green-100 text-green-800',
      cerrado: 'bg-slate-100 text-slate-800'
    };
    return colors[status];
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header del Ticket */}
      <Card className="mb-4">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{ticket.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {ticket.id} • {ticket.userName} • {ticket.userPhone}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Badge className={getStatusColor(ticket.status)}>
                {ticket.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Select 
                value={ticket.status} 
                onValueChange={(value) => handleStatusChange(value as TicketStatus)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asignado">Asignado</SelectItem>
                  <SelectItem value="en_progreso">En Progreso</SelectItem>
                  <SelectItem value="resuelto">Resuelto</SelectItem>
                  <SelectItem value="cerrado">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm">{ticket.description}</p>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            <span>Ubicación: {ticket.location}</span>
            {ticket.serviceProvider && (
              <span> • Proveedor: {ticket.serviceProvider}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Comunicación con el Usuario
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4 mb-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderRole === 'experto' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderRole === 'experto'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {message.senderName}
                      </span>
                      <span className="text-xs opacity-70">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setNewMessage('He revisado tu caso y necesito programar una visita técnica. ¿Cuándo estarías disponible?')}
            >
              <Wrench className="h-4 w-4 mr-2" />
              Programar Visita
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setNewMessage('El problema ha sido resuelto. Por favor confirma si todo funciona correctamente.')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar Resuelto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}