import pytest
from app.services.model_service import ModelService

def test_model_inference_and_shap_explainability():
    # Registro de prueba con alta inactividad y bajo puntaje formativo
    test_features = {
        "login_count": 2,
        "total_time_seconds": 1200,
        "materials_accessed": 1,
        "forum_interactions": 0,
        "inactivity_days": 18,
        "avg_score_evaluations": 6.5,
        "late_submissions_count": 4,
        "academic_term": "2026-1",
        "course_code": "SIS-101"
    }
    
    result = ModelService.predict(test_features)
    
    assert "dropout_probability" in result
    assert 0.0 <= result["dropout_probability"] <= 1.0
    assert result["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    assert isinstance(result["shap_summary"], dict)
    assert result["risk_level"] == "HIGH"