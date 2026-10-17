interface AlertSummaryProps {
  total: number;
  pending: number;
  intervened: number;
  resolved: number;
}

export function AlertSummaryCards({
  total,
  pending,
  intervened,
  resolved,
}: AlertSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Total Alertas Generadas
        </p>
        <p className="mt-1 text-2xl font-extrabold text-slate-900">{total}</p>
        <p className="mt-1 text-[11px] text-slate-400">Cohorte activa 2026-1</p>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wider text-red-600">
          Pendientes de Atención
        </p>
        <p className="mt-1 text-2xl font-extrabold text-red-600">{pending}</p>
        <p className="mt-1 text-[11px] text-red-500">Requieren contacto docente</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
          En Proceso / Intervenidas
        </p>
        <p className="mt-1 text-2xl font-extrabold text-amber-600">{intervened}</p>
        <p className="mt-1 text-[11px] text-amber-600">Compromisos formativos en curso</p>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
          Casos Resueltos
        </p>
        <p className="mt-1 text-2xl font-extrabold text-emerald-600">{resolved}</p>
        <p className="mt-1 text-[11px] text-emerald-600">Riesgo mitigado con éxito</p>
      </div>
    </div>
  );
}