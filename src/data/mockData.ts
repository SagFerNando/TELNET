import { Ticket, Expert, Message, TicketActivity } from '../types';

export const mockTickets: Ticket[] = [
  {
    id: 'TK-001',
    title: 'Sin conexión a internet desde ayer',
    description: 'Desde ayer por la tarde no tengo conexión a internet. El módem está encendido pero no hay señal. He reiniciado el equipo varias veces.',
    problemType: 'internet',
    priority: 'alta',
    status: 'pendiente',
    userId: 'user1',
    userName: 'María González',
    userEmail: 'maria.gonzalez@email.com',
    userPhone: '+52 555 123 4567',
    createdAt: '2024-01-15T14:30:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
    location: 'Colonia Roma Norte, CDMX',
    serviceProvider: 'Telmex'
  },
  {
    id: 'TK-002',
    title: 'Teléfono fijo sin tono',
    description: 'El teléfono fijo no tiene tono de marcado. Verificé todos los cables y están conectados correctamente.',
    problemType: 'telefono',
    priority: 'media',
    status: 'asignado',
    userId: 'user2',
    userName: 'Carlos Ramírez',
    userEmail: 'carlos.ramirez@email.com',
    userPhone: '+52 555 987 6543',
    assignedExpertId: 'exp1',
    assignedExpertName: 'Ana López',
    createdAt: '2024-01-14T09:15:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    location: 'Polanco, CDMX',
    serviceProvider: 'Megacable'
  },
  {
    id: 'TK-003',
    title: 'Internet lento y llamadas entrecortadas',
    description: 'La velocidad de internet es muy lenta, solo 10% de lo contratado. Además las llamadas se cortan constantemente.',
    problemType: 'ambos',
    priority: 'critica',
    status: 'en_progreso',
    userId: 'user3',
    userName: 'Roberto Silva',
    userEmail: 'roberto.silva@email.com',
    userPhone: '+52 555 456 7890',
    assignedExpertId: 'exp2',
    assignedExpertName: 'Miguel Torres',
    createdAt: '2024-01-13T16:45:00Z',
    updatedAt: '2024-01-15T11:30:00Z',
    location: 'Santa Fe, CDMX',
    serviceProvider: 'Totalplay'
  },
  {
    id: 'TK-004',
    title: 'Problema resuelto - Configuración router',
    description: 'Router desconfigurado después de corte de luz. Ya fue solucionado.',
    problemType: 'internet',
    priority: 'baja',
    status: 'resuelto',
    userId: 'user4',
    userName: 'Sandra Méndez',
    userEmail: 'sandra.mendez@email.com',
    userPhone: '+52 555 321 0987',
    assignedExpertId: 'exp1',
    assignedExpertName: 'Ana López',
    createdAt: '2024-01-12T08:20:00Z',
    updatedAt: '2024-01-14T15:45:00Z',
    location: 'Coyoacán, CDMX',
    serviceProvider: 'Izzi'
  }
];

export const mockExperts: Expert[] = [
  {
    id: 'exp1',
    name: 'Ana López',
    email: 'ana.lopez@soporte.com',
    specializations: ['Internet', 'Telefonía', 'Redes'],
    activeTickets: 3,
    totalResolved: 127
  },
  {
    id: 'exp2',
    name: 'Miguel Torres',
    email: 'miguel.torres@soporte.com',
    specializations: ['Internet', 'Fibra Óptica', 'Configuración'],
    activeTickets: 2,
    totalResolved: 89
  },
  {
    id: 'exp3',
    name: 'Carmen Ruiz',
    email: 'carmen.ruiz@soporte.com',
    specializations: ['Telefonía', 'VoIP', 'Equipos'],
    activeTickets: 1,
    totalResolved: 156
  }
];

export const mockMessages: Message[] = [
  {
    id: 'msg1',
    ticketId: 'TK-003',
    senderId: 'exp2',
    senderName: 'Miguel Torres',
    senderRole: 'experto',
    content: 'Hola Roberto, he revisado tu caso. Voy a programar una visita técnica para revisar la instalación. ¿Estarías disponible mañana entre 10-12 hrs?',
    timestamp: '2024-01-15T11:30:00Z'
  },
  {
    id: 'msg2',
    ticketId: 'TK-003',
    senderId: 'user3',
    senderName: 'Roberto Silva',
    senderRole: 'usuario',
    content: 'Perfecto, estaré disponible en ese horario. ¿Necesito tener algo preparado?',
    timestamp: '2024-01-15T11:45:00Z'
  },
  {
    id: 'msg3',
    ticketId: 'TK-003',
    senderId: 'exp2',
    senderName: 'Miguel Torres',
    senderRole: 'experto',
    content: 'Solo asegúrate de tener acceso al área donde están los equipos. Te confirmo la cita por este medio.',
    timestamp: '2024-01-15T12:00:00Z'
  }
];

export const mockActivities: TicketActivity[] = [
  {
    id: 'act1',
    ticketId: 'TK-001',
    action: 'Ticket creado',
    performedBy: 'María González',
    timestamp: '2024-01-15T14:30:00Z'
  },
  {
    id: 'act2',
    ticketId: 'TK-002',
    action: 'Ticket asignado',
    performedBy: 'Operador Sistema',
    timestamp: '2024-01-15T10:00:00Z',
    details: 'Asignado a Ana López'
  },
  {
    id: 'act3',
    ticketId: 'TK-003',
    action: 'Estado cambiado a En Progreso',
    performedBy: 'Miguel Torres',
    timestamp: '2024-01-15T11:30:00Z'
  }
];