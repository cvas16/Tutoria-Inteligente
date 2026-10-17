import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { AlertCaseDetail } from "@/components/alerts/alert-case-detail";
import type { AlertDetailResponse } from "@/types/api";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000/api/v1";

interface PageProps {
  params: { id: string };
}

async function getAlert(alertId: string): Promise<AlertDetailResponse | null> {
  const token = cookies().get("its_session_token")?.value;
  if (!token) {
    throw new Error("No se encontró una sesión activa.");
  }

  const response = await fetch(`${BACKEND_URL}/alerts/${encodeURIComponent(alertId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`No se pudo cargar el diagnóstico (${response.status}).`);
  }
  return response.json();
}

export default async function TutorAlertDetailPage({ params }: PageProps) {
  let alert: AlertDetailResponse | null;
  try {
    alert = await getAlert(params.id);
  } catch (error) {
    console.error("Error al cargar el diagnóstico de alerta:", error);
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        No se pudo cargar el diagnóstico. Verifique la sesión y la conexión con el backend.
      </div>
    );
  }

  if (!alert) {
    notFound();
  }

  return <AlertCaseDetail alert={alert} />;
}
