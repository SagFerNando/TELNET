-- ============================================
-- MIGRACIÓN A BASE DE DATOS NORMALIZADA
-- ============================================
-- Este script actualiza la base de datos para eliminar duplicación
-- y agregar campos de ciudad y dirección
--
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard → SQL Editor
-- 2. Copia y pega TODO este archivo
-- 3. Click en "Run"
-- ============================================

-- PASO 1: Agregar campo 'city' a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);

COMMENT ON COLUMN public.profiles.city IS 'Ciudad de origen del usuario (para facilitar desplazamientos de técnicos)';

-- PASO 2: Actualizar la función handle_new_user para incluir city
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, phone, city, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.raw_user_meta_data->>'city',
    COALESCE(NEW.raw_user_meta_data->>'role', 'usuario')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 3: Modificar la tabla tickets para NORMALIZAR datos
-- Primero, agregar nuevas columnas
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Migrar datos existentes (si los hay)
UPDATE public.tickets 
SET 
  city = COALESCE(location, 'No especificada'),
  address = COALESCE(location, 'No especificada')
WHERE city IS NULL;

-- Ahora hacer city y address obligatorios
ALTER TABLE public.tickets 
ALTER COLUMN city SET NOT NULL,
ALTER COLUMN address SET NOT NULL;

-- PASO 4: ELIMINAR columnas duplicadas de la tabla tickets
-- Estos datos ahora vienen de la tabla profiles mediante JOIN
ALTER TABLE public.tickets 
DROP COLUMN IF EXISTS user_name,
DROP COLUMN IF EXISTS user_email,
DROP COLUMN IF EXISTS user_phone,
DROP COLUMN IF EXISTS assigned_expert_name,
DROP COLUMN IF EXISTS location;

-- PASO 5: Actualizar el CHECK constraint de problem_type
ALTER TABLE public.tickets 
DROP CONSTRAINT IF EXISTS tickets_problem_type_check;

ALTER TABLE public.tickets 
ADD CONSTRAINT tickets_problem_type_check CHECK (problem_type IN (
  'internet_sin_conexion', 'internet_lento', 'internet_intermitente',
  'router_apagado', 'router_configuracion', 'router_wifi_debil', 'router_reinicio_constante',
  'fibra_sin_señal', 'fibra_ont_apagado',
  'adsl_desconexiones', 'adsl_lento',
  'telefono_sin_linea', 'telefono_ruido', 'telefono_no_recibe', 'telefono_no_realiza', 'telefono_spam',
  'cableado_dañado', 'cableado_instalacion',
  'otro'
));

-- Crear índice para la ciudad en tickets
CREATE INDEX IF NOT EXISTS idx_tickets_city ON public.tickets(city);

-- Agregar comentarios
COMMENT ON TABLE public.tickets IS 'Tabla normalizada de tickets - Los datos de usuario y experto se obtienen mediante JOIN con profiles y experts';
COMMENT ON COLUMN public.tickets.city IS 'Ciudad donde está ubicado el problema (no necesariamente la ciudad del usuario)';
COMMENT ON COLUMN public.tickets.address IS 'Dirección completa donde está el problema';

-- PASO 6: Crear vista normalizada para consultas con JOIN
CREATE OR REPLACE VIEW public.tickets_with_details AS
SELECT 
  t.id,
  t.title,
  t.description,
  t.problem_type,
  t.priority,
  t.status,
  
  -- Datos del usuario (normalizados desde profiles)
  t.user_id,
  p_user.name as user_name,
  p_user.email as user_email,
  p_user.phone as user_phone,
  p_user.city as user_city,
  
  -- Datos del experto asignado (normalizados)
  t.assigned_expert_id,
  p_expert.name as assigned_expert_name,
  p_expert.email as assigned_expert_email,
  p_expert.city as assigned_expert_city,
  e.specializations as assigned_expert_specializations,
  t.assigned_at,
  
  -- Datos del operador que asignó
  t.assigned_by_id,
  p_operator.name as assigned_by_name,
  
  -- Ubicación del problema
  t.city,
  t.address,
  t.service_provider,
  
  -- Timestamps
  t.created_at,
  t.updated_at,
  t.resolved_at,
  t.closed_at
  
FROM public.tickets t
LEFT JOIN public.profiles p_user ON t.user_id = p_user.id
LEFT JOIN public.profiles p_expert ON t.assigned_expert_id = p_expert.id
LEFT JOIN public.experts e ON t.assigned_expert_id = e.id
LEFT JOIN public.profiles p_operator ON t.assigned_by_id = p_operator.id;

COMMENT ON VIEW public.tickets_with_details IS 'Vista desnormalizada de tickets con todos los datos de usuario y experto mediante JOINs';

-- PASO 7: Crear vistas adicionales para expertos y operadores
CREATE OR REPLACE VIEW public.experts_with_profile AS
SELECT 
  e.id,
  p.name,
  p.email,
  p.phone,
  p.city,
  e.specializations,
  e.certifications,
  e.experience_years,
  e.department,
  e.active_tickets,
  e.total_resolved,
  e.created_at,
  e.updated_at
FROM public.experts e
JOIN public.profiles p ON e.id = p.id;

CREATE OR REPLACE VIEW public.operators_with_profile AS
SELECT 
  o.id,
  p.name,
  p.email,
  p.phone,
  p.city,
  o.department,
  o.shift,
  o.supervisor_id,
  o.tickets_assigned,
  o.created_at,
  o.updated_at
FROM public.operators o
JOIN public.profiles p ON o.id = p.id;

-- PASO 8: Crear función para obtener etiquetas legibles de problem_type
CREATE OR REPLACE FUNCTION get_problem_type_label(problem_type TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE problem_type
    WHEN 'internet_sin_conexion' THEN 'Internet - Sin conexión'
    WHEN 'internet_lento' THEN 'Internet - Baja velocidad'
    WHEN 'internet_intermitente' THEN 'Internet - Intermitente'
    WHEN 'router_apagado' THEN 'Router - No enciende'
    WHEN 'router_configuracion' THEN 'Router - Problema de configuración'
    WHEN 'router_wifi_debil' THEN 'Router - WiFi débil'
    WHEN 'router_reinicio_constante' THEN 'Router - Se reinicia constantemente'
    WHEN 'fibra_sin_señal' THEN 'Fibra - Sin señal'
    WHEN 'fibra_ont_apagado' THEN 'Fibra - ONT sin luz'
    WHEN 'adsl_desconexiones' THEN 'ADSL - Desconexiones frecuentes'
    WHEN 'adsl_lento' THEN 'ADSL - Baja velocidad'
    WHEN 'telefono_sin_linea' THEN 'Teléfono - Sin línea'
    WHEN 'telefono_ruido' THEN 'Teléfono - Ruido/Interferencias'
    WHEN 'telefono_no_recibe' THEN 'Teléfono - No recibe llamadas'
    WHEN 'telefono_no_realiza' THEN 'Teléfono - No puede realizar llamadas'
    WHEN 'telefono_spam' THEN 'Teléfono - Llamadas de spam'
    WHEN 'cableado_dañado' THEN 'Cableado - Cable dañado'
    WHEN 'cableado_instalacion' THEN 'Cableado - Instalación nueva'
    ELSE 'Otro problema'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- PASO 9: Agregar soporte para imágenes en mensajes
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_image_url ON public.messages(image_url) WHERE image_url IS NOT NULL;

COMMENT ON COLUMN public.messages.image_url IS 'URL de imagen adjunta al mensaje (evidencia fotográfica)';

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que todo está correcto
SELECT 
  'profiles' as tabla,
  COUNT(*) as registros,
  COUNT(city) as con_ciudad
FROM public.profiles

UNION ALL

SELECT 
  'tickets' as tabla,
  COUNT(*) as registros,
  COUNT(city) as con_ciudad
FROM public.tickets

UNION ALL

SELECT 
  'vista tickets_with_details' as tabla,
  COUNT(*) as registros,
  COUNT(city) as con_ciudad
FROM public.tickets_with_details;

-- Ver estructura actualizada de tickets
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tickets'
ORDER BY ordinal_position;

-- ============================================
-- ✅ MIGRACIÓN COMPLETADA
-- ============================================
-- La base de datos ahora está normalizada:
-- ✅ Campo 'city' agregado a profiles
-- ✅ Campos 'city' y 'address' agregados a tickets
-- ✅ Campos duplicados eliminados de tickets
-- ✅ Tipos de problemas expandidos
-- ✅ Vista 'tickets_with_details' creada para consultas
-- ✅ Vistas adicionales para expertos y operadores
-- ✅ Función para etiquetas de problemas
-- ✅ Soporte para imágenes en mensajes
--
-- SIGUIENTE PASO:
-- Los tickets existentes tienen ciudad "No especificada"
-- Puedes actualizarlos manualmente si es necesario
-- ============================================