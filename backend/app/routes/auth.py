import json
from typing import Annotated
from urllib.parse import urlencode

from authlib.integrations.starlette_client import OAuth, OAuthError
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models import User
from app.routes.deps import get_current_user
from app.schemas import UserOut
from app.services.auth import upsert_oauth_user
from app.utils.jwt import create_access_token

router = APIRouter()

DbDep = Annotated[AsyncSession, Depends(get_db)]

PROVIDERS = ("google", "twitch", "discord")

oauth = OAuth()


def _register_providers() -> None:
    settings = get_settings()
    if settings.google_client_id:
        oauth.register(
            "google",
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
            server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
            client_kwargs={"scope": "openid email profile"},
        )
    if settings.twitch_client_id:
        oauth.register(
            "twitch",
            client_id=settings.twitch_client_id,
            client_secret=settings.twitch_client_secret,
            authorize_url="https://id.twitch.tv/oauth2/authorize",
            access_token_url="https://id.twitch.tv/oauth2/token",
            token_endpoint_auth_method="client_secret_post",
            client_kwargs={"scope": "user:read:email"},
        )
    if settings.discord_client_id:
        oauth.register(
            "discord",
            client_id=settings.discord_client_id,
            client_secret=settings.discord_client_secret,
            authorize_url="https://discord.com/oauth2/authorize",
            access_token_url="https://discord.com/api/oauth2/token",
            client_kwargs={"scope": "identify email"},
        )


_register_providers()


def _get_client(provider: str):
    if provider not in PROVIDERS:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Unknown provider")
    client = oauth.create_client(provider)
    if client is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Provider not configured")
    return client


async def _fetch_profile(provider: str, client, token: dict) -> dict:
    """Normalize provider profiles to one shape."""
    if provider == "google":
        info = token.get("userinfo") or {}
        return {
            "provider_id": info["sub"],
            "email": info.get("email", ""),
            "display_name": info.get("name", ""),
            "avatar_url": info.get("picture", ""),
        }

    if provider == "discord":
        resp = await client.get("https://discord.com/api/users/@me", token=token)
        resp.raise_for_status()
        info = resp.json()
        avatar = (
            f"https://cdn.discordapp.com/avatars/{info['id']}/{info['avatar']}.png"
            if info.get("avatar")
            else ""
        )
        return {
            "provider_id": info["id"],
            "email": info.get("email", ""),
            "display_name": info.get("global_name") or info.get("username", ""),
            "avatar_url": avatar,
        }

    # twitch
    resp = await client.get(
        "https://api.twitch.tv/helix/users",
        token=token,
        headers={"Client-Id": get_settings().twitch_client_id},
    )
    resp.raise_for_status()
    info = resp.json()["data"][0]
    return {
        "provider_id": info["id"],
        "email": info.get("email", ""),
        "display_name": info.get("display_name", ""),
        "avatar_url": info.get("profile_image_url", ""),
    }


def _user_payload(user: User) -> dict:
    return UserOut.model_validate(user).model_dump(by_alias=True, mode="json")


@router.get("/me")
async def me(user: Annotated[User, Depends(get_current_user)]) -> dict:
    return {"data": _user_payload(user)}


@router.post("/logout")
async def logout() -> dict:
    # JWTs are stateless: the client discards the token. Kept as an
    # endpoint so the frontend contract (and future revocation) holds.
    return {"data": None}


@router.post("/dev-login")
async def dev_login(db: DbDep) -> dict:
    """Mock login for local development and e2e tests — disabled unless
    DEV_LOGIN_ENABLED=true. Never enable in production."""
    if not get_settings().dev_login_enabled:
        raise HTTPException(status.HTTP_404_NOT_FOUND)

    user = await upsert_oauth_user(
        db,
        provider="google",
        provider_id="dev-user",
        email="dev@test.com",
        display_name="Dev User",
        avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=dev",
    )
    return {"data": {"token": create_access_token(user.id), "user": _user_payload(user)}}


# NOTE: parameterized routes must stay below the literal ones
# (/me, /logout, /dev-login) or they would swallow those paths.
@router.get("/{provider}")
async def login(provider: str, request: Request):
    """Start the OAuth flow. The frontend passes a `state` it generated
    (CSRF token); it is round-tripped through the provider and returned
    to the frontend callback so the client can verify it."""
    client = _get_client(provider)
    redirect_uri = str(request.url_for("auth_callback", provider=provider))
    state = request.query_params.get("state")
    return await client.authorize_redirect(request, redirect_uri, state=state)


@router.get("/{provider}/callback")
async def auth_callback(provider: str, request: Request, db: DbDep):
    client = _get_client(provider)
    settings = get_settings()
    frontend_callback = f"{settings.frontend_url}/auth/callback"

    try:
        token = await client.authorize_access_token(request)
        profile = await _fetch_profile(provider, client, token)
    except (OAuthError, KeyError, IndexError):
        return RedirectResponse(f"{frontend_callback}?{urlencode({'error': 'oauth_failed'})}")

    user = await upsert_oauth_user(db, provider=provider, **profile)
    params = urlencode({
        "token": create_access_token(user.id),
        "user": json.dumps(_user_payload(user)),
        "state": request.query_params.get("state", ""),
    })
    return RedirectResponse(f"{frontend_callback}?{params}")
