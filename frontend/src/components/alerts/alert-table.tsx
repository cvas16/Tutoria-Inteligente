"use client";

import Link from "next/link";

export interface AlertRow {
  id: string;
  first_name: string;
  last_name: string;
  institutional_id: string;
  course_code: string;
  dropout_probability: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "NOTIFIED" | "INTERVENED" | "RESOLVED";
  recommendation_text: string;
}

interface AlertTableProps {
  alerts: AlertRow[];
  onOpenIntervention?: (alert: AlertRow) => void;
}

export function AlertTable({ alerts, onOpenIntervention }: AlertTableProps) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400 shadow-sm">
        No se encontraron alertas que coincidan con los criterios seleccionados.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="p-4">Estudiante</th>
            <th className="p-4">Asignatura</th>
            <th className="p-4">Probabilidad de Deserción</th>
            <th className="p-4">Nivel de Riesgo</th>
            <th className="p-4">Estado</th>
            <th className="p-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {alerts.map((alert) => (
            <tr key={alert.id} className="transition hover:bg-slate-50">
              <td className="p-4">
                <p className="font-bold text-slate-900">
                  {alert.first_name} {alert.last_name}
                </p>
                <p className="font-mono text-[11px] text-slate-400">
                  {alert.institutional_id}
                </p>
              </td>
              <td className="p-4 font-mono font-medium text-slate-600">
                {alert.course_code}
              </td>
              <td className="p-4 font-mono font-bold text-slate-800">
                {(alert.dropout_probability * 100).toFixed(1)}%
              </td>
              <td className="p-4">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    alert.risk_level === "HIGH"
                      ? "bg-red-100 text-red-700"
                      : alert.risk_level === "MEDIUM"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {alert.risk_level}
                </span>
              </td>
              <td className="p-4">
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-600">
                  {alert.status}
                </span>
              </td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {onOpenIntervention && alert.status !== "RESOLVED" && (
                    <button
                      onClick={() => onOpenIntervention(alert)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Intervenir
                    </button>
                  )}
                  <Link
                    href={`/tutor/alerts/${alert.id}`}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-blue-700"
                  >
                    Detalle XAI
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}