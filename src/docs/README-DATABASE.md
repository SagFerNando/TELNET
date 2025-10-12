# 📚 Guía Completa de Base de Datos

## 🎯 Introducción

Este sistema de tickets utiliza **Supabase** como backend integral que proporciona:

- ✅ **PostgreSQL** - Base de datos relacional
- ✅ **Auth** - Sistema de autenticación con roles
- ✅ **Realtime** - Actualizaciones en tiempo real para chat
- ✅ **Edge Functions** - API server con Hono
- ✅ **Storage** - Almacenamiento de archivos (futuro)

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐
│   Frontend      │
│   (React +      │
│   TypeScript)   │
└────────┬────────┘
         │
         │ HTTP/WebSocket
         ▼
┌─────────────────┐
│  Supabase       │
│  Edge Functions │ ← Hono Server (API)
│  (/server/)     │
└────────┬────────┘
         │
         ├─────────┬──────────┬──────────┐
         ▼         ▼          ▼          ▼
    ┌────────┐ ┌──────┐  ┌────────┐ ┌──────┐
    │  Auth  │ │  KV  │  │Realtime│ │Storage│
    └────────┘ └──────┘  └────────┘ └──────┘
```

## 📦 Estructura de Datos (KV Store)

### Claves Principales

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `user:{userId}` | Object | Datos del usuario |
| `expert:{expertId}` | Object | Perfil de experto |
| `ticket:{ticketId}` | Object | Información del ticket |
| `message:{messageId}` | Object | Mensaje de chat |
| `activity:{activityId}` | Object | Registro de actividad |

### Índices (Arrays de IDs)

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `all_tickets` | Array | Todos los tickets del sistema |
| `user_tickets:{userId}` | Array | Tickets de un usuario |
| `expert_tickets:{expertId}` | Array | Tickets asignados a experto |
| `ticket_messages:{ticketId}` | Array | Mensajes de un ticket |
| `ticket_activities:{ticketId}` | Array | Actividades de un ticket |

## 🚀 Inicio Rápido

### Paso 1: Configuración Inicial

La forma más fácil de comenzar es usar el **DatabaseSetup** integrado:

1. La aplicación te mostrará automáticamente la pantalla de configuración
2. Click en "Configuración Completa (Recomendado)"
3. Espera a que se creen usuarios y tickets de prueba
4. ¡Listo! Ya puedes iniciar sesión

### Paso 2: Verificar Conexión

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Verificar que el servidor está activo
const projectId = 'TU_PROJECT_ID';
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-370afec0/health`
);
const data = await response.json();
console.log(data); // Debe mostrar: { status: "ok" }
```

### Paso 3: Iniciar Sesión

Usa cualquiera de estos usuarios creados automáticamente:

| Rol | Email | Password | Descripción |
|-----|-------|----------|-------------|
| 👤 Usuario | usuario@test.com | test123 | Crea y consulta tickets |
| ⚙️ Operador | operador@test.com | test123 | Gestiona y asigna tickets |
| 🔧 Experto | experto1@test.com | test123 | Resuelve tickets (Internet) |
| 🔧 Experto | experto2@test.com | test123 | Resuelve tickets (Teléfono) |

## 🔐 Sistema de Autenticación

### Registro de Nuevos Usuarios

```typescript
import { fetchFromServer } from './utils/supabase/client';

await fetchFromServer('/auth/signup', {
  method: 'POST',
  body: JSON.stringify({
    email: 'nuevo@ejemplo.com',
    password: 'password123',
    name: 'Nombre Completo',
    phone: '+34 600 000 000',
    role: 'usuario', // 'usuario' | 'operador' | 'experto'
    specializations: ['internet'] // Solo para expertos
  })
});
```

### Iniciar Sesión

```typescript
import { createClient } from './utils/supabase/client';

const supabase = createClient();
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@test.com',
  password: 'test123',
});

if (!error) {
  console.log('Sesión iniciada:', data.user);
}
```

### Cerrar Sesión

```typescript
import { createClient } from './utils/supabase/client';

const supabase = createClient();
await supabase.auth.signOut();
```

### Verificar Sesión Actual

```typescript
import { getCurrentUser } from './utils/supabase/client';

const user = await getCurrentUser();
if (user) {
  console.log('Usuario activo:', user.email);
}
```

## 📝 Operaciones con Tickets

### Crear Ticket (Usuario)

```typescript
import { fetchFromServer } from './utils/supabase/client';

const ticket = await fetchFromServer('/tickets', {
  method: 'POST',
  body: JSON.stringify({
    title: 'Sin conexión a internet',
    description: 'El router tiene luz roja desde esta mañana',
    problemType: 'internet', // 'internet' | 'telefono' | 'ambos'
    priority: 'alta', // 'baja' | 'media' | 'alta' | 'critica'
    location: 'Oficina Central - Planta 3',
    serviceProvider: 'Movistar'
  })
});

console.log('Ticket creado:', ticket);
```

### Listar Tickets

```typescript
// Sin filtros (ve tickets según tu rol)
const { tickets } = await fetchFromServer('/tickets');

// Con filtros
const { tickets } = await fetchFromServer(
  '/tickets?status=pendiente&priority=alta'
);

console.log('Tickets:', tickets);
```

### Obtener Ticket Específico

```typescript
const { ticket } = await fetchFromServer(`/tickets/${ticketId}`);
```

### Asignar Ticket (Operador)

```typescript
await fetchFromServer(`/tickets/${ticketId}/assign`, {
  method: 'POST',
  body: JSON.stringify({
    expertId: 'uuid-del-experto'
  })
});
```

### Actualizar Estado (Experto)

```typescript
await fetchFromServer(`/tickets/${ticketId}/status`, {
  method: 'PUT',
  body: JSON.stringify({
    status: 'en_progreso' // 'pendiente' | 'asignado' | 'en_progreso' | 'resuelto' | 'cerrado'
  })
});
```

### Obtener Actividades

```typescript
const { activities } = await fetchFromServer(`/tickets/${ticketId}/activities`);
```

## 💬 Chat en Tiempo Real

### Componente de Chat

```typescript
import { useTicketMessages, useSendMessage } from './utils/supabase/realtime';

function ChatComponent({ ticketId }: { ticketId: string }) {
  const { messages, loading } = useTicketMessages(ticketId);
  const { sendMessage, sending } = useSendMessage();

  const handleSend = async (content: string) => {
    try {
      await sendMessage(ticketId, content);
    } catch (error) {
      console.error('Error al enviar:', error);
    }
  };

  return (
    <div>
      {loading && <p>Cargando mensajes...</p>}
      
      {messages.map(msg => (
        <div key={msg.id}>
          <strong>{msg.senderName}:</strong> {msg.content}
          <small>{new Date(msg.timestamp).toLocaleString()}</small>
        </div>
      ))}

      <button 
        onClick={() => handleSend('Hola!')}
        disabled={sending}
      >
        Enviar
      </button>
    </div>
  );
}
```

### Enviar Mensaje Directamente

```typescript
import { fetchFromServer } from './utils/supabase/client';

const message = await fetchFromServer('/messages', {
  method: 'POST',
  body: JSON.stringify({
    ticketId: 'uuid-del-ticket',
    content: 'Contenido del mensaje'
  })
});
```

### Obtener Mensajes de un Ticket

```typescript
const { messages } = await fetchFromServer(`/messages/${ticketId}`);
```

## 📊 Estadísticas

### Dashboard Stats

```typescript
const { stats } = await fetchFromServer('/stats');

// Para operador:
// { totalTickets, pendientes, asignados, enProgreso, resueltos, cerrados }

// Para experto:
// { activeTickets, totalResolved, enProgreso, resueltos }

// Para usuario:
// { totalTickets, pendientes, enProgreso, resueltos }
```

## 👥 Gestión de Expertos

### Listar Expertos

```typescript
const { experts } = await fetchFromServer('/experts');

experts.forEach(expert => {
  console.log(`${expert.name} - Especialidades: ${expert.specializations.join(', ')}`);
  console.log(`Tickets activos: ${expert.activeTickets}`);
  console.log(`Tickets resueltos: ${expert.totalResolved}`);
});
```

## 🔒 Seguridad y Permisos

### Roles y Permisos

| Acción | Usuario | Operador | Experto |
|--------|---------|----------|---------|
| Crear tickets | ✅ | ✅ | ✅ |
| Ver propios tickets | ✅ | - | - |
| Ver todos los tickets | ❌ | ✅ | ❌ |
| Ver tickets asignados | ❌ | ❌ | ✅ |
| Asignar tickets | ❌ | ✅ | ❌ |
| Cambiar estado | ❌ | ✅ | ✅ |
| Enviar mensajes | ✅ | ❌ | ✅ |

### Validación de Tokens

Todas las peticiones al servidor (excepto signup) requieren autenticación:

```typescript
Authorization: Bearer {access_token}
```

El servidor valida el token y verifica permisos antes de ejecutar acciones.

## 🧪 Testing y Debugging

### Modo Debug en Consola

Abre DevTools (F12) y ejecuta:

```javascript
// Funciones disponibles globalmente
await seedTestUsers();      // Crear usuarios de prueba
await seedTestTickets();    // Crear tickets de prueba (requiere login)
await seedAll();            // Ejecutar todo

// Verificar conexión
const health = await fetch(
  'https://TU_PROJECT_ID.supabase.co/functions/v1/make-server-370afec0/health'
).then(r => r.json());
console.log('Server:', health);
```

### Ver Logs del Servidor

1. Ir a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Edge Functions → make-server-370afec0
4. Ver logs en tiempo real

### Errores Comunes

#### "No autorizado"
**Causa:** No hay sesión activa o token expirado
**Solución:**
```typescript
await supabase.auth.signInWithPassword({
  email: 'usuario@test.com',
  password: 'test123'
});
```

#### "Ticket no encontrado"
**Causa:** El ID del ticket no existe
**Solución:**
```typescript
const { tickets } = await fetchFromServer('/tickets');
console.log('Tickets disponibles:', tickets);
```

#### "No tienes permiso"
**Causa:** Tu rol no puede realizar esa acción
**Solución:** Verifica que el usuario tiene el rol correcto

## 🚀 Despliegue a Producción

### Checklist

- [ ] Configurar variables de entorno en Supabase
- [ ] Actualizar URLs del proyecto
- [ ] Configurar servidor de emails para auth (opcional)
- [ ] Activar Row Level Security (RLS) en tablas
- [ ] Configurar dominios personalizados
- [ ] Implementar rate limiting
- [ ] Configurar backups automáticos
- [ ] Monitoreo y alertas

### Variables de Entorno

```bash
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

## 📈 Próximas Funcionalidades

### Planeadas

- [ ] **File uploads**: Adjuntar archivos/imágenes a tickets
- [ ] **Email notifications**: Notificar cuando se asigna/actualiza ticket
- [ ] **Push notifications**: Notificaciones en tiempo real
- [ ] **Advanced search**: Búsqueda full-text en tickets
- [ ] **Analytics**: Dashboard con métricas y KPIs
- [ ] **Export**: Exportar tickets a PDF/Excel
- [ ] **Audit log**: Registro completo de cambios
- [ ] **SLA tracking**: Seguimiento de tiempos de respuesta

### Migraciones Futuras

Si el proyecto crece, considera migrar a tablas PostgreSQL nativas:

```sql
-- Ejemplo de migración (no ejecutar ahora)
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  problem_type TEXT CHECK (problem_type IN ('internet', 'telefono', 'ambos')),
  priority TEXT CHECK (priority IN ('baja', 'media', 'alta', 'critica')),
  status TEXT DEFAULT 'pendiente',
  user_id UUID REFERENCES auth.users(id),
  assigned_expert_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Con Row Level Security
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus propios tickets"
ON tickets FOR SELECT
USING (auth.uid() = user_id);
```

## 🆘 Soporte

### Recursos

- 📖 [Documentación Supabase](https://supabase.com/docs)
- 💬 [Supabase Discord](https://discord.supabase.com)
- 🐛 [GitHub Issues](https://github.com/supabase/supabase/issues)

### Contacto

Para problemas específicos del proyecto, consulta:
- `/docs/database-structure.md` - Estructura detallada
- `/docs/quick-start.md` - Guía de inicio rápido
- `/docs/README-DATABASE.md` - Este archivo

---

**¡Feliz desarrollo! 🚀**
