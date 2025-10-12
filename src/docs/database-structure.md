# Estructura de la Base de Datos

## Resumen

Este sistema utiliza **Supabase** como plataforma backend con:
- **Supabase Auth**: Autenticación de usuarios con roles
- **KV Store**: Almacenamiento de datos usando tabla key-value
- **Realtime**: Comunicación en tiempo real para el chat

## Arquitectura

```
Frontend (React) → Supabase Edge Functions (Hono Server) → KV Store (PostgreSQL)
                 ↓
            Supabase Auth
            Supabase Realtime
```

## Estructura de Claves en KV Store

### Usuarios
```typescript
user:{userId}
{
  id: string,
  name: string,
  email: string,
  phone: string,
  role: 'usuario' | 'operador' | 'experto',
  createdAt: string
}
```

### Expertos
```typescript
expert:{expertId}
{
  id: string,
  name: string,
  email: string,
  specializations: string[],
  activeTickets: number,
  totalResolved: number
}
```

### Tickets
```typescript
ticket:{ticketId}
{
  id: string,
  title: string,
  description: string,
  problemType: 'internet' | 'telefono' | 'ambos',
  priority: 'baja' | 'media' | 'alta' | 'critica',
  status: 'pendiente' | 'asignado' | 'en_progreso' | 'resuelto' | 'cerrado',
  userId: string,
  userName: string,
  userEmail: string,
  userPhone: string,
  assignedExpertId?: string,
  assignedExpertName?: string,
  location: string,
  serviceProvider?: string,
  createdAt: string,
  updatedAt: string
}
```

### Mensajes
```typescript
message:{messageId}
{
  id: string,
  ticketId: string,
  senderId: string,
  senderName: string,
  senderRole: 'usuario' | 'experto',
  content: string,
  timestamp: string
}
```

### Actividades
```typescript
activity:{activityId}
{
  id: string,
  ticketId: string,
  action: string,
  performedBy: string,
  timestamp: string,
  details?: string
}
```

### Índices y Listas
```typescript
// Lista de todos los tickets
all_tickets: string[]

// Tickets por usuario
user_tickets:{userId}: string[]

// Tickets asignados a un experto
expert_tickets:{expertId}: string[]

// Mensajes de un ticket
ticket_messages:{ticketId}: string[]

// Actividades de un ticket
ticket_activities:{ticketId}: string[]
```

## API Endpoints

### Autenticación

#### POST /auth/signup
Registrar nuevo usuario
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña",
  "name": "Nombre Completo",
  "phone": "+123456789",
  "role": "usuario",
  "specializations": ["internet", "telefono"] // solo para expertos
}
```

#### GET /auth/me
Obtener información del usuario actual (requiere autenticación)

### Tickets

#### POST /tickets
Crear nuevo ticket (requiere autenticación)
```json
{
  "title": "Sin conexión a internet",
  "description": "Descripción detallada del problema",
  "problemType": "internet",
  "priority": "alta",
  "location": "Oficina Central",
  "serviceProvider": "Proveedor X"
}
```

#### GET /tickets
Obtener lista de tickets (con filtros opcionales)
- Query params: `status`, `problemType`, `priority`
- Los usuarios solo ven sus tickets
- Los expertos ven sus tickets asignados
- Los operadores ven todos los tickets

#### GET /tickets/:id
Obtener detalles de un ticket específico

#### POST /tickets/:id/assign
Asignar ticket a un experto (solo operadores)
```json
{
  "expertId": "uuid-del-experto"
}
```

#### PUT /tickets/:id/status
Actualizar estado del ticket
```json
{
  "status": "en_progreso"
}
```

#### GET /tickets/:id/activities
Obtener historial de actividades de un ticket

### Mensajes

#### POST /messages
Enviar mensaje en un ticket
```json
{
  "ticketId": "uuid-del-ticket",
  "content": "Contenido del mensaje"
}
```

#### GET /messages/:ticketId
Obtener todos los mensajes de un ticket

### Expertos

#### GET /experts
Obtener lista de todos los expertos

### Estadísticas

#### GET /stats
Obtener estadísticas según el rol del usuario
- Operador: totales por estado
- Experto: tickets activos y resueltos
- Usuario: resumen de sus tickets

## Autenticación

### Sign Up (Registro)
```typescript
import { fetchFromServer } from './utils/supabase/client';

const response = await fetchFromServer('/auth/signup', {
  method: 'POST',
  body: JSON.stringify({
    email: 'usuario@ejemplo.com',
    password: 'contraseña',
    name: 'Nombre',
    phone: '+123456789',
    role: 'usuario'
  })
});
```

### Sign In (Inicio de sesión)
```typescript
import { createClient } from './utils/supabase/client';

const supabase = createClient();
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@ejemplo.com',
  password: 'contraseña',
});

// El access_token se guarda automáticamente en la sesión
```

### Sign Out (Cerrar sesión)
```typescript
import { createClient } from './utils/supabase/client';

const supabase = createClient();
await supabase.auth.signOut();
```

### Verificar Sesión Actual
```typescript
import { createClient } from './utils/supabase/client';

const supabase = createClient();
const { data: { session } } = await supabase.auth.getSession();

if (session) {
  // Usuario autenticado
  const user = session.user;
  const accessToken = session.access_token;
}
```

## Realtime (Chat en Tiempo Real)

### Usar Hook de Mensajes
```typescript
import { useTicketMessages, useSendMessage } from './utils/supabase/realtime';

function ChatComponent({ ticketId }) {
  const { messages, loading } = useTicketMessages(ticketId);
  const { sendMessage, sending } = useSendMessage();

  const handleSend = async (content: string) => {
    try {
      await sendMessage(ticketId, content);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    // UI del chat
  );
}
```

## Flujo de Trabajo Completo

### 1. Usuario reporta problema
1. Usuario se registra/inicia sesión
2. Crea ticket con `POST /tickets`
3. Ticket aparece en dashboard del usuario con estado "pendiente"

### 2. Operador asigna ticket
1. Operador ve ticket en dashboard
2. Selecciona experto apropiado según especialización
3. Asigna con `POST /tickets/:id/assign`
4. Estado cambia a "asignado"

### 3. Experto resuelve problema
1. Experto ve ticket asignado en su dashboard
2. Cambia estado a "en_progreso" con `PUT /tickets/:id/status`
3. Inicia chat con usuario para comunicación directa
4. Una vez resuelto, cambia estado a "resuelto"

### 4. Chat en tiempo real
1. Cliente se suscribe al canal del ticket
2. Mensajes enviados se guardan en KV store
3. Se hace broadcast a todos los clientes suscritos
4. UI se actualiza automáticamente

## Seguridad

### Row Level Security (Conceptual)
Aunque KV Store no tiene RLS nativo, la seguridad se implementa en el servidor:

- **Usuarios**: Solo pueden ver/editar sus propios tickets
- **Operadores**: Pueden ver todos los tickets y asignar a expertos
- **Expertos**: Solo pueden ver tickets asignados a ellos

### Autenticación de Requests
Todos los endpoints (excepto signup) requieren token de autenticación:
```
Authorization: Bearer {access_token}
```

El servidor verifica el token y el rol antes de procesar la petición.

## Ejemplo de Flujo de Datos

```
1. Usuario crea ticket
   Frontend → POST /tickets → Server
   Server → KV: set ticket:{id}
   Server → KV: append to user_tickets:{userId}
   Server → KV: append to all_tickets
   Server → Frontend: {success, ticket}

2. Operador asigna a experto
   Frontend → POST /tickets/:id/assign → Server
   Server → Verifica rol es operador
   Server → KV: update ticket:{id}
   Server → KV: append to expert_tickets:{expertId}
   Server → KV: update expert:{expertId}
   Server → Frontend: {success, ticket}

3. Chat entre experto y usuario
   Frontend → POST /messages → Server
   Server → KV: set message:{id}
   Server → KV: append to ticket_messages:{ticketId}
   Server → Frontend: {success, message}
   Frontend → Realtime broadcast → Otros clientes
```

## Monitoreo y Debugging

### Logs del Servidor
Todos los errores se logean con contexto:
```typescript
console.log("Error al crear ticket:", error);
```

### Testing de Endpoints
Usar herramienta como Postman o curl:
```bash
# Health check
curl https://{projectId}.supabase.co/functions/v1/make-server-370afec0/health

# Crear usuario
curl -X POST https://{projectId}.supabase.co/functions/v1/make-server-370afec0/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "test123",
    "name": "Test User",
    "role": "usuario"
  }'
```

## Extensiones Futuras

### Posibles mejoras:
1. **Migraciones a tablas SQL**: Para mejor performance y queries complejas
2. **File uploads**: Para adjuntar imágenes/archivos a tickets
3. **Notificaciones**: Email/push cuando se asigna o actualiza ticket
4. **Analytics**: Dashboard de métricas y KPIs
5. **Búsqueda avanzada**: Full-text search en tickets
6. **Historial completo**: Versioning de cambios en tickets
