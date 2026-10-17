import { LikertForm } from "@/components/survey/likert-form";
import { getCurrentUser } from "@/lib/api/auth";

export default async function StudentSurveyPage() {
  try {
    const profile = await getCurrentUser();
    if (profile.role !== "STUDENT") {
      return (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          El cuestionario está disponible únicamente para estudiantes.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            CUESTIONARIO DE EVALUACIÓN
          </span>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Evaluación del Sistema de Tutoría Inteligente
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Responda los 12 ítems en escala Likert del 1 (totalmente en desacuerdo) al 5 (totalmente de acuerdo).
          </p>
        </div>
        <LikertForm studentId={profile.id} />
      </div>
    );
  } catch (error) {
    console.error("Error al preparar la encuesta del estudiante:", error);
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        No se pudo validar la sesión para registrar el cuestionario.
      </div>
    );
  }
}
