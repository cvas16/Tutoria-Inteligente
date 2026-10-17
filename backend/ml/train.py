import os
import json
import joblib
import sklearn
import shap
import lightgbm as lgb
import pandas as pd
import numpy as np
from matplotlib import pyplot as plt
from typing import Dict, Tuple

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    precision_recall_curve,
    roc_auc_score,
    average_precision_score,
    f1_score,
    recall_score,
    precision_score,
    classification_report,
)
from ml.features import build_preprocessor, FEATURES, TARGET

MODEL_VERSION = "dropout_lgbm_v2"
MIN_RECALL = 0.85
MIN_HIGH_PRECISION = 0.60
CANDIDATE_THRESHOLDS = {"medium": 0.32, "high": 0.61}


def threshold_metrics(y_true: pd.Series, proba: np.ndarray, threshold: float) -> Dict[str, float]:
    predictions = proba >= threshold
    return {
        "precision": float(precision_score(y_true, predictions, zero_division=0)),
        "recall": float(recall_score(y_true, predictions, zero_division=0)),
        "predicted_positive": int(predictions.sum()),
    }


def pick_thresholds(
    y_true: pd.Series,
    proba: np.ndarray,
    min_recall: float = MIN_RECALL,
    min_precision: float = MIN_HIGH_PRECISION,
) -> Dict[str, float]:
    """
    Determina umbrales operacionales a partir de predicciones out-of-fold:
    - medium: umbral que garantiza un Recall >= 85% para detección temprana.
    - high: umbral con Precision >= 60% para priorizar intervenciones tutoriales críticas.
    """
    prec, rec, thr = precision_recall_curve(y_true, proba)
    prec, rec = prec[:-1], rec[:-1]
    f1 = 2 * prec * rec / np.clip(prec + rec, 1e-9, None)

    ok_rec = np.where(rec >= min_recall)[0]
    ok_prec = np.where(prec >= min_precision)[0]

    t_medium = float(thr[ok_rec.max()]) if len(ok_rec) else float(thr.min())
    t_high = float(thr[ok_prec.min()]) if len(ok_prec) else float(thr.max())

    return {
        "best_f1": float(thr[np.argmax(f1)]),
        "medium": t_medium,
        "high": max(t_high, t_medium)
    }


def plot_precision_recall(
    y_true: pd.Series,
    proba: np.ndarray,
    selected_thresholds: Dict[str, float],
    candidate_thresholds: Dict[str, float],
    output_path: str,
) -> Tuple[float, Dict[str, Dict[str, float]]]:
    precision, recall, _ = precision_recall_curve(y_true, proba)
    pr_auc = float(average_precision_score(y_true, proba))
    prevalence = float(y_true.mean())
    selected_metrics = {
        level: threshold_metrics(y_true, proba, threshold)
        for level, threshold in selected_thresholds.items()
        if level in ("medium", "high")
    }
    candidate_metrics = {
        level: threshold_metrics(y_true, proba, threshold)
        for level, threshold in candidate_thresholds.items()
    }

    figure, (curve_axis, band_axis) = plt.subplots(
        2, 1, figsize=(10, 8), gridspec_kw={"height_ratios": [4, 1.5]}
    )
    curve_axis.plot(recall, precision, color="#174a7e", linewidth=2, label="Curva Precision–Recall")
    curve_axis.axhline(
        prevalence, color="#777777", linestyle=":", label=f"Prevalencia positiva ({prevalence:.3f})"
    )
    curve_axis.scatter(
        [selected_metrics["medium"]["recall"], selected_metrics["high"]["recall"]],
        [selected_metrics["medium"]["precision"], selected_metrics["high"]["precision"]],
        color=["#d99a00", "#b3261e"],
        marker="o",
        s=80,
        edgecolor="white",
        linewidth=0.8,
        zorder=4,
        label="Cortes operativos seleccionados",
    )
    curve_axis.scatter(
        [candidate_metrics["medium"]["recall"], candidate_metrics["high"]["recall"]],
        [candidate_metrics["medium"]["precision"], candidate_metrics["high"]["precision"]],
        color=["#d99a00", "#b3261e"],
        marker="x",
        s=90,
        linewidth=2,
        zorder=5,
        label="Cortes candidatos 0.32 / 0.61",
    )
    annotations = [
        ("medium", selected_thresholds["medium"], selected_metrics["medium"], "Operativo", (0.50, 0.34), "#8a6500"),
        ("high", selected_thresholds["high"], selected_metrics["high"], "Operativo", (0.70, 0.70), "#8a6500"),
        ("medium", candidate_thresholds["medium"], candidate_metrics["medium"], "Candidato", (0.18, 0.48), "#555555"),
        ("high", candidate_thresholds["high"], candidate_metrics["high"], "Candidato", (0.05, 0.87), "#555555"),
    ]
    for level, threshold, point, label, offset, color in annotations:
        curve_axis.annotate(
            f"{label} {level.title()}={threshold:.3f}\nP={point['precision']:.3f}, R={point['recall']:.3f}",
            (point["recall"], point["precision"]),
            xytext=offset,
            textcoords="axes fraction",
            ha="left",
            va="center",
            fontsize=8,
            color=color,
            arrowprops={"arrowstyle": "-", "color": color, "linewidth": 0.7},
        )

    curve_axis.set(
        xlim=(0, 1),
        ylim=(0, 1.02),
        xlabel="Recall",
        ylabel="Precision",
        title=f"Curva Precision–Recall en test (holdout) | PR-AUC = {pr_auc:.3f}",
    )
    curve_axis.grid(alpha=0.2)
    curve_axis.legend(loc="lower left", fontsize=8)

    band_axis.set_xlim(0, 1)
    band_axis.set_ylim(0, 2)
    band_axis.axis("off")
    colors = {"low": "#43a047", "medium": "#f9a825", "high": "#e53935"}
    strips = [
        (1.1, selected_thresholds, "Umbrales operativos seleccionados"),
        (0.15, candidate_thresholds, "Candidatos solicitados (no operativos si no cumplen criterios)"),
    ]
    for y, thresholds, label in strips:
        medium, high = thresholds["medium"], thresholds["high"]
        band_axis.text(-0.01, y + 0.18, label, ha="right", va="center", fontsize=8, clip_on=False)
        band_axis.axhspan(y, y + 0.35, xmin=0, xmax=medium, color=colors["low"])
        band_axis.axhspan(y, y + 0.35, xmin=medium, xmax=high, color=colors["medium"])
        band_axis.axhspan(y, y + 0.35, xmin=high, xmax=1, color=colors["high"])
        band_axis.text(medium, y + 0.4, f"{medium:.3f}", ha="center", fontsize=8)
        band_axis.text(high, y + 0.4, f"{high:.3f}", ha="center", fontsize=8)
        band_axis.text(medium / 2, y + 0.17, "Bajo", ha="center", va="center", color="white", fontsize=8)
        band_axis.text((medium + high) / 2, y + 0.17, "Medio", ha="center", va="center", fontsize=8)
        band_axis.text((high + 1) / 2, y + 0.17, "Alto", ha="center", va="center", color="white", fontsize=8)

    figure.suptitle("Umbrales de clasificación del riesgo de deserción", fontsize=13)
    figure.tight_layout(rect=(0.22, 0, 1, 0.96))
    figure.savefig(output_path, dpi=180, bbox_inches="tight")
    plt.close(figure)
    return pr_auc, {"selected": selected_metrics, "candidate": candidate_metrics}


def run_training_and_export():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, "data", "dataset_dropout_elearning.csv")
    artifacts_dir = os.path.join(base_dir, "artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"No se encontró el dataset en '{data_path}'. Genérelo previamente.")

    df = pd.read_csv(data_path)
    X = df[FEATURES]
    y = df[TARGET]

    # Partición estratificada (80% Train, 20% Test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    pipeline = Pipeline([
        ("preprocessor", build_preprocessor()),
        ("classifier", lgb.LGBMClassifier(
            n_estimators=150,
            learning_rate=0.05,
            max_depth=5,
            num_leaves=31,
            random_state=42,
            verbosity=-1
        ))
    ])

    # Selección de umbrales sobre predicciones out-of-fold; el holdout se reserva para evaluación.
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    oof_proba = cross_val_predict(pipeline, X_train, y_train, cv=cv, method="predict_proba")[:, 1]
    candidate_oof_metrics = {
        level: threshold_metrics(y_train, oof_proba, threshold)
        for level, threshold in CANDIDATE_THRESHOLDS.items()
    }
    candidate_thresholds_accepted = (
        candidate_oof_metrics["medium"]["recall"] >= MIN_RECALL
        and candidate_oof_metrics["high"]["precision"] >= MIN_HIGH_PRECISION
        and CANDIDATE_THRESHOLDS["high"] >= CANDIDATE_THRESHOLDS["medium"]
    )
    thresholds = (
        {**CANDIDATE_THRESHOLDS, "best_f1": pick_thresholds(y_train, oof_proba)["best_f1"]}
        if candidate_thresholds_accepted
        else pick_thresholds(y_train, oof_proba)
    )

    print("=== MÉTRICAS OUT-OF-FOLD (TRAIN 5-FOLDS) ===")
    print(f"ROC-AUC: {roc_auc_score(y_train, oof_proba):.4f}")
    print(f"PR-AUC:  {average_precision_score(y_train, oof_proba):.4f}")
    print(
        f"Candidatos 0.32/0.61: {'APROBADOS' if candidate_thresholds_accepted else 'NO APROBADOS'} "
        f"(recall medio={candidate_oof_metrics['medium']['recall']:.3f}; "
        f"precision alto={candidate_oof_metrics['high']['precision']:.3f})"
    )
    print(
        f"Umbrales operativos -> MEDIUM: {thresholds['medium']:.3f} | "
        f"HIGH: {thresholds['high']:.3f} | F1-óptimo: {thresholds['best_f1']:.3f}\n"
    )

    # Ajuste definitivo del pipeline sobre el conjunto completo de entrenamiento
    pipeline.fit(X_train, y_train)

    # Evaluación final sobre el conjunto de prueba (Holdout no visto)
    test_proba = pipeline.predict_proba(X_test)[:, 1]
    y_pred = (test_proba >= thresholds["best_f1"]).astype(int)

    metrics = {
        "test_roc_auc": float(roc_auc_score(y_test, test_proba)),
        "test_pr_auc": float(average_precision_score(y_test, test_proba)),
        "test_prevalence": float(y_test.mean()),
        "test_f1": float(f1_score(y_test, y_pred)),
        "test_recall": float(recall_score(y_test, y_pred)),
        "test_precision": float(precision_score(y_test, y_pred)),
        "recall_at_medium": threshold_metrics(y_test, test_proba, thresholds["medium"])["recall"],
        "precision_at_high": threshold_metrics(y_test, test_proba, thresholds["high"])["precision"],
    }

    print("=== EVALUACIÓN EN TEST SET (HOLDOUT) ===")
    print(classification_report(y_test, y_pred, target_names=["Activo", "En Riesgo"]))
    for label, level, threshold in (
        ("Operativo Medio", "medium", thresholds["medium"]),
        ("Operativo Alto", "high", thresholds["high"]),
        ("Candidato Medio", "medium", CANDIDATE_THRESHOLDS["medium"]),
        ("Candidato Alto", "high", CANDIDATE_THRESHOLDS["high"]),
    ):
        point = threshold_metrics(y_test, test_proba, threshold)
        print(
            f"{label} ({threshold:.3f}): precision={point['precision']:.3f}, "
            f"recall={point['recall']:.3f}, positivos={point['predicted_positive']}"
        )

    plot_path = os.path.join(artifacts_dir, f"{MODEL_VERSION}_precision_recall.png")
    _, plotted_metrics = plot_precision_recall(
        y_test, test_proba, thresholds, CANDIDATE_THRESHOLDS, plot_path
    )

    # Serialización física en backend/artifacts/
    joblib_path = os.path.join(artifacts_dir, f"{MODEL_VERSION}.joblib")
    joblib.dump(pipeline, joblib_path)

    meta_payload = {
        "model_version": MODEL_VERSION,
        "features": FEATURES,
        "thresholds": thresholds,
        "metrics": metrics,
        "threshold_selection": {
            "method": "5-fold out-of-fold predictions on training split",
            "minimum_medium_recall": MIN_RECALL,
            "minimum_high_precision": MIN_HIGH_PRECISION,
            "candidate_thresholds": CANDIDATE_THRESHOLDS,
            "candidate_thresholds_accepted": candidate_thresholds_accepted,
            "candidate_oof_metrics": candidate_oof_metrics,
            "test_threshold_metrics": plotted_metrics,
            "precision_recall_plot": os.path.basename(plot_path),
        },
        "versions": {
            "sklearn": sklearn.__version__,
            "lightgbm": lgb.__version__,
            "shap": shap.__version__
        }
    }

    meta_path = os.path.join(artifacts_dir, f"{MODEL_VERSION}_meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta_payload, f, indent=2)

    print(f"Artefactos exportados exitosamente:")
    print(f" -> {joblib_path}")
    print(f" -> {meta_path}")
    print(f" -> {plot_path}")


if __name__ == "__main__":
    run_training_and_export()