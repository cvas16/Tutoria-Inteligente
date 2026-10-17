"use client";

interface RiskDistributionProps {
  total: number;
  high: number;
  medium: number;
  low: number;
}

export function RiskDistributionChart({
  total,
  high,
  medium,
  low,
}: RiskDistributionProps) {
  const safeTotal = total > 0 ? total : 1;
  const pctHigh = Number(((high / safeTotal) * 100).toFixed(1));
  const pctMedium = Number(((medium / safeTotal) * 100).toFixed(1));
  const pctLow = Number(((low / safeTotal) * 100).toFixed(1));

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            Figura 7
          </span>
          <h3 className="text-sm font-bold text-slate-900">
            Distribución Global del Semáforo de Riesgo en el Aula
          </h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-semibold text-slate-600">
          Cohorte Total: {total} estudiantes
        </span>
      </div>

      <p className="text-xs text-slate-500">
        Clasificación generada a partir de los umbrales calibrados del modelo LightGBM.
      </p>

      {/* Barra Semafórica Continua */}
      <div className="relative flex h-5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
        {pctHigh > 0 && (
          <div
            style={{ width: `${pctHigh}%` }}
            className="flex items-center justify-center bg-red-500 text-[10px] font-bold text-white transition-all duration-500"
            title={`Riesgo Alto: ${pctHigh}% (${high} estudiantes)`}
          >
            {pctHigh >= 8 && `${pctHigh}%`}
          </div>
        )}
        {pctMedium > 0 && (
          <div
            style={{ width: `${pctMedium}%` }}
            className="flex items-center justify-center bg-amber-500 text-[10px] font-bold text-white transition-all duration-500"
            title={`Riesgo Medio: ${pctMedium}% (${medium} estudiantes)`}
          >
            {pctMedium >= 8 && `${pctMedium}%`}
          </div>
        )}
        {pctLow > 0 && (
          <div
            style={{ width: `${pctLow}%` }}
            className="flex items-center justify-center bg-emerald-500 text-[10px] font-bold text-white transition-all duration-500"
            title={`Riesgo Bajo: ${pctLow}% (${low} estudiantes)`}
          >
            {pctLow >= 8 && `${pctLow}%`}
          </div>
        )}
      </div>

      {/* Leyenda y Desglose Cuantitativo */}
      <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/60 p-3">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <div>
            <p className="text-xs font-bold text-red-900">
              Riesgo Alto ({high})
            </p>
            <p className="text-[11px] text-red-600">{pctHigh}% de la muestra</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
          <span className="h-3 w-3 rounded-full bg-amber-500" />
          <div>
            <p className="text-xs font-bold text-amber-900">
              Riesgo Medio ({medium})
            </p>
            <p className="text-[11px] text-amber-600">{pctMedium}% de la muestra</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          <div>
            <p className="text-xs font-bold text-emerald-900">
              Riesgo Bajo ({low})
            </p>
            <p className="text-[11px] text-emerald-600">{pctLow}% de la muestra</p>
          </div>
        </div>
      </div>
    </div>
  );
}