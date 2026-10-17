import {
  AlertStatus,
  InterventionActionType,
  LikertSurveyAnswers,
  RiskLevel,
  UserRole,
} from "./domain";

/**
 * Esquema de respuesta de autenticación JWT (/api/v1/auth/login)
 */
export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  user_id: string;
}

/**
 * Perfil consolidado del usuario autenticado (/api/v1/me)
 */
export interface UserProfileResponse {
  id: string;
  institutional_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  enrollment?: {
    enrollment_id: string;
    course_id: string;
    course_code: string;
    course_name: string;
    academic_term: string;
    risk_level?: RiskLevel;
    dropout_probability?: number;
  };
}

/**
 * Payload para disparar la inferencia en tiempo real
 */
export interface PredictionRequestPayload {
  login_count?: number;
  total_time_seconds?: number;
  materials_accessed?: number;
  forum_interactions?: number;
  inactivity_days?: number;
  avg_score_evaluations?: number;
  late_submissions_count?: number;
  academic_term?: string;
  course_code?: string;
}

/**
 * Salida del motor de inferencia LightGBM y explicabilidad SHAP 
 */
export interface PredictionResponse {
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

/**
 * Elemento de la lista de alertas devuelto por FastAPI (/api/v1/alerts)
 */
export interface AlertListItemResponse {
  id: string;
  prediction_id: string;
  tutor_id?: string | null;
  status: AlertStatus;
  recommendation_text: string;
  notified_at?: string | null;
  resolved_at?: string | null;
  dropout_probability: number;
  risk_level: RiskLevel;
  first_name?: string | null;
  last_name?: string | null;
  institutional_id?: string | null;
  course_code?: string | null;
}

/**
 * Detalle completo de una alerta para el diagnóstico individual
 */
export interface AlertDetailResponse extends AlertListItemResponse {
  enrollment_id: string;
  shap_summary: Record<string, number>;
  interventions: Array<{
    id: string;
    alert_id: string;
    tutor_id: string;
    action_type: InterventionActionType;
    notes: string;
    agreed_commitment: string | null;
    executed_at: string;
    tutor_first_name?: string;
    tutor_last_name?: string;
  }>;
}

/**
 * Payload para registrar una intervención tutoral (/api/v1/interventions)
 */
export interface CreateInterventionPayload {
  alert_id: string;
  action_type: InterventionActionType;
  notes: string;
  agreed_commitment?: string | null;
  mark_as_resolved: boolean;
}

/**
 * Payload para el envío del cuestionario Likert de 12 ítems 
 */
export interface SubmitSurveyPayload extends LikertSurveyAnswers {
  student_id: string;
}

/**
 * Medias psicométricas por dimensión del Anexo 3
 */
export interface SurveySummaryResponse {
  total_respondents: number;
  mean_dimension_1: number | null;
  mean_dimension_2: number | null;
  mean_dimension_3: number | null;
  global_mean: number | null;
}

/**
 * Resumen analítico del aula virtual para el semáforo docente 
 */
export interface AnalyticsSummaryResponse {
  total_students: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  pending_alerts_count: number;
  resolved_alerts_count: number;
}

/**
 * Formato unificado de error devuelto por la API
 */
export interface ApiErrorResponse {
  detail: string | Array<{ loc: string[]; msg: string; type: string }>;
}