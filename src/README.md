# Sistema de Tickets de Soporte

Sistema completo de gestión de tickets de soporte técnico para problemas de red, internet y telefonía con interfaces específicas para cada rol de usuario.

## 🚀 Características

- **Dashboard de Usuario**: Creación y seguimiento de tickets
- **Dashboard de Operador**: Gestión y asignación de tickets a expertos
- **Dashboard de Experto**: Atención especializada y chat directo con usuarios
- **Sistema de Chat**: Comunicación en tiempo real entre expertos y usuarios
- **Filtros Avanzados**: Búsqueda y filtrado por estado, prioridad, tipo de problema
- **Responsive Design**: Optimizado para desktop y móvil

## 🛠️ Tecnologías

- **React 18** + **TypeScript**
- **Tailwind CSS v4** (alpha)
- **Vite** como bundler
- **Radix UI** para componentes accesibles
- **Lucide React** para iconos
- **Sonner** para notificaciones

## 📋 Prerrequisitos

- Node.js 18+ 
- npm o yarn

## 🔧 Instalación y Setup

### ⚡ Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar en desarrollo
npm run dev

# 3. Abrir en navegador
# http://localhost:5173
```

### 🗄️ Configuración de Base de Datos (OBLIGATORIO)

**El sistema requiere PostgreSQL configurado. Elige una opción:**

#### Opción A: PostgreSQL (Recomendado para Producción)
1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Abre **SQL Editor**
3. Ejecuta las migraciones de `/docs/DATABASE-MIGRATIONS.md`
4. Sigue la guía completa en **`/SETUP-SQL.md`**

#### Opción B: KV Store (Solo para Desarrollo Rápido)
1. Abre la aplicación
2. Click en "Configurar Base de Datos"
3. Click en "Configuración Completa"

**Ver `/NUEVAS-FUNCIONALIDADES.md` para comparación detallada**

## 📁 Estructura del Proyecto

```
├── App.tsx                     # Componente principal
├── src/
│   └── main.tsx               # Punto de entrada
├── components/
│   ├── dashboard/             # Dashboards por rol
│   │   ├── UserDashboard.tsx
│   │   ├── OperatorDashboard.tsx
│   │   └── ExpertDashboard.tsx
│   ├── user/                  # Componentes específicos de usuario
│   ├── operator/              # Componentes específicos de operador
│   ├── expert/                # Componentes específicos de experto
│   ├── shared/                # Componentes compartidos
│   └── ui/                    # Componentes de UI base (shadcn/ui)
├── data/
│   └── mockData.ts           # Datos de prueba
├── types/
│   └── index.ts              # Definiciones de tipos TypeScript
└── styles/
    └── globals.css           # Estilos globales + Tailwind
```

## 👥 Roles de Usuario

### 🔵 Usuario
- Crear tickets de soporte detallados
- Seguimiento del estado de sus reportes
- Comunicación directa con expertos asignados

### 🟢 Operador  
- Ver todos los tickets pendientes
- Asignar tickets a expertos especializados
- Filtrar y buscar tickets por múltiples criterios
- Monitorear el progreso general

### 🟣 Experto Técnico
- Recibir tickets asignados por especialidad
- Chat en tiempo real con usuarios
- Cambiar estados de tickets
- Gestionar múltiples casos simultáneamente

## 🎯 Funcionalidades Principales

### Gestión de Tickets
- Creación con formulario completo (problema, ubicación, contacto, prioridad)
- Estados: Pendiente → Asignado → En Progreso → Resuelto → Cerrado
- Tipos: Internet, Teléfono, Ambos
- Prioridades: Baja, Media, Alta, Crítica

### Sistema de Asignación Inteligente
- Asignación basada en especialización del experto
- Balanceo de carga de trabajo
- Recomendaciones automáticas de expertos

### Comunicación
- Chat bidireccional experto-usuario
- Mensajes con timestamp y identificación de emisor
- Plantillas de respuesta rápida
- Historial completo de conversación

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción  
- `npm run preview` - Preview del build
- `npm run lint` - Linting con ESLint

## 📱 Responsive Design

El sistema está completamente optimizado para:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🎨 Personalización

### Temas
El sistema utiliza CSS variables para fácil personalización de colores y temas. Modifica `styles/globals.css` para cambiar la apariencia.

### Componentes
Los componentes UI están basados en shadcn/ui y son completamente personalizables.

## 📊 Datos de Demostración

El sistema incluye datos mock realistas para demostrar todas las funcionalidades:
- 4 tickets de ejemplo en diferentes estados
- 3 expertos con especialidades variadas  
- Mensajes de chat de muestra
- Estadísticas y métricas de rendimiento

## 🚀 Despliegue

Para producción:
```bash
npm run build
npm run preview
```

Los archivos de build se generan en la carpeta `dist/`.

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

### Documentación Completa

- 📖 **[SETUP-SQL.md](SETUP-SQL.md)** - Guía completa de configuración con PostgreSQL
- ✨ **[NUEVAS-FUNCIONALIDADES.md](NUEVAS-FUNCIONALIDADES.md)** - Todas las nuevas funcionalidades
- 🗄️ **[DATABASE-MIGRATIONS.md](docs/DATABASE-MIGRATIONS.md)** - Migraciones SQL
- 🔄 **[MIGRATION-GUIDE.md](docs/MIGRATION-GUIDE.md)** - Migrar de KV a SQL
- 🏗️ **[ARQUITECTURA.md](docs/ARQUITECTURA.md)** - Arquitectura del sistema

### Problemas Comunes

Ver sección de troubleshooting en `/SETUP-SQL.md`

Para soporte adicional, abre un issue en el repositorio.