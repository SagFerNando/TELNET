# ⚡ Inicio Rápido - 5 Minutos

## 🎯 Lo que vas a hacer

1. ✅ Configurar base de datos PostgreSQL (3 min)
2. ✅ Iniciar la aplicación (1 min)
3. ✅ Registrarte y crear tu primer ticket (1 min)

**Tiempo total: ~5 minutos**

---

## 📋 Paso 1: Base de Datos (3 minutos)

### 1.1 Abrir Supabase
1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto
3. Click en **"SQL Editor"** (menú izquierdo)

### 1.2 Ejecutar Migraciones

Abre `/docs/DATABASE-MIGRATIONS.md` en tu editor y:

#### Migración 1 (Tablas)
```sql
-- Copia y pega TODO el contenido de "Migración 1: Crear Tablas Base"
-- Click en "Run" (o Ctrl/Cmd + Enter)
```

#### Migración 2 (Seguridad)
```sql
-- Copia y pega TODO el contenido de "Migración 2: Row Level Security"
-- Click en "Run"
```

#### Migración 3 (Triggers)
```sql
-- Copia y pega TODO el contenido de "Migración 3: Triggers y Funciones"
-- Click en "Run"
```

#### Migración 4 (Funciones)
```sql
-- Copia y pega TODO el contenido de "Migración 4: Funciones de Utilidad"
-- Click en "Run"
```

### 1.3 Verificar ✅
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

Deberías ver 6 tablas: `experts`, `messages`, `operators`, `profiles`, `ticket_activities`, `tickets`

---

## 💻 Paso 2: Iniciar App (1 minuto)

```bash
# En tu terminal
npm install    # Solo la primera vez
npm run dev
```

Abre: `http://localhost:5173`

---

## 👤 Paso 3: Usar el Sistema (1 minuto)

### 3.1 Registrarte

1. Click en **"Regístrate aquí"**
2. Selecciona **"Usuario"**
3. Completa:
   ```
   Nombre: Tu nombre
   Email: tu@email.com
   Contraseña: test123
   Confirmar: test123
   ```
4. Click en **"Crear Cuenta"**
5. ✅ Entrarás automáticamente

### 3.2 Crear Primer Ticket

1. Click en **"Crear Nuevo Ticket"**
2. Completa:
   ```
   Título: Sin internet
   Descripción: El router tiene luz roja
   Tipo: Internet
   Prioridad: Alta
   Ubicación: Oficina 301
   ```
3. Click en **"Crear Ticket"**
4. ✅ Verás tu ticket en el dashboard

---

## 🎉 ¡Listo!

Ya tienes el sistema funcionando. Ahora puedes:

### Siguiente: Crear un Experto

1. Cierra sesión (botón arriba derecha)
2. Click en "Regístrate aquí"
3. Selecciona **"Experto Técnico"**
4. Completa campos básicos
5. Selecciona especializaciones (ej: Internet, Router)
6. Click en "Crear Cuenta"

### Siguiente: Crear un Operador

1. Cierra sesión
2. Click en "Regístrate aquí"
3. Selecciona **"Operador"**
4. Completa campos básicos
5. Selecciona turno (ej: Mañana)
6. Click en "Crear Cuenta"

### Probar Flujo Completo

1. **Como Operador**: Asigna el ticket al experto
2. **Como Experto**: Cambia estado a "En progreso"
3. **Como Experto**: Envía mensaje al usuario por chat
4. **Como Usuario**: Responde en el chat
5. **Como Experto**: Marca como "Resuelto"

---

## 🔍 Verificar en Supabase

1. Supabase Dashboard → **Table Editor**
2. Tabla **profiles**: Verás tus usuarios
3. Tabla **tickets**: Verás el ticket creado
4. Tabla **messages**: Verás los mensajes del chat

---

## ❓ ¿Problemas?

### "relation does not exist"
→ No ejecutaste las migraciones. Ve al Paso 1.

### "No autorizado"
→ Cierra sesión y vuelve a iniciar sesión.

### El formulario no muestra campos adicionales
→ Asegúrate de seleccionar "Experto" u "Operador" en el selector de rol.

---

## 📚 Siguiente Paso

Lee la documentación completa:
- **[SETUP-SQL.md](SETUP-SQL.md)** - Guía detallada
- **[NUEVAS-FUNCIONALIDADES.md](NUEVAS-FUNCIONALIDADES.md)** - Qué hay de nuevo
- **[docs/ARQUITECTURA.md](docs/ARQUITECTURA.md)** - Cómo funciona

---

**¡Sistema listo en 5 minutos! 🚀**
