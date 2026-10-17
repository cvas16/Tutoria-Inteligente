from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token

def test_password_hashing():
    raw = "Tesis2026*"
    hashed = get_password_hash(raw)
    assert verify_password(raw, hashed) is True
    assert verify_password("PasswordErroneo", hashed) is False

def test_jwt_generation_and_decode():
    token = create_access_token(subject="user-123", role="TUTOR")
    payload = decode_access_token(token)
    assert payload["sub"] == "user-123"
    assert payload["role"] == "TUTOR"