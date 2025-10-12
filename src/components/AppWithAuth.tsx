import { useState, useEffect } from 'react';
import { UserDashboard } from './dashboard/UserDashboard';
import { OperatorDashboard } from './dashboard/OperatorDashboard';
import { ExpertDashboard } from './dashboard/ExpertDashboard';
import { LoginForm } from './auth/LoginForm';
import { RegisterForm } from './auth/RegisterForm';
import { DatabaseSetup } from './setup/DatabaseSetup';
import { useAuth } from './auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, User, Settings, Wrench, LogOut, Database } from 'lucide-react';
import { createClient } from '../utils/supabase/client';

export function AppWithAuth() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [showSetup, setShowSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    // Verificar si ya se ejecutó el setup
    checkIfSetupDone();
  }, []);

  const checkIfSetupDone = async () => {
    try {
      // Intentar obtener usuarios de prueba
      const response = await fetch(
        `https://kdhumybrhxpaehnyaymx.supabase.co/functions/v1/make-server-370afec0/health`
      );
      
      if (response.ok) {
        // El servidor está funcionando
        const setupDone = localStorage.getItem('setupCompleted');
        setShowSetup(!setupDone);
      } else {
        setShowSetup(true);
      }
    } catch (error) {
      console.error('Error verificando setup:', error);
      setShowSetup(true);
    } finally {
      setCheckingSetup(false);
    }
  };

  const handleSetupComplete = () => {
    localStorage.setItem('setupCompleted', 'true');
    setShowSetup(false);
  };

  const handleSkipSetup = () => {
    localStorage.setItem('setupCompleted', 'true');
    setShowSetup(false);
  };

  // Mostrar loader mientras se verifica auth
  if (authLoading || checkingSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-muted-foreground">Cargando sistema...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar setup si es necesario
  if (showSetup && !user) {
    return (
      <div>
        <DatabaseSetup />
        <div className="fixed bottom-4 right-4">
          <Button variant="outline" onClick={handleSkipSetup}>
            Ya configuré la base de datos
          </Button>
        </div>
      </div>
    );
  }

  // Mostrar login o registro si no hay usuario
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-4">
          <div className="text-center mb-6">
            <h1 className="text-3xl mb-2">Sistema de Tickets</h1>
            <p className="text-muted-foreground">
              Gestión de soporte técnico
            </p>
          </div>

          {showRegister ? (
            <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
          ) : (
            <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
          )}

          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSetup(true)}
            >
              <Database className="h-4 w-4 mr-2" />
              Configurar Base de Datos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Usuario autenticado - mostrar dashboard según rol
  const getRoleIcon = () => {
    switch (user.role) {
      case 'usuario':
        return User;
      case 'operador':
        return Settings;
      case 'experto':
        return Wrench;
      default:
        return User;
    }
  };

  const getRoleColor = () => {
    switch (user.role) {
      case 'usuario':
        return 'bg-blue-600';
      case 'operador':
        return 'bg-green-600';
      case 'experto':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getRoleName = () => {
    switch (user.role) {
      case 'usuario':
        return 'Usuario';
      case 'operador':
        return 'Operador';
      case 'experto':
        return 'Experto Técnico';
      default:
        return 'Usuario';
    }
  };

  const renderDashboard = () => {
    switch (user.role) {
      case 'usuario':
        return <UserDashboard />;
      case 'operador':
        return <OperatorDashboard />;
      case 'experto':
        return <ExpertDashboard />;
      default:
        return <UserDashboard />;
    }
  };

  const RoleIcon = getRoleIcon();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getRoleColor()}`}>
                <RoleIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-medium">Sistema de Tickets</h2>
                <p className="text-sm text-muted-foreground">
                  {getRoleName()} - {user.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <Badge variant="outline">{user.email}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {renderDashboard()}
      </main>

      {/* Info Footer */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 max-w-xs">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-xs">
              <strong>Modo desarrollo</strong>
              <br />
              Usuario: {user.role} ({user.email})
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
