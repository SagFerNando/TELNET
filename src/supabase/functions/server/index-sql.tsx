import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Crear cliente Supabase con service role key para el backend
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Enable logger
app.use("*", logger(console.log));

// Enable CORS
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

// Middleware para verificar autenticación
async function verifyAuth(authHeader: string | null) {
  if (!authHeader) return null;
  
  const accessToken = authHeader.split(" ")[1];
  if (!accessToken) return null;

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) return null;

  return user;
}

// ============================================
// AUTENTICACIÓN
// ============================================

// Registro de usuario
app.post("/make-server-370afec0/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { 
      email, 
      password, 
      name, 
      phone, 
      role,
      // Campos adicionales
      specializations,
      certifications,
      experienceYears,
      department,
      shift
    } = body;

    if (!email || !password || !name || !role) {
      return c.json({ error: "Faltan campos requeridos" }, 400);
    }

    // Validar rol
    if (!["usuario", "operador", "experto"].includes(role)) {
      return c.json({ error: "Rol inválido" }, 400);
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name, 
        phone: phone || "",
        role 
      },
      email_confirm: true,
    });

    if (authError) {
      console.log("Error al crear usuario en Auth:", authError);
      return c.json({ error: authError.message }, 400);
    }

    const userId = authData.user.id;

    // Crear perfil en tabla profiles (se crea automáticamente con trigger)
    // Pero asegurarnos de que los datos estén correctos
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email,
        name,
        phone: phone || '',
        city: body.city || null,
        role
      });

    if (profileError) {
      console.log("Error al crear perfil:", profileError);
    }

    // Si es experto, crear registro en tabla experts
    if (role === "experto") {
      const { error: expertError } = await supabase
        .from('experts')
        .insert({
          id: userId,
          specializations: specializations || [],
          certifications: certifications || [],
          experience_years: parseInt(experienceYears) || 0,
          department: department || null,
          active_tickets: 0,
          total_resolved: 0
        });

      if (expertError) {
        console.log("Error al crear perfil de experto:", expertError);
        return c.json({ error: "Error al crear perfil de experto" }, 500);
      }
    }

    // Si es operador, crear registro en tabla operators
    if (role === "operador") {
      const { error: operatorError } = await supabase
        .from('operators')
        .insert({
          id: userId,
          department: department || null,
          shift: shift || null,
          tickets_assigned: 0
        });

      if (operatorError) {
        console.log("Error al crear perfil de operador:", operatorError);
        return c.json({ error: "Error al crear perfil de operador" }, 500);
      }
    }

    return c.json({ 
      success: true, 
      user: authData.user,
      message: "Usuario registrado exitosamente" 
    });
  } catch (error) {
    console.log("Error en signup:", error);
    return c.json({ error: "Error al registrar usuario" }, 500);
  }
});

// Obtener información del usuario actual
app.get("/make-server-370afec0/auth/me", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.log("Error al obtener perfil:", error);
      return c.json({ error: "Error al obtener perfil" }, 500);
    }

    // Si es experto, obtener datos adicionales
    if (profile.role === 'experto') {
      const { data: expertData } = await supabase
        .from('experts')
        .select('*')
        .eq('id', user.id)
        .single();

      return c.json({ ...profile, ...expertData });
    }

    // Si es operador, obtener datos adicionales
    if (profile.role === 'operador') {
      const { data: operatorData } = await supabase
        .from('operators')
        .select('*')
        .eq('id', user.id)
        .single();

      return c.json({ ...profile, ...operatorData });
    }

    return c.json(profile);
  } catch (error) {
    console.log("Error al obtener usuario:", error);
    return c.json({ error: "Error al obtener información del usuario" }, 500);
  }
});

// ============================================
// TICKETS
// ============================================

// Crear ticket
app.post("/make-server-370afec0/tickets", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const body = await c.req.json();
    const { title, description, problemType, priority, city, address, serviceProvider } = body;

    if (!title || !description || !problemType || !priority || !city || !address) {
      return c.json({ error: "Faltan campos requeridos (título, descripción, tipo, prioridad, ciudad, dirección)" }, 400);
    }

    // Obtener datos del usuario (solo para el log de actividad)
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    // NORMALIZADO: Solo guardamos el user_id, los datos se obtienen mediante JOIN
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        title,
        description,
        problem_type: problemType,
        priority,
        status: 'pendiente',
        user_id: user.id,  // Solo ID - datos normalizados
        city,              // Ciudad donde está el problema
        address,           // Dirección del problema
        service_provider: serviceProvider || null
      })
      .select()
      .single();

    if (error) {
      console.log("Error al crear ticket:", error);
      return c.json({ error: "Error al crear ticket" }, 500);
    }

    // Crear actividad
    await supabase.from('ticket_activities').insert({
      ticket_id: ticket.id,
      action: 'Ticket creado',
      performed_by_id: user.id,
      performed_by_name: profile?.name || 'Usuario'
    });

    return c.json({ success: true, ticket });
  } catch (error) {
    console.log("Error al crear ticket:", error);
    return c.json({ error: "Error al crear ticket" }, 500);
  }
});

// Obtener todos los tickets (con filtros opcionales)
app.get("/make-server-370afec0/tickets", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const status = c.req.query("status");
    const problemType = c.req.query("problemType");
    const priority = c.req.query("priority");
    const city = c.req.query("city");

    // Usar vista normalizada con JOINs
    let query = supabase.from('tickets_with_details').select('*');

    // Filtrar según el rol
    if (profile?.role === 'usuario') {
      query = query.eq('user_id', user.id);
    } else if (profile?.role === 'experto') {
      query = query.eq('assigned_expert_id', user.id);
    }
    // Los operadores ven todos los tickets

    // Aplicar filtros
    if (status) query = query.eq('status', status);
    if (problemType) query = query.eq('problem_type', problemType);
    if (priority) query = query.eq('priority', priority);
    if (city) query = query.eq('city', city);

    // Ordenar por fecha de creación
    query = query.order('created_at', { ascending: false });

    const { data: tickets, error } = await query;

    if (error) {
      console.log("Error al obtener tickets:", error);
      return c.json({ error: "Error al obtener tickets" }, 500);
    }

    return c.json({ tickets: tickets || [] });
  } catch (error) {
    console.log("Error al obtener tickets:", error);
    return c.json({ error: "Error al obtener tickets" }, 500);
  }
});

// Obtener un ticket específico
app.get("/make-server-370afec0/tickets/:id", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const ticketId = c.req.param("id");

    // Usar vista normalizada con datos de usuario y experto
    const { data: ticket, error } = await supabase
      .from('tickets_with_details')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error || !ticket) {
      return c.json({ error: "Ticket no encontrado" }, 404);
    }

    return c.json({ ticket });
  } catch (error) {
    console.log("Error al obtener ticket:", error);
    return c.json({ error: "Error al obtener ticket" }, 500);
  }
});

// Asignar ticket a un experto
app.post("/make-server-370afec0/tickets/:id/assign", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'operador') {
      return c.json({ error: "No tienes permiso para asignar tickets" }, 403);
    }

    const ticketId = c.req.param("id");
    const { expertId } = await c.req.json();

    if (!expertId) {
      return c.json({ error: "Se requiere expertId" }, 400);
    }

    // NORMALIZADO: Solo guardamos IDs, no nombres
    // Los nombres se obtienen mediante JOIN en la vista
    const { data: ticket, error } = await supabase
      .from('tickets')
      .update({
        assigned_expert_id: expertId,
        assigned_by_id: user.id,
        assigned_at: new Date().toISOString(),
        status: 'asignado'
      })
      .eq('id', ticketId)
      .select()
      .single();
    
    // Obtener datos del experto solo para el log de actividad
    const { data: expertProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', expertId)
      .single();

    if (error) {
      console.log("Error al asignar ticket:", error);
      return c.json({ error: "Error al asignar ticket" }, 500);
    }

    // Crear actividad
    await supabase.from('ticket_activities').insert({
      ticket_id: ticketId,
      action: 'Ticket asignado',
      performed_by_id: user.id,
      performed_by_name: profile?.name || 'Operador',
      details: `Asignado a ${expertProfile?.name}`
    });

    return c.json({ success: true, ticket });
  } catch (error) {
    console.log("Error al asignar ticket:", error);
    return c.json({ error: "Error al asignar ticket" }, 500);
  }
});

// Actualizar estado de ticket
app.put("/make-server-370afec0/tickets/:id/status", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const ticketId = c.req.param("id");
    const { status } = await c.req.json();

    if (!status) {
      return c.json({ error: "Se requiere status" }, 400);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    const updateData: any = { status };
    
    if (status === 'resuelto') {
      updateData.resolved_at = new Date().toISOString();
    } else if (status === 'cerrado') {
      updateData.closed_at = new Date().toISOString();
    }

    const { data: ticket, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      console.log("Error al actualizar estado:", error);
      return c.json({ error: "Error al actualizar estado" }, 500);
    }

    // Crear actividad
    await supabase.from('ticket_activities').insert({
      ticket_id: ticketId,
      action: 'Estado actualizado',
      performed_by_id: user.id,
      performed_by_name: profile?.name || 'Usuario',
      details: `Nuevo estado: ${status}`
    });

    return c.json({ success: true, ticket });
  } catch (error) {
    console.log("Error al actualizar estado:", error);
    return c.json({ error: "Error al actualizar estado" }, 500);
  }
});

// ============================================
// MENSAJES DE CHAT
// ============================================

// Enviar mensaje
app.post("/make-server-370afec0/messages", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const body = await c.req.json();
    const { ticketId, content } = body;

    if (!ticketId || !content) {
      return c.json({ error: "Faltan campos requeridos" }, 400);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', user.id)
      .single();

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        sender_name: profile?.name || 'Usuario',
        sender_role: profile?.role || 'usuario',
        content
      })
      .select()
      .single();

    if (error) {
      console.log("Error al enviar mensaje:", error);
      return c.json({ error: "Error al enviar mensaje" }, 500);
    }

    return c.json({ success: true, message });
  } catch (error) {
    console.log("Error al enviar mensaje:", error);
    return c.json({ error: "Error al enviar mensaje" }, 500);
  }
});

// Obtener mensajes de un ticket
app.get("/make-server-370afec0/messages/:ticketId", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const ticketId = c.req.param("ticketId");

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      console.log("Error al obtener mensajes:", error);
      return c.json({ error: "Error al obtener mensajes" }, 500);
    }

    return c.json({ messages: messages || [] });
  } catch (error) {
    console.log("Error al obtener mensajes:", error);
    return c.json({ error: "Error al obtener mensajes" }, 500);
  }
});

// ============================================
// EXPERTOS
// ============================================

// Obtener lista de expertos
app.get("/make-server-370afec0/experts", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const { data: experts, error } = await supabase
      .from('experts')
      .select(`
        *,
        profiles!inner(name, email)
      `);

    if (error) {
      console.log("Error al obtener expertos:", error);
      return c.json({ error: "Error al obtener expertos" }, 500);
    }

    // Formatear respuesta
    const formattedExperts = experts?.map(expert => ({
      id: expert.id,
      name: expert.profiles.name,
      email: expert.profiles.email,
      specializations: expert.specializations,
      activeTickets: expert.active_tickets,
      totalResolved: expert.total_resolved
    })) || [];

    return c.json({ experts: formattedExperts });
  } catch (error) {
    console.log("Error al obtener expertos:", error);
    return c.json({ error: "Error al obtener expertos" }, 500);
  }
});

// ============================================
// ACTIVIDADES
// ============================================

// Obtener actividades de un ticket
app.get("/make-server-370afec0/tickets/:id/activities", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const ticketId = c.req.param("id");

    const { data: activities, error } = await supabase
      .from('ticket_activities')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false });

    if (error) {
      console.log("Error al obtener actividades:", error);
      return c.json({ error: "Error al obtener actividades" }, 500);
    }

    return c.json({ activities: activities || [] });
  } catch (error) {
    console.log("Error al obtener actividades:", error);
    return c.json({ error: "Error al obtener actividades" }, 500);
  }
});

// ============================================
// ESTADÍSTICAS
// ============================================

// Obtener estadísticas del dashboard
app.get("/make-server-370afec0/stats", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    // Usar función SQL personalizada
    const { data, error } = await supabase
      .rpc('get_user_stats', { user_id: user.id });

    if (error) {
      console.log("Error al obtener estadísticas:", error);
      return c.json({ error: "Error al obtener estadísticas" }, 500);
    }

    return c.json({ stats: data || {} });
  } catch (error) {
    console.log("Error al obtener estadísticas:", error);
    return c.json({ error: "Error al obtener estadísticas" }, 500);
  }
});

// Health check endpoint
app.get("/make-server-370afec0/health", (c) => {
  return c.json({ status: "ok", database: "PostgreSQL" });
});

Deno.serve(app.fetch);
