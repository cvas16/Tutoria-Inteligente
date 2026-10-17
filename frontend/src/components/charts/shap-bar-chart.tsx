"use client";

interface ShapBarChartProps {
  shapSummary: Record<string, number>;
  maxDisplay?: number;
}

const FEATURE_LABELS: Record<string, string> = {
  inactivity_days: "Días de inactividad continuos en plataforma",
  avg_score_evaluations: "Rezago en notas de evaluaciones formativas",
  late_submissions_count: "Entregas acumuladas fuera de plazo",
  login_count: "Baja frecuencia de sesiones semanales",
  materials_accessed: "Pocas consultas a lecturas y recursos",
  forum_interactions: "Ausencia de participación en foros",
};

export function ShapBarChart({
  shapSummary,
  maxDisplay = 5,
}: ShapBarChartProps) {
  const entries = Object.entries(shapSummary || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxDisplay);

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
        No se registran factores críticos de incremento de riesgo para este estudiante.
      </div>
    );
  }

  const maxVal = Math.max(...entries.map(([, val]) => val), 0.01);

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="border-b border-slate-100 pb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
          Figura 9
        </span>
        <h3 className="text-sm font-bold text-slate-900">
          Factores Determinantes de Riesgo (Valores Locales SHAP)
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Magnitud con la que cada comportamiento estudiantil aumenta la probabilidad predicha de deserción.
        </p>
      </div>

      <div className="space-y-4 pt-2">
        {entries.map(([featureKey, value]) => {
          const label = FEATURE_LABELS[featureKey] || featureKey;
          const percentage = Math.min((value / maxVal) * 100, 100);

          return (
            <div key={featureKey} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">{label}</span>
                <span className="font-mono font-bold text-red-600">
                  +{value.toFixed(4)}
                </span>
              </div>

              {/* Barra de Magnitud SHAP */}
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  style={{ width: `${percentage}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-500"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px] text-slate-500">
        <span className="font-semibold text-slate-700">Interpretación:</span> Los valores positivos indican un incremento en el riesgo calculado. Una magnitud superior orienta al tutor hacia las áreas donde debe priorizar la tutoría adaptativa.
      </div>
    </div>
  );
}