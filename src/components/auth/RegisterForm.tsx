import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Checkbox } from '../ui/checkbox';
import { Loader2, Mail, Lock, User, Phone, Briefcase, Award } from 'lucide-react';
import { useAuth } from './AuthProvider';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { signUp } = useAuth();
  
  // Campos básicos
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'usuario' | 'operador' | 'experto'>('usuario');
  
  // Campos para expertos
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [certifications, setCertifications] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [department, setDepartment] = useState('');
  
  // Campos para operadores
  const [shift, setShift] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableSpecializations = [
    'Internet',
    'Router',
    'Fibra Óptica',
    'ADSL',
    'Teléfono Fijo',
    'VoIP',
    'Centralita',
    'RDSI',
    'Cableado',
    'Redes'
  ];

  const handleSpecializationToggle = (spec: string) => {
    setSpecializations(prev =>
      prev.includes(spec)
        ? prev.filter(s => s !== spec)
        : [...prev, spec]
    );
  };

  const validateForm = (): string | null => {
    if (!email || !password || !name) {
      return 'Por favor completa todos los campos obligatorios';
    }

    if (password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }

    if (password !== confirmPassword) {
      return 'Las contraseñas no coinciden';
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return 'Email inválido';
    }

    if (role === 'experto' && specializations.length === 0) {
      return 'Los expertos deben seleccionar al menos una especialización';
    }

    if (role === 'operador' && !shift) {
      return 'Los operadores deben seleccionar un turno';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      // Preparar datos adicionales según el rol
      const additionalData: any = {
        department: department || null
      };

      if (role === 'experto') {
        additionalData.specializations = specializations;
        additionalData.certifications = certifications.split(',').map(c => c.trim()).filter(c => c);
        additionalData.experienceYears = parseInt(experienceYears) || 0;
      }

      if (role === 'operador') {
        additionalData.shift = shift;
      }

      await signUp(email, password, name, phone, role, additionalData);
      
      // Éxito - el AuthProvider redirigirá automáticamente
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Crear Cuenta</CardTitle>
        <CardDescription>
          Completa el formulario para registrarte en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Tipo de Usuario */}
          <div className="space-y-2">
            <Label htmlFor="role">Tipo de Usuario *</Label>
            <Select
              value={role}
              onValueChange={(value: any) => setRole(value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usuario">👤 Usuario - Reportar problemas</SelectItem>
                <SelectItem value="operador">⚙️ Operador - Gestionar tickets</SelectItem>
                <SelectItem value="experto">🔧 Experto Técnico - Resolver problemas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Información Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono {role !== 'usuario' && '*'}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+34 600 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9"
                  required={role !== 'usuario'}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repetir contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Campos específicos para EXPERTOS */}
          {role === 'experto' && (
            <>
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Información Profesional
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Especializaciones * (selecciona al menos una)</Label>
                    <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-muted/50">
                      {availableSpecializations.map(spec => (
                        <div key={spec} className="flex items-center space-x-2">
                          <Checkbox
                            id={`spec-${spec}`}
                            checked={specializations.includes(spec)}
                            onCheckedChange={() => handleSpecializationToggle(spec)}
                            disabled={loading}
                          />
                          <label
                            htmlFor={`spec-${spec}`}
                            className="text-sm cursor-pointer"
                          >
                            {spec}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experienceYears">Años de Experiencia</Label>
                      <Input
                        id="experienceYears"
                        type="number"
                        min="0"
                        max="50"
                        placeholder="5"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Departamento</Label>
                      <Input
                        id="department"
                        type="text"
                        placeholder="Soporte Técnico"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="certifications">Certificaciones (separadas por comas)</Label>
                    <Input
                      id="certifications"
                      type="text"
                      placeholder="CCNA, CompTIA Network+"
                      value={certifications}
                      onChange={(e) => setCertifications(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Campos específicos para OPERADORES */}
          {role === 'operador' && (
            <>
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Información Laboral
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shift">Turno de Trabajo *</Label>
                    <Select
                      value={shift}
                      onValueChange={setShift}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona turno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mañana">🌅 Mañana (8:00 - 16:00)</SelectItem>
                        <SelectItem value="tarde">🌆 Tarde (16:00 - 24:00)</SelectItem>
                        <SelectItem value="noche">🌙 Noche (24:00 - 8:00)</SelectItem>
                        <SelectItem value="rotativo">🔄 Rotativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Input
                      id="department"
                      type="text"
                      placeholder="Gestión de Incidencias"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Inicia sesión
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
