# 🔄 Instrucciones de Migración a Base de Datos Normalizada

## 📊 ¿Qué cambió?

### ✅ Base de Datos Normalizada

**ANTES (con duplicación):**
```
tickets:
  - user_id
  - user_name ❌ (duplicado)
  - user_email ❌ (duplicado)
  - user_phone ❌ (duplicado)
  - assigned_expert_name ❌ (duplicado)
```

**AHORA (normalizado):**
```
tickets:
  - user_id ✅ (solo referencia)
  - assigned_expert_id ✅ (solo referencia)
  
Los datos se obtienen mediante JOIN con profiles/experts
```

### ✅ Nuevos Campos Agregados

1. **`city` en `profiles`**: Ciudad de origen (usuarios, operadores, expertos)
2. **`city` en `tickets`**: Ciudad donde está el problema
3. **`address` en `tickets`**: Dirección completa del problema

### ✅ Tipos de Problemas Expandidos

**ANTES:**
- Internet, Teléfono, Ambos

**AHORA (18 tipos específicos):**
- **Internet**: Sin conexión, Lento, Intermitente
- **Router**: No enciende, Configuración, WiFi débil, Reinicio constante
- **Fibra**: Sin señal, ONT apagado
- **ADSL**: Desconexiones, Lento
- **Teléfono**: Sin línea, Ruido, No recibe, No realiza
- **Cableado**: Dañado, Instalación nueva
- **Otro**: Problema general

---

## 🚀 Pasos para Migrar

### 1. Ejecutar SQL en Supabase

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Abre el archivo `/MIGRACION-NORMALIZADA.sql`
3. Copia **TODO** el contenido
4. Pégalo en SQL Editor
5. Click en **"Run"**

El script:
- ✅ Agrega campo `city` a `profiles`
- ✅ Agrega campos `city` y `address` a `tickets`
- ✅ **ELIMINA** campos duplicados (`user_name`, `user_email`, etc.)
- ✅ Actualiza tipos de problemas
- ✅ Crea vista `tickets_with_details` para consultas con JOIN

### 2. Verificar Migración

Ejecuta en SQL Editor:

```sql
-- Ver estructura de tickets
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tickets'
ORDER BY ordinal_position;
```

Deberías ver:
- ✅ `city` (text, not null)
- ✅ `address` (text, not null)
- ❌ NO debe existir `user_name`
- ❌ NO debe existir `user_email`
- ❌ NO debe existir `assigned_expert_name`

### 3. Probar la Vista Normalizada

```sql
-- Consultar tickets con datos de usuario y experto
SELECT 
  id,
  title,
  user_name,
  user_email,
  user_city,
  assigned_expert_name,
  assigned_expert_city,
  city as problema_ciudad,
  address as problema_direccion
FROM tickets_with_details
LIMIT 5;
```

---

## 🧪 Probar el Sistema

### 1. Registrar Usuario con Ciudad

1. Abre la app
2. Click en "Regístrate aquí"
3. Completa el formulario
4. **Nuevo campo**: "Ciudad de Origen" (ej: Madrid)
5. Registrarse

### 2. Crear Ticket con Ubicación

1. Inicia sesión como usuario
2. Click en "Crear Nuevo Ticket"
3. Completa:
   - Tipo de problema (ahora más específico)
   - **Ciudad**: Donde está el problema
   - **Dirección**: Dirección completa
4. Crear ticket

### 3. Verificar en Base de Datos

```sql
-- Ver usuarios con ciudad
SELECT name, email, city, role
FROM profiles
LIMIT 10;

-- Ver tickets con ubicación
SELECT 
  title,
  problem_type,
  city,
  address,
  user_name,
  user_city
FROM tickets_with_details
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📋 Datos de Prueba

### Tickets Existentes

Si tienes tickets antiguos, se migraron así:
- `location` → `city` y `address` (ambos con el mismo valor)
- Si `location` era NULL → "No especificada"

Puedes actualizarlos manualmente:

```sql
UPDATE tickets
SET 
  city = 'Madrid',
  address = 'Calle Gran Vía 28, 3º A'
WHERE id = 'uuid-del-ticket';
```

### Crear Datos de Prueba

```sql
-- Usuario con ciudad
INSERT INTO profiles (id, email, name, phone, city, role)
VALUES (
  gen_random_uuid(),
  'test@ejemplo.com',
  'Usuario Test',
  '+34 600 000 000',
  'Barcelona',
  'usuario'
);

-- Experto con ciudad
INSERT INTO profiles (id, email, name, phone, city, role)
VALUES (
  'uuid-experto',
  'experto@ejemplo.com',
  'Técnico Test',
  '+34 600 111 111',
  'Madrid',
  'experto'
);

INSERT INTO experts (id, specializations)
VALUES (
  'uuid-experto',
  ARRAY['Internet', 'Router', 'Fibra Óptica']
);
```

---

## 🔍 Consultas Útiles

### Tickets por Ciudad

```sql
SELECT 
  city,
  COUNT(*) as total_tickets,
  COUNT(*) FILTER (WHERE status = 'pendiente') as pendientes,
  COUNT(*) FILTER (WHERE status = 'resuelto') as resueltos
FROM tickets
GROUP BY city
ORDER BY total_tickets DESC;
```

### Expertos por Ciudad

```sql
SELECT 
  city,
  COUNT(*) as total_expertos,
  AVG(active_tickets) as promedio_activos,
  SUM(total_resolved) as total_resueltos
FROM experts_with_profile
GROUP BY city
ORDER BY total_expertos DESC;
```

### Asignación Inteligente (mismo ciudad)

```sql
-- Buscar expertos en la misma ciudad que el problema
SELECT 
  t.id as ticket_id,
  t.title,
  t.city as problema_ciudad,
  e.name as experto,
  e.city as experto_ciudad,
  e.specializations,
  e.active_tickets
FROM tickets t
CROSS JOIN experts_with_profile e
WHERE 
  t.status = 'pendiente'
  AND t.city = e.city
  AND t.problem_type LIKE 'internet%'
  AND 'Internet' = ANY(e.specializations)
ORDER BY e.active_tickets ASC
LIMIT 10;
```

---

## 🐛 Solución de Problemas

### Error: "column does not exist"

Si ves errores de columnas que no existen:

1. **Backend**: Verifica que uses `tickets_with_details` en lugar de `tickets`
2. **Frontend**: Los datos ahora vienen en objetos anidados:
   ```typescript
   ticket.user.name    // en lugar de ticket.userName
   ticket.city         // ciudad del problema
   ticket.user.city    // ciudad del usuario
   ```

### Error: "city cannot be null"

Los campos `city` y `address` en tickets son obligatorios ahora:

```typescript
// Al crear ticket
{
  title: "...",
  description: "...",
  problemType: "internet_sin_conexion",
  city: "Madrid",        // REQUERIDO
  address: "Calle...",   // REQUERIDO
}
```

### Los nombres de usuarios no aparecen

Si los nombres no aparecen, el backend no está usando la vista:

```typescript
// ANTES (incorrecto)
const { data } = await supabase.from('tickets').select('*');

// AHORA (correcto)
const { data } = await supabase.from('tickets_with_details').select('*');
```

---

## ✅ Checklist de Migración

- [ ] Ejecutar `/MIGRACION-NORMALIZADA.sql` en Supabase
- [ ] Verificar que las columnas duplicadas se eliminaron
- [ ] Verificar que la vista `tickets_with_details` existe
- [ ] Registrar usuario nuevo con ciudad
- [ ] Crear ticket con ciudad y dirección
- [ ] Verificar que los datos se guardan correctamente
- [ ] Probar consultas desde el frontend
- [ ] Actualizar tickets antiguos (si es necesario)

---

## 📚 Archivos Modificados

1. **`/types/index.ts`** - Tipos actualizados
2. **`/utils/api.ts`** - API con nuevos campos
3. **`/components/user/CreateTicketForm.tsx`** - Formulario con ciudad/dirección
4. **`/components/auth/RegisterForm.tsx`** - Registro con ciudad
5. **`/supabase/functions/server/index-sql.tsx`** - Backend normalizado
6. **`/docs/DATABASE-MIGRATIONS.md`** - Documentación SQL

---

## 🎯 Beneficios de la Normalización

### ✅ Ventajas

1. **Sin duplicación**: Los datos del usuario se almacenan UNA sola vez
2. **Consistencia**: Si cambias el nombre del usuario, se actualiza en todos los tickets
3. **Integridad**: Las relaciones se mantienen con foreign keys
4. **Rendimiento**: Índices en `city` para búsquedas rápidas
5. **Escalabilidad**: Fácil agregar más campos a profiles sin tocar tickets

### 📊 Comparación de Tamaño

**Antes** (1000 tickets):
- Tickets: ~500KB (con nombres duplicados)

**Ahora** (1000 tickets):
- Tickets: ~250KB (solo IDs)
- Profiles: ~50KB (datos únicos)
- **Total**: ~300KB (40% de ahorro)

---

## 🚀 Próximos Pasos

1. ✅ Migración completada
2. Crear filtros por ciudad en dashboards
3. Implementar asignación inteligente por ubicación
4. Agregar mapas de cobertura por ciudad
5. Reportes de incidencias por zona geográfica

---

**¿Dudas?** Revisa `/docs/DATABASE-MIGRATIONS.md` para más detalles técnicos.
