"""OAuth callback tests with mocked provider responses.

The real providers are never called: `_get_client` is patched to return
a stub whose `authorize_access_token` / `get` yield canned responses,
so the tests cover everything from the callback route down to the DB
upsert and the redirect back to the frontend.
"""

from unittest.mock import AsyncMock, MagicMock
from urllib.parse import parse_qs, urlparse

import pytest
from authlib.integrations.starlette_client import OAuthError

import app.routes.auth as auth_routes
from app.utils.jwt import verify_access_token

FRONTEND_CALLBACK = "http://localhost:5173/auth/callback"

GOOGLE_USERINFO = {
    "sub": "google-user-1",
    "email": "alice@gmail.com",
    "name": "Alice",
    "picture": "https://lh3.googleusercontent.com/a/photo.jpg",
}

DISCORD_PROFILE = {
    "id": "discord-user-1",
    "email": "bob@discord.test",
    "username": "bob",
    "global_name": "Bob The Builder",
    "avatar": "abc123",
}

TWITCH_PROFILE = {
    "id": "twitch-user-1",
    "email": "carol@twitch.test",
    "display_name": "Carol",
    "profile_image_url": "https://static-cdn.jtvnw.net/carol.png",
}


def _stub_client(token=None, profile_json=None, token_error=None):
    """Build a fake authlib client for one provider."""
    client = MagicMock()
    if token_error is not None:
        client.authorize_access_token = AsyncMock(side_effect=token_error)
    else:
        client.authorize_access_token = AsyncMock(return_value=token or {})
    if profile_json is not None:
        resp = MagicMock()
        resp.json.return_value = profile_json
        resp.raise_for_status.return_value = None
        client.get = AsyncMock(return_value=resp)
    return client


@pytest.fixture
def use_client(monkeypatch):
    def _install(client):
        monkeypatch.setattr(auth_routes, "_get_client", lambda provider: client)
        return client

    return _install


def _redirect_params(resp):
    assert resp.status_code == 307
    location = resp.headers["location"]
    assert location.startswith(FRONTEND_CALLBACK)
    return {k: v[0] for k, v in parse_qs(urlparse(location).query).items()}


class TestGoogleCallback:
    async def test_success_redirects_with_token_and_user(self, client, use_client):
        use_client(_stub_client(token={"userinfo": GOOGLE_USERINFO}))
        resp = await client.get("/api/auth/google/callback?code=x&state=csrf-123")
        params = _redirect_params(resp)

        assert verify_access_token(params["token"]) is not None
        assert params["state"] == "csrf-123"
        assert "alice@gmail.com" in params["user"]
        assert "error" not in params

    async def test_created_user_is_usable_via_me(self, client, use_client):
        use_client(_stub_client(token={"userinfo": GOOGLE_USERINFO}))
        resp = await client.get("/api/auth/google/callback?code=x")
        token = _redirect_params(resp)["token"]

        me = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200
        data = me.json()["data"]
        assert data["email"] == "alice@gmail.com"
        assert data["displayName"] == "Alice"
        assert data["provider"] == "google"

    async def test_repeat_login_upserts_same_user(self, client, use_client):
        use_client(_stub_client(token={"userinfo": GOOGLE_USERINFO}))
        first = _redirect_params(await client.get("/api/auth/google/callback?code=x"))
        second = _redirect_params(await client.get("/api/auth/google/callback?code=y"))
        assert verify_access_token(first["token"]) == verify_access_token(second["token"])

    async def test_oauth_error_redirects_with_error(self, client, use_client):
        use_client(_stub_client(token_error=OAuthError(error="access_denied")))
        resp = await client.get("/api/auth/google/callback?error=access_denied")
        params = _redirect_params(resp)
        assert params == {"error": "oauth_failed"}

    async def test_malformed_profile_redirects_with_error(self, client, use_client):
        # Token exchange succeeds but userinfo is missing "sub" → KeyError
        use_client(_stub_client(token={"userinfo": {"email": "x@y.z"}}))
        resp = await client.get("/api/auth/google/callback?code=x")
        assert _redirect_params(resp) == {"error": "oauth_failed"}


class TestDiscordCallback:
    async def test_profile_normalization(self, client, use_client):
        stub = use_client(_stub_client(token={"access_token": "t"}, profile_json=DISCORD_PROFILE))
        resp = await client.get("/api/auth/discord/callback?code=x")
        token = _redirect_params(resp)["token"]

        me = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        data = me.json()["data"]
        assert data["provider"] == "discord"
        assert data["email"] == "bob@discord.test"
        # global_name preferred over username
        assert data["displayName"] == "Bob The Builder"
        assert data["avatarUrl"] == "https://cdn.discordapp.com/avatars/discord-user-1/abc123.png"
        stub.get.assert_awaited_once()

    async def test_missing_avatar_gives_empty_url(self, client, use_client):
        profile = {**DISCORD_PROFILE, "avatar": None}
        use_client(_stub_client(token={"access_token": "t"}, profile_json=profile))
        resp = await client.get("/api/auth/discord/callback?code=x")
        token = _redirect_params(resp)["token"]

        me = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.json()["data"]["avatarUrl"] == ""


class TestTwitchCallback:
    async def test_profile_normalization(self, client, use_client):
        use_client(
            _stub_client(token={"access_token": "t"}, profile_json={"data": [TWITCH_PROFILE]})
        )
        resp = await client.get("/api/auth/twitch/callback?code=x")
        token = _redirect_params(resp)["token"]

        me = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        data = me.json()["data"]
        assert data["provider"] == "twitch"
        assert data["email"] == "carol@twitch.test"
        assert data["displayName"] == "Carol"

    async def test_empty_users_list_redirects_with_error(self, client, use_client):
        # Twitch returned no users → IndexError → oauth_failed
        use_client(_stub_client(token={"access_token": "t"}, profile_json={"data": []}))
        resp = await client.get("/api/auth/twitch/callback?code=x")
        assert _redirect_params(resp) == {"error": "oauth_failed"}
