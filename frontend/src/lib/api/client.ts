import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000/api/v1";

export async function fetchServerData<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = cookies().get("its_session_token")?.value;
  const url = `${BACKEND_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(process.env.API_KEY ? { "X-API-Key": process.env.API_KEY } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    cache: options.cache || "no-store",
  });

  if (!response.ok) {
    let errorDetail = "Error en la petición al backend";
    try {
      const err = await response.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch {}
    throw new Error(errorDetail);
  }

  return response.json();
}