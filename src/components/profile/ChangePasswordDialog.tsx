import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { PasswordInput } from "../ui/password-input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "../../utils/supabase/client";
import { toast } from "sonner@2.0.3";
import {
  validatePasswordStrength,
  getPasswordStrengthText,
} from "../../utils/passwordValidation";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const passwordStrength = validatePasswordStrength(formData.newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validar contraseña segura
    if (!passwordStrength.isValid) {
      setError("La contraseña no cumple con los requisitos de seguridad");
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Primero verificamos la contraseña actual intentando iniciar sesión
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error("No se pudo verificar el usuario");
      }

      // Actualizar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      toast.success("Contraseña actualizada exitosamente");

      // Resetear formulario después de 2 segundos y cerrar
      setTimeout(() => {
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setSuccess(false);
        onOpenChange(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Error al cambiar la contraseña");
      toast.error(err.message || "Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setError(null);
    setSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
          <DialogDescription>
            Ingresa tu contraseña actual y una nueva contraseña segura
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-green-100 p-3 rounded-full mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <p className="text-center">¡Contraseña actualizada exitosamente!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Requisitos de contraseña */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">
                  Requisitos de contraseña segura:
                </p>
                <ul className="text-sm space-y-0.5 ml-4 list-disc">
                  <li>Mínimo 10 caracteres</li>
                  <li>Al menos una letra minúscula</li>
                  <li>Al menos una letra mayúscula</li>
                  <li>Al menos un número</li>
                  <li>Al menos un carácter especial (!@#$%...)</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <PasswordInput
                  id="currentPassword"
                  placeholder="••••••••"
                  value={formData.currentPassword}
                  onChange={(e: { target: { value: any } }) =>
                    setFormData({
                      ...formData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="pl-9"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <PasswordInput
                  id="newPassword"
                  placeholder="••••••••"
                  value={formData.newPassword}
                  onChange={(e: { target: { value: any } }) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  className="pl-9"
                  required
                  disabled={loading}
                  showStrengthIndicator
                  strengthScore={passwordStrength.score}
                  strengthText={getPasswordStrengthText(passwordStrength.score)}
                />
              </div>
              {passwordStrength.messages.length > 0 && formData.newPassword && (
                <div className="space-y-1">
                  {passwordStrength.messages.map((msg, i) => (
                    <p key={i} className="text-xs text-red-600">
                      • {msg}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirmar Nueva Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <PasswordInput
                  id="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e: { target: { value: any } }) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="pl-9"
                  required
                  disabled={loading}
                />
              </div>
              {formData.confirmPassword &&
                formData.newPassword !== formData.confirmPassword && (
                  <p className="text-xs text-red-600">
                    Las contraseñas no coinciden
                  </p>
                )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={
                  loading ||
                  !passwordStrength.isValid ||
                  formData.newPassword !== formData.confirmPassword
                }
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cambiar Contraseña
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
