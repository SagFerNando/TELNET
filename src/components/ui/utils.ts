import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// // Normaliza fechas con microsegundos y espacio en lugar de 'T'
// export function normalizeDateString(date: string): string {
//   return date.replace(" ", "T").replace(/\.\d+/, "");
// }

// // Formatea fecha completa en español
// export function formatFullDate(date: string | null | undefined): string {
//   if (!date) return "Fecha no disponible";
//   const normalized = normalizeDateString(date);
//   const parsed = new Date(normalized);
//   if (isNaN(parsed.getTime())) return "Fecha inválida";
//   return parsed.toLocaleDateString("es-ES", {
//     day: "2-digit",
//     month: "long",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }
