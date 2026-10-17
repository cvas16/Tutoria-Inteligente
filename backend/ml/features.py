from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import RobustScaler, OneHotEncoder

# Características numéricas extraídas de los logs del aula virtual y notas formativas
NUMERIC_FEATURES = [
    "login_count",            # Frecuencia de sesiones iniciadas
    "total_time_seconds",     # Permanencia acumulada en plataforma
    "materials_accessed",     # Recursos didácticos consultados
    "forum_interactions",     # Participaciones e intercambios en foros
    "inactivity_days",        # Días continuos sin conexión al aula virtual
    "avg_score_evaluations",  # Calificación formativa promedio temprana (escala 0-20)
    "late_submissions_count"  # Entregas de tareas fuera del plazo establecido
]

# Variables categóricas institucionales
CATEGORICAL_FEATURES = [
    "academic_term",          # Ciclo académico (ej. '2026-1')
    "course_code"             # Código de la asignatura
]

FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES
TARGET = "has_dropped_out"    # 1: En riesgo de deserción / Abandono, 0: Activo


def build_preprocessor() -> ColumnTransformer:
    """
    Construye el preprocesador desacoplado:
    - Numéricas: Imputación con mediana y escalado con RobustScaler (resistente a outliers).
    - Categóricas: Imputación por constante y One-Hot Encoding sin romper ante nuevas categorías.
    """
    numeric_transformer = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", RobustScaler())
    ])

    categorical_transformer = Pipeline([
        ("imputer", SimpleImputer(strategy="constant", fill_value="missing")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    return ColumnTransformer([
        ("num", numeric_transformer, NUMERIC_FEATURES),
        ("cat", categorical_transformer, CATEGORICAL_FEATURES)
    ])