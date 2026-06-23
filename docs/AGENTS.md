# AI Assistant Guide

This document defines rules and conventions for AI assistants working on this project. Follow these guidelines strictly.

## 🚨 Critical Rules

### Never Commit Secrets

**NEVER** commit, log, or expose:

- API keys (Google, Twitch, Discord, any third-party)
- Database connection strings with credentials
- JWT secrets or signing keys
- OAuth client secrets
- `.env` files with real values
- Private keys or certificates

### Always Use `.env.example`

When adding new environment variables:

1. Add the variable to `.env.example` with a placeholder value
2. Add a comment explaining what it is and how to obtain it
3. **NEVER** put real values in `.env.example`

Example:

```bash
# .env.example
# Get your Google OAuth credentials at https://console.cloud.google.com
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here

# Database connection (local Docker)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# JWT secret — generate with: openssl rand -hex 32
JWT_SECRET=generate-a-random-secret
```

## Project Structure

```md
frontend-study-lab/
├── .env # ← NEVER COMMIT (gitignored)
├── .env.example # ← Template with placeholders
├── .github/
│ └── workflows/ # CI/CD pipelines
├── backend/ # FastAPI backend (future)
│ ├── .env # ← NEVER COMMIT
│ ├── .env.example # ← Template
│ ├── alembic/ # Database migrations
│ ├── app/
│ │ ├── config.py # Settings loaded from .env
│ │ ├── models/ # SQLAlchemy models
│ │ ├── routes/ # API endpoints
│ │ └── services/ # Business logic
│ └── tests/
├── docs/
│ ├── AI-GUIDE.md # This file
│ ├── plan-frontend.md # Frontend development plan
│ ├── plan-backend.md # Backend development plan
│ └── skeleton.md # Topic creation template
├── frontend/
│ ├── .env # ← NEVER COMMIT (Vite env)
│ ├── .env.example # ← Template
│ ├── api/ # API client layer
│ ├── assets/
│ ├── components/
│ ├── composables/
│ ├── i18n/
│ ├── mocks/ # MSW handlers (safe to commit)
│ ├── pages/
│ ├── stores/
│ ├── topics/ # Learning modules
│ ├── types/
│ ├── App.vue
│ ├── main.ts
│ ├── router.ts
│ ├── vite.config.ts
│ └── vitest.config.ts
├── .gitignore
├── .husky/
├── docker-compose.yml # Local development (safe — no secrets)
├── index.html
├── package.json
└── README.md
```

## Environment Variables

### Frontend (`frontend/.env`)

```bash
# API base URL (no secrets)
VITE_API_URL=http://localhost:8000/api

# MSW mode — enable API mocking in development
VITE_USE_MSW=true
```

### Backend (`backend/.env`)

```bash
# Database (local Docker — safe defaults)
DATABASE_URL=postgresql://studylab:studylab@localhost:5432/studylab

# JWT — generate with: openssl rand -hex 32
JWT_SECRET=change-me-in-production

# OAuth2 Providers — get from respective developer consoles
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret

DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# CORS — frontend URL
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

## Git Safety Checklist

Before every commit, verify:

```bash
# 1. Check what files are staged
git diff --cached --name-only

# 2. Ensure no .env files are staged
git diff --cached --name-only | grep -E "^\.env$|^\.env\.local$|^\.env\.production$"
# If this outputs anything — STOP and unstage those files

# 3. Check for accidental secrets in diff
git diff --cached | grep -iE "(api_key|api_secret|password|token|secret|private_key)"
# If this outputs anything — STOP and remove the secrets

# 4. Run linting
npm run lint

# 5. Run type checking
npm run typecheck
```

## Docker Compose (Local Development)

The `docker-compose.yml` uses default credentials for local development only:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: studylab
      POSTGRES_USER: studylab # ← Safe for local only
      POSTGRES_PASSWORD: studylab # ← Safe for local only
    ports:
      - "5432:5432"
```

**These are safe to commit** because they're for local development only. Production will use environment variables from `.env`.

## Adding New Dependencies

When adding packages that require API keys:

1. Add the package to `package.json` / `requirements.txt`
2. Add required env vars to `.env.example` with placeholders
3. Add env var validation in config (fail fast if missing)
4. **NEVER** hardcode the actual key anywhere in the code

## Code Patterns

### ✅ Correct: Load from environment

```typescript
// frontend/api/client.ts
const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) throw new Error("VITE_API_URL is not set");
```

```python
# backend/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    google_client_id: str
    google_client_secret: str

    class Config:
        env_file = ".env"

settings = Settings()
```

### ❌ Wrong: Hardcoded secrets

```typescript
// NEVER DO THIS
const API_KEY = "sk-1234567890abcdef";
```

```python
# NEVER DO THIS
JWT_SECRET = "my-super-secret-key"
```

## Production Deployment

When deploying to production (Railway, Vercel, etc.):

1. Set environment variables in the platform's dashboard
2. **NEVER** commit production `.env` files
3. Use the platform's secret management (Railway env vars, Vercel env vars)
4. Rotate keys immediately if accidentally exposed

## If You Accidentally Commit a Secret

1. **DO NOT** just delete the file in a new commit — the secret is still in git history
2. Use `git filter-branch` or `BFG Repo-Cleaner` to remove from history
3. Rotate the compromised key immediately
4. Notify the team

## License Compliance

This project is licensed under **CC BY-NC 4.0** (Attribution-NonCommercial 4.0 International).

**When contributing or generating code:**

- All new files must include the license header
- Do not add dependencies with incompatible licenses (GPL, proprietary, etc.)
- Do not include code copied from non-commercial or proprietary sources
- When in doubt, ask before adding external code

**License header template for new files:**

```typescript
/**
 * Frontend Study Lab
 * Copyright (c) 2026-present faustze9@gmail.com
 * Licensed under CC BY-NC 4.0 (https://creativecommons.org/licenses/by-nc/4.0/)
 */
```
