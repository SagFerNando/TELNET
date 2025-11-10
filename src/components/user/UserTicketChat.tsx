import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Ticket, Message } from '../../types';
import { Send, User, Image as ImageIcon, X, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getMessages, sendMessage } from '../../utils/api';
import { createClient } from '../../utils/supabase/client';

interface UserTicketChatProps {
  ticket: Ticket;
  onBack: () => void;
}

export function UserTicketChat({ ticket, onBack }: UserTicketChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar mensajes al montar el componente
  useEffect(() => {
    loadMessages();
  }, [ticket.id]);

  // Scroll to bottom cuando llegan nuevos mensajes
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoadingMessages(true);
      const messagesData = await getMessages(ticket.id);
      setMessages(messagesData);
    } catch (error: any) {
      console.error('Error cargando mensajes:', error);
      toast.error('Error al cargar mensajes: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar 5MB');
      return;
    }

    setSelectedImage(file);
    
    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const supabase = createClient();
    const bucketName = 'make-370afec0-tickets';
    
    // Nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${ticket.id}/${Date.now()}.${fileExt}`;

    try {
      // Verificar/crear bucket
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        const { error: bucketError } = await supabase.storage.createBucket(bucketName, {
          public: false
        });
        if (bucketError) throw bucketError;
      }

      // Subir archivo
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública firmada (válida por 1 año)
      const { data: signedUrlData } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(fileName, 31536000); // 1 año en segundos

      if (!signedUrlData?.signedUrl) {
        throw new Error('No se pudo generar URL de la imagen');
      }

      return signedUrlData.signedUrl;
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedImage) return;

    setIsLoading(true);
    
    try {
      let messageContent = newMessage.trim();

      // Si hay una imagen, subirla primero
      if (selectedImage) {
        setUploadingImage(true);
        const imageUrl = await uploadImage(selectedImage);
        
        // Agregar la URL de la imagen al mensaje
        messageContent = messageContent 
          ? `${messageContent}\n[IMAGEN]: ${imageUrl}`
          : `[IMAGEN]: ${imageUrl}`;
        
        setUploadingImage(false);
      }

      // Enviar mensaje
      const sentMessage = await sendMessage(ticket.id, messageContent);
      
      // Agregar el mensaje a la lista
      setMessages(prev => [...prev, sentMessage]);
      
      // Limpiar campos
      setNewMessage('');
      handleRemoveImage();
      
      toast.success('Mensaje enviado');
    } catch (error: any) {
      console.error('Error enviando mensaje:', error);
      toast.error('Error al enviar mensaje: ' + (error.message || 'Error desconocido'));
    } finally {
      setIsLoading(false);
      setUploadingImage(false);
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Hora inválida';
      }
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Hora inválida';
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendiente: 'bg-gray-100 text-gray-800',
      asignado: 'bg-blue-100 text-blue-800',
      en_progreso: 'bg-purple-100 text-purple-800',
      resuelto: 'bg-green-100 text-green-800',
      cerrado: 'bg-slate-100 text-slate-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Función para detectar si el mensaje contiene una URL de imagen
  const extractImageUrl = (content: string): { text: string; imageUrl: string | null } => {
    const imageMatch = content.match(/\[IMAGEN\]: (.+)/);
    if (imageMatch) {
      const imageUrl = imageMatch[1];
      const text = content.replace(/\[IMAGEN\]: .+/, '').trim();
      return { text, imageUrl };
    }
    return { text: content, imageUrl: null };
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Tickets
        </Button>
      </div>

      {/* Ticket Info */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{ticket.title}</CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">
                    <span className="font-medium">ID:</span> {ticket.id}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Ubicación:</span> {ticket.city}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Dirección:</span> {ticket.address}
                  </p>
                  {ticket.serviceProvider && (
                    <p className="text-muted-foreground">
                      <span className="font-medium">Proveedor:</span> {ticket.serviceProvider}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Prioridad:</span>{' '}
                    <span className="capitalize">{ticket.priority}</span>
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Tipo:</span>{' '}
                    {ticket.problemType.replace(/_/g, ' ')}
                  </p>
                  {ticket.assignedExpert && (
                    <p className="text-muted-foreground">
                      <span className="font-medium">Experto:</span> {ticket.assignedExpert.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <Badge className={getStatusColor(ticket.status)}>
              {ticket.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm font-medium mb-1">Descripción del Problema:</p>
            <p className="text-sm">{ticket.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col min-h-[600px]">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {ticket.assignedExpert 
              ? `Comunicación con ${ticket.assignedExpert.name}`
              : 'Comunicación con el Experto'
            }
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col min-h-0 gap-4">
          {/* Messages Area with Fixed Height and Scroll */}
          <div className="flex-1 min-h-0 relative">
            <ScrollArea ref={scrollAreaRef} className="h-full pr-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-muted-foreground">Cargando mensajes...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay mensajes aún.</p>
                  {ticket.assignedExpert ? (
                    <p className="text-sm mt-1">El experto se comunicará contigo pronto.</p>
                  ) : (
                    <p className="text-sm mt-1">Espera a que se asigne un experto a tu ticket.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  {messages.map((message) => {
                    const { text, imageUrl } = extractImageUrl(message.content);
                    const isUser = message.senderRole === 'usuario';
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isUser
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
                          {text && <p className="text-sm mb-2">{text}</p>}
                          {imageUrl && (
                            <img 
                              src={imageUrl} 
                              alt="Evidencia" 
                              className="rounded-md max-w-full cursor-pointer hover:opacity-90"
                              onClick={() => window.open(imageUrl, '_blank')}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Input Area - Fixed at Bottom */}
          <div className="flex-shrink-0 space-y-3 border-t pt-4">
            {/* Image Preview */}
            {imagePreview && (
              <div className="relative inline-block">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="h-20 rounded-md border"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Message Input or Closed/Reopened Message */}
            {ticket.status === 'cerrado' ? (
              <div className="text-center text-sm text-muted-foreground py-2">
                <p className="mb-3">Este ticket ha sido cerrado.</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      const { updateTicketStatus } = await import('../../utils/api');
                      await updateTicketStatus(ticket.id, 'en_progreso');
                      toast.success('Ticket reabierto correctamente');
                      onBack();
                    } catch (error: any) {
                      toast.error('Error al reabrir ticket: ' + (error.message || 'Error desconocido'));
                    }
                  }}
                >
                  Reabrir Ticket
                </Button>
              </div>
            ) : ticket.status === 'resuelto' ? (
              <div className="text-center text-sm py-2">
                <p className="text-muted-foreground mb-3">Este ticket está marcado como resuelto.</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      const { updateTicketStatus } = await import('../../utils/api');
                      await updateTicketStatus(ticket.id, 'en_progreso');
                      toast.success('Ticket reabierto correctamente');
                      onBack();
                    } catch (error: any) {
                      toast.error('Error al reabrir ticket: ' + (error.message || 'Error desconocido'));
                    }
                  }}
                >
                  Reabrir Ticket (el problema persiste)
                </Button>
              </div>
            ) : (
              <>
                {/* Message Input */}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || uploadingImage}
                    title="Adjuntar imagen"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    disabled={isLoading || uploadingImage}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={(!newMessage.trim() && !selectedImage) || isLoading || uploadingImage}
                    size="icon"
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}