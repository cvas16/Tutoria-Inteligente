import { fetchServerData } from "./client";
import { RiskLevel } from "../risk";

export interface StudentAcademicFeatures {
  login_count: number;
  total_time_seconds: number;
  materials_accessed: number;
  forum_interactions: number;
  inactivity_days: number;
  avg_score_evaluations: number;
  late_submissions_count: number;
  academic_term: string;
  course_code: string;
}

export interface PredictionResult {
  prediction_id: string;
  enrollment_id: string;
  student_id: string;
  dropout_probability: number;
  risk_level: RiskLevel;
  shap_summary: Record<string, number>;
  recommendations: {
    student: string;
    tutor: string;
  };
  created_at: string;
}

export interface ClassRiskAnalytics {
  total_analyzed: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  high_risk_pct: number;
  medium_risk_pct: number;
  low_risk_pct: number;
  course_code: string;
}

/**
 * Solicita una predicción en tiempo real para una matrícula específica.
 * Llama al endpoint de FastAPI: POST /api/v1/enrollments/{enrollment_id}/predict
 */
export async function triggerPrediction(
  enrollmentId: string,
  featuresOverride?: Partial<StudentAcademicFeatures>
): Promise<PredictionResult> {
  return fetchServerData<PredictionResult>(`/enrollments/${enrollmentId}/predict`, {
    method: "POST",
    body: JSON.stringify(featuresOverride || {}),
  });
}

/**
 * Obtiene el histórico de predicciones ejecutadas sobre un estudiante.
 */
export async function getStudentPredictionHistory(enrollmentId: string): Promise<PredictionResult[]> {
  return fetchServerData<PredictionResult[]>(`/enrollments/${enrollmentId}/predictions`);
}

/**
 * Consulta la analítica agregada de riesgo del aula virtual (Figura 7 APA 7).
 */
export async function getClassAnalytics(courseCode?: string): Promise<ClassRiskAnalytics> {
  const query = courseCode ? `?course_code=${encodeURIComponent(courseCode)}` : "";
  return fetchServerData<ClassRiskAnalytics>(`/analytics/risk-distribution${query}`);
}