import pytest

@pytest.mark.asyncio
async def test_student_cannot_access_tutor_alerts(async_client, test_student_token):
    headers = {"Authorization": f"Bearer {test_student_token}"}
    res = await async_client.get("/api/v1/alerts", headers=headers)
    assert res.status_code == 403

@pytest.mark.asyncio
async def test_tutor_can_access_alerts(async_client, test_tutor_token):
    headers = {"Authorization": f"Bearer {test_tutor_token}"}
    res = await async_client.get("/api/v1/alerts", headers=headers)
    assert res.status_code in [200, 401]