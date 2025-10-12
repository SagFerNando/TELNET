# Guía de Inicio Rápido

## 🚀 Comenzar a Probar el Sistema

### Paso 1: Crear Usuarios de Prueba

Para probar el sistema completo, necesitas crear usuarios con diferentes roles. Aquí te muestro cómo hacerlo:

#### Opción A: Usando la consola del navegador

1. Abre tu aplicación en el navegador
2. Abre las DevTools (F12)
3. Ve a la pestaña Console
4. Ejecuta estos comandos:

```javascript
// Función auxiliar para crear usuarios
async function crearUsuario(email, password, name, role, specializations = []) {
  const projectId = 'TU_PROJECT_ID'; // Reemplazar con tu project ID
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-370afec0/auth/signup`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role, specializations })
    }
  );
  const data = await response.json();
  console.log(`✅ ${role} creado:`, data);
  return data;
}

// Crear usuarios de prueba
await crearUsuario('usuario@test.com', 'test123', 'Juan Pérez', 'usuario');
await crearUsuario('operador@test.com', 'test123', 'María García', 'operador');
await crearUsuario('experto1@test.com', 'test123', 'Carlos Técnico', 'experto', ['internet', 'router']);
await crearUsuario('experto2@test.com', 'test123', 'Ana Soporte', 'experto', ['telefono', 'voip']);
```

#### Opción B: Usando un archivo de inicialización

Crea un archivo `/utils/seed-data.ts` y ejecuta la función al cargar la app:

```typescript
import { fetchFromServer } from './supabase/client';

export async function seedTestUsers() {
  const users = [
    {
      email: 'usuario@test.com',
      password: 'test123',
      name: 'Juan Pérez',
      phone: '+34 600 123 456',
      role: 'usuario'
    },
    {
      email: 'operador@test.com',
      password: 'test123',
      name: 'María García',
      phone: '+34 600 234 567',
      role: 'operador'
    },
    {
      email: 'experto1@test.com',
      password: 'test123',
      name: 'Carlos Técnico',
      phone: '+34 600 345 678',
      role: 'experto',
      specializations: ['internet', 'router', 'fibra']
    },
    {
      email: 'experto2@test.com',
      password: 'test123',
      name: 'Ana Soporte',
      phone: '+34 600 456 789',
      role: 'experto',
      specializations: ['telefono', 'voip', 'centralita']
    }
  ];

  console.log('🌱 Creando usuarios de prueba...');

  for (const user of users) {
    try {
      await fetchFromServer('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(user)
      });
      console.log(`✅ Usuario ${user.role} creado: ${user.email}`);
    } catch (error) {
      console.log(`⚠️ Usuario ya existe o error: ${user.email}`, error);
    }
  }

  console.log('✅ Usuarios de prueba listos!');
}
```

### Paso 2: Iniciar Sesión

Una vez creados los usuarios, puedes iniciar sesión desde el frontend:

```typescript
import { createClient } from './utils/supabase/client';

async function login(email: string, password: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Error al iniciar sesión:', error);
    return null;
  }

  console.log('✅ Sesión iniciada:', data.user);
  return data.user;
}

// Ejemplo de uso
await login('usuario@test.com', 'test123');
```

### Paso 3: Flujo de Prueba Completo

#### 1. Como Usuario - Crear Ticket

```typescript
import { fetchFromServer } from './utils/supabase/client';

// Primero inicia sesión como usuario
await login('usuario@test.com', 'test123');

// Crear ticket
const ticket = await fetchFromServer('/tickets', {
  method: 'POST',
  body: JSON.stringify({
    title: 'Sin conexión a internet',
    description: 'Desde esta mañana no tengo conexión. El router tiene luz roja.',
    problemType: 'internet',
    priority: 'alta',
    location: 'Oficina Central - Planta 3',
    serviceProvider: 'Movistar'
  })
});

console.log('✅ Ticket creado:', ticket);
```

#### 2. Como Operador - Asignar Ticket

```typescript
// Cerrar sesión y entrar como operador
await supabase.auth.signOut();
await login('operador@test.com', 'test123');

// Obtener expertos disponibles
const { experts } = await fetchFromServer('/experts');
console.log('Expertos disponibles:', experts);

// Asignar ticket al experto de internet
const expertoInternet = experts.find(e => 
  e.specializations.includes('internet')
);

await fetchFromServer(`/tickets/${ticket.ticket.id}/assign`, {
  method: 'POST',
  body: JSON.stringify({
    expertId: expertoInternet.id
  })
});

console.log('✅ Ticket asignado a experto');
```

#### 3. Como Experto - Resolver Ticket

```typescript
// Cerrar sesión y entrar como experto
await supabase.auth.signOut();
await login('experto1@test.com', 'test123');

// Ver tickets asignados
const { tickets } = await fetchFromServer('/tickets');
console.log('Mis tickets:', tickets);

// Cambiar estado a "en progreso"
await fetchFromServer(`/tickets/${ticket.ticket.id}/status`, {
  method: 'PUT',
  body: JSON.stringify({
    status: 'en_progreso'
  })
});

// Enviar mensaje al usuario
await fetchFromServer('/messages', {
  method: 'POST',
  body: JSON.stringify({
    ticketId: ticket.ticket.id,
    content: 'Hola, estoy revisando tu caso. ¿Has intentado reiniciar el router?'
  })
});

console.log('✅ Mensaje enviado');
```

### Paso 4: Testing de Chat en Tiempo Real

Para probar el chat, abre dos ventanas del navegador:

**Ventana 1 - Experto:**
```typescript
// Login como experto
await login('experto1@test.com', 'test123');

// En el componente, usa el hook de mensajes
import { useTicketMessages, useSendMessage } from './utils/supabase/realtime';

const { messages } = useTicketMessages(ticketId);
const { sendMessage } = useSendMessage();

await sendMessage(ticketId, 'Mensaje del experto');
```

**Ventana 2 - Usuario:**
```typescript
// Login como usuario
await login('usuario@test.com', 'test123');

// Usar el mismo hook
const { messages } = useTicketMessages(ticketId);
const { sendMessage } = useSendMessage();

await sendMessage(ticketId, 'Respuesta del usuario');
```

Ambas ventanas deberían ver los mensajes en tiempo real.

## 🔍 Verificar que Todo Funciona

### Test de Conexión al Servidor

```javascript
const projectId = 'TU_PROJECT_ID';
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-370afec0/health`
);
const data = await response.json();
console.log('Estado del servidor:', data); // Debería mostrar { status: "ok" }
```

### Test de Autenticación

```javascript
import { createClient } from './utils/supabase/client';

const supabase = createClient();

// Verificar sesión actual
const { data: { session } } = await supabase.auth.getSession();
console.log('Sesión actual:', session);

// Si hay sesión, obtener datos del usuario
if (session) {
  const userInfo = await fetchFromServer('/auth/me');
  console.log('Info del usuario:', userInfo);
}
```

### Test de Estadísticas

```javascript
// Obtener stats del usuario actual
const stats = await fetchFromServer('/stats');
console.log('Estadísticas:', stats);
```

## 📊 Datos de Ejemplo

Si quieres poblar la base de datos con datos de ejemplo más completos:

```typescript
export async function seedCompleteData() {
  // Crear usuarios
  await seedTestUsers();

  // Login como usuario y crear múltiples tickets
  await login('usuario@test.com', 'test123');

  const ticketsData = [
    {
      title: 'Internet muy lento',
      description: 'La conexión está muy lenta desde hace 2 días',
      problemType: 'internet',
      priority: 'media',
      location: 'Oficina Norte'
    },
    {
      title: 'No funciona el teléfono fijo',
      description: 'Al descolgar no hay tono, línea muerta',
      problemType: 'telefono',
      priority: 'alta',
      location: 'Recepción'
    },
    {
      title: 'Cortes intermitentes',
      description: 'Tanto internet como teléfono se cortan cada 10 minutos',
      problemType: 'ambos',
      priority: 'critica',
      location: 'Oficina Central'
    }
  ];

  for (const ticketData of ticketsData) {
    await fetchFromServer('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData)
    });
  }

  console.log('✅ Datos de ejemplo creados');
}
```

## 🐛 Debugging

### Ver logs del servidor

Los logs del servidor Supabase se pueden ver en:
1. Dashboard de Supabase
2. Edge Functions → Logs
3. Selecciona la función `make-server-370afec0`

### Errores comunes

**Error: "No autorizado"**
- Verifica que hayas iniciado sesión
- Comprueba que el token de acceso es válido
- Revisa que el rol del usuario tiene permisos para esa acción

**Error: "Ticket no encontrado"**
- Verifica que el ID del ticket existe
- Usa `/tickets` para listar todos los tickets disponibles

**Error: "No hay sesión activa"**
- Ejecuta `await login(email, password)` primero
- Verifica que la sesión se guardó correctamente

### Herramientas útiles

**Ver todos los datos en KV Store:**
```typescript
// En el servidor, podrías agregar un endpoint de debug (solo desarrollo)
app.get("/make-server-370afec0/debug/all-data", async (c) => {
  const allTickets = await kv.get("all_tickets");
  const tickets = await Promise.all(
    (allTickets || []).map(id => kv.get(`ticket:${id}`))
  );
  
  return c.json({ tickets });
});
```

## 🎯 Checklist de Testing

- [ ] Crear usuarios con los 3 roles
- [ ] Iniciar sesión con cada usuario
- [ ] Crear ticket como usuario
- [ ] Ver ticket en dashboard de operador
- [ ] Asignar ticket a experto
- [ ] Ver ticket asignado en dashboard de experto
- [ ] Cambiar estado del ticket
- [ ] Enviar mensajes en el chat
- [ ] Verificar actualización en tiempo real
- [ ] Cerrar ticket
- [ ] Verificar estadísticas actualizadas

## 📚 Próximos Pasos

Una vez que hayas probado todo lo anterior:

1. **Personalizar la UI**: Ajusta los dashboards según tus necesidades
2. **Agregar validaciones**: Añade más validaciones en formularios
3. **Mejorar el chat**: Agregar indicadores de "escribiendo...", archivos adjuntos
4. **Notificaciones**: Implementar notificaciones push o email
5. **Analytics**: Crear dashboards con gráficos y métricas
6. **Mobile**: Hacer la app responsive para móviles

¡Listo para empezar! 🚀
