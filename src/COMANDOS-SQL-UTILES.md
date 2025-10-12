# 🔍 Comandos SQL Útiles

## Guía rápida de consultas para verificar y depurar el sistema

---

## ✅ Verificación Inicial

### Ver todas las tablas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Deberías ver:
-- experts, messages, operators, profiles, 
-- ticket_activities, tickets
```

### Ver estructura de tickets (normalizada)
```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tickets'
ORDER BY ordinal_position;

-- Debes ver: city, address (NOT NULL)
-- NO debes ver: user_name, user_email, assigned_expert_name
```

### Verificar vista normalizada existe
```sql
SELECT * FROM tickets_with_details LIMIT 1;

-- Si da error "does not exist" 
-- → Ejecuta MIGRACION-NORMALIZADA.sql
```

---

## 👥 Consultas de Usuarios

### Ver todos los usuarios
```sql
SELECT 
  name,
  email,
  phone,
  city,
  role,
  created_at
FROM profiles
ORDER BY created_at DESC;
```

### Contar usuarios por rol
```sql
SELECT 
  role,
  COUNT(*) as total
FROM profiles
GROUP BY role
ORDER BY total DESC;
```

### Ver expertos con detalles
```sql
SELECT 
  name,
  email,
  city,
  specializations,
  experience_years,
  active_tickets,
  total_resolved
FROM experts_with_profile
ORDER BY total_resolved DESC;
```

### Ver operadores con detalles
```sql
SELECT 
  name,
  email,
  city,
  department,
  shift,
  tickets_assigned
FROM operators_with_profile
ORDER BY tickets_assigned DESC;
```

---

## 🎫 Consultas de Tickets

### Ver todos los tickets (con nombres)
```sql
SELECT 
  id,
  title,
  user_name,
  user_email,
  assigned_expert_name,
  city as problema_ciudad,
  address as problema_direccion,
  problem_type,
  priority,
  status,
  created_at
FROM tickets_with_details
ORDER BY created_at DESC;
```

### Contar tickets por estado
```sql
SELECT 
  status,
  COUNT(*) as total
FROM tickets
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'pendiente' THEN 1
    WHEN 'asignado' THEN 2
    WHEN 'en_progreso' THEN 3
    WHEN 'resuelto' THEN 4
    WHEN 'cerrado' THEN 5
  END;
```

### Tickets por ciudad
```sql
SELECT 
  city,
  COUNT(*) as total_tickets,
  COUNT(*) FILTER (WHERE status = 'pendiente') as pendientes,
  COUNT(*) FILTER (WHERE status IN ('asignado', 'en_progreso')) as en_proceso,
  COUNT(*) FILTER (WHERE status = 'resuelto') as resueltos
FROM tickets
GROUP BY city
ORDER BY total_tickets DESC;
```

### Tickets por tipo de problema
```sql
SELECT 
  problem_type,
  COUNT(*) as total
FROM tickets
GROUP BY problem_type
ORDER BY total DESC;
```

### Ver tickets de un usuario específico
```sql
-- Reemplaza 'email@ejemplo.com' con el email del usuario
SELECT 
  t.id,
  t.title,
  t.description,
  t.problem_type,
  t.priority,
  t.status,
  t.city,
  t.address,
  t.created_at
FROM tickets t
JOIN profiles p ON t.user_id = p.id
WHERE p.email = 'juan@test.com'
ORDER BY t.created_at DESC;
```

### Ver tickets asignados a un experto
```sql
-- Reemplaza con el email del experto
SELECT 
  t.id,
  t.title,
  t.problem_type,
  t.priority,
  t.status,
  p_user.name as usuario,
  t.city,
  t.created_at,
  t.assigned_at
FROM tickets t
JOIN profiles p_user ON t.user_id = p_user.id
JOIN profiles p_expert ON t.assigned_expert_id = p_expert.id
WHERE p_expert.email = 'carlos@test.com'
ORDER BY t.created_at DESC;
```

### Tickets pendientes de asignar
```sql
SELECT 
  title,
  user_name,
  city,
  address,
  problem_type,
  priority,
  created_at
FROM tickets_with_details
WHERE status = 'pendiente'
ORDER BY 
  CASE priority
    WHEN 'critica' THEN 1
    WHEN 'alta' THEN 2
    WHEN 'media' THEN 3
    WHEN 'baja' THEN 4
  END,
  created_at ASC;
```

---

## 💬 Consultas de Mensajes

### Ver mensajes de un ticket
```sql
-- Reemplaza 'ticket-id' con el ID del ticket
SELECT 
  sender_name,
  sender_role,
  content,
  created_at
FROM messages
WHERE ticket_id = 'ticket-id'
ORDER BY created_at ASC;
```

### Contar mensajes por ticket
```sql
SELECT 
  t.id,
  t.title,
  COUNT(m.id) as total_mensajes
FROM tickets t
LEFT JOIN messages m ON t.id = m.ticket_id
GROUP BY t.id, t.title
HAVING COUNT(m.id) > 0
ORDER BY total_mensajes DESC;
```

---

## 📊 Estadísticas y Reportes

### Rendimiento de expertos
```sql
SELECT 
  name,
  city,
  active_tickets,
  total_resolved,
  ROUND(total_resolved::numeric / NULLIF(active_tickets + total_resolved, 0) * 100, 2) as tasa_resolucion
FROM experts_with_profile
WHERE total_resolved > 0
ORDER BY total_resolved DESC;
```

### Tiempo promedio de resolución
```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as horas_promedio
FROM tickets
WHERE resolved_at IS NOT NULL;
```

### Tickets por día (últimos 7 días)
```sql
SELECT 
  DATE(created_at) as fecha,
  COUNT(*) as total_tickets,
  COUNT(*) FILTER (WHERE status = 'resuelto') as resueltos
FROM tickets
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY fecha DESC;
```

### Distribución de prioridades
```sql
SELECT 
  priority,
  COUNT(*) as total,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as porcentaje
FROM tickets
GROUP BY priority
ORDER BY 
  CASE priority
    WHEN 'critica' THEN 1
    WHEN 'alta' THEN 2
    WHEN 'media' THEN 3
    WHEN 'baja' THEN 4
  END;
```

---

## 🔧 Actualización de Datos

### Actualizar ciudad de un usuario
```sql
UPDATE profiles
SET city = 'Madrid'
WHERE email = 'usuario@ejemplo.com';
```

### Actualizar ubicación de un ticket
```sql
UPDATE tickets
SET 
  city = 'Barcelona',
  address = 'Calle Nueva 123, 4º B'
WHERE id = 'ticket-id';
```

### Cambiar estado de un ticket
```sql
UPDATE tickets
SET 
  status = 'resuelto',
  resolved_at = NOW()
WHERE id = 'ticket-id';
```

### Asignar ticket manualmente
```sql
-- Primero obtener el ID del experto
SELECT id, name FROM profiles WHERE role = 'experto';

-- Luego asignar
UPDATE tickets
SET 
  assigned_expert_id = 'expert-uuid',
  assigned_at = NOW(),
  status = 'asignado'
WHERE id = 'ticket-id';
```

---

## 🗑️ Limpieza y Mantenimiento

### Borrar todos los tickets de prueba
```sql
-- ⚠️ CUIDADO: Esto borrará TODOS los tickets
DELETE FROM ticket_activities;
DELETE FROM messages;
DELETE FROM tickets;
```

### Borrar un usuario específico
```sql
-- Esto borrará el usuario y todos sus tickets (CASCADE)
DELETE FROM profiles
WHERE email = 'usuario@ejemplo.com';
```

### Reset de contadores de expertos
```sql
UPDATE experts
SET 
  active_tickets = (
    SELECT COUNT(*)
    FROM tickets
    WHERE assigned_expert_id = experts.id
      AND status IN ('asignado', 'en_progreso')
  ),
  total_resolved = (
    SELECT COUNT(*)
    FROM tickets
    WHERE assigned_expert_id = experts.id
      AND status = 'resuelto'
  );
```

---

## 🎯 Asignación Inteligente

### Buscar mejor experto para un ticket
```sql
-- Expertos en la misma ciudad con especialización relevante
SELECT 
  e.id,
  p.name,
  p.city,
  e.specializations,
  e.active_tickets,
  e.total_resolved
FROM tickets t
CROSS JOIN experts e
JOIN profiles p ON e.id = p.id
WHERE 
  t.id = 'ticket-id'
  AND t.city = p.city
  AND (
    -- Verificar si tiene especialización relevante
    (t.problem_type LIKE 'internet%' AND 'Internet' = ANY(e.specializations))
    OR (t.problem_type LIKE 'router%' AND 'Router' = ANY(e.specializations))
    OR (t.problem_type LIKE 'fibra%' AND 'Fibra Óptica' = ANY(e.specializations))
    OR (t.problem_type LIKE 'telefono%' AND 'Teléfono Fijo' = ANY(e.specializations))
  )
ORDER BY e.active_tickets ASC, e.total_resolved DESC
LIMIT 5;
```

### Ver carga de trabajo por experto
```sql
SELECT 
  name,
  city,
  active_tickets,
  CASE 
    WHEN active_tickets = 0 THEN '🟢 Disponible'
    WHEN active_tickets <= 3 THEN '🟡 Carga media'
    WHEN active_tickets <= 5 THEN '🟠 Carga alta'
    ELSE '🔴 Sobrecargado'
  END as estado_carga,
  specializations
FROM experts_with_profile
ORDER BY active_tickets ASC;
```

---

## 🐛 Debugging

### Ver logs de actividad de un ticket
```sql
SELECT 
  action,
  performed_by_name,
  details,
  created_at
FROM ticket_activities
WHERE ticket_id = 'ticket-id'
ORDER BY created_at DESC;
```

### Verificar integridad referencial
```sql
-- Tickets sin usuario (no debería haber)
SELECT * FROM tickets 
WHERE user_id NOT IN (SELECT id FROM profiles);

-- Tickets asignados a experto inexistente
SELECT * FROM tickets 
WHERE assigned_expert_id IS NOT NULL
  AND assigned_expert_id NOT IN (SELECT id FROM experts);
```

### Ver usuarios sin perfil completo
```sql
-- Expertos sin registro en tabla experts
SELECT p.* 
FROM profiles p
WHERE p.role = 'experto'
  AND p.id NOT IN (SELECT id FROM experts);

-- Operadores sin registro en tabla operators
SELECT p.* 
FROM profiles p
WHERE p.role = 'operador'
  AND p.id NOT IN (SELECT id FROM operators);
```

---

## 📝 Insertar Datos de Prueba

### Crear usuario de prueba
```sql
-- Primero crear en auth (solo desde backend)
-- Luego insertar perfil
INSERT INTO profiles (id, email, name, phone, city, role)
VALUES (
  gen_random_uuid(),
  'test@ejemplo.com',
  'Usuario Test',
  '+34 600 000 000',
  'Madrid',
  'usuario'
);
```

### Crear ticket de prueba
```sql
INSERT INTO tickets (
  user_id,
  title,
  description,
  problem_type,
  priority,
  city,
  address,
  status
)
VALUES (
  (SELECT id FROM profiles WHERE email = 'juan@test.com'),
  'Prueba de ticket',
  'Este es un ticket de prueba',
  'internet_sin_conexion',
  'media',
  'Madrid',
  'Calle Test 123',
  'pendiente'
);
```

---

## 🔒 Seguridad y Permisos

### Ver políticas RLS activas
```sql
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Ver triggers activos
```sql
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

---

**💡 Tip**: Guarda estas consultas en favoritos de Supabase SQL Editor para acceso rápido.
