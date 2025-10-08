import { useState } from 'react';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { OperatorDashboard } from './components/dashboard/OperatorDashboard';
import { ExpertDashboard } from './components/dashboard/ExpertDashboard';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Toaster } from './components/ui/sonner';
import { User, Settings, Wrench, ArrowRight } from 'lucide-react';

type UserRole = 'selector' | 'usuario' | 'operador' | 'experto';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('selector');

  const renderRoleSelector = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-4">Sistema de Tickets de Soporte</h1>
          <p className="text-xl text-muted-foreground">
            Gestión integral de problemas de red, internet y telefonía
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Usuario */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentRole('usuario')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle>Usuario</CardTitle>
              <p className="text-sm text-muted-foreground">
                Reporta problemas de red y telefonía
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Crear tickets de soporte
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Seguimiento de reportes
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Comunicación con expertos
                </li>
              </ul>
              <Button className="w-full mt-4">
                Acceder como Usuario
              </Button>
            </CardContent>
          </Card>

          {/* Operador */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentRole('operador')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                <Settings className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Operador</CardTitle>
              <p className="text-sm text-muted-foreground">
                Gestiona y asigna tickets a expertos
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Revisar tickets pendientes
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Asignar a expertos especializados
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Monitorear progreso
                </li>
              </ul>
              <Button className="w-full mt-4">
                Acceder como Operador
              </Button>
            </CardContent>
          </Card>

          {/* Experto */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentRole('experto')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
                <Wrench className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle>Experto Técnico</CardTitle>
              <p className="text-sm text-muted-foreground">
                Resuelve problemas técnicos especializados
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Tickets asignados por especialidad
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Chat directo con usuarios
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Resolución de problemas
                </li>
              </ul>
              <Button className="w-full mt-4">
                Acceder como Experto
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="outline">Demo Interactiva</Badge>
            <Badge variant="outline">Datos de Prueba</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Sistema completo de gestión de tickets de soporte técnico con flujo de trabajo integral
          </p>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => {
    switch (currentRole) {
      case 'usuario':
        return <UserDashboard />;
      case 'operador':
        return <OperatorDashboard />;
      case 'experto':
        return <ExpertDashboard />;
      default:
        return renderRoleSelector();
    }
  };

  const getRoleInfo = () => {
    const roles = {
      usuario: { name: 'Usuario', icon: User, color: 'bg-blue-600' },
      operador: { name: 'Operador', icon: Settings, color: 'bg-green-600' },
      experto: { name: 'Experto Técnico', icon: Wrench, color: 'bg-purple-600' }
    };
    return roles[currentRole as keyof typeof roles];
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="min-h-screen bg-background">
      {/* Header cuando hay rol seleccionado */}
      {currentRole !== 'selector' && roleInfo && (
        <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${roleInfo.color}`}>
                  <roleInfo.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-medium">Sistema de Tickets</h2>
                  <p className="text-sm text-muted-foreground">
                    {roleInfo.name}
                  </p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => setCurrentRole('selector')}
              >
                Cambiar Rol
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={currentRole === 'selector' ? '' : 'pt-0'}>
        {renderDashboard()}
      </main>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}