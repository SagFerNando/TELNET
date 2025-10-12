import { fetchFromServer } from './supabase/client';

/**
 * Crear usuarios de prueba en la base de datos
 * Solo ejecutar una vez al iniciar el proyecto
 */
export async function seedTestUsers() {
  const users = [
    {
      email: 'usuario@test.com',
      password: 'test123',
      name: 'Juan Pérez',
      phone: '+34 600 123 456',
      role: 'usuario'
    },
    {
      email: 'usuario2@test.com',
      password: 'test123',
      name: 'Laura Martínez',
      phone: '+34 600 234 567',
      role: 'usuario'
    },
    {
      email: 'operador@test.com',
      password: 'test123',
      name: 'María García',
      phone: '+34 600 345 678',
      role: 'operador'
    },
    {
      email: 'experto1@test.com',
      password: 'test123',
      name: 'Carlos Técnico',
      phone: '+34 600 456 789',
      role: 'experto',
      specializations: ['internet', 'router', 'fibra', 'adsl']
    },
    {
      email: 'experto2@test.com',
      password: 'test123',
      name: 'Ana Soporte',
      phone: '+34 600 567 890',
      role: 'experto',
      specializations: ['telefono', 'voip', 'centralita', 'rdsi']
    },
    {
      email: 'experto3@test.com',
      password: 'test123',
      name: 'Pedro Redes',
      phone: '+34 600 678 901',
      role: 'experto',
      specializations: ['internet', 'telefono', 'red', 'cableado']
    }
  ];

  console.log('🌱 Iniciando creación de usuarios de prueba...');

  const results = {
    success: [] as string[],
    errors: [] as string[]
  };

  for (const user of users) {
    try {
      await fetchFromServer('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(user)
      });
      results.success.push(`✅ ${user.role}: ${user.email}`);
      console.log(`✅ Usuario ${user.role} creado: ${user.email}`);
    } catch (error: any) {
      results.errors.push(`❌ ${user.email}: ${error.message}`);
      console.log(`⚠️ Error al crear ${user.email}:`, error.message);
    }
  }

  console.log('\n📊 Resumen:');
  console.log(`Exitosos: ${results.success.length}`);
  console.log(`Errores: ${results.errors.length}`);
  
  if (results.success.length > 0) {
    console.log('\n✅ Usuarios creados:');
    results.success.forEach(msg => console.log(msg));
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errores:');
    results.errors.forEach(msg => console.log(msg));
  }

  return results;
}

/**
 * Crear tickets de ejemplo para testing
 * Requiere estar autenticado como usuario
 */
export async function seedTestTickets() {
  const tickets = [
    {
      title: 'Internet muy lento desde ayer',
      description: 'La velocidad de descarga es muy baja, páginas tardan mucho en cargar. He reiniciado el router pero sigue igual.',
      problemType: 'internet',
      priority: 'media',
      location: 'Oficina Norte - Despacho 205',
      serviceProvider: 'Movistar'
    },
    {
      title: 'No funciona el teléfono fijo',
      description: 'Al descolgar no hay tono de llamada. La línea está completamente muerta. Necesito solución urgente.',
      problemType: 'telefono',
      priority: 'alta',
      location: 'Recepción Principal',
      serviceProvider: 'Vodafone'
    },
    {
      title: 'Cortes intermitentes de conexión',
      description: 'Tanto internet como teléfono se cortan cada 10-15 minutos. Muy molesto para trabajar.',
      problemType: 'ambos',
      priority: 'critica',
      location: 'Oficina Central - Sala de Juntas',
      serviceProvider: 'Orange'
    },
    {
      title: 'No puedo conectarme al WiFi',
      description: 'El WiFi aparece pero dice "Sin acceso a Internet". Cable funciona bien.',
      problemType: 'internet',
      priority: 'baja',
      location: 'Oficina Sur - Planta 1',
      serviceProvider: 'Jazztel'
    },
    {
      title: 'Llamadas con mucho ruido',
      description: 'Al hacer llamadas se escucha mucho ruido de fondo e interferencias. A veces se corta.',
      problemType: 'telefono',
      priority: 'media',
      location: 'Atención al Cliente',
      serviceProvider: 'Vodafone'
    }
  ];

  console.log('🎫 Creando tickets de prueba...');

  const results = {
    success: [] as string[],
    errors: [] as string[]
  };

  for (const ticket of tickets) {
    try {
      const response = await fetchFromServer('/tickets', {
        method: 'POST',
        body: JSON.stringify(ticket)
      });
      results.success.push(`✅ ${ticket.title}`);
      console.log(`✅ Ticket creado: ${ticket.title}`);
    } catch (error: any) {
      results.errors.push(`❌ ${ticket.title}: ${error.message}`);
      console.log(`⚠️ Error al crear ticket:`, error.message);
    }
  }

  console.log('\n📊 Resumen de tickets:');
  console.log(`Exitosos: ${results.success.length}`);
  console.log(`Errores: ${results.errors.length}`);

  return results;
}

/**
 * Ejecutar seeding completo (usuarios + tickets)
 */
export async function seedAll() {
  console.log('🚀 Iniciando seeding completo...\n');
  
  // Crear usuarios
  const userResults = await seedTestUsers();
  
  console.log('\n⏳ Esperando 2 segundos antes de crear tickets...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Para crear tickets, necesitamos estar autenticados
  console.log('ℹ️ Para crear tickets de prueba, ejecuta:');
  console.log('1. Inicia sesión con usuario@test.com / test123');
  console.log('2. Ejecuta: await seedTestTickets()');
  
  return {
    users: userResults,
    message: 'Usuarios creados. Inicia sesión para crear tickets de prueba.'
  };
}

// Exponer funciones globalmente para facilitar uso desde consola
if (typeof window !== 'undefined') {
  (window as any).seedTestUsers = seedTestUsers;
  (window as any).seedTestTickets = seedTestTickets;
  (window as any).seedAll = seedAll;
}
