import pytest
from uuid import uuid4
from pydantic import ValidationError
from app.schemas.survey import SurveyCreate

def test_survey_create_valid():
    payload = {
        "student_id": str(uuid4()),
        "q01": 5, "q02": 4, "q03": 5, "q04": 4,
        "q05": 5, "q06": 4, "q07": 5, "q08": 4,
        "q09": 5, "q10": 4, "q11": 5, "q12": 4
    }
    survey = SurveyCreate(**payload)
    assert survey.q01 == 5
    assert survey.q12 == 4

def test_survey_create_out_of_range():
    # El instrumento solo admite valores del 1 al 5
    payload = {
        "student_id": str(uuid4()),
        "q01": 6, "q02": 0, "q03": 5, "q04": 4,
        "q05": 5, "q06": 4, "q07": 5, "q08": 4,
        "q09": 5, "q10": 4, "q11": 5, "q12": 4
    }
    with pytest.raises(ValidationError):
        SurveyCreate(**payload)