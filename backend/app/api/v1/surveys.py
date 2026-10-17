from fastapi import APIRouter, Depends, HTTPException, status
from app.core.deps import get_db, require_api_key, require_role
from app.schemas.survey import DimensionScores, SurveyCreate, SurveyResponse
from app.schemas.auth import TokenPayload
from app.services.survey_service import SurveyService

router = APIRouter(tags=["surveys"], dependencies=[Depends(require_api_key)])

@router.get("/surveys/summary", response_model=DimensionScores)
async def get_survey_summary(
    current_user: TokenPayload = Depends(require_role(["TUTOR", "ADMIN"])),
    pool = Depends(get_db)
):
    return await SurveyService(pool).compute_summary()

@router.post("/surveys", response_model=SurveyResponse, status_code=status.HTTP_201_CREATED)
async def submit_evaluation_survey(
    payload: SurveyCreate,
    current_user: TokenPayload = Depends(require_role(["STUDENT"])),
    pool = Depends(get_db)
):
    if payload.student_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puede registrar su propio cuestionario.",
        )

    query = """
        INSERT INTO evaluation_surveys (
            student_id, q01, q02, q03, q04, q05, q06, q07, q08, q09, q10, q11, q12
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, student_id, submission_date;
    """
    async with pool.acquire() as conn:
        try:
            row = await conn.fetchrow(
                query,
                payload.student_id,
                payload.q01, payload.q02, payload.q03, payload.q04,
                payload.q05, payload.q06, payload.q07, payload.q08,
                payload.q09, payload.q10, payload.q11, payload.q12
            )
            return dict(row)
        except Exception as e:
            if "fk_survey_student" in str(e):
                raise HTTPException(status_code=404, detail="El estudiante indicado no existe o no tiene rol STUDENT.")
            if "evaluation_surveys_student_id_key" in str(e):
                raise HTTPException(status_code=409, detail="El estudiante ya ha completado previamente el cuestionario.")
            raise HTTPException(status_code=500, detail="Error interno al registrar el instrumento psicométrico.")