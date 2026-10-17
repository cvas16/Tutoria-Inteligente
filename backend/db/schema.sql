CREATE EXTENSION IF NOT EXISTS "pgcrypto";   


CREATE TABLE users (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    institutional_id VARCHAR(20) UNIQUE NOT NULL,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL,

    role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'TUTOR', 'ADMIN')),

    password_hash TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_users_id_role UNIQUE (id, role)           

);

CREATE UNIQUE INDEX uq_users_email_ci ON users (lower(email));  



CREATE TABLE courses (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(20) NOT NULL,

    name VARCHAR(150) NOT NULL,

    academic_term VARCHAR(10) NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_course_code_term UNIQUE (code, academic_term)

);



CREATE TABLE enrollments (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL,

    student_role VARCHAR(20) NOT NULL DEFAULT 'STUDENT' CHECK (student_role = 'STUDENT'),

    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'WITHDRAWN', 'COMPLETED')),

    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    status_changed_at TIMESTAMPTZ,

    CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id, student_role)

        REFERENCES users(id, role) ON DELETE CASCADE,        -- solo usuarios STUDENT

    CONSTRAINT uq_student_course UNIQUE (student_id, course_id),

    CONSTRAINT ck_withdrawn_has_date CHECK (status <> 'WITHDRAWN' OR status_changed_at IS NOT NULL)

);



CREATE TABLE platform_activity_logs (

    id BIGSERIAL PRIMARY KEY,

    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,

    week_number SMALLINT NOT NULL CHECK (week_number BETWEEN 1 AND 16),

    login_count INT NOT NULL DEFAULT 0 CHECK (login_count >= 0),

    total_time_seconds INT NOT NULL DEFAULT 0 CHECK (total_time_seconds >= 0),

    materials_accessed INT NOT NULL DEFAULT 0 CHECK (materials_accessed >= 0),

    forum_interactions INT NOT NULL DEFAULT 0 CHECK (forum_interactions >= 0),

    last_access_at TIMESTAMPTZ,

    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_activity_enrollment_week UNIQUE (enrollment_id, week_number)

);


CREATE TABLE academic_metrics (

    id BIGSERIAL PRIMARY KEY,

    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,

    evaluation_name VARCHAR(50) NOT NULL,

    week_number SMALLINT NOT NULL CHECK (week_number BETWEEN 1 AND 16),

    score NUMERIC(5,2) NOT NULL CHECK (score >= 0),

    max_score NUMERIC(5,2) NOT NULL DEFAULT 20.00 CHECK (max_score > 0),

    submitted_on_time BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_score_le_max CHECK (score <= max_score),

    CONSTRAINT uq_metric_enrollment_eval UNIQUE (enrollment_id, evaluation_name)

);



CREATE TABLE ml_predictions (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,

    cut_off_week SMALLINT NOT NULL CHECK (cut_off_week BETWEEN 1 AND 16),

    model_version VARCHAR(50) NOT NULL,

    dropout_probability NUMERIC(5,4) NOT NULL CHECK (dropout_probability BETWEEN 0 AND 1),

    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),

    shap_summary JSONB NOT NULL DEFAULT '{}'::jsonb,

    features_snapshot JSONB,

    predicted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_prediction UNIQUE (enrollment_id, cut_off_week, model_version)

);



CREATE TABLE early_alerts (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    prediction_id UUID NOT NULL UNIQUE REFERENCES ml_predictions(id) ON DELETE CASCADE,

    tutor_id UUID REFERENCES users(id) ON DELETE SET NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'NOTIFIED', 'INTERVENED', 'RESOLVED')),

    recommendation_text TEXT NOT NULL,

    notified_at TIMESTAMPTZ,                                 -- NULL mientras esté PENDING

    resolved_at TIMESTAMPTZ,

    CONSTRAINT ck_resolved_consistency CHECK ((status = 'RESOLVED') = (resolved_at IS NOT NULL))

);



CREATE FUNCTION trg_alert_tutor_is_tutor() RETURNS trigger AS $$

BEGIN

    IF NEW.tutor_id IS NOT NULL AND NOT EXISTS (

        SELECT 1 FROM users WHERE id = NEW.tutor_id AND role = 'TUTOR') THEN

        RAISE EXCEPTION 'tutor_id % no pertenece a un usuario con rol TUTOR', NEW.tutor_id;

    END IF;

    RETURN NEW;

END $$ LANGUAGE plpgsql;

CREATE TRIGGER alert_tutor_check BEFORE INSERT OR UPDATE OF tutor_id ON early_alerts

    FOR EACH ROW EXECUTE FUNCTION trg_alert_tutor_is_tutor();

CREATE TABLE tutor_interventions (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    alert_id UUID NOT NULL REFERENCES early_alerts(id) ON DELETE CASCADE,

    tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    action_type VARCHAR(40) NOT NULL CHECK (
        action_type IN ('ENTREVISTA', 'REFUERZO_ACADEMICO', 'ENVIO_MATERIAL', 'CONTACTO_PREVENTIVO')
    ),

    notes TEXT NOT NULL CHECK (length(notes) >= 5),

    agreed_commitment TEXT,

    executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP

);



CREATE TABLE evaluation_surveys (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    student_id UUID NOT NULL UNIQUE,

    student_role VARCHAR(20) NOT NULL DEFAULT 'STUDENT' CHECK (student_role = 'STUDENT'),

    q01 SMALLINT NOT NULL CHECK (q01 BETWEEN 1 AND 5), q02 SMALLINT NOT NULL CHECK (q02 BETWEEN 1 AND 5),

    q03 SMALLINT NOT NULL CHECK (q03 BETWEEN 1 AND 5), q04 SMALLINT NOT NULL CHECK (q04 BETWEEN 1 AND 5),

    q05 SMALLINT NOT NULL CHECK (q05 BETWEEN 1 AND 5), q06 SMALLINT NOT NULL CHECK (q06 BETWEEN 1 AND 5),

    q07 SMALLINT NOT NULL CHECK (q07 BETWEEN 1 AND 5), q08 SMALLINT NOT NULL CHECK (q08 BETWEEN 1 AND 5),

    q09 SMALLINT NOT NULL CHECK (q09 BETWEEN 1 AND 5), q10 SMALLINT NOT NULL CHECK (q10 BETWEEN 1 AND 5),

    q11 SMALLINT NOT NULL CHECK (q11 BETWEEN 1 AND 5), q12 SMALLINT NOT NULL CHECK (q12 BETWEEN 1 AND 5),

    submission_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_survey_student FOREIGN KEY (student_id, student_role)

        REFERENCES users(id, role) ON DELETE CASCADE

);




CREATE INDEX idx_enrollments_course      ON enrollments(course_id);

CREATE INDEX idx_predictions_latest      ON ml_predictions(enrollment_id, cut_off_week, predicted_at DESC);

CREATE INDEX idx_predictions_risk        ON ml_predictions(risk_level, predicted_at DESC);

CREATE INDEX idx_alerts_tutor_status     ON early_alerts(tutor_id, status);




DROP FUNCTION IF EXISTS public.fn_ml_features(smallint, timestamp with time zone, uuid);
DROP FUNCTION IF EXISTS public.fn_ml_features(uuid, integer);

CREATE FUNCTION fn_ml_features(

    p_cutoff_week SMALLINT,

    p_as_of TIMESTAMPTZ DEFAULT now(),

    p_enrollment_id UUID DEFAULT NULL

)

RETURNS TABLE (

    login_count BIGINT,
    inactivity_days INT,
    avg_score_evaluations NUMERIC,
    late_submissions_count BIGINT,
    materials_accessed BIGINT,
    forum_interactions BIGINT

)

LANGUAGE sql STABLE AS $$

    SELECT

        COALESCE(a.logins, 0),

        GREATEST(0, EXTRACT(DAY FROM p_as_of - COALESCE(a.last_access, e.enrolled_at)))::int,

        COALESCE(ROUND(m.avg_score, 2), 0),
        COALESCE(m.late, 0),

        COALESCE(a.materials, 0),
        COALESCE(a.forum, 0)

    FROM enrollments e

    LEFT JOIN (

        SELECT enrollment_id,

               SUM(login_count) AS logins,
               SUM(materials_accessed) AS materials,
               SUM(forum_interactions) AS forum,
               MAX(last_access_at) FILTER (
                   WHERE last_access_at IS NOT NULL AND last_access_at <= p_as_of
               ) AS last_access

        FROM platform_activity_logs

        WHERE week_number <= p_cutoff_week
          AND recorded_at <= p_as_of
          AND (last_access_at IS NULL OR last_access_at <= p_as_of)

          AND (p_enrollment_id IS NULL OR enrollment_id = p_enrollment_id)

        GROUP BY enrollment_id

    ) a ON a.enrollment_id = e.id

    LEFT JOIN (

        SELECT enrollment_id,

               AVG(score / max_score * 20.0) AS avg_score,

               COUNT(*) FILTER (WHERE NOT submitted_on_time) AS late

        FROM academic_metrics

        WHERE week_number <= p_cutoff_week
          AND created_at <= p_as_of

          AND (p_enrollment_id IS NULL OR enrollment_id = p_enrollment_id)

        GROUP BY enrollment_id

    ) m ON m.enrollment_id = e.id

    WHERE e.enrolled_at <= p_as_of
      AND (p_enrollment_id IS NULL OR e.id = p_enrollment_id);

$$; 