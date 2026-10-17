"use client";

import { useState } from "react";
import { AlertRow } from "./alert-table";

interface InterventionDialogProps {
  alert: AlertRow | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InterventionDialog({
  alert,
  isOpen,
  onClose,
  onSuccess,
}: InterventionDialogProps) {
  const [actionType, setActionType] = useState("ENTREVISTA");
  const [notes, setNotes] = useState("");
  const [commitment, setCommitment] = useState("");
  const [markResolved, setMarkResolved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !alert) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/interventions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert_id: alert.id,
          action_type: actionType,
          notes,
          agreed_commitment: commitment || null,
          mark_as_resolved: markResolved,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo registrar la intervención.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Registrar Intervención Tutoral
            </h3>
            <p className="text-xs text-slate-500">
              Estudiante: {alert.first_name} {alert.last_name} ({alert.institutional_id})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700">
              Tipo de Acción Pedagógica
            </label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none"
            >
              <option value="ENTREVISTA">Entrevista de orientación académica</option>
              <option value="REFUERZO_ACADEMICO">Sesión de refuerzo formativo</option>
              <option value="ENVIO_MATERIAL">Envío de material didáctico complementario</option>
              <option value="CONTACTO_PREVENTIVO">Contacto preventivo por inactividad</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700">
              Observaciones Pedagógicas *
            </label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describa los aspectos formativos tratados con el alumno..."
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700">
              Compromiso Acordado (Opcional)
            </label>
            <input
              type="text"
              value={commitment}
              onChange={(e) => setCommitment(e.target.value)}
              placeholder="Ejemplo: Regularizar evaluaciones de la semana 4"
              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="dialogResolve"
              checked={markResolved}
              onChange={(e) => setMarkResolved(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            <label htmlFor="dialogResolve" className="text-slate-600">
              Marcar caso como resuelto tras esta acción
            </label>
          </div>

          {error && <p className="font-semibold text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-1.5 font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-300"
            >
              {saving ? "Guardando..." : "Guardar Registro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}