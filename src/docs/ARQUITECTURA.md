# 🏗️ Arquitectura del Sistema de Tickets

## 📋 Visión General

Sistema de gestión de tickets de soporte técnico con 3 roles de usuario, chat en tiempo real y backend serverless.

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Usuario  │  │ Operador │  │ Experto  │              │
│  │Dashboard │  │Dashboard │  │Dashboard │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                          │
│  ┌──────────────────────────────────────┐               │
│  │     AuthProvider (Context)           │               │
│  │  - Login/Logout                      │               │
│  │  - User state management             │               │
│  └──────────────────────────────────────┘               │
└────────────────────┬─────────────────────────────────────┘
                     │
                     │ HTTPS / WebSocket
                     ▼
┌─────────────────────────────────────────────────────────┐
│               SUPABASE PLATFORM                          │
│                                                          │
│  ┌─────────────────────────────────────┐                │
│  │  Edge Functions (Hono Server)       │                │
│  │  /make-server-370afec0/*            │                │
│  │                                     │                │
│  │  ├─ POST /auth/signup               │                │
│  │  ├─ GET  /auth/me                   │                │
│  │  ├─ POST /tickets                   │                │
│  │  ├─ GET  /tickets                   │                │
│  │  ├─ POST /tickets/:id/assign        │                │
│  │  ├─ PUT  /tickets/:id/status        │                │
│  │  ├─ POST /messages                  │                │
│  │  ├─ GET  /messages/:ticketId        │                │
│  │  ├─ GET  /experts                   │                │
│  │  └─ GET  /stats                     │                │
│  └─────────────────────────────────────┘                │
│                     │                                    │
│         ┌───────────┼───────────┬─────────────┐         │
│         ▼           ▼           ▼             ▼         │
│    ┌────────┐  ┌───────┐  ┌─────────┐  ┌─────────┐    │
│    │  Auth  │  │   KV  │  │Realtime │  │ Storage │    │
│    │        │  │ Store │  │         │  │         │    │
│    └────────┘  └───────┘  └─────────┘  └─────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🎭 Roles y Permisos

### 👤 Usuario
**Puede:**
- ✅ Crear tickets de soporte
- ✅ Ver sus propios tickets
- ✅ Chatear con el experto asignado
- ✅ Ver historial de sus tickets

**No puede:**
- ❌ Ver tickets de otros usuarios
- ❌ Asignar tickets
- ❌ Cambiar estado de tickets (solo puede crear)

### ⚙️ Operador
**Puede:**
- ✅ Ver TODOS los tickets del sistema
- ✅ Filtrar tickets por estado, prioridad, tipo
- ✅ Asignar tickets a expertos según especialización
- ✅ Ver lista de expertos y su disponibilidad
- ✅ Monitorear estadísticas generales
- ✅ Cambiar estado de tickets

**No puede:**
- ❌ Chatear con usuarios (solo expertos pueden)
- ❌ Crear tickets como usuario

### 🔧 Experto
**Puede:**
- ✅ Ver tickets asignados a él
- ✅ Cambiar estado de tickets asignados
- ✅ Chatear directamente con los usuarios
- ✅ Ver historial completo del ticket
- ✅ Marcar tickets como resueltos

**No puede:**
- ❌ Ver tickets no asignados a él
- ❌ Asignar tickets a otros expertos
- ❌ Ver tickets de otros expertos

## 📊 Flujo de Datos

### 1. Creación de Ticket

```
Usuario → [Formulario] → Frontend
                           ↓
                    POST /tickets
                           ↓
                   Backend (Hono)
                     ↓         ↓
              Validar      Guardar en
               Auth         KV Store
                     ↓         ↓
                Ticket creado con ID
                           ↓
                Agregar a índices:
                - all_tickets
                - user_tickets:{userId}
                           ↓
                Crear actividad:
                "Ticket creado"
                           ↓
                 Responder a Frontend
                           ↓
              Actualizar Dashboard
```

### 2. Asignación de Ticket

```
Operador → [Selecciona Experto] → Frontend
                                      ↓
                         POST /tickets/:id/assign
                                      ↓
                              Backend (Hono)
                                  ↓    ↓
                            Verificar   Obtener
                            es operador  ticket
                                  ↓    ↓
                            Actualizar ticket:
                            - assignedExpertId
                            - status = "asignado"
                                      ↓
                            Agregar a índice:
                            expert_tickets:{expertId}
                                      ↓
                            Actualizar experto:
                            - activeTickets++
                                      ↓
                            Crear actividad:
                            "Ticket asignado a X"
                                      ↓
                          Notificar a Frontend
                                      ↓
                    Actualizar ambos dashboards
```

### 3. Chat en Tiempo Real

```
Usuario/Experto → [Escribe mensaje] → Frontend
                                         ↓
                                POST /messages
                                         ↓
                                 Backend (Hono)
                                    ↓     ↓
                              Validar   Guardar
                               Auth     mensaje
                                    ↓     ↓
                              Agregar a índice:
                              ticket_messages:{ticketId}
                                         ↓
                              Responder con mensaje
                                         ↓
                                    Frontend
                                         ↓
                              Broadcast via Realtime
                                         ↓
                           Todos los clientes suscritos
                           reciben el mensaje
                                         ↓
                              UI se actualiza automáticamente
```

## 🗄️ Modelo de Datos (KV Store)

### Entidades Principales

```typescript
// Usuario
user:{userId} → {
  id: string
  name: string
  email: string
  phone: string
  role: 'usuario' | 'operador' | 'experto'
  createdAt: string
}

// Experto (extensión de usuario)
expert:{expertId} → {
  id: string
  name: string
  email: string
  specializations: string[]      // ['internet', 'telefono']
  activeTickets: number           // Contador en tiempo real
  totalResolved: number           // Historial
}

// Ticket
ticket:{ticketId} → {
  id: string
  title: string
  description: string
  problemType: 'internet' | 'telefono' | 'ambos'
  priority: 'baja' | 'media' | 'alta' | 'critica'
  status: 'pendiente' | 'asignado' | 'en_progreso' | 'resuelto' | 'cerrado'
  userId: string
  userName: string
  userEmail: string
  userPhone: string
  assignedExpertId?: string
  assignedExpertName?: string
  location: string
  serviceProvider?: string
  createdAt: string
  updatedAt: string
}

// Mensaje
message:{messageId} → {
  id: string
  ticketId: string
  senderId: string
  senderName: string
  senderRole: 'usuario' | 'experto'
  content: string
  timestamp: string
}

// Actividad
activity:{activityId} → {
  id: string
  ticketId: string
  action: string              // 'Ticket creado', 'Ticket asignado', etc.
  performedBy: string
  timestamp: string
  details?: string
}
```

### Índices (para queries rápidas)

```typescript
all_tickets: string[]                    // Todos los tickets
user_tickets:{userId}: string[]          // Tickets de un usuario
expert_tickets:{expertId}: string[]      // Tickets de un experto
ticket_messages:{ticketId}: string[]     // Mensajes de un ticket
ticket_activities:{ticketId}: string[]   // Actividades de un ticket
```

## 🔐 Seguridad

### Autenticación
```
Frontend → Login → Supabase Auth
                        ↓
                  JWT Token (access_token)
                        ↓
             Guardado en Session Storage
                        ↓
     Incluido en cada request al backend:
     Authorization: Bearer {access_token}
                        ↓
              Backend valida el token
                        ↓
             Extrae user.id y user.role
                        ↓
            Aplica lógica de permisos
```

### Validación de Permisos (Backend)

```typescript
// Ejemplo: Obtener tickets
async function getTickets(user) {
  if (user.role === 'usuario') {
    // Solo sus tickets
    const ticketIds = await kv.get(`user_tickets:${user.id}`);
    return getTicketsByIds(ticketIds);
  }
  
  if (user.role === 'experto') {
    // Solo tickets asignados
    const ticketIds = await kv.get(`expert_tickets:${user.id}`);
    return getTicketsByIds(ticketIds);
  }
  
  if (user.role === 'operador') {
    // Todos los tickets
    const ticketIds = await kv.get('all_tickets');
    return getTicketsByIds(ticketIds);
  }
}
```

## 🔄 Realtime (WebSocket)

### Arquitectura del Chat

```
┌──────────────┐                    ┌──────────────┐
│  Cliente 1   │                    │  Cliente 2   │
│  (Usuario)   │                    │  (Experto)   │
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       │ Subscribe to:                     │ Subscribe to:
       │ channel(`ticket-${ticketId}`)     │ channel(`ticket-${ticketId}`)
       │                                   │
       └───────────┬───────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  Supabase Realtime  │
         │     (WebSocket)     │
         └─────────────────────┘
                   │
                   │ Broadcast:
                   │ { event: 'new-message', payload: message }
                   │
       ┌───────────┴───────────────────────┐
       │                                   │
       ▼                                   ▼
┌──────────────┐                    ┌──────────────┐
│  Cliente 1   │                    │  Cliente 2   │
│  Recibe msg  │                    │  Recibe msg  │
│  UI update   │                    │  UI update   │
└──────────────┘                    └──────────────┘
```

### Hook de Realtime

```typescript
function useTicketMessages(ticketId) {
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    // 1. Cargar mensajes iniciales
    loadMessages();
    
    // 2. Suscribirse a nuevos mensajes
    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on('broadcast', { event: 'new-message' }, (payload) => {
        setMessages(prev => [...prev, payload.message]);
      })
      .subscribe();
    
    // 3. Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);
  
  return { messages };
}
```

## 📈 Escalabilidad

### Limitaciones Actuales (KV Store)

- ✅ Perfecto para prototipado y MVP
- ✅ Soporta miles de tickets sin problema
- ⚠️ Queries complejas requieren múltiples lecturas
- ⚠️ No hay transacciones atómicas

### Migración Futura a PostgreSQL

```sql
-- Cuando el proyecto crezca, migrar a tablas SQL

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('usuario', 'operador', 'experto')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  problem_type TEXT,
  priority TEXT,
  status TEXT DEFAULT 'pendiente',
  user_id UUID REFERENCES users(id),
  assigned_expert_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id),
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_expert_id ON tickets(assigned_expert_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_messages_ticket_id ON messages(ticket_id);
```

## 🚀 Optimizaciones

### Caché en Frontend
```typescript
// Usar React Query para caché
const { data: tickets } = useQuery(
  ['tickets', filters],
  () => getTickets(filters),
  { staleTime: 30000 } // 30 segundos
);
```

### Paginación
```typescript
// Para grandes volúmenes de tickets
const { tickets, hasMore } = await getTickets({
  limit: 20,
  offset: page * 20
});
```

### Índices Optimizados
```typescript
// Mantener contadores denormalizados para evitar conteos
const stats = await kv.get(`stats:${userId}`);
// Actualizar en cada cambio de ticket
```

## 📱 Responsive Design

```
Mobile (< 768px)
├── Single column layout
├── Collapsible filters
├── Bottom navigation
└── Swipe gestures

Tablet (768px - 1024px)
├── Two column layout
├── Sidebar navigation
└── Modal dialogs

Desktop (> 1024px)
├── Three column layout
├── Fixed sidebar
├── Inline forms
└── Multi-panel views
```

## 🧪 Testing

### Unit Tests
```typescript
// Funciones API
test('createTicket should create a new ticket', async () => {
  const ticket = await createTicket({...});
  expect(ticket.id).toBeDefined();
});
```

### Integration Tests
```typescript
// Flujo completo
test('ticket workflow', async () => {
  // 1. Usuario crea ticket
  const ticket = await createTicket({...});
  
  // 2. Operador asigna
  await assignTicket(ticket.id, expertId);
  
  // 3. Experto actualiza
  await updateTicketStatus(ticket.id, 'resuelto');
  
  // 4. Verificar estado final
  const updated = await getTicket(ticket.id);
  expect(updated.status).toBe('resuelto');
});
```

### E2E Tests (Playwright/Cypress)
```typescript
test('complete user flow', async ({ page }) => {
  // Login
  await page.goto('/');
  await page.fill('[name=email]', 'usuario@test.com');
  await page.fill('[name=password]', 'test123');
  await page.click('button[type=submit]');
  
  // Create ticket
  await page.click('text=Crear Ticket');
  await page.fill('[name=title]', 'Test ticket');
  // ...
  
  // Verify
  await expect(page.locator('text=Test ticket')).toBeVisible();
});
```

---

**Sistema diseñado para ser:**
- 🚀 Rápido de implementar
- 📱 Responsive y mobile-first
- 🔒 Seguro con auth y roles
- 💬 Interactivo con realtime
- 📈 Escalable a producción
