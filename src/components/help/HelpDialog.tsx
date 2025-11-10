import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { User, Settings, Wrench, Ticket, MessageSquare, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ayuda y Soporte - Sistema TELNET</DialogTitle>
          <DialogDescription>
            Guía completa para usar el sistema de gestión de tickets
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visión General</TabsTrigger>
            <TabsTrigger value="usuario">Usuario</TabsTrigger>
            <TabsTrigger value="operador">Operador</TabsTrigger>
            <TabsTrigger value="experto">Experto</TabsTrigger>
          </TabsList>

          {/* VISIÓN GENERAL */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bienvenido a TELNET</CardTitle>
                <CardDescription>
                  Sistema de gestión de tickets de soporte técnico para problemas de red de internet y teléfono
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h3 className="font-medium">Roles del Sistema</h3>
                  
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="bg-blue-100 p-2 rounded">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Usuario</p>
                      <p className="text-sm text-muted-foreground">
                        Crea tickets para reportar problemas de red o teléfono y se comunica con expertos mediante chat
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="bg-green-100 p-2 rounded">
                      <Settings className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Operador</p>
                      <p className="text-sm text-muted-foreground">
                        Recibe tickets entrantes, los analiza y los asigna a expertos especializados según el tipo de problema
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="bg-purple-100 p-2 rounded">
                      <Wrench className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Experto Técnico</p>
                      <p className="text-sm text-muted-foreground">
                        Resuelve casos asignados según su especialidad y se comunica directamente con usuarios mediante chat
                      </p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Importante:</strong> Cada rol tiene acceso a diferentes funcionalidades del sistema. Utiliza las pestañas superiores para ver la guía específica de tu rol.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tipos de Problemas</CardTitle>
                <CardDescription>
                  El sistema maneja 18 categorías específicas de problemas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Badge variant="outline">Internet sin conexión</Badge>
                  <Badge variant="outline">Internet lento</Badge>
                  <Badge variant="outline">Internet intermitente</Badge>
                  <Badge variant="outline">Router apagado</Badge>
                  <Badge variant="outline">Router - Configuración</Badge>
                  <Badge variant="outline">Router - WiFi débil</Badge>
                  <Badge variant="outline">Router - Reinicio constante</Badge>
                  <Badge variant="outline">Fibra sin señal</Badge>
                  <Badge variant="outline">Fibra - ONT apagado</Badge>
                  <Badge variant="outline">ADSL - Desconexiones</Badge>
                  <Badge variant="outline">ADSL lento</Badge>
                  <Badge variant="outline">Teléfono sin línea</Badge>
                  <Badge variant="outline">Teléfono con ruido</Badge>
                  <Badge variant="outline">Teléfono no recibe</Badge>
                  <Badge variant="outline">Teléfono no realiza llamadas</Badge>
                  <Badge variant="outline">Cableado dañado</Badge>
                  <Badge variant="outline">Cableado - Instalación</Badge>
                  <Badge variant="outline">Otro</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GUÍA USUARIO */}
          <TabsContent value="usuario" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Guía para Usuarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    1. Crear un Ticket
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-6">
                    <li>Haz clic en el botón "Crear Nuevo Ticket"</li>
                    <li>Completa el formulario con:
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Título descriptivo del problema</li>
                        <li>Descripción detallada</li>
                        <li>Tipo de problema (selecciona de la lista)</li>
                        <li>Prioridad (baja, media, alta o crítica)</li>
                        <li>Ciudad y dirección donde está el problema</li>
                        <li>Proveedor de servicio (opcional)</li>
                      </ul>
                    </li>
                    <li>Haz clic en "Crear Ticket"</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    2. Seguimiento de Tickets
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Tu dashboard muestra todos tus tickets con su estado actual:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">Pendiente</Badge>
                      <span className="text-muted-foreground">Esperando asignación de operador</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">Asignado</Badge>
                      <span className="text-muted-foreground">Asignado a un experto</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge className="bg-blue-600">En Progreso</Badge>
                      <span className="text-muted-foreground">Experto trabajando en el problema</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge className="bg-green-600">Resuelto</Badge>
                      <span className="text-muted-foreground">Problema solucionado</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    3. Comunicación con Expertos
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-6">
                    <li>Haz clic en "Ver Chat" en el ticket asignado</li>
                    <li>Escribe mensajes para comunicarte con el experto</li>
                    <li>Puedes adjuntar imágenes de evidencia usando el botón de imagen</li>
                    <li>El chat es en tiempo real - recibirás respuestas inmediatas</li>
                  </ol>
                </div>

                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Consejo:</strong> Proporciona la mayor cantidad de detalles posible al crear un ticket. Esto ayudará al experto a resolver tu problema más rápidamente.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GUÍA OPERADOR */}
          <TabsContent value="operador" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Guía para Operadores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">1. Gestión de Tickets Entrantes</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Tu dashboard muestra todos los tickets del sistema con filtros:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li>Filtra por estado (Pendiente, Asignado, En Progreso, Resuelto)</li>
                    <li>Filtra por prioridad (Baja, Media, Alta, Crítica)</li>
                    <li>Busca por texto en título o descripción</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">2. Asignar Tickets a Expertos</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-6">
                    <li>Revisa el tipo de problema del ticket</li>
                    <li>Haz clic en "Asignar" en el ticket pendiente</li>
                    <li>Selecciona un experto de la lista:
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Ver especializaciones del experto</li>
                        <li>Ver carga de trabajo (tickets activos)</li>
                        <li>Ver historial de tickets resueltos</li>
                      </ul>
                    </li>
                    <li>Confirma la asignación</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium mb-2">3. Asignación Inteligente</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    El sistema te ayuda a asignar tickets de forma óptima:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li>Los expertos se muestran con sus especializaciones</li>
                    <li>Se recomienda asignar según especialidad del experto</li>
                    <li>Considera la carga de trabajo actual de cada experto</li>
                    <li>Prioriza tickets de alta prioridad o críticos</li>
                  </ul>
                </div>

                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Consejo:</strong> Asigna tickets rápidamente a expertos especializados para mejorar el tiempo de respuesta y la satisfacción del usuario.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GUÍA EXPERTO */}
          <TabsContent value="experto" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Guía para Expertos Técnicos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">1. Tickets Asignados</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Tu dashboard muestra los tickets asignados a ti:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li>Vista general de todos tus tickets activos</li>
                    <li>Información detallada del problema</li>
                    <li>Datos de contacto del usuario</li>
                    <li>Ubicación del problema (ciudad y dirección)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    2. Chat con Usuarios
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-6">
                    <li>Haz clic en "Abrir Chat" en el ticket asignado</li>
                    <li>Comunícate directamente con el usuario</li>
                    <li>Solicita información adicional si es necesario</li>
                    <li>Comparte instrucciones paso a paso</li>
                    <li>Adjunta imágenes de evidencia o guías visuales</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium mb-2">3. Gestión de Estado del Ticket</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Actualiza el estado según el progreso:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li><strong>Asignado:</strong> Ticket recién asignado a ti</li>
                    <li><strong>En Progreso:</strong> Cambia a este estado cuando comiences a trabajar</li>
                    <li><strong>Resuelto:</strong> Marca como resuelto cuando el problema esté solucionado</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium mb-2">4. Mejores Prácticas</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li>Responde rápidamente a los tickets asignados</li>
                    <li>Mantén al usuario informado del progreso</li>
                    <li>Solicita evidencia fotográfica cuando sea necesario</li>
                    <li>Documenta la solución en el chat para referencia futura</li>
                    <li>Marca como resuelto solo cuando el problema esté completamente solucionado</li>
                  </ul>
                </div>

                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Consejo:</strong> La comunicación clara y rápida con el usuario es clave para resolver problemas eficientemente. Usa el chat en tiempo real para guiar al usuario paso a paso.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>¿Necesitas más ayuda?</strong> Contacta al administrador del sistema o consulta la documentación técnica completa.
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  );
}
