from typing import Dict, Any

FEATURE_PEDAGOGICAL_MAP = {
    "inactivity_days": "Pauta de reenganche: Supera el umbral crítico de inactividad virtual. Notificar vía mensajería y tutoría de seguimiento.",
    "avg_score_evaluations": "Refuerzo académico: Rendimiento formativo inferior a la media del curso. Asignar sesión de tutoría y material de nivelación.",
    "late_submissions_count": "Gestión del tiempo: Múltiples entregas a destiempo registradas. Coordinar cronograma de entregas asistidas.",
    "login_count": "Persistencia de estudio: Reducida frecuencia de acceso semanal al aula virtual. Realizar recordatorio de participación activa.",
    "materials_accessed": "Cobertura curricular: Visualización deficiente de recursos obligatorios. Comprobar acceso técnico y compatibilidad de material.",
    "forum_interactions": "Aprendizaje colaborativo: Ausencia de intervenciones en foros formativos y dinámicas de grupo."
}

def build_recommendation(shap_summary: Dict[str, float]) -> Dict[str, str]:
    if not shap_summary:
        return {
            "tutor": "Estudiante con trayectoria regular. Mantener supervisión formativa preventiva periódica.",
            "student": "Tu ritmo de aprendizaje y participación se mantienen dentro de los parámetros esperados. ¡Continúa así!"
        }

    # Ordenar factores por mayor peso explicativo local
    sorted_factors = sorted(shap_summary.items(), key=lambda kv: kv[1], reverse=True)
    top_factor_name = sorted_factors[0][0]

    pauta_docente = FEATURE_PEDAGOGICAL_MAP.get(
        top_factor_name, 
        "Riesgo académico multifactorial detectado. Revisar registro continuo del participante."
    )
    
    pauta_alumno = (
        "Hemos identificado áreas de oportunidad en tus entregas e interacción en plataforma. "
        "Te sugerimos revisar tu planificador semanal y contactar con tu tutor asignado para orientación."
    )

    return {
        "tutor": pauta_docente,
        "student": pauta_alumno
    }