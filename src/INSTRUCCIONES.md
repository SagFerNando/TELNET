# 🚀 INSTRUCCIONES RÁPIDAS - Sistema de Tickets

## ⚡ INICIO EN 3 PASOS

### 1️⃣ Abre la aplicación
```bash
npm install
npm run dev
```

### 2️⃣ Configura la base de datos
- Al abrir la app verás la pantalla de "Configuración de Base de Datos"
- Click en **"Configuración Completa (Recomendado)"**
- Espera 10-15 segundos
- ✅ ¡Listo!

### 3️⃣ Inicia sesión
Usa cualquiera de estos usuarios:

```
👤 USUARIO
usuario@test.com / test123

⚙️ OPERADOR
operador@test.com / test123

🔧 EXPERTO
experto1@test.com / test123
```

---

## 🎯 FLUJO DE PRUEBA COMPLETO

### Paso 1: Como Usuario
1. Inicia sesión: `usuario@test.com` / `test123`
2. Click "Crear Nuevo Ticket"
3. Completa el formulario:
   - Título: "Sin conexión a internet"
   - Descripción: "El router tiene luz roja"
   - Tipo: Internet
   - Prioridad: Alta
4. Click "Crear Ticket"
5. **Copia el ID del ticket** (lo necesitarás después)

### Paso 2: Como Operador
1. Click "Salir" (botón arriba derecha)
2. Inicia sesión: `operador@test.com` / `test123`
3. Verás el ticket creado en "Tickets Pendientes"
4. Click en el ticket → "Asignar a Experto"
5. Selecciona "Carlos Técnico" (especialista en internet)
6. Click "Asignar Ticket"

### Paso 3: Como Experto
1. Click "Salir"
2. Inicia sesión: `experto1@test.com` / `test123`
3. Verás el ticket en "Tickets Asignados"
4. Abre el ticket
5. Cambia estado a "En Progreso"
6. Usa el chat para enviar mensaje al usuario
7. Cuando termines, cambia estado a "Resuelto"

### Paso 4: Chat en Tiempo Real (BONUS)
1. Abre dos ventanas/pestañas del navegador
2. **Ventana 1**: Login como `usuario@test.com`
3. **Ventana 2**: Login como `experto1@test.com`
4. Ambas ventanas: Abre el mismo ticket
5. Envía mensajes desde ambas ventanas
6. **¡Verás los mensajes aparecer en tiempo real!** ✨

---

## 📊 ESTRUCTURA DE LA BASE DE DATOS

```
Usuarios de Prueba Creados:
├── 👤 usuario@test.com (Rol: Usuario)
├── 👤 usuario2@test.com (Rol: Usuario)
├── ⚙️ operador@test.com (Rol: Operador)
├── 🔧 experto1@test.com (Rol: Experto - Internet)
├── 🔧 experto2@test.com (Rol: Experto - Teléfono)
└── 🔧 experto3@test.com (Rol: Experto - Ambos)

Tickets de Ejemplo (5):
├── Internet muy lento
├── Teléfono sin tono
├── Cortes intermitentes
├── WiFi sin conexión
└── Llamadas con ruido
```

---

## 🔧 COMANDOS ÚTILES

### En la Consola del Navegador (F12)

```javascript
// Ver usuario actual
import { getCurrentUser } from './utils/supabase/client';
const user = await getCurrentUser();
console.log(user);

// Crear más usuarios de prueba
await seedTestUsers();

// Crear tickets de ejemplo (requiere estar logueado)
await seedTestTickets();

// Ver todos los tickets
import { getTickets } from './utils/api';
const tickets = await getTickets();
console.log(tickets);

// Ver expertos disponibles
import { getExperts } from './utils/api';
const experts = await getExperts();
console.log(experts);

// Verificar que el servidor funciona
fetch('https://kdhumybrhxpaehnyaymx.supabase.co/functions/v1/make-server-370afec0/health')
  .then(r => r.json())
  .then(console.log);
```

---

## 📁 ARCHIVOS IMPORTANTES

```
📄 SETUP.md                     # Guía completa de setup
📄 /docs/README-DATABASE.md     # Documentación de la BD
📄 /docs/quick-start.md         # Guía paso a paso
📄 /docs/database-structure.md  # Estructura técnica

🔥 BACKEND:
📄 /supabase/functions/server/index.tsx  # API Server

🎨 FRONTEND:
📄 /App.tsx                              # Entrada principal
📄 /components/AppWithAuth.tsx           # App con auth
📄 /components/auth/AuthProvider.tsx     # Contexto auth
📄 /components/setup/DatabaseSetup.tsx   # Setup inicial

🛠️ UTILS:
📄 /utils/api.ts                         # Funciones API
📄 /utils/supabase/client.tsx            # Cliente Supabase
📄 /utils/supabase/realtime.tsx          # Hooks realtime
📄 /utils/seed-data.ts                   # Datos de prueba
```

---

## ❓ PROBLEMAS COMUNES

### "No autorizado"
→ Inicia sesión primero
```javascript
import { createClient } from './utils/supabase/client';
const supabase = createClient();
await supabase.auth.signInWithPassword({
  email: 'usuario@test.com',
  password: 'test123'
});
```

### "Servidor no responde"
→ Verifica que Supabase está activo
```javascript
fetch('https://kdhumybrhxpaehnyaymx.supabase.co/functions/v1/make-server-370afec0/health')
  .then(r => r.json())
  .then(d => console.log('Server:', d));
```

### "No aparecen los tickets"
→ Verifica que creaste los datos de prueba
```javascript
await seedTestUsers();  // Primero usuarios
// Luego inicia sesión con usuario@test.com
await seedTestTickets();  // Después tickets
```

### "El chat no funciona"
→ Asegúrate de que:
1. Estés logueado
2. El ticket tenga mensajes
3. Ambos usuarios estén viendo el mismo ticket

---

## 🎨 PERSONALIZACIÓN

### Cambiar colores
Edita `/styles/globals.css`:
```css
--primary: ...
--secondary: ...
```

### Agregar más expertos
```javascript
import { fetchFromServer } from './utils/supabase/client';

await fetchFromServer('/auth/signup', {
  method: 'POST',
  body: JSON.stringify({
    email: 'nuevo-experto@test.com',
    password: 'password',
    name: 'Nombre del Experto',
    phone: '+34 600 000 000',
    role: 'experto',
    specializations: ['internet', 'router', 'fibra']
  })
});
```

### Cambiar usuarios de prueba
Edita `/utils/seed-data.ts` y modifica el array `users`

---

## 📞 SOPORTE

### Logs del servidor
1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Edge Functions → make-server-370afec0
4. Ver logs

### Logs del frontend
1. Abre DevTools (F12)
2. Tab "Console"
3. Verás todos los logs de la aplicación

### Reiniciar base de datos
```javascript
// ADVERTENCIA: Esto borra todo
localStorage.removeItem('setupCompleted');
// Luego recarga la página y vuelve a ejecutar el setup
```

---

## ✅ CHECKLIST DE FUNCIONALIDADES

- [ ] ✅ Inicializar base de datos
- [ ] ✅ Crear usuarios de prueba
- [ ] ✅ Login con diferentes roles
- [ ] ✅ Crear ticket como usuario
- [ ] ✅ Ver tickets en dashboard de operador
- [ ] ✅ Asignar ticket a experto
- [ ] ✅ Ver ticket asignado en dashboard de experto
- [ ] ✅ Cambiar estado del ticket
- [ ] ✅ Enviar mensajes en el chat
- [ ] ✅ Probar chat en tiempo real (2 ventanas)
- [ ] ✅ Cerrar ticket
- [ ] ✅ Ver estadísticas actualizadas

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Completar el checklist de arriba
2. 📖 Leer la documentación completa en `/docs/`
3. 🎨 Personalizar la interfaz según tus necesidades
4. 🚀 Agregar funcionalidades adicionales
5. 🌐 Desplegar a producción

---

**¡Listo para comenzar! 🚀**

Cualquier duda, revisa:
- `SETUP.md` para configuración completa
- `/docs/README-DATABASE.md` para documentación técnica
- `/docs/quick-start.md` para ejemplos de código
