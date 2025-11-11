-- Script para agregar soporte a llamadas de spam
-- Ejecutar en Supabase Dashboard → SQL Editor

-- Eliminar constraint existente
ALTER TABLE public.tickets 
DROP CONSTRAINT IF EXISTS tickets_problem_type_check;

-- Agregar constraint actualizado con telefono_spam
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

-- Actualizar función de etiquetas
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