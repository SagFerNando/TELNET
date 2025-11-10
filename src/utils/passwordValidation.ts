/**
 * Utilidades para validación de contraseñas seguras
 */

export interface PasswordStrength {
  isValid: boolean;
  score: number; // 0-4
  messages: string[];
}

/**
 * Valida si una contraseña es segura
 * Requisitos:
 * - Mínimo 10 caracteres
 * - Al menos una letra minúscula
 * - Al menos una letra mayúscula
 * - Al menos un número
 * - Al menos un carácter especial
 */
export function validatePasswordStrength(password: string): PasswordStrength {
  const messages: string[] = [];
  let score = 0;

  // Validar longitud mínima
  if (password.length < 10) {
    messages.push('Debe tener al menos 10 caracteres');
  } else {
    score++;
  }

  // Validar letra minúscula
  if (!/[a-z]/.test(password)) {
    messages.push('Debe incluir al menos una letra minúscula');
  } else {
    score++;
  }

  // Validar letra mayúscula
  if (!/[A-Z]/.test(password)) {
    messages.push('Debe incluir al menos una letra mayúscula');
  } else {
    score++;
  }

  // Validar número
  if (!/[0-9]/.test(password)) {
    messages.push('Debe incluir al menos un número');
  } else {
    score++;
  }

  // Validar carácter especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    messages.push('Debe incluir al menos un carácter especial (!@#$%^&*...)');
  } else {
    score++;
  }

  return {
    isValid: score === 5 && password.length >= 10,
    score,
    messages
  };
}

/**
 * Obtiene el color del indicador de fortaleza
 */
export function getPasswordStrengthColor(score: number): string {
  if (score === 0) return 'bg-gray-200';
  if (score === 1) return 'bg-red-500';
  if (score === 2) return 'bg-orange-500';
  if (score === 3) return 'bg-yellow-500';
  if (score === 4) return 'bg-blue-500';
  return 'bg-green-500';
}

/**
 * Obtiene el texto del indicador de fortaleza
 */
export function getPasswordStrengthText(score: number): string {
  if (score === 0) return 'Muy débil';
  if (score === 1) return 'Débil';
  if (score === 2) return 'Regular';
  if (score === 3) return 'Buena';
  if (score === 4) return 'Fuerte';
  return 'Muy fuerte';
}
