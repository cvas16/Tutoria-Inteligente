import { fetchServerData } from "./client";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: "STUDENT" | "TUTOR" | "ADMIN";
  user_id: string;
}

export interface UserEnrollment {
  enrollment_id: string;
  course_id: string;
  course_code: string;
  course_name: string;
  academic_term: string;
  risk_level?: "LOW" | "MEDIUM" | "HIGH";
  dropout_probability?: number;
}

export interface CurrentUser {
  id: string;
  institutional_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "STUDENT" | "TUTOR" | "ADMIN";
  enrollment?: UserEnrollment;
}

/**
 * Consulta el perfil completo del usuario autenticado a través de FastAPI (/api/v1/me).
 * Compatible con Server Components y Server Actions.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  return fetchServerData<CurrentUser>("/me");
}

/**
 * Realiza el login a través de la ruta Route Handler (BFF) del frontend
 * para almacenar de manera segura la cookie httpOnly en el navegador.
 */
export async function loginClient(credentials: LoginCredentials): Promise<{ success: boolean; role: string }> {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Credenciales inválidas");
  }

  return res.json();
}

/**
 * Cierra la sesión activa invalidando la cookie httpOnly en el Route Handler.
 */
export async function logoutClient(): Promise<void> {
  await fetch("/api/auth", {
    method: "DELETE",
  });
}