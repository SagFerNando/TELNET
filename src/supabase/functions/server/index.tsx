import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Crear cliente Supabase con service role key para el backend
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
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

// Middleware para verificar autenticación (opcional según la ruta)
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
    const { email, password, name, phone, role } = body;

    if (!email || !password || !name || !role) {
      return c.json({ error: "Faltan campos requeridos" }, 400);
    }

    // Validar rol
    if (!["usuario", "operador", "experto"].includes(role)) {
      return c.json({ error: "Rol inválido" }, 400);
    }

    // Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name, 
        phone: phone || "",
        role 
      },
      // Confirmar email automáticamente (no hay servidor de email configurado)
      email_confirm: true,
    });

    if (error) {
      console.log("Error al crear usuario:", error);
      return c.json({ error: error.message }, 400);
    }

    // Guardar información adicional del usuario en KV store
    const userId = data.user.id;
    await kv.set(`user:${userId}`, {
      id: userId,
      name,
      email,
      phone: phone || "",
      role,
      createdAt: new Date().toISOString(),
    });

    // Si es experto, crear perfil de experto
    if (role === "experto") {
      await kv.set(`expert:${userId}`, {
        id: userId,
        name,
        email,
        specializations: body.specializations || [],
        activeTickets: 0,
        totalResolved: 0,
      });
    }

    return c.json({ 
      success: true, 
      user: data.user,
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

    const userData = await kv.get(`user:${user.id}`);
    
    return c.json({ 
      id: user.id,
      email: user.email,
      ...user.user_metadata,
      ...userData
    });
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
    const { title, description, problemType, priority, location, serviceProvider } = body;

    if (!title || !description || !problemType || !priority) {
      return c.json({ error: "Faltan campos requeridos" }, 400);
    }

    const ticketId = crypto.randomUUID();
    const userData = await kv.get(`user:${user.id}`);
    
    const ticket = {
      id: ticketId,
      title,
      description,
      problemType,
      priority,
      status: "pendiente",
      userId: user.id,
      userName: userData?.name || user.user_metadata.name || "Usuario",
      userEmail: user.email || "",
      userPhone: userData?.phone || user.user_metadata.phone || "",
      location: location || "",
      serviceProvider: serviceProvider || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`ticket:${ticketId}`, ticket);
    
    // Agregar ticket a la lista de tickets del usuario
    const userTicketsKey = `user_tickets:${user.id}`;
    const userTickets = await kv.get(userTicketsKey) || [];
    userTickets.push(ticketId);
    await kv.set(userTicketsKey, userTickets);

    // Agregar a lista de todos los tickets
    const allTicketsKey = "all_tickets";
    const allTickets = await kv.get(allTicketsKey) || [];
    allTickets.push(ticketId);
    await kv.set(allTicketsKey, allTickets);

    // Registrar actividad
    await addTicketActivity(ticketId, "Ticket creado", user.id, userData?.name || "Usuario");

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

    const userData = await kv.get(`user:${user.id}`);
    const userRole = userData?.role || user.user_metadata.role;

    const status = c.req.query("status");
    const problemType = c.req.query("problemType");
    const priority = c.req.query("priority");

    let ticketIds: string[] = [];

    // Obtener tickets según el rol
    if (userRole === "usuario") {
      // Usuarios solo ven sus propios tickets
      ticketIds = await kv.get(`user_tickets:${user.id}`) || [];
    } else if (userRole === "experto") {
      // Expertos ven tickets asignados a ellos
      ticketIds = await kv.get(`expert_tickets:${user.id}`) || [];
    } else {
      // Operadores ven todos los tickets
      ticketIds = await kv.get("all_tickets") || [];
    }

    // Obtener datos de todos los tickets
    const tickets = await Promise.all(
      ticketIds.map(async (id) => await kv.get(`ticket:${id}`))
    );

    // Filtrar tickets nulos y aplicar filtros
    let filteredTickets = tickets.filter((t) => t !== null);

    if (status) {
      filteredTickets = filteredTickets.filter((t) => t.status === status);
    }
    if (problemType) {
      filteredTickets = filteredTickets.filter((t) => t.problemType === problemType);
    }
    if (priority) {
      filteredTickets = filteredTickets.filter((t) => t.priority === priority);
    }

    // Ordenar por fecha de creación (más recientes primero)
    filteredTickets.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json({ tickets: filteredTickets });
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
    const ticket = await kv.get(`ticket:${ticketId}`);

    if (!ticket) {
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

    const userData = await kv.get(`user:${user.id}`);
    const userRole = userData?.role || user.user_metadata.role;

    // Solo operadores pueden asignar tickets
    if (userRole !== "operador") {
      return c.json({ error: "No tienes permiso para asignar tickets" }, 403);
    }

    const ticketId = c.req.param("id");
    const { expertId } = await c.req.json();

    if (!expertId) {
      return c.json({ error: "Se requiere expertId" }, 400);
    }

    const ticket = await kv.get(`ticket:${ticketId}`);
    if (!ticket) {
      return c.json({ error: "Ticket no encontrado" }, 404);
    }

    const expert = await kv.get(`expert:${expertId}`);
    if (!expert) {
      return c.json({ error: "Experto no encontrado" }, 404);
    }

    // Actualizar ticket
    ticket.assignedExpertId = expertId;
    ticket.assignedExpertName = expert.name;
    ticket.status = "asignado";
    ticket.updatedAt = new Date().toISOString();
    await kv.set(`ticket:${ticketId}`, ticket);

    // Agregar ticket a la lista del experto
    const expertTicketsKey = `expert_tickets:${expertId}`;
    const expertTickets = await kv.get(expertTicketsKey) || [];
    if (!expertTickets.includes(ticketId)) {
      expertTickets.push(ticketId);
      await kv.set(expertTicketsKey, expertTickets);
    }

    // Actualizar contador de tickets activos del experto
    expert.activeTickets = (expert.activeTickets || 0) + 1;
    await kv.set(`expert:${expertId}`, expert);

    // Registrar actividad
    await addTicketActivity(
      ticketId, 
      "Ticket asignado", 
      user.id, 
      userData?.name || "Operador",
      `Asignado a ${expert.name}`
    );

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

    const ticket = await kv.get(`ticket:${ticketId}`);
    if (!ticket) {
      return c.json({ error: "Ticket no encontrado" }, 404);
    }

    const previousStatus = ticket.status;
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    await kv.set(`ticket:${ticketId}`, ticket);

    // Si el ticket se marca como resuelto/cerrado, actualizar estadísticas del experto
    if ((status === "resuelto" || status === "cerrado") && ticket.assignedExpertId) {
      const expert = await kv.get(`expert:${ticket.assignedExpertId}`);
      if (expert) {
        expert.activeTickets = Math.max((expert.activeTickets || 0) - 1, 0);
        if (status === "resuelto") {
          expert.totalResolved = (expert.totalResolved || 0) + 1;
        }
        await kv.set(`expert:${ticket.assignedExpertId}`, expert);
      }
    }

    const userData = await kv.get(`user:${user.id}`);
    await addTicketActivity(
      ticketId,
      "Estado actualizado",
      user.id,
      userData?.name || "Usuario",
      `De "${previousStatus}" a "${status}"`
    );

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

    const ticket = await kv.get(`ticket:${ticketId}`);
    if (!ticket) {
      return c.json({ error: "Ticket no encontrado" }, 404);
    }

    const userData = await kv.get(`user:${user.id}`);
    const senderRole = userData?.role || user.user_metadata.role;

    const messageId = crypto.randomUUID();
    const message = {
      id: messageId,
      ticketId,
      senderId: user.id,
      senderName: userData?.name || user.user_metadata.name || "Usuario",
      senderRole,
      content,
      timestamp: new Date().toISOString(),
    };

    await kv.set(`message:${messageId}`, message);

    // Agregar mensaje a la lista de mensajes del ticket
    const ticketMessagesKey = `ticket_messages:${ticketId}`;
    const ticketMessages = await kv.get(ticketMessagesKey) || [];
    ticketMessages.push(messageId);
    await kv.set(ticketMessagesKey, ticketMessages);

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
    const ticket = await kv.get(`ticket:${ticketId}`);
    
    if (!ticket) {
      return c.json({ error: "Ticket no encontrado" }, 404);
    }

    const messageIds = await kv.get(`ticket_messages:${ticketId}`) || [];
    const messages = await Promise.all(
      messageIds.map(async (id: string) => await kv.get(`message:${id}`))
    );

    // Filtrar mensajes nulos y ordenar por timestamp
    const sortedMessages = messages
      .filter((m) => m !== null)
      .sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

    return c.json({ messages: sortedMessages });
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

    // Obtener todos los expertos
    const allKeys = await kv.getByPrefix("expert:");
    const experts = allKeys.map(item => item.value).filter(e => e !== null);

    return c.json({ experts });
  } catch (error) {
    console.log("Error al obtener expertos:", error);
    return c.json({ error: "Error al obtener expertos" }, 500);
  }
});

// ============================================
// ACTIVIDADES
// ============================================

// Función auxiliar para registrar actividades
async function addTicketActivity(
  ticketId: string,
  action: string,
  userId: string,
  performedBy: string,
  details?: string
) {
  const activityId = crypto.randomUUID();
  const activity = {
    id: activityId,
    ticketId,
    action,
    performedBy,
    timestamp: new Date().toISOString(),
    details: details || "",
  };

  await kv.set(`activity:${activityId}`, activity);

  const ticketActivitiesKey = `ticket_activities:${ticketId}`;
  const activities = await kv.get(ticketActivitiesKey) || [];
  activities.push(activityId);
  await kv.set(ticketActivitiesKey, activities);
}

// Obtener actividades de un ticket
app.get("/make-server-370afec0/tickets/:id/activities", async (c) => {
  try {
    const user = await verifyAuth(c.req.header("Authorization"));
    if (!user) {
      return c.json({ error: "No autorizado" }, 401);
    }

    const ticketId = c.req.param("id");
    const activityIds = await kv.get(`ticket_activities:${ticketId}`) || [];
    
    const activities = await Promise.all(
      activityIds.map(async (id: string) => await kv.get(`activity:${id}`))
    );

    const sortedActivities = activities
      .filter((a) => a !== null)
      .sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    return c.json({ activities: sortedActivities });
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

    const userData = await kv.get(`user:${user.id}`);
    const userRole = userData?.role || user.user_metadata.role;

    let stats = {};

    if (userRole === "operador") {
      const allTicketIds = await kv.get("all_tickets") || [];
      const allTickets = await Promise.all(
        allTicketIds.map(async (id: string) => await kv.get(`ticket:${id}`))
      );

      const validTickets = allTickets.filter(t => t !== null);

      stats = {
        totalTickets: validTickets.length,
        pendientes: validTickets.filter(t => t.status === "pendiente").length,
        asignados: validTickets.filter(t => t.status === "asignado").length,
        enProgreso: validTickets.filter(t => t.status === "en_progreso").length,
        resueltos: validTickets.filter(t => t.status === "resuelto").length,
        cerrados: validTickets.filter(t => t.status === "cerrado").length,
      };
    } else if (userRole === "experto") {
      const expertTicketIds = await kv.get(`expert_tickets:${user.id}`) || [];
      const expertTickets = await Promise.all(
        expertTicketIds.map(async (id: string) => await kv.get(`ticket:${id}`))
      );

      const validTickets = expertTickets.filter(t => t !== null);
      const expert = await kv.get(`expert:${user.id}`);

      stats = {
        activeTickets: expert?.activeTickets || 0,
        totalResolved: expert?.totalResolved || 0,
        enProgreso: validTickets.filter(t => t.status === "en_progreso").length,
        resueltos: validTickets.filter(t => t.status === "resuelto").length,
      };
    } else {
      // Usuario
      const userTicketIds = await kv.get(`user_tickets:${user.id}`) || [];
      const userTickets = await Promise.all(
        userTicketIds.map(async (id: string) => await kv.get(`ticket:${id}`))
      );

      const validTickets = userTickets.filter(t => t !== null);

      stats = {
        totalTickets: validTickets.length,
        pendientes: validTickets.filter(t => t.status === "pendiente").length,
        enProgreso: validTickets.filter(t => t.status === "en_progreso").length,
        resueltos: validTickets.filter(t => t.status === "resuelto").length,
      };
    }

    return c.json({ stats });
  } catch (error) {
    console.log("Error al obtener estadísticas:", error);
    return c.json({ error: "Error al obtener estadísticas" }, 500);
  }
});

// Health check endpoint
app.get("/make-server-370afec0/health", (c) => {
  return c.json({ status: "ok" });
});

Deno.serve(app.fetch);
