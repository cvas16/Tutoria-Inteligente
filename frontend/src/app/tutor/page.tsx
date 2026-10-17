import { cookies } from "next/headers";
import Link from "next/link";
import { RiskDistributionChart } from "@/components/charts/risk-distribution";

interface AnalyticsSummary {
  total_students: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  pending_alerts_count: number;
  resolved_alerts_count: number;
}

async function getAnalyticsData(): Promise<AnalyticsSummary> {
  const token = cookies().get("its_session_token")?.value;
  if (!token) {
    throw new Error("No se encontró una sesión activa.");
  }
  const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000/api/v1";

  const response = await fetch(`${backendUrl}/analytics/summary`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`No se pudieron cargar las métricas (${response.status}).`);
  }
  return response.json();
}

export default async function TutorDashboardPage() {
  let data: AnalyticsSummary;
  try {
    data = await getAnalyticsData();
  } catch (error) {
    console.error("Error al cargar las métricas de la cohorte:", error);
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        No se pudo cargar la distribución de riesgo. Verifique la conexión con el backend.
      </div>
    );
  }
  const denominator = data.total_students > 0 ? data.total_students : 1;
  const pctHigh = ((data.high_risk_count / denominator) * 100).toFixed(1);
  const pctMedium = ((data.medium_risk_count / denominator) * 100).toFixed(1);
  const pctLow = ((data.low_risk_count / denominator) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
          DASHBOARD
        </span>
        <h1 className="text-2xl font-bold text-slate-900">
          Panel de Monitoreo Preventivo y Semáforo de Riesgo
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Supervisión en tiempo real de la cohorte universitaria mediante inferencia LightGBM
        </p>
      </div>

      {/* Tarjetas Superiores de KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Matriculados
          </p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {data.total_students}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Muestra evaluada n = 30</p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
            Riesgo Alto (Crítico)
          </p>
          <p className="mt-2 text-3xl font-extrabold text-red-600">
            {data.high_risk_count}
          </p>
          <p className="mt-1 text-[11px] text-red-500">{pctHigh}% del aula virtual</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
            Riesgo Medio (Preventivo)
          </p>
          <p className="mt-2 text-3xl font-extrabold text-amber-600">
            {data.medium_risk_count}
          </p>
          <p className="mt-1 text-[11px] text-amber-500">{pctMedium}% del aula virtual</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Riesgo Bajo (Regular)
          </p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-600">
            {data.low_risk_count}
          </p>
          <p className="mt-1 text-[11px] text-emerald-500">{pctLow}% del aula virtual</p>
        </div>
      </div>

      <RiskDistributionChart
        total={data.total_students}
        high={data.high_risk_count}
        medium={data.medium_risk_count}
        low={data.low_risk_count}
      />
      <div className="text-right">
        <Link
          href="/tutor/alerts"
          className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          Atender Casos en Bandeja →
        </Link>
      </div>
    </div>
  );
}