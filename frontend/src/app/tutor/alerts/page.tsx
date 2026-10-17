import { cookies } from "next/headers";
import { AlertInbox } from "@/components/alerts/alert-inbox";
import type { AlertRow } from "@/components/alerts/alert-table";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000/api/v1";

async function getAlerts(): Promise<AlertRow[]> {
  const token = cookies().get("its_session_token")?.value;
  if (!token) {
    throw new Error("No se encontró una sesión activa.");
  }

  const response = await fetch(`${BACKEND_URL}/alerts?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`No se pudieron cargar las alertas (${response.status}).`);
  }
  return response.json();
}

export default async function TutorAlertsPage() {
  let alerts: AlertRow[];
  try {
    alerts = await getAlerts();
  } catch (error) {
    console.error("Error al cargar la bandeja de alertas:", error);
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        No se pudo cargar la bandeja de alertas. Verifique la sesión y la conexión con el backend.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
          DASHBOARD
        </span>
        <h1 className="text-2xl font-bold text-slate-900">
          Gestión y Despacho de Alertas Tempranas
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Filtre casos por criticidad y estado para priorizar la derivación e intervención tutoral.
        </p>
      </div>
      <AlertInbox alerts={alerts} />
    </div>
  );
}
