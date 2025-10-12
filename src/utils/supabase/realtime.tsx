import { useEffect, useState } from 'react';
import { createClient } from './client';
import { Message } from '../../types';

/**
 * Hook personalizado para suscribirse a mensajes en tiempo real de un ticket
 * Usa Supabase Realtime para escuchar nuevos mensajes
 */
export function useTicketMessages(ticketId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticketId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    // Cargar mensajes iniciales
    const loadMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://${supabase.supabaseUrl.split('//')[1]}/functions/v1/make-server-370afec0/messages/${ticketId}`,
          {
            headers: {
              'Authorization': `Bearer ${supabase.supabaseKey}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Error cargando mensajes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Configurar suscripción a nuevos mensajes
    // Nota: Como estamos usando KV store en lugar de tablas Postgres,
    // necesitamos usar broadcast channels para simular realtime
    channel = supabase.channel(`ticket-${ticketId}`)
      .on('broadcast', { event: 'new-message' }, (payload) => {
        const newMessage = payload.payload as Message;
        setMessages((prev) => {
          // Evitar duplicados
          if (prev.some(m => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
      })
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [ticketId]);

  return { messages, loading };
}

/**
 * Hook para enviar mensajes y notificar a otros clientes en tiempo real
 */
export function useSendMessage() {
  const [sending, setSending] = useState(false);

  const sendMessage = async (ticketId: string, content: string) => {
    setSending(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch(
        `https://${supabase.supabaseUrl.split('//')[1]}/functions/v1/make-server-370afec0/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ ticketId, content }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al enviar mensaje');
      }

      const data = await response.json();
      
      // Broadcast el nuevo mensaje a todos los clientes suscritos
      const channel = supabase.channel(`ticket-${ticketId}`);
      await channel.send({
        type: 'broadcast',
        event: 'new-message',
        payload: data.message,
      });

      return data.message;
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      throw error;
    } finally {
      setSending(false);
    }
  };

  return { sendMessage, sending };
}

/**
 * Hook para suscribirse a cambios de estado de tickets en tiempo real
 */
export function useTicketUpdates(ticketId: string | null) {
  const [ticket, setTicket] = useState<any>(null);

  useEffect(() => {
    if (!ticketId) return;

    const supabase = createClient();
    
    const channel = supabase.channel(`ticket-updates-${ticketId}`)
      .on('broadcast', { event: 'ticket-updated' }, (payload) => {
        setTicket(payload.payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  return ticket;
}

/**
 * Función para notificar actualizaciones de ticket a todos los clientes
 */
export async function broadcastTicketUpdate(ticketId: string, ticket: any) {
  const supabase = createClient();
  const channel = supabase.channel(`ticket-updates-${ticketId}`);
  
  await channel.send({
    type: 'broadcast',
    event: 'ticket-updated',
    payload: ticket,
  });
}
