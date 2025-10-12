# 🚀 Setup Completo con PostgreSQL

## 🎯 Descripción

Sistema de tickets con:
- ✅ **Autenticación obligatoria** con login y registro
- ✅ **Formularios personalizados** según el rol (usuario/operador/experto)
- ✅ **Base de datos PostgreSQL** con tablas relacionadas y RLS
- ✅ **Validación de datos** completa en frontend y backend
- ✅ **Seguridad por roles** con políticas RLS automáticas

## 📋 Requisitos Previos

1. Cuenta en [Supabase](https://supabase.com)
2. Node.js 18+ instalado
3. Este proyecto clonado

## 🗄️ Paso 1: Configurar Base de Datos

### 1.1 Acceder a Supabase Dashboard

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto
3. Click en **SQL Editor** (menú izquierdo)

### 1.2 Ejecutar Migraciones SQL

Abre el archivo `/docs/DATABASE-MIGRATIONS.md` y ejecuta cada migración en orden:

#### Migración 1: Crear Tablas Base

```sql
-- Copia y pega el contenido de "Migración 1" del archivo
-- Esto creará las tablas: profiles, experts, operators, tickets, messages, ticket_activities
```

Click en **"Run"** (o Ctrl/Cmd + Enter)

#### Migración 2: Row Level Security (RLS)

```sql
-- Copia y pega el contenido de "Migración 2" del archivo
-- Esto habilitará las políticas de seguridad por rol
```

Click en **"Run"**

#### Migración 3: Triggers y Funciones

```sql
-- Copia y pega el contenido de "Migración 3" del archivo
-- Esto creará triggers automáticos y funciones auxiliares
```

Click en **"Run"**

#### Migración 4: Funciones de Utilidad

```sql
-- Copia y pega el contenido de "Migración 4" del archivo
-- Esto creará la función get_user_stats()
```

Click en **"Run"**

### 1.3 Verificar Migraciones

Ejecuta en SQL Editor:

```sql
-- Ver tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Deberías ver 6 tablas:
- ✅ experts
- ✅ messages
- ✅ operators
- ✅ profiles
- ✅ ticket_activities
- ✅ tickets

## 💻 Paso 2: Instalar y Ejecutar el Proyecto

### 2.1 Instalar Dependencias

```bash
npm install
```

### 2.2 Iniciar Servidor de Desarrollo

```bash
npm run dev
```

### 2.3 Abrir en el Navegador

```
http://localhost:5173
```

## 👤 Paso 3: Crear tu Primera Cuenta

### 3.1 Registro de Usuario Normal

1. En la pantalla de login, click en **"Regístrate aquí"**
2. Selecciona **"Usuario"** como tipo
3. Completa:
   - Nombre completo
   - Email
   - Teléfono (opcional para usuarios)
   - Contraseña (mínimo 6 caracteres)
   - Confirmar contraseña
4. Click en **"Crear Cuenta"**
5. ✅ Serás redirigido automáticamente al dashboard

### 3.2 Registro de Experto Técnico

Para registrar un experto:

1. Cierra sesión (si estás logueado)
2. Click en **"Regístrate aquí"**
3. Selecciona **"Experto Técnico"**
4. Completa los campos básicos +  adicionales:
   - ✅ **Especializaciones** (selecciona al menos una):
     - Internet, Router, Fibra Óptica, ADSL
     - Teléfono Fijo, VoIP, Centralita, RDSI
     - Cableado, Redes
   - Años de experiencia (opcional)
   - Departamento (opcional)
   - Certificaciones (opcional, separadas por comas)
5. Click en **"Crear Cuenta"**

### 3.3 Registro de Operador

Para registrar un operador:

1. Click en **"Regístrate aquí"**
2. Selecciona **"Operador"**
3. Completa los campos básicos + adicionales:
   - ✅ **Turno** (obligatorio):
     - Mañana (8:00 - 16:00)
     - Tarde (16:00 - 24:00)
     - Noche (24:00 - 8:00)
     - Rotativo
   - Departamento (opcional)
4. Click en **"Crear Cuenta"**

## 🎮 Paso 4: Probar el Sistema

### Como Usuario

1. Inicia sesión con tu cuenta de usuario
2. Dashboard mostrará tus tickets
3. Click en **"Crear Nuevo Ticket"**
4. Completa el formulario:
   - Título: "Sin conexión a internet"
   - Descripción: "Router con luz roja"
   - Tipo: Internet
   - Prioridad: Alta
   - Ubicación: "Oficina 301"
5. Click en **"Crear Ticket"**
6. ✅ Verás tu ticket en el dashboard

### Como Operador

1. Cierra sesión
2. Inicia sesión con cuenta de operador
3. Verás todos los tickets del sistema
4. Click en un ticket pendiente
5. Click en **"Asignar a Experto"**
6. Selecciona un experto de la lista
7. Click en **"Asignar Ticket"**
8. ✅ Ticket cambia a estado "Asignado"

### Como Experto

1. Cierra sesión
2. Inicia sesión con cuenta de experto
3. Verás solo tus tickets asignados
4. Click en un ticket
5. Cambia estado a **"En Progreso"**
6. Usa el chat para comunicarte con el usuario
7. Cuando termines, cambia a **"Resuelto"**
8. ✅ Ticket marcado como resuelto

## 🔍 Paso 5: Verificar en Supabase

### Ver Usuarios Registrados

1. Supabase Dashboard → **Table Editor**
2. Selecciona tabla **"profiles"**
3. Verás todos los usuarios con sus roles

### Ver Tickets

1. Tabla **"tickets"**
2. Verás todos los tickets con:
   - Estado actual
   - Usuario que reportó
   - Experto asignado (si aplica)
   - Timestamps de creación/actualización

### Ver Expertos

1. Tabla **"experts"**
2. Verás especializa ciones y contadores:
   - `active_tickets` (actualizado automáticamente)
   - `total_resolved` (actualizado automáticamente)

### Ver Mensajes del Chat

1. Tabla **"messages"**
2. Verás todos los mensajes con:
   - Contenido
   - Emisor (usuario o experto)
   - Timestamp

## 🛠️ Configuración Avanzada

### Verificar Health Check

```javascript
// En consola del navegador (F12)
const response = await fetch(
  'https://kdhumybrhxpaehnyaymx.supabase.co/functions/v1/make-server-370afec0/health'
);
const data = await response.json();
console.log(data);
// Debe mostrar: { status: "ok", database: "PostgreSQL" }
```

### Crear Múltiples Usuarios de Prueba

```javascript
// Array de usuarios para crear
const testUsers = [
  {
    email: 'juan@test.com',
    password: 'test123',
    name: 'Juan Pérez',
    phone: '+34 600 111 111',
    role: 'usuario'
  },
  {
    email: 'experto.internet@test.com',
    password: 'test123',
    name: 'Carlos Técnico',
    phone: '+34 600 222 222',
    role: 'experto',
    specializations: ['Internet', 'Router', 'Fibra Óptica'],
    experienceYears: 5,
    department: 'Soporte Técnico'
  },
  {
    email: 'operador@test.com',
    password: 'test123',
    name: 'María Gestora',
    phone: '+34 600 333 333',
    role: 'operador',
    shift: 'mañana',
    department: 'Gestión de Incidencias'
  }
];

// Función para registrar usuarios
async function createTestUsers() {
  for (const user of testUsers) {
    try {
      const response = await fetch(
        'https://kdhumybrhxpaehnyaymx.supabase.co/functions/v1/make-server-370afec0/auth/signup',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        }
      );
      const data = await response.json();
      console.log(`✅ Usuario creado: ${user.email}`);
    } catch (error) {
      console.log(`❌ Error: ${user.email}`, error);
    }
  }
}

// Ejecutar
await createTestUsers();
```

### Ver Estadísticas

```javascript
// Obtener stats del usuario actual
import { getStats } from './utils/api';
const stats = await getStats();
console.log('Estadísticas:', stats);
```

## 🔒 Seguridad

### Políticas RLS Activas

El sistema tiene políticas de seguridad automáticas:

- **Usuarios**: Solo ven sus propios tickets y mensajes
- **Expertos**: Solo ven tickets asignados a ellos y sus mensajes
- **Operadores**: Ven todos los tickets y pueden asignarlos

### Probar Seguridad

```javascript
// Intentar acceder a ticket de otro usuario
// (debe fallar con "No autorizado")
import { getTicket } from './utils/api';
await getTicket('uuid-de-otro-usuario');
```

## 📊 Esquema de Base de Datos

```
auth.users (Supabase Auth)
    ↓
profiles (Datos básicos)
    ├→ experts (Si rol = 'experto')
    └→ operators (Si rol = 'operador')

tickets (Casos reportados)
    ├→ messages (Chat)
    └→ ticket_activities (Historial)
```

## 🐛 Problemas Comunes

### "Tabla no existe"
**Solución**: Ejecuta todas las migraciones SQL en orden

### "No autorizado" al crear ticket
**Solución**: Asegúrate de estar logueado. Verifica el token en consola:
```javascript
import { getCurrentUser } from './utils/supabase/client';
const user = await getCurrentUser();
console.log(user);
```

### Los contadores no se actualizan
**Solución**: Verifica que ejecutaste Migración 3 (Triggers)

### El formulario de registro no muestra campos adicionales
**Solución**: Selecciona el rol "Experto" o "Operador" primero

## 📚 Documentación Adicional

- 📖 `/docs/DATABASE-MIGRATIONS.md` - Migraciones SQL completas
- 🔄 `/docs/MIGRATION-GUIDE.md` - Guía de migración KV → SQL
- 🏗️ `/docs/ARQUITECTURA.md` - Arquitectura del sistema
- 📘 `/docs/README-DATABASE.md` - API completa

## ✅ Checklist de Setup

- [ ] Ejecutar Migración 1 (Tablas)
- [ ] Ejecutar Migración 2 (RLS)
- [ ] Ejecutar Migración 3 (Triggers)
- [ ] Ejecutar Migración 4 (Funciones)
- [ ] Verificar tablas en Table Editor
- [ ] Ejecutar `npm install`
- [ ] Ejecutar `npm run dev`
- [ ] Registrar usuario de prueba
- [ ] Registrar experto de prueba
- [ ] Registrar operador de prueba
- [ ] Crear ticket como usuario
- [ ] Asignar ticket como operador
- [ ] Resolver ticket como experto
- [ ] Probar chat en tiempo real
- [ ] Verificar datos en Supabase Dashboard

## 🎉 ¡Listo!

Tu sistema de tickets con PostgreSQL está completamente funcional y listo para usar.

**Próximos pasos**:
1. Personalizar la interfaz
2. Agregar más especializaciones
3. Configurar notificaciones
4. Desplegar a producción

---

**¿Preguntas?** Consulta la documentación en `/docs/` 📚
