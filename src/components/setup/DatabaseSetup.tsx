import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Loader2, Database, Users, Ticket, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { seedTestUsers, seedTestTickets } from '../../utils/seed-data';
import { createClient } from '../../utils/supabase/client';
import { Separator } from '../ui/separator';

export function DatabaseSetup() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'users' | 'login' | 'tickets' | 'complete'>('idle');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateUsers = async () => {
    setLoading(true);
    setError(null);
    setStep('users');

    try {
      const userResults = await seedTestUsers();
      setResults(userResults);
      setStep('login');
    } catch (err: any) {
      setError(err.message || 'Error al crear usuarios');
      setStep('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAndCreateTickets = async () => {
    setLoading(true);
    setError(null);

    try {
      // Iniciar sesión con usuario de prueba
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: 'usuario@test.com',
        password: 'test123',
      });

      if (signInError) throw signInError;

      // Esperar un momento para que se establezca la sesión
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Crear tickets de prueba
      const ticketResults = await seedTestTickets();
      
      setResults((prev: any) => ({
        ...prev,
        tickets: ticketResults
      }));

      // Cerrar sesión
      await supabase.auth.signOut();

      setStep('complete');
      
      // Marcar como completado en localStorage
      localStorage.setItem('setupCompleted', 'true');
    } catch (err: any) {
      setError(err.message || 'Error al crear tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleFullSetup = async () => {
    await handleCreateUsers();
    // Esperamos a que termine la creación de usuarios
    setTimeout(async () => {
      await handleLoginAndCreateTickets();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Configuración de Base de Datos</CardTitle>
              <CardDescription>
                Inicializa la base de datos con usuarios y tickets de prueba
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Estado actual */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Crear usuarios de prueba</span>
              </div>
              {step === 'users' && loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : ['login', 'tickets', 'complete'].includes(step) ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                <span>Crear tickets de ejemplo</span>
              </div>
              {step === 'tickets' && loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : step === 'complete' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
              )}
            </div>
          </div>

          {/* Errores */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Resultados */}
          {results && (
            <div className="space-y-3">
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Resultados:</h3>
                <div className="space-y-2 text-sm">
                  {results.success && results.success.length > 0 && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="font-medium text-green-900 mb-1">
                        ✅ Usuarios creados: {results.success.length}
                      </p>
                      <div className="space-y-1 text-green-700">
                        {results.success.slice(0, 3).map((msg: string, i: number) => (
                          <p key={i}>{msg}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.errors && results.errors.length > 0 && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="font-medium text-yellow-900 mb-1">
                        ⚠️ Algunos usuarios ya existen
                      </p>
                      <p className="text-xs text-yellow-700">
                        Esto es normal si ya ejecutaste la configuración anteriormente
                      </p>
                    </div>
                  )}

                  {results.tickets && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium text-blue-900">
                        🎫 Tickets creados: {results.tickets.success?.length || 0}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="space-y-3">
            {step === 'idle' && (
              <>
                <Button 
                  onClick={handleFullSetup} 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Configurando...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Configuración Completa (Recomendado)
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={handleCreateUsers}
                    variant="outline"
                    disabled={loading}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Solo Usuarios
                  </Button>
                  <Button 
                    onClick={handleLoginAndCreateTickets}
                    variant="outline"
                    disabled={loading}
                  >
                    <Ticket className="mr-2 h-4 w-4" />
                    Solo Tickets
                  </Button>
                </div>
              </>
            )}

            {step === 'login' && (
              <Button 
                onClick={handleLoginAndCreateTickets}
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando tickets...
                  </>
                ) : (
                  'Continuar: Crear Tickets'
                )}
              </Button>
            )}

            {step === 'complete' && (
              <>
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-900">
                    ¡Base de datos configurada correctamente! Ya puedes comenzar a usar el sistema.
                  </AlertDescription>
                </Alert>
                
                <Button 
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Continuar al Login
                </Button>
              </>
            )}
          </div>

          {/* Información adicional */}
          <Separator />

          <div className="space-y-3">
            <h3 className="font-medium">Usuarios creados:</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                <div>
                  <Badge variant="outline" className="mr-2">Usuario</Badge>
                  <span>usuario@test.com</span>
                </div>
                <code className="text-xs bg-white px-2 py-1 rounded">test123</code>
              </div>
              <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                <div>
                  <Badge variant="outline" className="mr-2">Operador</Badge>
                  <span>operador@test.com</span>
                </div>
                <code className="text-xs bg-white px-2 py-1 rounded">test123</code>
              </div>
              <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                <div>
                  <Badge variant="outline" className="mr-2">Experto</Badge>
                  <span>experto1@test.com</span>
                </div>
                <code className="text-xs bg-white px-2 py-1 rounded">test123</code>
              </div>
            </div>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              💡 <strong>Nota:</strong> Esta configuración solo necesita ejecutarse una vez. 
              Si los usuarios ya existen, recibirás un aviso pero no afectará el funcionamiento.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
