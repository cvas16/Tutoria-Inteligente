import os
import json
import logging
import joblib
import pandas as pd
import numpy as np
import shap
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


class ModelService:
    _pipeline = None
    _explainer = None
    _meta = None
    _thresholds = None
    _fallback_mode = False

    @classmethod
    def load_artifacts(cls):
        artifacts_dir = settings.ARTIFACTS_DIR
        model_path = os.path.join(artifacts_dir, f"{settings.ACTIVE_MODEL_VERSION}.joblib")
        meta_path = os.path.join(artifacts_dir, f"{settings.ACTIVE_MODEL_VERSION}_meta.json")

        if not os.path.exists(model_path):
            if os.path.exists(meta_path):
                with open(meta_path, "r", encoding="utf-8") as f:
                    cls._meta = json.load(f)
            else:
                cls._meta = {}
            cls._thresholds = cls._meta.get("thresholds", {"medium": 0.15, "high": 0.45})
            cls._pipeline = None
            cls._explainer = None
            cls._fallback_mode = True
            logger.warning(
                "No se encontró el modelo %s; se usará el predictor heurístico de respaldo.",
                model_path,
            )
            return

        if not os.path.exists(meta_path):
            raise FileNotFoundError(f"Metadatos del modelo no encontrados en: {meta_path}")

        cls._pipeline = joblib.load(model_path)
        with open(meta_path, "r", encoding="utf-8") as f:
            cls._meta = json.load(f)

        cls._thresholds = cls._meta["thresholds"]
        cls._explainer = shap.TreeExplainer(cls._pipeline.named_steps["classifier"])
        cls._fallback_mode = False

    @classmethod
    def predict(cls, features: Dict[str, Any], top_k: int = 3) -> Dict[str, Any]:
        if cls._pipeline is None and not cls._fallback_mode:
            cls.load_artifacts()

        if cls._fallback_mode:
            return cls._predict_fallback(features, top_k)

        df_single = pd.DataFrame([features]).reindex(columns=cls._meta["features"])
        proba = float(cls._pipeline.predict_proba(df_single)[:, 1][0])

        if proba >= cls._thresholds["high"]:
            risk_level = "HIGH"
        elif proba >= cls._thresholds["medium"]:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Explicabilidad local con SHAP
        pre = cls._pipeline.named_steps["preprocessor"]
        transformed = pre.transform(df_single)
        sv = cls._explainer.shap_values(transformed)

        if isinstance(sv, list):
            vals = sv[1][0]
        elif np.ndim(sv) == 3:
            vals = sv[0, :, 1]
        else:
            vals = sv[0]

        names = [n.split("__", 1)[1] for n in pre.get_feature_names_out()]
        ranked = sorted(zip(names, map(float, vals)), key=lambda x: x[1], reverse=True)[:top_k]
        shap_summary = {k: round(v, 4) for k, v in ranked if v > 0}

        return {
            "dropout_probability": round(proba, 4),
            "risk_level": risk_level,
            "shap_summary": shap_summary,
            "model_version": cls._meta["model_version"]
        }

    @classmethod
    def _predict_fallback(cls, features: Dict[str, Any], top_k: int) -> Dict[str, Any]:
        def value(name: str, default: float = 0.0) -> float:
            raw_value = features.get(name)
            return default if raw_value is None else float(raw_value)

        contributions = {
            "inactivity_days": 0.08 * min(max(value("inactivity_days"), 0.0), 30.0),
            "login_count": 0.04 * max(0.0, 10.0 - min(value("login_count"), 10.0)),
            "avg_score_evaluations": 0.08 * max(
                0.0, 12.0 - min(value("avg_score_evaluations", 12.0), 20.0)
            ),
            "late_submissions_count": 0.18 * min(
                max(value("late_submissions_count"), 0.0), 8.0
            ),
            "materials_accessed": -0.02 * min(max(value("materials_accessed"), 0.0), 12.0),
            "forum_interactions": -0.02 * min(max(value("forum_interactions"), 0.0), 10.0),
        }
        score = -2.2 + sum(contributions.values())
        proba = 1.0 / (1.0 + np.exp(-score))

        if proba >= cls._thresholds["high"]:
            risk_level = "HIGH"
        elif proba >= cls._thresholds["medium"]:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        shap_summary = {
            name: round(contribution, 4)
            for name, contribution in sorted(
                contributions.items(), key=lambda item: item[1], reverse=True
            )[:top_k]
            if contribution > 0
        }
        return {
            "dropout_probability": round(float(proba), 4),
            "risk_level": risk_level,
            "shap_summary": shap_summary,
            "model_version": f"{settings.ACTIVE_MODEL_VERSION}_fallback",
        }

    @classmethod
    def warnings_for(cls, cutoff_week: int) -> list[str]:
        warnings = []
        if cutoff_week <= 2:
            warnings.append("Diagnóstico preliminar: Semanas tempranas con baja densidad de evaluaciones formativas.")
        return warnings