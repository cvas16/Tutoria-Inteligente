"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShapBarChart } from "@/components/charts/shap-bar-chart";
import type { AlertDetailResponse } from "@/types/api";
import { AlertRow } from "./alert-table";
import { InterventionDialog } from "./intervention-dialog";

interface AlertCaseDetailProps {
  alert: AlertDetailResponse;
}

export function AlertCaseDetail({ alert }: AlertCaseDetailProps) {
  const router = useRouter();
  const [interventionOpen, setInterventionOpen] = useState(false);
  const alertRow: AlertRow = {
    id: alert.id,
    first_name: alert.first_name ?? "",
    last_name: alert.last_name ?? "",
    institutional_id: alert.institutional_id ?? "",
    course_code: alert.course_code ?? "",
    dropout_probability: alert.dropout_probability,
    risk_level: alert.risk_level,
    status: alert.status,
    recommendation_text: alert.recommendation_text,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Figura 9 APA 7
          </span>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Diagnóstico individual de riesgo
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {alert.first_name} {alert.last_name} · {alert.institutional_id} · {alert.course_code}
          </p>
        </div>
        {alert.status !== "RESOLVED" && (
          <button
            type="button"
            onClick={() => setInterventionOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Derivar y registrar intervención
          </button>
        )}
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-500">Probabilidad estimada</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {(alert.dropout_probability * 100).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-500">Criticidad</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{alert.risk_level}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-500">Estado de gestión</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{alert.status}</p>
        </div>
      </section>

      <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        {alert.recommendation_text}
      </p>

      <ShapBarChart shapSummary={alert.shap_summary} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">Historial de intervenciones</h2>
        {alert.interventions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Aún no se registran intervenciones para este caso.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {alert.interventions.map((intervention) => (
              <li key={intervention.id} className="rounded-lg border border-slate-100 p-4 text-sm">
                <p className="font-semibold text-slate-800">{intervention.action_type}</p>
                <p className="mt-1 text-slate-600">{intervention.notes}</p>
                {intervention.agreed_commitment && (
                  <p className="mt-1 text-slate-600">Compromiso: {intervention.agreed_commitment}</p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  Tutor: {intervention.tutor_first_name} {intervention.tutor_last_name} ·{" "}
                  {new Date(intervention.executed_at).toLocaleString("es-PE")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <InterventionDialog
        alert={alertRow}
        isOpen={interventionOpen}
        onClose={() => setInterventionOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
