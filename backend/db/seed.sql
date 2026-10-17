\getenv seed_password SEED_DEMO_PASSWORD

INSERT INTO users (
    id, institutional_id, first_name, last_name, email, role, password_hash
)
VALUES (
    '00000000-0000-4000-8000-000000000001',
    'T202600001',
    'Tutor',
    'Demostración',
    'tutor@example.com',
    'TUTOR',
    crypt(:'seed_password', gen_salt('bf'))
)
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    password_hash = EXCLUDED.password_hash;

INSERT INTO users (
    id, institutional_id, first_name, last_name, email, role, password_hash
)
SELECT
    ('00000000-0000-4000-8000-' || lpad((n + 1)::text, 12, '0'))::uuid,
    'N2026' || lpad(n::text, 5, '0'),
    'Estudiante',
    lpad(n::text, 2, '0'),
    'student' || lpad(n::text, 2, '0') || '@example.com',
    'STUDENT',
    crypt(:'seed_password', gen_salt('bf'))
FROM generate_series(1, 30) AS n
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    password_hash = EXCLUDED.password_hash;

INSERT INTO courses (id, code, name, academic_term)
VALUES (
    '00000000-0000-4000-8000-000000000032',
    'SIS-101',
    'Fundamentos de Sistemas',
    '2026-1'
)
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    academic_term = EXCLUDED.academic_term;

INSERT INTO enrollments (id, student_id, course_id, status)
SELECT
    ('00000000-0000-4000-8000-' || lpad((100 + n)::text, 12, '0'))::uuid,
    student_id,
    '00000000-0000-4000-8000-000000000032',
    'ACTIVE'
FROM (
    SELECT id AS student_id, right(institutional_id, 5)::int AS n
    FROM users
    WHERE institutional_id LIKE 'N2026%'
) students
ON CONFLICT (student_id, course_id) DO UPDATE SET status = 'ACTIVE';

WITH cohort AS (
    SELECT e.id AS enrollment_id, right(u.institutional_id, 5)::int AS n
    FROM enrollments e
    JOIN users u ON u.id = e.student_id
    WHERE u.institutional_id LIKE 'N2026%'
)
INSERT INTO platform_activity_logs (
    enrollment_id, week_number, login_count, total_time_seconds,
    materials_accessed, forum_interactions, last_access_at
)
SELECT
    enrollment_id,
    4,
    CASE WHEN n <= 5 THEN 2 WHEN n <= 13 THEN 5 ELSE 12 END,
    CASE WHEN n <= 5 THEN 1800 WHEN n <= 13 THEN 5400 ELSE 14400 END,
    CASE WHEN n <= 5 THEN 3 WHEN n <= 13 THEN 8 ELSE 18 END,
    CASE WHEN n <= 5 THEN 0 WHEN n <= 13 THEN 2 ELSE 7 END,
    CURRENT_TIMESTAMP - make_interval(days => CASE WHEN n <= 5 THEN 18 WHEN n <= 13 THEN 9 ELSE 2 END)
FROM cohort
ON CONFLICT (enrollment_id, week_number) DO UPDATE SET
    login_count = EXCLUDED.login_count,
    total_time_seconds = EXCLUDED.total_time_seconds,
    materials_accessed = EXCLUDED.materials_accessed,
    forum_interactions = EXCLUDED.forum_interactions,
    last_access_at = EXCLUDED.last_access_at;

WITH cohort AS (
    SELECT e.id AS enrollment_id, right(u.institutional_id, 5)::int AS n
    FROM enrollments e
    JOIN users u ON u.id = e.student_id
    WHERE u.institutional_id LIKE 'N2026%'
)
INSERT INTO academic_metrics (
    enrollment_id, evaluation_name, week_number, score, max_score, submitted_on_time
)
SELECT
    enrollment_id,
    'Evaluación ' || evaluation_number,
    evaluation_number + 1,
    CASE
        WHEN n <= 5 THEN 5 + (n % 3) + evaluation_number
        WHEN n <= 13 THEN 10 + (n % 3) + evaluation_number
        ELSE LEAST(20, 15 + (n % 4) + evaluation_number)
    END,
    20,
    NOT ((n <= 5 AND evaluation_number < 3) OR (n BETWEEN 6 AND 13 AND evaluation_number = 1))
FROM cohort
CROSS JOIN generate_series(1, 3) AS evaluation_number
ON CONFLICT (enrollment_id, evaluation_name) DO UPDATE SET
    week_number = EXCLUDED.week_number,
    score = EXCLUDED.score,
    max_score = EXCLUDED.max_score,
    submitted_on_time = EXCLUDED.submitted_on_time;

WITH cohort AS (
    SELECT e.id AS enrollment_id, right(u.institutional_id, 5)::int AS n
    FROM enrollments e
    JOIN users u ON u.id = e.student_id
    WHERE u.institutional_id LIKE 'N2026%'
)
INSERT INTO ml_predictions (
    enrollment_id, cut_off_week, model_version, dropout_probability,
    risk_level, shap_summary, features_snapshot
)
SELECT
    enrollment_id,
    4,
    'dropout_lgbm_v2_seed',
    CASE
        WHEN n <= 5 THEN 0.70 + n * 0.02
        WHEN n <= 13 THEN 0.20 + (n - 6) * 0.02
        ELSE 0.05 + n * 0.002
    END,
    CASE WHEN n <= 5 THEN 'HIGH' WHEN n <= 13 THEN 'MEDIUM' ELSE 'LOW' END,
    CASE
        WHEN n <= 5 THEN jsonb_build_object('inactivity_days', 0.55, 'avg_score_evaluations', 0.31, 'late_submissions_count', 0.18)
        WHEN n <= 13 THEN jsonb_build_object('inactivity_days', 0.28, 'login_count', 0.16)
        ELSE jsonb_build_object('avg_score_evaluations', 0.08)
    END,
    jsonb_build_object(
        'login_count', CASE WHEN n <= 5 THEN 2 WHEN n <= 13 THEN 5 ELSE 12 END,
        'inactivity_days', CASE WHEN n <= 5 THEN 18 WHEN n <= 13 THEN 9 ELSE 2 END
    )
FROM cohort
ON CONFLICT (enrollment_id, cut_off_week, model_version) DO UPDATE SET
    dropout_probability = EXCLUDED.dropout_probability,
    risk_level = EXCLUDED.risk_level,
    shap_summary = EXCLUDED.shap_summary,
    features_snapshot = EXCLUDED.features_snapshot;

WITH cohort AS (
    SELECT p.id AS prediction_id, right(u.institutional_id, 5)::int AS n
    FROM ml_predictions p
    JOIN enrollments e ON e.id = p.enrollment_id
    JOIN users u ON u.id = e.student_id
    WHERE p.model_version = 'dropout_lgbm_v2_seed'
)
INSERT INTO early_alerts (prediction_id, tutor_id, status, recommendation_text, notified_at, resolved_at)
SELECT
    prediction_id,
    '00000000-0000-4000-8000-000000000001',
    CASE WHEN n <= 6 THEN 'PENDING' WHEN n <= 9 THEN 'NOTIFIED' WHEN n <= 12 THEN 'INTERVENED' ELSE 'RESOLVED' END,
    CASE WHEN n <= 5 THEN 'Contactar al estudiante por inactividad y rezago académico.'
         ELSE 'Realizar seguimiento preventivo y reforzar la participación en el aula.' END,
    CASE WHEN n <= 6 THEN NULL ELSE CURRENT_TIMESTAMP - INTERVAL '1 day' END,
    CASE WHEN n = 13 THEN CURRENT_TIMESTAMP ELSE NULL END
FROM cohort
WHERE n <= 13
ON CONFLICT (prediction_id) DO UPDATE SET
    tutor_id = EXCLUDED.tutor_id,
    status = EXCLUDED.status,
    recommendation_text = EXCLUDED.recommendation_text,
    notified_at = EXCLUDED.notified_at,
    resolved_at = EXCLUDED.resolved_at;

WITH cohort AS (
    SELECT a.id AS alert_id, right(u.institutional_id, 5)::int AS n
    FROM early_alerts a
    JOIN ml_predictions p ON p.id = a.prediction_id
    JOIN enrollments e ON e.id = p.enrollment_id
    JOIN users u ON u.id = e.student_id
    WHERE p.model_version = 'dropout_lgbm_v2_seed'
)
INSERT INTO tutor_interventions (id, alert_id, tutor_id, action_type, notes, agreed_commitment, executed_at)
SELECT
    ('00000000-0000-4000-8000-' || lpad((200 + n)::text, 12, '0'))::uuid,
    alert_id,
    '00000000-0000-4000-8000-000000000001',
    CASE WHEN n IN (10, 13) THEN 'ENTREVISTA' ELSE 'REFUERZO_ACADEMICO' END,
    'Seguimiento demostrativo de la cohorte sintética.',
    'Revisar avances académicos en la siguiente semana.',
    CURRENT_TIMESTAMP - INTERVAL '12 hours'
FROM cohort
WHERE n BETWEEN 10 AND 13
ON CONFLICT (id) DO UPDATE SET
    alert_id = EXCLUDED.alert_id,
    tutor_id = EXCLUDED.tutor_id,
    action_type = EXCLUDED.action_type,
    notes = EXCLUDED.notes,
    agreed_commitment = EXCLUDED.agreed_commitment,
    executed_at = EXCLUDED.executed_at;
