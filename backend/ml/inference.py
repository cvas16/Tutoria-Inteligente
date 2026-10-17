from typing import Dict, Any, List
import pandas as pd
import numpy as np
import shap
from sklearn.pipeline import Pipeline
from app.ml.features import FEATURES


def determine_risk_level(proba: float, thresholds: Dict[str, float]) -> str:
    """Clasifica la probabilidad calculada en los rangos categóricos de la tesis."""
    if proba >= thresholds["high"]:
        return "HIGH"
    if proba >= thresholds["medium"]:
        return "MEDIUM"
    return "LOW"


def explain_instance_shap(
    pipeline: Pipeline,
    explainer: shap.TreeExplainer,
    df_instance: pd.DataFrame,
    top_k: int = 3
) -> Dict[str, float]:
    """
    Calcula los valores SHAP locales para la observación analizada
    y extrae los top_k factores que incrementan el riesgo de deserción.
    """
    preprocessor = pipeline.named_steps["preprocessor"]
    transformed_features = preprocessor.transform(df_instance)
    sv = explainer.shap_values(transformed_features)

    # Compatibilidad de formatos de salida para LightGBM binario
    if isinstance(sv, list):
        vals = sv[1][0]
    elif np.ndim(sv) == 3:
        vals = sv[0, :, 1]
    else:
        vals = sv[0]

    # Recuperación de nombres de columnas codificadas por el preprocesador
    raw_feature_names = preprocessor.get_feature_names_out()
    feature_names = [name.split("__", 1)[1] for name in raw_feature_names]

    # Ordenar factores con contribución positiva (aumento de riesgo)
    ranked_factors = sorted(zip(feature_names, map(float, vals)), key=lambda item: item[1], reverse=True)[:top_k]
    return {feature: round(score, 4) for feature, score in ranked_factors if score > 0}


def predict_single_record(
    record: Dict[str, Any],
    pipeline: Pipeline,
    explainer: shap.TreeExplainer,
    thresholds: Dict[str, float],
    top_k: int = 3
) -> Dict[str, Any]:
    """
    Ejecuta el ciclo completo de inferencia y explicabilidad sobre un registro.
    Campos omitidos o faltantes se imputan mediante la mediana definida en el preprocesador.
    """
    df_single = pd.DataFrame([record]).reindex(columns=FEATURES)
    proba = float(pipeline.predict_proba(df_single)[:, 1][0])
    risk_level = determine_risk_level(proba, thresholds)
    shap_factors = explain_instance_shap(pipeline, explainer, df_single, top_k=top_k)

    return {
        "dropout_probability": round(proba, 4),
        "risk_level": risk_level,
        "shap_summary": shap_factors
    }


def predict_batch_records(
    records: List[Dict[str, Any]],
    pipeline: Pipeline,
    thresholds: Dict[str, float]
) -> List[Dict[str, Any]]:
    """Procesa múltiples registros en lote para el monitoreo general del aula."""
    df_batch = pd.DataFrame(records).reindex(columns=FEATURES)
    probas = pipeline.predict_proba(df_batch)[:, 1]

    results = []
    for p in probas:
        p_float = float(p)
        results.append({
            "dropout_probability": round(p_float, 4),
            "risk_level": determine_risk_level(p_float, thresholds)
        })
    return results