import uuid

from app.utils.jwt import create_access_token, verify_access_token


class TestJwt:
    def test_roundtrip(self):
        user_id = uuid.uuid4()
        token = create_access_token(user_id)
        assert verify_access_token(token) == user_id

    def test_rejects_garbage(self):
        assert verify_access_token("not-a-token") is None

    def test_rejects_wrong_signature(self):
        import jwt as pyjwt

        forged = pyjwt.encode({"sub": str(uuid.uuid4())}, "other-secret", algorithm="HS256")
        assert verify_access_token(forged) is None


class TestAuthEndpoints:
    async def test_health(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}

    async def test_me_requires_token(self, client):
        resp = await client.get("/api/auth/me")
        assert resp.status_code == 401

    async def test_me_rejects_invalid_token(self, client):
        resp = await client.get("/api/auth/me", headers={"Authorization": "Bearer bogus"})
        assert resp.status_code == 401

    async def test_dev_login_returns_token_and_user(self, client):
        resp = await client.post("/api/auth/dev-login")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["token"]
        assert data["user"]["email"] == "dev@test.com"
        # camelCase contract with the frontend
        assert "displayName" in data["user"]
        assert "avatarUrl" in data["user"]
        assert "createdAt" in data["user"]

    async def test_dev_login_is_idempotent(self, client):
        first = await client.post("/api/auth/dev-login")
        second = await client.post("/api/auth/dev-login")
        assert first.json()["data"]["user"]["id"] == second.json()["data"]["user"]["id"]

    async def test_me_returns_current_user(self, auth_client):
        resp = await auth_client.get("/api/auth/me")
        assert resp.status_code == 200
        assert resp.json()["data"]["id"] == auth_client.user["id"]

    async def test_logout(self, auth_client):
        resp = await auth_client.post("/api/auth/logout")
        assert resp.status_code == 200
        assert resp.json() == {"data": None}

    async def test_unknown_provider_404(self, client):
        resp = await client.get("/api/auth/github")
        assert resp.status_code == 404

    async def test_unconfigured_provider_404(self, client):
        # No OAuth credentials in the test environment
        resp = await client.get("/api/auth/google")
        assert resp.status_code == 404
