export const SHAP_FEATURE_LABELS: Record<string, string> = {
  inactivity_days: "Días continuos sin interacción en el aula virtual",
  avg_score_evaluations: "Rezago en calificaciones de evaluaciones formativas",
  late_submissions_count: "Frecuencia de entregas registradas fuera de plazo",
  login_count: "Baja recurrencia de accesos a la plataforma",
  materials_accessed: "Escasa consulta de lecturas y recursos didácticos",
  forum_interactions: "Falta de participación en foros y actividades grupales",
  total_time_seconds: "Tiempo total de permanencia en el sistema",
};

export const RISK_LEVEL_LABELS: Record<string, string> = {
  HIGH: "Riesgo Alto (Crítico)",
  MEDIUM: "Riesgo Medio (Preventivo)",
  LOW: "Riesgo Bajo (Regular)",
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente de atención",
  NOTIFIED: "Notificado al tutor",
  INTERVENED: "Intervención realizada",
  RESOLVED: "Riesgo mitigado / Resuelto",
};