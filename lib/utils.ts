import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function formatDateRaw(date: string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function formatTime(date: string | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit",
  });
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosErr = error as { response?: { data?: { message?: string } } };
    return axiosErr.response?.data?.message || "Terjadi kesalahan";
  }
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan";
}

/** Returns "YYYY-MM-DD" for the first day of current month */
export function firstOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Returns "YYYY-MM-DD" for today */
export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function toExcelDate(date: string | null | undefined): Date | null {
  if (!date) return null;
  // Parse manual agar tidak kena timezone shift
  // Format yang masuk bisa "2026-04-24" atau "2026-04-24 10:43:00" atau ISO
  const cleaned = date.replace(" ", "T"); // "2026-04-24 10:43:00" → "2026-04-24T10:43:00"
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}