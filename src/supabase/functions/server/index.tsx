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
  if (!authHeader) {
    console.log("No se proporcionó header de autorización");
    return null;
  }
  
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    console.log("Formato de header de autorización inválido:", authHeader);
    return null;
  }

  const accessToken = parts[1];
  if (!accessToken) {
    console.log("Token de acceso vacío");
    return null;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error) {
      console.log("Error verificando usuario:", error.message);
      return null;
    }
    
    if (!user) {
      console.log("Usuario no encontrado con el token");
      return null;
    }

    console.log("Usuario autenticado:", user.email, "ID:", user.id);
    return user;
  } catch (error: any) {
    console.log("Excepción verificando auth:", error.message || error);
    return null;
  }
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
      city,
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
        city: city || null,
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
        city: city || null,
        role
      });

    if (profileError) {
      console.log("Error al crear perfil:", profileError);
      return c.json({ error: "Error al crear perfil" }, 500);
    }

    // Si es experto, crear registro en tabla experts
    if (role === 'experto') {
      if (!specializations || specializations.length === 0) {
        return c.json({ error: "Los expertos deben tener al menos una especialización" }, 400);
      }

      const { error: expertError } = await supabase
        .from('experts')
        .insert({
          id: userId,
          specializations: specializations || [],
          certifications: certifications || [],
          experience_years: experienceYears || 0,
          department: department || null
        });

      if (expertError) {
        console.log("Error al crear experto:", expertError);
        return c.json({ error: "Error al crear experto" }, 500);
      }
    }

    // Si es operador, crear registro en tabla operators
    if (role === 'operador') {
      if (!shift) {
        return c.json({ error: "Los operadores deben especificar un turno" }, 400);
      }

      const { error: operatorError } = await supabase
        .from('operators')
        .insert({
          id: userId,
          department: department || null,
          shift: shift
        });

      if (operatorError) {
        console.log("Error al crear operador:", operatorError);
        return c.json({ error: "Error al crear operador" }, 500);
      }
    }

    return c.json({ 
      success: true, 
      message: "Usuario registrado exitosamente",
      userId 
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
      console.log("No se pudo verificar autenticación");
      return c.json({ error: "No autorizado" }, 401);
    }

    console.log("Obteniendo perfil para usuario:", user.id);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log("Error al obtener perfil:", profileError);
      
      // Si no existe el perfil, crearlo desde los metadatos de auth
      if (profileError.code === 'PGRST116') {
        console.log("Perfil no existe, creando desde metadatos...");
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || 'Usuario',
            phone: user.user_metadata?.phone || '',
            city: user.user_metadata?.city || null,
            role: user.user_metadata?.role || 'usuario'
          })
          .select()
          .single();

        if (createError) {
          console.log("Error al crear perfil:", createError);
          return c.json({ error: "Error al crear perfil de usuario" }, 500);
        }

        return c.json(newProfile);
      }

      return c.json({ error: "Error al obtener perfil" }, 500);
    }

    if (!profile) {
      console.log("Perfil no encontrado para usuario:", user.id);
      return c.json({ error: "Perfil no encontrado" }, 404);
    }

    console.log("Perfil encontrado:", profile.email, "Rol:", profile.role);

    // Retornar datos base del perfil
    const userData = { ...profile };

    // Si es experto, obtener datos adicionales (opcional, no bloquear si no existe)
    if (profile.role === 'experto') {
      const { data: expertData, error: expertError } = await supabase
        .from('experts')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!expertError && expertData) {
        Object.assign(userData, expertData);
      } else {
        console.log("Advertencia: Experto sin datos adicionales:", expertError?.message);
      }
    }

    // Si es operador, obtener datos adicionales (opcional, no bloquear si no existe)
    if (profile.role === 'operador') {
      const { data: operatorData, error: operatorError } = await supabase
        .from('operators')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!operatorError && operatorData) {
        Object.assign(userData, operatorData);
      } else {
        console.log("Advertencia: Operador sin datos adicionales:", operatorError?.message);
      }
    }

    console.log("Devolviendo datos de usuario con rol:", userData.role);
    return c.json(userData);
  } catch (error: any) {
    console.log("Error inesperado en /auth/me:", error.message || error);
    return c.json({ error: "Error al obtener información del usuario: " + (error.message || 'Error desconocido') }, 500);
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
      return c.json({ error: "Error al crear ticket: " + error.message }, 500);
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

    // Obtener tickets básicos primero
    let query = supabase.from('tickets').select('*');

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

    const { data: rawTickets, error } = await query;

    if (error) {
      console.log("Error al obtener tickets:", error);
      return c.json({ error: "Error al obtener tickets: " + error.message }, 500);
    }

    // Obtener datos de usuarios y expertos por separado para evitar problemas de JOIN
    const userIds = [...new Set(rawTickets?.map(t => t.user_id).filter(Boolean) || [])];
    const expertIds = [...new Set(rawTickets?.map(t => t.assigned_expert_id).filter(Boolean) || [])];

    const { data: users } = await supabase
      .from('profiles')
      .select('id, name, email, phone, city')
      .in('id', userIds);

    const { data: experts } = await supabase
      .from('profiles')
      .select('id, name, email, city')
      .in('id', expertIds);

    const { data: expertData } = await supabase
      .from('experts')
      .select('id, specializations')
      .in('id', expertIds);

    // Combinar datos
    const tickets = rawTickets?.map(ticket => {
      const user = users?.find(u => u.id === ticket.user_id);
      const expert = experts?.find(e => e.id === ticket.assigned_expert_id);
      const expertInfo = expertData?.find(e => e.id === ticket.assigned_expert_id);

      return {
        ...ticket,
        // Mapear nombres de campos para compatibilidad
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        problemType: ticket.problem_type,
        priority: ticket.priority,
        status: ticket.status,
        userId: ticket.user_id,
        assignedExpertId: ticket.assigned_expert_id,
        assignedAt: ticket.assigned_at,
        city: ticket.city,
        address: ticket.address,
        serviceProvider: ticket.service_provider,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        resolvedAt: ticket.resolved_at,
        closedAt: ticket.closed_at,
        // Datos del usuario
        user: user ? {
          name: user.name,
          email: user.email,
          phone: user.phone,
          city: user.city
        } : undefined,
        // Datos del experto asignado
        assignedExpert: expert ? {
          name: expert.name,
          email: expert.email,
          city: expert.city,
          specializations: expertInfo?.specializations || []
        } : undefined
      };
    }) || [];

    return c.json({ tickets });
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

    // Obtener ticket básico
    const { data: rawTicket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error || !rawTicket) {
      return c.json({ error: "Ticket no encontrado" }, 404);
    }

    // Obtener datos del usuario
    const { data: user } = await supabase
      .from('profiles')
      .select('name, email, phone, city')
      .eq('id', rawTicket.user_id)
      .single();

    // Obtener datos del experto si está asignado
    let expert = null;
    let expertInfo = null;
    if (rawTicket.assigned_expert_id) {
      const { data: expertProfile } = await supabase
        .from('profiles')
        .select('name, email, city')
        .eq('id', rawTicket.assigned_expert_id)
        .single();
      
      const { data: expertData } = await supabase
        .from('experts')
        .select('specializations')
        .eq('id', rawTicket.assigned_expert_id)
        .single();
      
      expert = expertProfile;
      expertInfo = expertData;
    }

    // Construir ticket con datos relacionados
    const ticket = {
      ...rawTicket,
      // Mapear nombres de campos para compatibilidad
      problemType: rawTicket.problem_type,
      userId: rawTicket.user_id,
      assignedExpertId: rawTicket.assigned_expert_id,
      assignedAt: rawTicket.assigned_at,
      serviceProvider: rawTicket.service_provider,
      createdAt: rawTicket.created_at,
      updatedAt: rawTicket.updated_at,
      resolvedAt: rawTicket.resolved_at,
      closedAt: rawTicket.closed_at,
      // Datos relacionados
      user: user ? {
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city
      } : undefined,
      assignedExpert: expert ? {
        name: expert.name,
        email: expert.email,
        city: expert.city,
        specializations: expertInfo?.specializations || []
      } : undefined
    };

    return c.json({ ticket });
  } catch (error) {
    console.log("Error al obtener ticket:", error);
    return c.json({ error: "Error al obtener ticket" }, 500);
  }
});

// Asignar ticket a un experto
app.post("/make-server-370afec0/tickets/:id/assign", async (c) => {
  const ticketId = c.req.param("id");
  console.log("🎯 Iniciando asignación - ticketId:", ticketId);
  
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) {
      console.log("❌ Usuario no autorizado");
      return c.json({ error: "No autorizado" }, 401);
    }
    console.log("✅ Usuario autenticado:", user.id);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log("❌ Error obteniendo perfil:", profileError);
      return c.json({ error: "Error obteniendo perfil" }, 500);
    }

    if (profile?.role !== 'operador') {
      console.log("❌ Usuario no es operador, rol:", profile?.role);
      return c.json({ error: "No tienes permiso para asignar tickets" }, 403);
    }
    console.log("✅ Operador verificado:", profile.name);

    const body = await c.req.json();
    console.log("📝 Body recibido:", JSON.stringify(body));
    const { expertId } = body;
    
    if (!expertId) {
      console.log("❌ expertId no proporcionado");
      return c.json({ error: "Se requiere expertId" }, 400);
    }
    console.log("✅ ExpertId recibido:", expertId);

    // Verificar que el ticket existe
    console.log("🔍 Verificando ticket...");
    const { data: existingTicket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, status, problem_type')
      .eq('id', ticketId)
      .single();

    if (ticketError) {
      console.log("❌ Error verificando ticket:", ticketError);
      return c.json({ error: "Ticket no encontrado: " + ticketError.message }, 404);
    }
    console.log("✅ Ticket encontrado:", existingTicket);

    // Verificar que el experto existe en profiles
    console.log("🔍 Verificando experto en profiles...");
    const { data: expertProfile, error: expertError } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('id', expertId)
      .single();

    if (expertError) {
      console.log("❌ Error verificando experto en profiles:", expertError);
      return c.json({ error: "Experto no encontrado en profiles: " + expertError.message }, 404);
    }
    console.log("✅ Experto encontrado en profiles:", expertProfile);

    // Verificar que el experto existe en la tabla experts (requerido por foreign key)
    console.log("🔍 Verificando experto en tabla experts...");
    const { data: expertData, error: expertDataError } = await supabase
      .from('experts')
      .select('id')
      .eq('id', expertId)
      .single();

    if (expertDataError) {
      console.log("❌ Error: Experto no existe en tabla experts:", expertDataError);
      return c.json({ error: "El experto no está registrado en la tabla experts: " + expertDataError.message }, 400);
    }
    console.log("✅ Experto verificado en tabla experts:", expertData.id);

    // Actualizar ticket
    console.log("🔄 Actualizando ticket...");
    const updateData = {
      assigned_expert_id: expertId,
      assigned_by_id: user.id,
      assigned_at: new Date().toISOString(),
      status: 'asignado'
    };
    console.log("📝 Datos de actualización:", updateData);

    const { data: ticket, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      console.log("❌ Error actualizando ticket:", error);
      console.log("❌ Detalles del error:", JSON.stringify(error, null, 2));
      return c.json({ error: "Error al actualizar ticket: " + error.message }, 500);
    }

    console.log("✅ Ticket actualizado exitosamente:", ticket.id);
    return c.json({ success: true, ticket });
  } catch (error: any) {
    console.log("💥 Error crítico:", error);
    console.log("💥 Stack:", error.stack);
    return c.json({ error: "Error interno: " + error.message }, 500);
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

    // Si el estado es resuelto, agregar timestamp
    if (status === 'resuelto') {
      updateData.resolved_at = new Date().toISOString();
    }

    // Si el estado es cerrado, agregar timestamp
    if (status === 'cerrado') {
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
      action: `Estado cambiado a ${status}`,
      performed_by_id: user.id,
      performed_by_name: profile?.name || 'Usuario'
    });

    return c.json({ success: true, ticket });
  } catch (error) {
    console.log("Error al actualizar estado:", error);
    return c.json({ error: "Error al actualizar estado" }, 500);
  }
});

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
// MENSAJES
// ============================================

// Enviar mensaje
app.post("/make-server-370afec0/messages", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const { ticketId, content } = await c.req.json();

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

// Obtener todos los expertos
app.get("/make-server-370afec0/experts", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    // Obtener perfiles de expertos
    const { data: expertProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, city')
      .eq('role', 'experto');

    if (profilesError) {
      console.log("Error al obtener perfiles de expertos:", profilesError);
      return c.json({ error: "Error al obtener expertos: " + profilesError.message }, 500);
    }

    // Obtener datos adicionales de expertos
    const { data: expertData, error: expertError } = await supabase
      .from('experts')
      .select('id, specializations, active_tickets, total_resolved');

    if (expertError) {
      console.log("Error al obtener datos de expertos:", expertError);
      return c.json({ error: "Error al obtener datos de expertos: " + expertError.message }, 500);
    }

    // Combinar datos
    const experts = expertProfiles?.map(profile => {
      const expert = expertData?.find(e => e.id === profile.id);
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        city: profile.city,
        specializations: expert?.specializations || [],
        activeTickets: expert?.active_tickets || 0,
        totalResolved: expert?.total_resolved || 0
      };
    }).sort((a, b) => a.activeTickets - b.activeTickets) || [];

    const error = null; // Ya manejamos errores arriba

    if (error) {
      console.log("Error al obtener expertos:", error);
      return c.json({ error: "Error al obtener expertos" }, 500);
    }

    return c.json({ experts: experts || [] });
  } catch (error) {
    console.log("Error al obtener expertos:", error);
    return c.json({ error: "Error al obtener expertos" }, 500);
  }
});

// ============================================
// ESTADÍSTICAS
// ============================================

app.get("/make-server-370afec0/stats", async (c) => {
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

    let stats = {};

    if (profile?.role === 'operador') {
      // Estadísticas para operador
      const { data: tickets } = await supabase
        .from('tickets')
        .select('status');

      const counts = {
        totalTickets: tickets?.length || 0,
        pendientes: tickets?.filter(t => t.status === 'pendiente').length || 0,
        asignados: tickets?.filter(t => t.status === 'asignado').length || 0,
        enProgreso: tickets?.filter(t => t.status === 'en_progreso').length || 0,
        resueltos: tickets?.filter(t => t.status === 'resuelto').length || 0,
        cerrados: tickets?.filter(t => t.status === 'cerrado').length || 0
      };

      stats = counts;
    } else if (profile?.role === 'experto') {
      // Estadísticas para experto
      const { data: expert } = await supabase
        .from('experts')
        .select('active_tickets, total_resolved')
        .eq('id', user.id)
        .single();

      const { data: tickets } = await supabase
        .from('tickets')
        .select('status')
        .eq('assigned_expert_id', user.id);

      stats = {
        activeTickets: expert?.active_tickets || 0,
        totalResolved: expert?.total_resolved || 0,
        enProgreso: tickets?.filter(t => t.status === 'en_progreso').length || 0,
        resueltos: tickets?.filter(t => t.status === 'resuelto').length || 0
      };
    } else {
      // Estadísticas para usuario
      const { data: tickets } = await supabase
        .from('tickets')
        .select('status')
        .eq('user_id', user.id);

      stats = {
        totalTickets: tickets?.length || 0,
        pendientes: tickets?.filter(t => t.status === 'pendiente').length || 0,
        enProgreso: tickets?.filter(t => ['asignado', 'en_progreso'].includes(t.status)).length || 0,
        resueltos: tickets?.filter(t => t.status === 'resuelto').length || 0
      };
    }

    return c.json({ stats });
  } catch (error) {
    console.log("Error al obtener estadísticas:", error);
    return c.json({ error: "Error al obtener estadísticas" }, 500);
  }
});

// ============================================
// PERFIL
// ============================================

// Actualizar perfil del usuario
app.post("/make-server-370afec0/update-profile", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, name, phone, city } = body;

    if (!userId) {
      return c.json({ error: "userId es requerido" }, 400);
    }

    // Actualizar perfil en la tabla profiles
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        name: name || '',
        phone: phone || '',
        city: city || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.log("Error al actualizar perfil:", updateError);
      return c.json({ error: "Error al actualizar perfil" }, 500);
    }

    return c.json({ 
      success: true, 
      message: "Perfil actualizado exitosamente" 
    });
  } catch (error) {
    console.log("Error al actualizar perfil:", error);
    return c.json({ error: "Error al actualizar perfil" }, 500);
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get("/make-server-370afec0/health", (c) => {
  return c.json({ 
    status: "ok", 
    database: "PostgreSQL",
    timestamp: new Date().toISOString()
  });
});

// Endpoint de prueba para verificar estructura de tablas
app.get("/make-server-370afec0/debug/tables", async (c) => {
  try {
    const { data: tickets } = await supabase.from('tickets').select('*').limit(1);
    const { data: profiles } = await supabase.from('profiles').select('*').limit(1);
    const { data: experts } = await supabase.from('experts').select('*').limit(1);
    
    return c.json({
      tickets: tickets?.[0] || "No data",
      profiles: profiles?.[0] || "No data", 
      experts: experts?.[0] || "No data"
    });
  } catch (error: any) {
    return c.json({ error: error.message });
  }
});

// Start server
Deno.serve(app.fetch);