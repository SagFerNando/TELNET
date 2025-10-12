# 🚀 Activar Sistema con Datos Reales

## ✅ Estado Actual

**TODO está listo para funcionar con datos reales:**
- ✅ Backend actualizado con SQL normalizado
- ✅ Dashboards conectados a la API real
- ✅ Formularios enviando datos a Supabase
- ✅ Componentes mostrando datos desde la base de datos

## 📋 Pasos para Activar

### 1. Ejecutar Migración SQL (PRIMERO)

```bash
1. Abre Supabase Dashboard: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a SQL Editor (menú izquierdo)
4. Abre el archivo: /MIGRACION-NORMALIZADA.sql
5. Copia TODO el contenido
6. Pégalo en SQL Editor
7. Click en "Run"
```

**Esto creará:**
- ✅ Campo `city` en `profiles`
- ✅ Campos `city` y `address` en `tickets`
- ✅ Vista `tickets_with_details` (normalizada)
- ✅ Tipos de problemas expandidos (18 tipos)

### 2. Verificar Migración

Ejecuta en SQL Editor:

```sql
-- Verificar estructura de tickets
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'tickets'
ORDER BY ordinal_position;

-- Verificar vista existe
SELECT * FROM tickets_with_details LIMIT 1;

-- Debería mostrar: city, address
-- NO debería mostrar: user_name, user_email (eliminados)
```

### 3. Iniciar la Aplicación

```bash
npm run dev
```

La app abrirá en `http://localhost:5173`

## 🧪 Probar el Sistema

### Paso 1: Registrar Usuario

1. Click en **"Regístrate aquí"**
2. Selecciona tipo: **Usuario**
3. Completa:
   - Nombre: Juan Pérez
   - Email: juan@test.com
   - Teléfono: +34 600 111 111
   - **Ciudad: Madrid** (nuevo campo)
   - Contraseña: test123
4. Click en **"Crear Cuenta"**

✅ **Resultado**: Redirige automáticamente al dashboard de usuario

### Paso 2: Crear Primer Ticket

1. Click en **"Nuevo Ticket"**
2. Completa:
   - Título: Router sin conexión
   - Descripción: El router no enciende desde ayer
   - **Tipo: Router - No enciende** (nuevo, 18 opciones)
   - Prioridad: Alta
   - **Ciudad: Madrid** (obligatorio, ciudad del problema)
   - **Dirección: Calle Gran Vía 28, 3º A** (obligatorio)
   - Proveedor: Movistar (opcional)
3. Click en **"Crear Ticket"**

✅ **Resultado**: Ticket creado, aparece en el dashboard

### Paso 3: Registrar Operador

1. **Cerrar sesión** (menú superior)
2. Click en **"Regístrate aquí"**
3. Selecciona tipo: **Operador**
4. Completa:
   - Nombre: María Gestora
   - Email: maria@test.com
   - Teléfono: +34 600 222 222 (obligatorio)
   - **Ciudad: Madrid**
   - **Turno: Mañana** (obligatorio)
   - Contraseña: test123
5. Click en **"Crear Cuenta"**

✅ **Resultado**: Dashboard de operador con TODOS los tickets

### Paso 4: Registrar Experto

1. **Cerrar sesión**
2. Click en **"Regístrate aquí"**
3. Selecciona tipo: **Experto Técnico**
4. Completa:
   - Nombre: Carlos Técnico
   - Email: carlos@test.com
   - Teléfono: +34 600 333 333 (obligatorio)
   - **Ciudad: Madrid**
   - **Especializaciones**: ✅ Internet, ✅ Router, ✅ Fibra Óptica (obligatorio)
   - Años experiencia: 5
   - Contraseña: test123
5. Click en **"Crear Cuenta"**

✅ **Resultado**: Dashboard de experto (vacío, sin tickets asignados)

### Paso 5: Asignar Ticket (como Operador)

1. Inicia sesión con: **maria@test.com / test123**
2. Ve al dashboard (verás el ticket pendiente)
3. Click en **"Asignar a Experto"** en el ticket
4. Selecciona: **Carlos Técnico**
5. Click en **"Asignar Ticket"**

✅ **Resultado**: 
- Ticket cambia a estado "Asignado"
- Aparece "Asignado a: Carlos Técnico"

### Paso 6: Trabajar Ticket (como Experto)

1. Inicia sesión con: **carlos@test.com / test123**
2. Verás el ticket asignado
3. Click en el ticket para abrirlo
4. Cambia estado a: **"En Progreso"**
5. Usa el chat para comunicarte con el usuario
6. Cuando termines, cambia a: **"Resuelto"**

✅ **Resultado**: Ticket resuelto, estadísticas actualizadas

## 📊 Verificar en Supabase

### Ver Datos en las Tablas

```sql
-- Ver usuarios registrados
SELECT name, email, city, role 
FROM profiles 
ORDER BY created_at DESC;

-- Ver tickets (normalizado, solo IDs)
SELECT 
  id,
  title,
  user_id,
  assigned_expert_id,
  city,
  address,
  status
FROM tickets
ORDER BY created_at DESC;

-- Ver tickets CON nombres (vista normalizada)
SELECT 
  title,
  user_name,
  user_email,
  user_city,
  assigned_expert_name,
  assigned_expert_city,
  city as problema_ciudad,
  address as problema_direccion,
  status
FROM tickets_with_details
ORDER BY created_at DESC;

-- Ver expertos registrados
SELECT 
  name,
  email,
  city,
  specializations,
  active_tickets,
  total_resolved
FROM experts_with_profile;
```

## 🎯 Funcionalidades Activas

### ✅ Usuarios
- [x] Registro con ciudad
- [x] Login
- [x] Crear tickets con ciudad y dirección
- [x] Ver sus propios tickets
- [x] Dashboard con estadísticas
- [x] Chat con expertos (cuando asignado)

### ✅ Operadores
- [x] Registro con ciudad y turno
- [x] Ver TODOS los tickets
- [x] Filtrar por estado, prioridad, ciudad, tipo
- [x] Asignar tickets a expertos
- [x] Dashboard con estadísticas globales

### ✅ Expertos
- [x] Registro con ciudad y especializaciones
- [x] Ver solo tickets asignados
- [x] Cambiar estado de tickets
- [x] Chat directo con usuarios
- [x] Dashboard con estadísticas personales

## 🗂️ Datos Normalizados

**ANTES (duplicación):**
```
tickets:
  user_id: "uuid"
  user_name: "Juan"      ❌ duplicado
  user_email: "juan@..."  ❌ duplicado
  assigned_expert_name: "Carlos" ❌ duplicado
```

**AHORA (normalizado):**
```
tickets:
  user_id: "uuid"        ✅ solo ID
  assigned_expert_id: "uuid" ✅ solo ID
  city: "Madrid"         ✅ ciudad del problema
  address: "Calle..."    ✅ dirección del problema

Los nombres vienen de tickets_with_details (vista con JOIN)
```

## 🔍 Debugging

### Si no ves datos:

1. **Verifica que ejecutaste el SQL**:
   ```sql
   SELECT * FROM tickets_with_details LIMIT 1;
   ```
   - Si da error → No ejecutaste la migración

2. **Verifica que hay datos**:
   ```sql
   SELECT COUNT(*) FROM profiles;
   SELECT COUNT(*) FROM tickets;
   ```
   - Si es 0 → Registra usuarios y crea tickets desde la app

3. **Verifica el backend**:
   - Abre consola del navegador (F12)
   - Ve a Network
   - Crea un ticket
   - Busca la petición a `/tickets`
   - Ve la respuesta

4. **Logs del servidor**:
   - El servidor muestra logs en la terminal
   - Busca errores en rojo

### Si hay error "city cannot be null":

Ejecuta el SQL de migración primero. Los campos `city` y `address` son obligatorios ahora.

### Si no aparecen nombres en tickets:

El backend debe usar `tickets_with_details` en lugar de `tickets`:

```typescript
// ✅ Correcto
const { data } = await supabase
  .from('tickets_with_details')
  .select('*');

// ❌ Incorrecto (datos normalizados, faltan nombres)
const { data } = await supabase
  .from('tickets')
  .select('*');
```

## 📈 Próximos Pasos

Una vez todo funciona:

1. ✅ Crear más usuarios de prueba
2. ✅ Crear tickets variados
3. ✅ Probar asignaciones
4. ✅ Probar chat en tiempo real
5. ✅ Verificar estadísticas
6. ✅ Agregar filtros por ciudad
7. ✅ Implementar asignación inteligente (misma ciudad)

## 🎉 ¡Listo!

Tu sistema está **100% funcional** con:
- ✅ Base de datos normalizada
- ✅ 18 tipos específicos de problemas
- ✅ Ubicaciones (ciudad del usuario + ciudad del problema)
- ✅ 3 roles completos
- ✅ Chat en tiempo real
- ✅ Estadísticas dinámicas

**No más mockData. Todo es real y se guarda en Supabase** 🚀
