import { cookies } from "next/headers";
import Link from "next/link";

interface UserProfile {
  id: string;
  institutional_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  enrollment?: {
    enrollment_id: string;
    course_id: string;
    course_code: string;
    course_name: string;
    academic_term: string;
    risk_level?: string;
    dropout_probability?: number;
  };
}

async function getStudentProfile(): Promise<UserProfile | null> {
  const token = cookies().get("its_session_token")?.value;
  if (!token) return null;

  const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000/api/v1";
  try {
    const res = await fetch(`${backendUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function StudentDashboardPage() {
  const profile = await getStudentProfile();

  if (!profile) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        No se pudo recuperar la información de matrícula del estudiante.
      </div>
    );
  }

  const enrollment = profile.enrollment;
  const isHighRisk = enrollment?.risk_level === "HIGH";
  const isMediumRisk = enrollment?.risk_level === "MEDIUM";

  return (
    <div className="space-y-6">
      {/* Banner de Bienvenida Institucional */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
          Trayectoria Formativa
        </span>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Hola, {profile.first_name} {profile.last_name}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Código: <span className="font-mono font-bold text-slate-700">{profile.institutional_id}</span> | Período Lectivo: {enrollment?.academic_term || "2026-1"}
        </p>
      </div>

      {/* Grid de Estado y Recomendaciones */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Tarjeta de Asignatura Matriculada */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Curso Activo
          </p>
          <p className="mt-2 text-lg font-bold text-slate-800">
            {enrollment?.course_name || "Asignatura Asignada"}
          </p>
          <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
            {enrollment?.course_code || "SIS-101"}
          </span>
        </div>

        {/* Tarjeta de Diagnóstico Preventivo */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Estado de Acompañamiento
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full ${
                isHighRisk ? "bg-red-500 animate-pulse" : isMediumRisk ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
            <p className="text-base font-bold text-slate-800">
              {isHighRisk
                ? "Atención Prioritaria"
                : isMediumRisk
                ? "Seguimiento Preventivo"
                : "Progreso Regular"}
            </p>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Monitoreo continuo de actividades y evaluaciones en plataforma.
          </p>
        </div>

        {/* Tarjeta de Encuesta Likert */}
        <div className="flex flex-col justify-between rounded-2xl border border-blue-200 bg-blue-50/60 p-6 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-800">
              Participación en Estudio
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Tu opinión es esencial para medir el impacto de la tutoría inteligente.
            </p>
          </div>
          <Link
            href="/student/survey"
            className="mt-4 block rounded-xl bg-blue-600 py-2.5 text-center text-xs font-bold text-white transition hover:bg-blue-700"
          >
            Responder Encuesta (12 Ítems)
          </Link>
        </div>
      </div>

      {/* Caja de Recomendación Adaptativa */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">
          Recomendación Pedagógica Personalizada
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          {isHighRisk
            ? "Hemos identificado una reducción reciente en tu interacción con las tareas y materiales del aula virtual. Te sugerimos revisar las actividades formativas pendientes y contactar a tu tutor docente para recibir orientación oportuna."
            : isMediumRisk
            ? "Tu progreso se mantiene estable, pero es conveniente reforzar la participación en los foros temáticos y entregar las tareas antes de la fecha límite para evitar acumulación de entregas."
            : "¡Excelente desempeño! Mantienes un ritmo regular de ingresos, consultas de materiales y calificaciones formativas en los rangos esperados."}
        </p>
      </div>
    </div>
  );
}