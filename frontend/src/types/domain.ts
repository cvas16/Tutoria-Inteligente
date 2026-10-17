/**
 * Niveles de riesgo semafórico determinados por los umbrales de corte LightGBM
 */
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

/**
 * Ciclo de vida y transición operativa de una alerta temprana
 */
export type AlertStatus = "PENDING" | "NOTIFIED" | "INTERVENED" | "RESOLVED";

/**
 * Roles institucionales con control de acceso RBAC
 */
export type UserRole = "STUDENT" | "TUTOR" | "ADMIN";

/**
 * Tipos de acción pedagógica ejecutadas por el docente (Dimensión VD-D3)
 */
export type InterventionActionType =
  | "ENTREVISTA"
  | "REFUERZO_ACADEMICO"
  | "ENVIO_MATERIAL"
  | "CONTACTO_PREVENTIVO";

/**
 * Entidad de Usuario del sistema institucional
 */
export interface User {
  id: string;
  institutionalId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

/**
 * Registro de Matrícula académica activa en la cohorte 2026-1
 */
export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  academicTerm: string;
  status: "ACTIVE" | "DROPPED" | "COMPLETED";
}

/**
 * Entidad representativa de la Alerta Temprana 
 */
export interface EarlyAlert {
  id: string;
  predictionId: string;
  enrollmentId: string;
  studentId: string;
  studentName: string;
  institutionalId: string;
  courseCode: string;
  courseName: string;
  dropoutProbability: number;
  riskLevel: RiskLevel;
  status: AlertStatus;
  recommendationText: string;
  shapSummary: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Registro de Intervención Docente y Compromiso Formativo
 */
export interface InterventionRecord {
  id: string;
  alertId: string;
  tutorId: string;
  actionType: InterventionActionType;
  notes: string;
  agreedCommitment: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

/**
 * Desglose de los 12 ítems psicométricos Likert  para la muestra n = 30
 */
export interface LikertSurveyAnswers {
  // Dimensión 1: Detección oportuna del riesgo académico
  q01: number;
  q03: number;
  q06: number;
  q07: number;
  q09: number;

  // Dimensión 2: Reducción de barreras de monitoreo continuo
  q02: number;
  q04: number;
  q08: number;
  q12: number;

  // Dimensión 3: Efectividad de alertas tempranas y tutoría adaptativa
  q05: number;
  q10: number;
  q11: number;
}