# Backend + Database Development Plan

## Phase 1: Project Setup

### 1.1 Python Environment

- [x] Create `backend/` directory in project root
- [x] Initialize Python project:
  - [x] `pyproject.toml` (or `requirements.txt`)
  - [x] Python 3.11+
  - [x] Virtual environment (venv or poetry)
- [x] Install dependencies:
  - [x] `fastapi` — web framework
  - [x] `uvicorn[standard]` — ASGI server
  - [x] `sqlalchemy` — SQL toolkit (Core, not ORM)
  - [x] `asyncpg` — async PostgreSQL driver
  - [x] `alembic` — database migrations
  - [x] `pydantic` — data validation
  - [x] `pydantic-settings` — settings management
  - [ ] ~~`python-jose[cryptography]`~~ → used `PyJWT` instead (maintained, no known CVEs)
  - [ ] `passlib[bcrypt]` — password hashing (skipped: OAuth-only, no passwords)
  - [x] `authlib` — OAuth2 client
  - [x] `httpx` — async HTTP client (for OAuth)
  - [x] `python-dotenv` — environment variables
  - [x] `pytest`, `pytest-asyncio`, `httpx` — testing

### 1.2 Docker Setup

- [x] Create `backend/Dockerfile`:

  ```dockerfile
  FROM python:3.11-slim
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt
  COPY . .
  CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
  ```

- [x] Create `docker-compose.yml` in project root:

  ```yaml
  services:
    db:
      image: postgres:16-alpine
      environment:
        POSTGRES_DB: studylab
        POSTGRES_USER: studylab
        POSTGRES_PASSWORD: studylab
      ports:
        - "5432:5432"
      volumes:
        - pgdata:/var/lib/postgresql/data
    api:
      build: ./backend
      ports:
        - "8000:8000"
      environment:
        DATABASE_URL: postgresql+asyncpg://studylab:studylab@db:5432/studylab
        SECRET_KEY: your-secret-key-here
        GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
        GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
        TWITCH_CLIENT_ID: ${TWITCH_CLIENT_ID}
        TWITCH_CLIENT_SECRET: ${TWITCH_CLIENT_SECRET}
        DISCORD_CLIENT_ID: ${DISCORD_CLIENT_ID}
        DISCORD_CLIENT_SECRET: ${DISCORD_CLIENT_SECRET}
      depends_on:
        - db
  volumes:
    pgdata:
  ```

- [x] Create `.env.example` with all required variables
- [x] Test: `docker compose up -d` → API at `http://localhost:8000/docs`

### 1.3 FastAPI Application Structure

- [x] Create `backend/app/` directory:

  ```bash
  backend/app/
  ├── __init__.py
  ├── main.py              # FastAPI app entry point
  ├── config.py            # Settings (Pydantic Settings)
  ├── database.py          # SQLAlchemy engine & session
  ├── models/              # SQLAlchemy table definitions
  │   ├── __init__.py
  │   ├── user.py
  │   └── progress.py
  ├── schemas/             # Pydantic models (request/response)
  │   ├── __init__.py
  │   ├── user.py
  │   └── progress.py
  ├── routes/              # API endpoints
  │   ├── __init__.py
  │   ├── auth.py
  │   └── progress.py
  ├── services/            # Business logic
  │   ├── __init__.py
  │   ├── auth.py
  │   └── progress.py
  ├── middleware/           # Custom middleware
  │   ├── __init__.py
  │   └── cors.py
  └── utils/               # Helpers
      ├── __init__.py
      └── jwt.py
  ```

---

## Phase 2: Database

### 2.1 Schema Design

- [x] Create `backend/app/models/user.py`:

  ```sql
  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,
    provider VARCHAR(50) NOT NULL,  -- 'google', 'twitch', 'discord'
    provider_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  CREATE UNIQUE INDEX idx_users_provider ON users(provider, provider_id);
  ```

- [x] Create `backend/app/models/progress.py`:

  ```sql
  CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    completed_modules TEXT[] DEFAULT '{}',
    completed_challenges JSONB DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT NOW()
  );
  CREATE UNIQUE INDEX idx_progress_user ON user_progress(user_id);
  ```

### 2.2 Alembic Migrations

- [x] Initialize alembic: `alembic init backend/alembic`
- [x] Configure `alembic.ini`:
  - [x] Set `sqlalchemy.url` from environment
  - [x] Set `script_location = backend/alembic`
- [x] Configure `alembic/env.py`:
  - [x] Import SQLAlchemy models
  - [x] Set up async engine
- [x] Create initial migration:
  - [x] `alembic revision --autogenerate -m "initial_schema"`
  - [x] Review generated migration
  - [x] `alembic upgrade head`
- [x] Test: verify tables created in PostgreSQL

### 2.3 Database Connection

- [x] Create `backend/app/database.py`:
  - [x] Async engine with `asyncpg`
  - [x] Session factory
  - [x] Dependency injection for FastAPI routes

  ```python
  from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
  from sqlalchemy.orm import sessionmaker

  engine = create_async_engine(DATABASE_URL)
  async_session = sessionmaker(engine, class_=AsyncSession)

  async def get_db():
      async with async_session() as session:
          yield session
  ```

---

## Phase 3: API Implementation

### 3.1 Auth Routes (`/api/auth`)

- [x] `GET /api/auth/{provider}` — Initiate OAuth2 flow
  - [x] Redirect to provider's authorization URL
  - [x] Supported providers: google, twitch, discord
- [x] `GET /api/auth/{provider}/callback` — OAuth2 callback
  - [x] Exchange code for access token
  - [x] Fetch user profile from provider
  - [x] Create or update user in database
  - [x] Generate JWT token
  - [x] Redirect to frontend with token
- [x] `GET /api/auth/me` — Get current user profile
  - [x] Requires JWT token
  - [x] Returns user data + progress
- [x] `POST /api/auth/logout` — Logout
  - [x] Clear session/token

### 3.2 Progress Routes (`/api/progress`)

- [x] `GET /api/progress` — Get user progress
  - [x] Requires JWT token
  - [x] Returns: xp, level, completedModules, completedChallenges
- [x] `POST /api/progress/complete` — Complete a module
  - [x] Body: `{ "moduleSlug": "debounce", "xpReward": 30 }`
  - [x] Requires JWT token
  - [x] Updates progress in database
  - [x] Returns updated progress
- [x] `POST /api/progress/challenge/complete` — Complete a challenge
  - [x] Body: `{ "moduleSlug": "debounce", "challengeId": "test-1", "xpReward": 10 }`
  - [x] Requires JWT token
  - [x] Returns updated progress

### 3.3 JWT Utilities

- [x] Create `backend/app/utils/jwt.py`:
  - [x] `create_access_token(user_id)` → JWT token
  - [x] `verify_access_token(token)` → user_id
  - [x] Token expiration: 7 days
- [x] Create dependency `get_current_user()` for protected routes

### 3.4 CORS Middleware

- [x] Configure CORS in `backend/app/main.py`:
  - [x] Allow frontend origin (localhost:5173 for dev)
  - [x] Allow credentials (for cookies if needed)

---

## Phase 4: OAuth2 Provider Setup

### 4.1 Google OAuth2

- [x] Create project in Google Cloud Console
- [x] Create OAuth2 credentials
- [x] Set redirect URI: `https://frontend-study-lab-production.up.railway.app/api/auth/google/callback`
- [x] Store `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` + Railway env
- [x] Verified in prod: `GET /api/auth/google` → 302 to accounts.google.com

### 4.2 Twitch OAuth2 (not configured — endpoint returns 404 in prod)

- [ ] Register application in Twitch Developer Console
- [ ] Set redirect URI: `https://frontend-study-lab-production.up.railway.app/api/auth/twitch/callback`
- [ ] Store `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` in `.env` + Railway env

### 4.3 Discord OAuth2 (not configured — endpoint returns 404 in prod)

- [ ] Create application in Discord Developer Portal
- [ ] Add redirect URI: `https://frontend-study-lab-production.up.railway.app/api/auth/discord/callback`
- [ ] Store `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` in `.env` + Railway env

---

## Phase 5: Testing

### 5.1 Backend Unit Tests

- [x] Create `backend/tests/` directory
- [x] Create `backend/tests/conftest.py`:
  - [x] Test database (SQLite in-memory or test PostgreSQL)
  - [x] Test client (AsyncClient from httpx)
  - [x] Fixtures for test user
- [x] Create `backend/tests/test_auth.py`:
  - [x] Test OAuth2 flow initiation (unknown/unconfigured provider cases)
  - [x] Test callback handling (`tests/test_oauth_callback.py`, mocked provider responses)
  - [x] Test JWT creation/verification
- [x] Create `backend/tests/test_progress.py`:
  - [x] Test get progress
  - [x] Test complete module
  - [x] Test complete challenge
  - [x] Test level-up logic

### 5.2 Integration Tests

- [x] Test full OAuth2 flow with mocked provider responses (google/twitch/discord: success, error, malformed profile, upsert idempotency)
- [x] Test database operations
- [x] Test API endpoints with real database (manual smoke via docker-compose, 2026-07-08)

---

## Phase 6: CI/CD & Deploy

### 6.1 GitHub Actions

- [x] Create `.github/workflows/backend-ci.yml`:
  - [x] Python linting (ruff)
  - [x] Type checking (mypy)
  - [x] Run tests
  - [x] Build Docker image
- [x] Deploy pipeline (no separate backend deploy.yml needed):
  - [x] Backend → Railway auto-deploys from GitHub on push to main
  - [x] Frontend → GitHub Pages via `.github/workflows/deploy.yml` (after CI)
  - [x] Migrations run on container start (`alembic upgrade head` in Dockerfile CMD, with retries)

### 6.2 Deploy Configuration

- [x] Create `backend/railway.toml`:
  - [x] Backend service (FastAPI, Dockerfile build, /health healthcheck)
  - [x] PostgreSQL database (Railway addon)
  - [x] Environment variables
- [x] Set up production secrets (Railway env):
  - [x] `JWT_SECRET`
  - [x] `DATABASE_URL`
  - [x] OAuth2 credentials (Google; Twitch/Discord pending — see Phase 4)
- [x] Test production deployment (`/health` → 200)
- [x] Verify Swagger docs at production URL (`/docs` → 200)

---

## API Endpoints Summary

```bash
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/auth/{provider}` | No | Initiate OAuth2 login |
| GET | `/api/auth/{provider}/callback` | No | OAuth2 callback |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/auth/logout` | Yes | Logout |
| GET | `/api/progress` | Yes | Get user progress |
| POST | `/api/progress/complete` | Yes | Complete module |
| POST | `/api/progress/challenge/complete` | Yes | Complete challenge |
| GET | `/docs` | No | Swagger UI |
| GET | `/health` | No | Health check |
```
