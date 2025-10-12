# 🚀 Setup Rápido - Sistema de Tickets

## ✅ Estado Actual

Tu sistema de tickets está **COMPLETAMENTE CONFIGURADO** con:

- ✅ Base de datos Supabase conectada
- ✅ Servidor backend funcionando (Edge Functions)
- ✅ Sistema de autenticación con roles
- ✅ Chat en tiempo real implementado
- ✅ API REST completa
- ✅ Utilidades y helpers listos

## 📋 Pasos para Comenzar

### 1️⃣ Inicializar la Base de Datos (OBLIGATORIO - Solo una vez)

La aplicación te mostrará automáticamente una pantalla de configuración inicial.

**Opción A: Interfaz Visual (Recomendado)**
1. Abre la aplicación en tu navegador
2. Verás la pantalla "Configuración de Base de Datos"
3. Click en **"Configuración Completa (Recomendado)"**
4. Espera a que termine (crea usuarios y tickets de prueba)
5. ¡Listo!

**Opción B: Consola del Navegador**
```javascript
// Abre DevTools (F12) y ejecuta:
await seedAll();
```

### 2️⃣ Iniciar Sesión

Usa cualquiera de estos usuarios creados automáticamente:

```
👤 USUARIO
Email: usuario@test.com
Password: test123
Puede: Crear tickets, ver sus tickets, chatear con expertos

⚙️ OPERADOR  
Email: operador@test.com
Password: test123
Puede: Ver todos los tickets, asignar a expertos, monitorear

🔧 EXPERTO (Internet)
Email: experto1@test.com
Password: test123
Puede: Ver tickets asignados, resolver, chatear con usuarios

🔧 EXPERTO (Teléfono)
Email: experto2@test.com
Password: test123
Puede: Ver tickets asignados, resolver, chatear con usuarios
```

### 3️⃣ Probar el Flujo Completo

#### Como Usuario:
1. Inicia sesión con `usuario@test.com`
2. Click en "Crear Nuevo Ticket"
3. Completa el formulario
4. Ve el ticket en tu dashboard

#### Como Operador:
1. Cambia a sesión con `operador@test.com`
2. Ve todos los tickets pendientes
3. Asigna un ticket a un experto
4. Monitorea el progreso

#### Como Experto:
1. Cambia a sesión con `experto1@test.com`
2. Ve tus tickets asignados
3. Abre un ticket y cambia estado a "En Progreso"
4. Usa el chat para comunicarte con el usuario

## 📁 Estructura del Proyecto

```
/
├── 📄 App.tsx                          # Componente principal
├── 📁 components/
│   ├── 📁 auth/
│   │   ├── AuthProvider.tsx            # Contexto de autenticación
│   │   └── LoginForm.tsx               # Formulario de login
│   ├── 📁 dashboard/
│   │   ├── UserDashboard.tsx           # Dashboard para usuarios
│   │   ├── OperatorDashboard.tsx       # Dashboard para operadores
│   │   └── ExpertDashboard.tsx         # Dashboard para expertos
│   ├── 📁 user/
│   │   └── CreateTicketForm.tsx        # Formulario de creación
│   ├── 📁 operator/
│   │   └── AssignTicketDialog.tsx      # Diálogo de asignación
│   ├── 📁 expert/
│   │   └── TicketChat.tsx              # Chat experto-usuario
│   ├── 📁 setup/
│   │   └── DatabaseSetup.tsx           # Configuración inicial
│   └── 📁 shared/
│       └── TicketCard.tsx              # Componente de ticket
├── 📁 supabase/
│   └── 📁 functions/
│       └── 📁 server/
│           ├── index.tsx               # 🔥 API Server (Hono)
│           └── kv_store.tsx            # Utilidades KV Store
├── 📁 utils/
│   ├── 📁 supabase/
│   │   ├── client.tsx                  # Cliente Supabase
│   │   ├── realtime.tsx                # Hooks de realtime
│   │   └── info.tsx                    # Credenciales (auto)
│   ├── api.ts                          # Funciones API
│   └── seed-data.ts                    # Datos de prueba
├── 📁 docs/
│   ├── database-structure.md           # Estructura de BD
│   ├── quick-start.md                  # Guía rápida
│   └── README-DATABASE.md              # Documentación completa
└── 📁 types/
    └── index.ts                        # TypeScript types
```

## 🔌 API Endpoints Disponibles

### Autenticación
- `POST /auth/signup` - Registrar usuario
- `GET /auth/me` - Obtener usuario actual

### Tickets
- `POST /tickets` - Crear ticket
- `GET /tickets` - Listar tickets (con filtros)
- `GET /tickets/:id` - Obtener ticket
- `POST /tickets/:id/assign` - Asignar a experto
- `PUT /tickets/:id/status` - Actualizar estado
- `GET /tickets/:id/activities` - Ver historial

### Mensajes
- `POST /messages` - Enviar mensaje
- `GET /messages/:ticketId` - Obtener mensajes

### Otros
- `GET /experts` - Listar expertos
- `GET /stats` - Estadísticas del dashboard

## 🛠️ Utilidades Disponibles

### Hooks de React

```typescript
// Autenticación
import { useAuth } from './components/auth/AuthProvider';
const { user, signIn, signOut, loading } = useAuth();

// Mensajes en tiempo real
import { useTicketMessages, useSendMessage } from './utils/supabase/realtime';
const { messages, loading } = useTicketMessages(ticketId);
const { sendMessage, sending } = useSendMessage();
```

### Funciones API

```typescript
import {
  createTicket,
  getTickets,
  assignTicket,
  updateTicketStatus,
  sendMessage,
  getExperts,
  getStats
} from './utils/api';

// Ejemplo: Crear ticket
const ticket = await createTicket({
  title: 'Problema de conexión',
  description: 'Detalles...',
  problemType: 'internet',
  priority: 'alta',
  location: 'Oficina'
});
```

## 🔍 Testing y Debug

### Verificar que todo funciona

Abre DevTools (F12) y ejecuta:

```javascript
// 1. Verificar servidor
fetch('https://kdhumybrhxpaehnyaymx.supabase.co/functions/v1/make-server-370afec0/health')
  .then(r => r.json())
  .then(console.log); // Debe mostrar: { status: "ok" }

// 2. Verificar sesión
import { getCurrentUser } from './utils/supabase/client';
const user = await getCurrentUser();
console.log('Usuario actual:', user);

// 3. Obtener tickets
import { getTickets } from './utils/api';
const tickets = await getTickets();
console.log('Tickets:', tickets);
```

### Funciones globales disponibles

```javascript
// Crear usuarios de prueba
await seedTestUsers();

// Crear tickets de prueba (requiere login)
await seedTestTickets();

// Hacer todo
await seedAll();
```

## 📚 Documentación

- 📖 **[database-structure.md](/docs/database-structure.md)** - Estructura completa de datos
- 🚀 **[quick-start.md](/docs/quick-start.md)** - Guía paso a paso
- 📘 **[README-DATABASE.md](/docs/README-DATABASE.md)** - Documentación completa

## ⚡ Características Principales

### ✅ Sistema de Roles
- **Usuario**: Crea y consulta sus tickets
- **Operador**: Gestiona y asigna tickets
- **Experto**: Resuelve tickets según especialización

### ✅ Gestión de Tickets
- Creación con formulario completo
- Filtros por estado, prioridad, tipo
- Asignación inteligente según especialización
- Historial de actividades
- Estados: Pendiente → Asignado → En Progreso → Resuelto → Cerrado

### ✅ Chat en Tiempo Real
- Comunicación directa experto-usuario
- Actualización automática de mensajes
- Historial completo de conversación

### ✅ Dashboards Personalizados
- Estadísticas en tiempo real
- Filtros y búsqueda
- Vistas específicas por rol

## 🎯 Próximos Pasos

1. **Personaliza la UI**: Ajusta colores, textos, logos
2. **Agrega validaciones**: Mejora las validaciones de formularios
3. **Implementa notificaciones**: Email/Push cuando hay cambios
4. **Añade analytics**: Gráficos y métricas avanzadas
5. **Mejora el chat**: Archivos adjuntos, emojis, typing indicators

## ❓ Preguntas Frecuentes

**P: ¿Puedo cambiar los usuarios de prueba?**
R: Sí, edita `/utils/seed-data.ts` y vuelve a ejecutar `seedTestUsers()`

**P: ¿Cómo agrego más expertos?**
R: Usa el endpoint `/auth/signup` con role='experto' y define specializations

**P: ¿Los datos persisten al recargar?**
R: Sí, todo se guarda en Supabase y persiste entre sesiones

**P: ¿Puedo usar en producción?**
R: Sí, pero configura correctamente las variables de entorno y seguridad

**P: ¿Necesito configurar algo más?**
R: No, todo está listo. Solo ejecuta la configuración inicial una vez.

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs del navegador (F12 → Console)
2. Verifica los logs del servidor en Supabase Dashboard
3. Consulta la documentación en `/docs/`
4. Ejecuta health check: `fetch('.../health')`

---

## 🎉 ¡Todo Listo!

Tu sistema de tickets está completamente funcional y listo para usar.

**Siguiente paso:** Ejecuta la configuración inicial y comienza a probar todas las funcionalidades.

**¡Feliz desarrollo! 🚀**
