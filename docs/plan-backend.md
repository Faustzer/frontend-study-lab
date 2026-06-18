# Backend + Database Development Plan

## Phase 1: Project Setup

### 1.1 Python Environment

- [ ] Create `backend/` directory in project root
- [ ] Initialize Python project:
  - [ ] `pyproject.toml` (or `requirements.txt`)
  - [ ] Python 3.11+
  - [ ] Virtual environment (venv or poetry)
- [ ] Install dependencies:
  - [ ] `fastapi` — web framework
  - [ ] `uvicorn[standard]` — ASGI server
  - [ ] `sqlalchemy` — SQL toolkit (Core, not ORM)
  - [ ] `asyncpg` — async PostgreSQL driver
  - [ ] `alembic` — database migrations
  - [ ] `pydantic` — data validation
  - [ ] `pydantic-settings` — settings management
  - [ ] `python-jose[cryptography]` — JWT tokens
  - [ ] `passlib[bcrypt]` — password hashing (for future)
  - [ ] `authlib` — OAuth2 client
  - [ ] `httpx` — async HTTP client (for OAuth)
  - [ ] `python-dotenv` — environment variables
  - [ ] `pytest`, `pytest-asyncio`, `httpx` — testing

### 1.2 Docker Setup

- [ ] Create `backend/Dockerfile`:

  ```dockerfile
  FROM python:3.11-slim
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt
  COPY . .
  CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
  ```

- [ ] Create `docker-compose.yml` in project root:

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

- [ ] Create `.env.example` with all required variables
- [ ] Test: `docker compose up -d` → API at `http://localhost:8000/docs`

### 1.3 FastAPI Application Structure

- [ ] Create `backend/app/` directory:

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

- [ ] Create `backend/app/models/user.py`:

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

- [ ] Create `backend/app/models/progress.py`:

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

- [ ] Initialize alembic: `alembic init backend/alembic`
- [ ] Configure `alembic.ini`:
  - [ ] Set `sqlalchemy.url` from environment
  - [ ] Set `script_location = backend/alembic`
- [ ] Configure `alembic/env.py`:
  - [ ] Import SQLAlchemy models
  - [ ] Set up async engine
- [ ] Create initial migration:
  - [ ] `alembic revision --autogenerate -m "initial_schema"`
  - [ ] Review generated migration
  - [ ] `alembic upgrade head`
- [ ] Test: verify tables created in PostgreSQL

### 2.3 Database Connection

- [ ] Create `backend/app/database.py`:
  - [ ] Async engine with `asyncpg`
  - [ ] Session factory
  - [ ] Dependency injection for FastAPI routes

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

- [ ] `GET /api/auth/{provider}` — Initiate OAuth2 flow
  - [ ] Redirect to provider's authorization URL
  - [ ] Supported providers: google, twitch, discord
- [ ] `GET /api/auth/{provider}/callback` — OAuth2 callback
  - [ ] Exchange code for access token
  - [ ] Fetch user profile from provider
  - [ ] Create or update user in database
  - [ ] Generate JWT token
  - [ ] Redirect to frontend with token
- [ ] `GET /api/auth/me` — Get current user profile
  - [ ] Requires JWT token
  - [ ] Returns user data + progress
- [ ] `POST /api/auth/logout` — Logout
  - [ ] Clear session/token

### 3.2 Progress Routes (`/api/progress`)

- [ ] `GET /api/progress` — Get user progress
  - [ ] Requires JWT token
  - [ ] Returns: xp, level, completedModules, completedChallenges
- [ ] `POST /api/progress/complete` — Complete a module
  - [ ] Body: `{ "moduleSlug": "debounce", "xpReward": 30 }`
  - [ ] Requires JWT token
  - [ ] Updates progress in database
  - [ ] Returns updated progress
- [ ] `POST /api/progress/challenge/complete` — Complete a challenge
  - [ ] Body: `{ "moduleSlug": "debounce", "challengeId": "test-1", "xpReward": 10 }`
  - [ ] Requires JWT token
  - [ ] Returns updated progress

### 3.3 JWT Utilities

- [ ] Create `backend/app/utils/jwt.py`:
  - [ ] `create_access_token(user_id)` → JWT token
  - [ ] `verify_access_token(token)` → user_id
  - [ ] Token expiration: 7 days
- [ ] Create dependency `get_current_user()` for protected routes

### 3.4 CORS Middleware

- [ ] Configure CORS in `backend/app/main.py`:
  - [ ] Allow frontend origin (localhost:5173 for dev)
  - [ ] Allow credentials (for cookies if needed)

---

## Phase 4: OAuth2 Provider Setup

### 4.1 Google OAuth2

- [ ] Create project in Google Cloud Console
- [ ] Enable Google+ API
- [ ] Create OAuth2 credentials
- [ ] Set redirect URI: `http://localhost:8000/api/auth/google/callback`
- [ ] Store `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

### 4.2 Twitch OAuth2

- [ ] Register application in Twitch Developer Console
- [ ] Set redirect URI: `http://localhost:8000/api/auth/twitch/callback`
- [ ] Store `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` in `.env`

### 4.3 Discord OAuth2

- [ ] Create application in Discord Developer Portal
- [ ] Add redirect URI: `http://localhost:8000/api/auth/discord/callback`
- [ ] Store `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` in `.env`

---

## Phase 5: Testing

### 5.1 Backend Unit Tests

- [ ] Create `backend/tests/` directory
- [ ] Create `backend/tests/conftest.py`:
  - [ ] Test database (SQLite in-memory or test PostgreSQL)
  - [ ] Test client (AsyncClient from httpx)
  - [ ] Fixtures for test user
- [ ] Create `backend/tests/test_auth.py`:
  - [ ] Test OAuth2 flow initiation
  - [ ] Test callback handling
  - [ ] Test JWT creation/verification
- [ ] Create `backend/tests/test_progress.py`:
  - [ ] Test get progress
  - [ ] Test complete module
  - [ ] Test complete challenge
  - [ ] Test level-up logic

### 5.2 Integration Tests

- [ ] Test full OAuth2 flow with mocked provider responses
- [ ] Test database operations
- [ ] Test API endpoints with real database

---

## Phase 6: CI/CD & Deploy

### 6.1 GitHub Actions

- [ ] Create `.github/workflows/backend-ci.yml`:
  - [ ] Python linting (ruff or flake8)
  - [ ] Type checking (mypy)
  - [ ] Run tests
  - [ ] Build Docker image
- [ ] Create `.github/workflows/deploy.yml`:
  - [ ] Deploy backend to Railway/Render
  - [ ] Deploy frontend to Vercel/Railway
  - [ ] Run migrations on deploy

### 6.2 Deploy Configuration

- [ ] Create `railway.toml` or `render.yaml`:
  - [ ] Backend service (FastAPI)
  - [ ] PostgreSQL database
  - [ ] Environment variables
- [ ] Set up production secrets:
  - [ ] `SECRET_KEY`
  - [ ] `DATABASE_URL`
  - [ ] OAuth2 credentials
- [ ] Test production deployment
- [ ] Verify Swagger docs at production URL

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
