from app.core.config import settings
from app.services.model_service import ModelService


def test_model_service_uses_functional_fallback_when_joblib_is_missing(tmp_path, monkeypatch):
    original_state = (
        ModelService._pipeline,
        ModelService._explainer,
        ModelService._meta,
        ModelService._thresholds,
        ModelService._fallback_mode,
    )
    monkeypatch.setattr(settings, "ARTIFACTS_DIR", str(tmp_path))
    ModelService._pipeline = None
    ModelService._explainer = None
    ModelService._meta = None
    ModelService._thresholds = None
    ModelService._fallback_mode = False

    try:
        result = ModelService.predict({
            "login_count": 2,
            "inactivity_days": 18,
            "avg_score_evaluations": 6.5,
            "late_submissions_count": 4,
        })

        assert 0.0 <= result["dropout_probability"] <= 1.0
        assert result["risk_level"] == "HIGH"
        assert result["shap_summary"]["inactivity_days"] > 0
        assert result["model_version"].endswith("_fallback")
    finally:
        (
            ModelService._pipeline,
            ModelService._explainer,
            ModelService._meta,
            ModelService._thresholds,
            ModelService._fallback_mode,
        ) = original_state
