"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LikertFormProps {
  studentId: string;
}

interface DimensionGroup {
  dimension: string;
  subtitle: string;
  items: { id: string; code: string; statement: string }[];
}

const SURVEY_DIMENSIONS: DimensionGroup[] = [
  {
    dimension: "Dimensión 1: Detección oportuna del riesgo académico",
    subtitle: "Evalúa la anticipación frente a rezagos y caídas en evaluaciones formativas (Ítems 1, 3, 6, 7, 9)",
    items: [
      {
        id: "q01",
        code: "Q01",
        statement:
          "La interfaz y los reportes del sistema inteligente facilitan la visualización rápida de mi progreso académico en la plataforma virtual.",
      },
      {
        id: "q03",
        code: "Q03",
        statement:
          "Las predicciones del sistema reflejan con precisión cuando una calificación o evaluación pone en riesgo la aprobación de una materia.",
      },
      {
        id: "q06",
        code: "Q06",
        statement:
          "El acceso al sistema desde cualquier dispositivo (PC, móvil) permite diagnosticar tempranamente caídas en mi rendimiento.",
      },
      {
        id: "q07",
        code: "Q07",
        statement:
          "El sistema identifica oportunamente situaciones de rezago o bajo puntaje en tareas y evaluaciones formativas.",
      },
      {
        id: "q09",
        code: "Q09",
        statement:
          "La navegación intuitiva del software facilita comprender los indicadores de riesgo académico proyectados por los algoritmos.",
      },
    ],
  },
  {
    dimension: "Dimensión 2: Reducción de barreras de monitoreo continuo",
    subtitle: "Evalúa la superación de demoras informativas y distancias físicas (Ítems 2, 4, 8, 12)",
    items: [
      {
        id: "q02",
        code: "Q02",
        statement:
          "El sistema reduce el tiempo de espera para conocer mi estado de avance continuo respecto a los métodos tradicionales de tutoría.",
      },
      {
        id: "q04",
        code: "Q04",
        statement:
          "La plataforma automatiza el registro de mis actividades sin generar sobrecarga ni retrasos técnicos en el aula virtual.",
      },
      {
        id: "q08",
        code: "Q08",
        statement:
          "El monitoreo continuo del sistema evita que la falta de seguimiento docente oportuno afecte mi desempeño general.",
      },
      {
        id: "q12",
        code: "Q12",
        statement:
          "La solución tecnológica supera las barreras operativas de distancia física entre el estudiante y el equipo tutorial universitario.",
      },
    ],
  },
  {
    dimension: "Dimensión 3: Efectividad de alertas tempranas y tutoría adaptativa",
    subtitle: "Evalúa la pertinencia de las alertas y la motivación formativa (Ítems 5, 10, 11)",
    items: [
      {
        id: "q05",
        code: "Q05",
        statement:
          "Las alertas automáticas emitidas por el sistema llegan con suficiente anticipación para permitirme corregir dificultades académicas.",
      },
      {
        id: "q10",
        code: "Q10",
        statement:
          "Las recomendaciones pedagógicas personalizadas que genera el sistema son claras, útiles y pertinentes para mis necesidades de estudio.",
      },
      {
        id: "q11",
        code: "Q11",
        statement:
          "El acompañamiento formativo y las sugerencias del sistema incrementan mi motivación y compromiso por continuar los estudios.",
      },
    ],
  },
];

const LIKERT_OPTIONS = [
  { value: 1, label: "Totalmente en desacuerdo (TD)" },
  { value: 2, label: "En desacuerdo (D)" },
  { value: 3, label: "Neutral / Ni de acuerdo ni en desacuerdo (N)" },
  { value: 4, label: "De acuerdo (A)" },
  { value: 5, label: "Totalmente de acuerdo (TA)" },
];

export function LikertForm({ studentId }: LikertFormProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const questionCount = SURVEY_DIMENSIONS.reduce((count, group) => count + group.items.length, 0);
  const allQuestionsAnswered = Object.keys(answers).length === questionCount;

  const handleSelect = (questionId: string, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        student_id: studentId,
        ...answers,
      };

      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo registrar la encuesta.");
      }

      setFeedback({
        type: "success",
        text: "Cuestionario registrado con éxito. Sus respuestas han sido incorporadas a la matriz del estudio.",
      });

      setTimeout(() => {
        router.push("/student");
        router.refresh();
      }, 2500);
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "Error al conectar con el servidor.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {SURVEY_DIMENSIONS.map((group, gIdx) => (
        <div
          key={gIdx}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Bloque {gIdx + 1}
            </span>
            <h3 className="text-base font-bold text-slate-900">{group.dimension}</h3>
            <p className="mt-1 text-xs text-slate-500">{group.subtitle}</p>
          </div>

          <div className="mt-6 space-y-8">
            {group.items.map((item) => (
              <div key={item.id} className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-700">
                    {item.code}
                  </span>
                  <p className="text-xs font-semibold leading-relaxed text-slate-800">
                    {item.statement}
                  </p>
                </div>

                {/* Escala Likert de 1 a 5 botones */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {LIKERT_OPTIONS.map((opt) => {
                    const isSelected = answers[item.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(item.id, opt.value)}
                        className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                          isSelected
                            ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        <span className="font-mono text-sm font-extrabold">
                          {opt.value}
                        </span>
                        <span
                          className={`mt-1 text-[10px] leading-tight ${
                            isSelected ? "text-blue-100" : "text-slate-500"
                          }`}
                        >
                          {opt.label.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {feedback && (
        <div
          className={`rounded-xl border p-4 text-xs font-semibold ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !allQuestionsAnswered}
        className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 disabled:bg-slate-300"
      >
        {isSubmitting
          ? "Transmitiendo evaluación..."
          : allQuestionsAnswered
          ? "Finalizar y Registrar Evaluación"
          : "Responda los 12 ítems"}
      </button>
    </form>
  );
}