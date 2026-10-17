from app.services.recommendations import build_recommendation

def test_recommendation_inactivity():
    shap_factors = {"inactivity_days": 0.45, "login_count": 0.12}
    rec = build_recommendation(shap_factors)
    assert "inactividad" in rec["tutor"].lower()

def test_recommendation_grades():
    shap_factors = {"avg_score_evaluations": 0.88}
    rec = build_recommendation(shap_factors)
    assert "refuerzo académico" in rec["tutor"].lower()

def test_recommendation_empty_shap():
    rec = build_recommendation({})
    assert "regular" in rec["tutor"].lower()