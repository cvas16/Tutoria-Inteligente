from fastapi import APIRouter
from app.api.v1 import predictions, alerts, surveys, analytics, interventions, auth, me

api_router = APIRouter()

api_router.include_router(predictions.router)
api_router.include_router(alerts.router)
api_router.include_router(surveys.router)
api_router.include_router(analytics.router)
api_router.include_router(interventions.router)  
api_router.include_router(auth.router)
api_router.include_router(me.router)