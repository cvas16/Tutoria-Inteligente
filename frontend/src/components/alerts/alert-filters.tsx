"use client";

interface AlertFiltersProps {
  selectedRisk: string;
  selectedStatus: string;
  onRiskChange: (risk: string) => void;
  onStatusChange: (status: string) => void;
}

export function AlertFilters({
  selectedRisk,
  selectedStatus,
  onRiskChange,
  onStatusChange,
}: AlertFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-slate-500">Filtrar por:</span>

        {/* Filtro de Nivel de Riesgo */}
        <select
          value={selectedRisk}
          onChange={(e) => onRiskChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="ALL">Todos los niveles</option>
          <option value="HIGH">Riesgo Alto (Crítico)</option>
          <option value="MEDIUM">Riesgo Medio (Preventivo)</option>
          <option value="LOW">Riesgo Bajo (Regular)</option>
        </select>

        {/* Filtro de Estado de Alerta */}
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="ALL">Todos los estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="NOTIFIED">Notificado</option>
          <option value="INTERVENED">Intervenido</option>
          <option value="RESOLVED">Resuelto</option>
        </select>
      </div>

      {(selectedRisk !== "ALL" || selectedStatus !== "ALL") && (
        <button
          onClick={() => {
            onRiskChange("ALL");
            onStatusChange("ALL");
          }}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800"
        >
          Restablecer filtros
        </button>
      )}
    </div>
  );
}