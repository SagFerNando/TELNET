# 🗄️ Migraciones de Base de Datos SQL

## ⚠️ IMPORTANTE: Ejecutar Estas Migraciones en Supabase Dashboard

Para usar tablas SQL relacionadas en lugar de KV Store, debes ejecutar estas migraciones en el Supabase Dashboard:

### Cómo ejecutar las migraciones:

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (menú izquierdo)
4. Copia y pega cada bloque SQL
5. Click en **"Run"**

---

## 📋 Migración 1: Crear Tablas Base

```sql
-- ============================================
-- TABLA: profiles (extensión de auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  city TEXT,  -- Ciudad de origen del usuario
  role TEXT NOT NULL CHECK (role IN ('usuario', 'operador', 'experto')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para profiles
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_city ON public.profiles(city);

-- ============================================
-- TABLA: experts (datos adicionales de expertos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.experts (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  specializations TEXT[] NOT NULL DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  experience_years INTEGER DEFAULT 0,
  department TEXT,
  active_tickets INTEGER DEFAULT 0,
  total_resolved INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para experts
CREATE INDEX idx_experts_specializations ON public.experts USING GIN(specializations);

COMMENT ON COLUMN public.experts.specializations IS 'Especializaciones del experto: Internet, Router, Fibra Óptica, ADSL, Teléfono Fijo, VoIP, Cableado, Redes, etc.';

-- ============================================
-- TABLA: operators (datos adicionales de operadores)
-- ============================================
CREATE TABLE IF NOT EXISTS public.operators (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  department TEXT,
  shift TEXT CHECK (shift IN ('mañana', 'tarde', 'noche', 'rotativo')),
  supervisor_id UUID REFERENCES public.profiles(id),
  tickets_assigned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: tickets (NORMALIZADA - sin duplicación de datos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Tipos de problemas específicos
  problem_type TEXT NOT NULL CHECK (problem_type IN (
    'internet_sin_conexion', 'internet_lento', 'internet_intermitente',
    'router_apagado', 'router_configuracion', 'router_wifi_debil', 'router_reinicio_constante',
    'fibra_sin_señal', 'fibra_ont_apagado',
    'adsl_desconexiones', 'adsl_lento',
    'telefono_sin_linea', 'telefono_ruido', 'telefono_no_recibe', 'telefono_no_realiza',
    'cableado_dañado', 'cableado_instalacion',
    'otro'
  )),
  
  priority TEXT NOT NULL CHECK (priority IN ('baja', 'media', 'alta', 'critica')),
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'asignado', 'en_progreso', 'resuelto', 'cerrado')),
  
  -- Referencias normalizadas (solo IDs, los datos vienen de las tablas relacionadas)
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_expert_id UUID REFERENCES public.experts(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE,
  assigned_by_id UUID REFERENCES public.operators(id) ON DELETE SET NULL,
  
  -- Ubicación del problema (NO del usuario)
  city TEXT NOT NULL,           -- Ciudad donde está el problema
  address TEXT NOT NULL,        -- Dirección completa del problema
  service_provider TEXT,        -- Proveedor de servicio
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para tickets
CREATE INDEX idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX idx_tickets_expert_id ON public.tickets(assigned_expert_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_priority ON public.tickets(priority);
CREATE INDEX idx_tickets_problem_type ON public.tickets(problem_type);
CREATE INDEX idx_tickets_city ON public.tickets(city);
CREATE INDEX idx_tickets_created_at ON public.tickets(created_at DESC);

COMMENT ON TABLE public.tickets IS 'Tabla normalizada de tickets - Los datos de usuario y experto se obtienen mediante JOIN con profiles y experts';
COMMENT ON COLUMN public.tickets.city IS 'Ciudad donde está ubicado el problema (no necesariamente la ciudad del usuario)';
COMMENT ON COLUMN public.tickets.address IS 'Dirección completa donde está el problema';

-- ============================================
-- TABLA: messages (chat)
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('usuario', 'experto', 'operador')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para messages
CREATE INDEX idx_messages_ticket_id ON public.messages(ticket_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- ============================================
-- TABLA: ticket_activities (historial)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ticket_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  performed_by_name TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para ticket_activities
CREATE INDEX idx_activities_ticket_id ON public.ticket_activities(ticket_id);
CREATE INDEX idx_activities_created_at ON public.ticket_activities(created_at DESC);
```

---

## 📋 Migración 2: Row Level Security (RLS)

```sql
-- ============================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_activities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA PROFILES
-- ============================================

-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Operadores y expertos pueden ver todos los perfiles
CREATE POLICY "Operators and experts can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('operador', 'experto')
    )
  );

-- ============================================
-- POLÍTICAS PARA EXPERTS
-- ============================================

-- Expertos pueden ver su propio perfil
CREATE POLICY "Experts can view own profile"
  ON public.experts FOR SELECT
  USING (auth.uid() = id);

-- Expertos pueden actualizar su propio perfil
CREATE POLICY "Experts can update own profile"
  ON public.experts FOR UPDATE
  USING (auth.uid() = id);

-- Operadores pueden ver todos los expertos
CREATE POLICY "Operators can view all experts"
  ON public.experts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'operador'
    )
  );

-- ============================================
-- POLÍTICAS PARA OPERATORS
-- ============================================

-- Operadores pueden ver su propio perfil
CREATE POLICY "Operators can view own profile"
  ON public.operators FOR SELECT
  USING (auth.uid() = id);

-- Operadores pueden actualizar su propio perfil
CREATE POLICY "Operators can update own profile"
  ON public.operators FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- POLÍTICAS PARA TICKETS
-- ============================================

-- Usuarios pueden ver sus propios tickets
CREATE POLICY "Users can view own tickets"
  ON public.tickets FOR SELECT
  USING (user_id = auth.uid());

-- Usuarios pueden crear tickets
CREATE POLICY "Users can create tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Expertos pueden ver tickets asignados a ellos
CREATE POLICY "Experts can view assigned tickets"
  ON public.tickets FOR SELECT
  USING (assigned_expert_id = auth.uid());

-- Expertos pueden actualizar tickets asignados
CREATE POLICY "Experts can update assigned tickets"
  ON public.tickets FOR UPDATE
  USING (assigned_expert_id = auth.uid());

-- Operadores pueden ver todos los tickets
CREATE POLICY "Operators can view all tickets"
  ON public.tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'operador'
    )
  );

-- Operadores pueden actualizar todos los tickets
CREATE POLICY "Operators can update all tickets"
  ON public.tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'operador'
    )
  );

-- ============================================
-- POLÍTICAS PARA MESSAGES
-- ============================================

-- Usuarios pueden ver mensajes de sus tickets
CREATE POLICY "Users can view messages of own tickets"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

-- Expertos pueden ver mensajes de tickets asignados
CREATE POLICY "Experts can view messages of assigned tickets"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE id = ticket_id AND assigned_expert_id = auth.uid()
    )
  );

-- Usuarios y expertos pueden crear mensajes en sus tickets
CREATE POLICY "Users and experts can create messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND (
      EXISTS (
        SELECT 1 FROM public.tickets
        WHERE id = ticket_id AND (
          user_id = auth.uid() OR assigned_expert_id = auth.uid()
        )
      )
    )
  );

-- Operadores pueden ver todos los mensajes
CREATE POLICY "Operators can view all messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'operador'
    )
  );

-- ============================================
-- POLÍTICAS PARA TICKET_ACTIVITIES
-- ============================================

-- Usuarios pueden ver actividades de sus tickets
CREATE POLICY "Users can view activities of own tickets"
  ON public.ticket_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

-- Expertos pueden ver actividades de tickets asignados
CREATE POLICY "Experts can view activities of assigned tickets"
  ON public.ticket_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE id = ticket_id AND assigned_expert_id = auth.uid()
    )
  );

-- Operadores pueden ver todas las actividades
CREATE POLICY "Operators can view all activities"
  ON public.ticket_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'operador'
    )
  );

-- Todos los usuarios autenticados pueden crear actividades
CREATE POLICY "Authenticated users can create activities"
  ON public.ticket_activities FOR INSERT
  WITH CHECK (auth.uid() = performed_by_id);
```

---

## 📋 Migración 3: Triggers y Funciones

```sql
-- ============================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experts_updated_at
  BEFORE UPDATE ON public.experts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operators_updated_at
  BEFORE UPDATE ON public.operators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCIÓN: Crear perfil automáticamente al registrar
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
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
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCIÓN: Actualizar contadores de expertos
-- ============================================

CREATE OR REPLACE FUNCTION update_expert_ticket_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se asigna un ticket a un experto
  IF NEW.assigned_expert_id IS NOT NULL AND 
     (OLD.assigned_expert_id IS NULL OR OLD.assigned_expert_id != NEW.assigned_expert_id) THEN
    
    -- Incrementar contador del nuevo experto
    UPDATE public.experts
    SET active_tickets = active_tickets + 1
    WHERE id = NEW.assigned_expert_id;
    
    -- Decrementar contador del experto anterior (si había)
    IF OLD.assigned_expert_id IS NOT NULL THEN
      UPDATE public.experts
      SET active_tickets = GREATEST(active_tickets - 1, 0)
      WHERE id = OLD.assigned_expert_id;
    END IF;
  END IF;
  
  -- Si se resuelve el ticket
  IF NEW.status IN ('resuelto', 'cerrado') AND OLD.status NOT IN ('resuelto', 'cerrado') THEN
    IF NEW.assigned_expert_id IS NOT NULL THEN
      UPDATE public.experts
      SET 
        active_tickets = GREATEST(active_tickets - 1, 0),
        total_resolved = total_resolved + CASE WHEN NEW.status = 'resuelto' THEN 1 ELSE 0 END
      WHERE id = NEW.assigned_expert_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_expert_counters
  AFTER UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_expert_ticket_count();
```

---

## 📋 Migración 4: Funciones de Utilidad

```sql
-- ============================================
-- FUNCIÓN: Obtener estadísticas por rol
-- ============================================

CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
  user_role TEXT;
  stats JSON;
BEGIN
  -- Obtener rol del usuario
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  
  IF user_role = 'operador' THEN
    -- Estadísticas para operador
    SELECT json_build_object(
      'totalTickets', COUNT(*),
      'pendientes', COUNT(*) FILTER (WHERE status = 'pendiente'),
      'asignados', COUNT(*) FILTER (WHERE status = 'asignado'),
      'enProgreso', COUNT(*) FILTER (WHERE status = 'en_progreso'),
      'resueltos', COUNT(*) FILTER (WHERE status = 'resuelto'),
      'cerrados', COUNT(*) FILTER (WHERE status = 'cerrado')
    ) INTO stats
    FROM public.tickets;
    
  ELSIF user_role = 'experto' THEN
    -- Estadísticas para experto
    SELECT json_build_object(
      'activeTickets', active_tickets,
      'totalResolved', total_resolved,
      'enProgreso', (SELECT COUNT(*) FROM public.tickets WHERE assigned_expert_id = user_id AND status = 'en_progreso'),
      'resueltos', (SELECT COUNT(*) FROM public.tickets WHERE assigned_expert_id = user_id AND status = 'resuelto')
    ) INTO stats
    FROM public.experts
    WHERE id = user_id;
    
  ELSE
    -- Estadísticas para usuario normal
    SELECT json_build_object(
      'totalTickets', COUNT(*),
      'pendientes', COUNT(*) FILTER (WHERE status = 'pendiente'),
      'enProgreso', COUNT(*) FILTER (WHERE status IN ('asignado', 'en_progreso')),
      'resueltos', COUNT(*) FILTER (WHERE status = 'resuelto')
    ) INTO stats
    FROM public.tickets
    WHERE user_id = user_id;
  END IF;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📋 Migración 5: Vistas para Consultas Normalizadas

```sql
-- ============================================
-- VISTA: tickets_with_details
-- Une tickets con información de usuario y experto
-- ============================================

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

-- Comentario sobre la vista
COMMENT ON VIEW public.tickets_with_details IS 'Vista desnormalizada de tickets con todos los datos de usuario y experto mediante JOINs';

-- ============================================
-- VISTA: experts_with_profile
-- Une expertos con sus datos de perfil
-- ============================================

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

-- ============================================
-- VISTA: operators_with_profile
-- Une operadores con sus datos de perfil
-- ============================================

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

-- ============================================
-- FUNCIÓN: Obtener etiquetas legibles de problem_type
-- ============================================

CREATE OR REPLACE FUNCTION get_problem_type_label(problem_type TEXT)
RETURNS TEXT AS $
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
    WHEN 'cableado_dañado' THEN 'Cableado - Cable dañado'
    WHEN 'cableado_instalacion' THEN 'Cableado - Instalación nueva'
    ELSE 'Otro problema'
  END;
END;
$ LANGUAGE plpgsql IMMUTABLE;
```

---

## ✅ Verificación de Migraciones

Después de ejecutar todas las migraciones, verifica que todo está correcto:

```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar políticas RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

---

## 🔄 Rollback (por si necesitas deshacer)

```sql
-- ADVERTENCIA: Esto borrará todos los datos

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_expert_counters ON public.tickets;
DROP TRIGGER IF EXISTS update_tickets_updated_at ON public.tickets;
DROP TRIGGER IF EXISTS update_operators_updated_at ON public.operators;
DROP TRIGGER IF EXISTS update_experts_updated_at ON public.experts;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

DROP FUNCTION IF EXISTS get_user_stats(UUID);
DROP FUNCTION IF EXISTS update_expert_ticket_count();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.ticket_activities CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.operators CASCADE;
DROP TABLE IF EXISTS public.experts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
```

---

## 📝 Notas Importantes

1. **Orden de ejecución**: Ejecuta las migraciones en el orden mostrado (1 → 2 → 3 → 4)
2. **RLS habilitado**: Las políticas de seguridad protegen los datos según el rol
3. **Triggers automáticos**: Los contadores y timestamps se actualizan automáticamente
4. **Backup**: Haz backup antes de ejecutar en producción
5. **Testing**: Prueba en desarrollo antes de aplicar en producción

---

**¡Migraciones listas! Ejecuta esto en Supabase Dashboard antes de continuar.** 🚀
