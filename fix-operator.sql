-- SOLUCIÓN COMPLETA: Corrige problema actual Y previene futuros
-- Ejecutar en Supabase Dashboard → SQL Editor

-- 1. Crear registro del operador actual
INSERT INTO public.operators (id, department, shift)
VALUES ('d05bc77d-d8f1-4fa9-b459-c29ad115a852', 'Soporte', 'mañana')
ON CONFLICT (id) DO NOTHING;

-- 2. Crear registros para TODOS los operadores existentes que falten
INSERT INTO public.operators (id, department, shift)
SELECT 
  p.id,
  'Soporte' as department,
  'mañana' as shift
FROM profiles p
LEFT JOIN operators o ON p.id = o.id
WHERE p.role = 'operador' AND o.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 3. Eliminar la foreign key constraint problemática (OPCIONAL)
-- Si quieres evitar este problema completamente:
-- ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_assigned_by_id_fkey;

-- 4. Verificar que todos los operadores están correctos
SELECT 
  p.name, 
  p.email, 
  p.role,
  CASE WHEN o.id IS NOT NULL THEN 'SÍ' ELSE 'NO' END as existe_en_operators
FROM profiles p
LEFT JOIN operators o ON p.id = o.id
WHERE p.role = 'operador';