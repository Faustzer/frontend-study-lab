# Nuxt 3 + FastAPI — Fullstack Application Architecture (reference)

> This describes the architecture of a **different** production application —
> a reference for migrating frontend-study-lab to Nuxt (see `MIGRATION.md`).
> Below is a comparison with the current project architecture: what matches,
> what differs, and what is worth adopting.

## 0. Comparison with the current frontend-study-lab architecture

| Aspect | Reference (this document) | frontend-study-lab (today) |
|---|---|---|
| Framework | Nuxt 3/4 (SSR + SPA hybrid) | Vue 3 SPA (Vite) |
| Rendering | `routeRules`: public — SSR, cabinet — SPA | Everything SPA; no SEO |
| Frontend hosting | Node server (Nitro) | GitHub Pages (static) |
| UI | Vuetify (Material) | Own UI kit (`components/ui/`) + SCSS |
| State | Pinia (options API stores) | Pinia (setup stores) + persistedstate |
| API client | `$fetch` + nuxt-open-fetch, auto-retry on 401 | Own fetch wrapper `api/client.ts`, 401 → modal |
| Backend connection | Nitro proxy `/api/**` → FastAPI (no CORS) | Direct requests to the Railway URL + CORS middleware |
| Auth tokens | Access + refresh in cookies, CSRF cookie | JWT (7 days) in localStorage, no refresh |
| CSRF | `XSRF-TOKEN` cookie on every request | Only the OAuth `state` (for the callback) |
| API typing | Generated from OpenAPI (nuxt-open-fetch) | Hand-written `api/types.ts` mirroring Pydantic |
| Authentication | Email/password + refresh flow | OAuth-only (Google; Twitch/Discord later) |
| i18n | @nuxtjs/i18n | vue-i18n directly |
| Backend | FastAPI, python-jose | FastAPI, PyJWT + authlib, SQLAlchemy async + alembic |

**Worth adopting during the migration (phases in MIGRATION.md):**

- `routeRules` / prerendering public pages — the main migration goal (SEO);
  in our case via SSG rather than an SSR server (hosting is static).
- `nuxt-open-fetch` — type generation from FastAPI's `/openapi.json`
  instead of manually keeping `api/types.ts` in sync with Pydantic schemas.
  Applicable even today, before Nuxt (openapi-typescript).
- The Nitro proxy `/api/**` — removes CORS and hides the Railway URL, but
  requires a Node server → only together with the deferred SSR phase.
- Cookie-based auth + refresh tokens — safer than localStorage (XSS),
  but also needs a server on the frontend side; deferred along with SSR.

**Not worth adopting:**

- Vuetify — the project has its own lightweight UI kit; no reason to pull in
  a Material framework.
- FingerprintJS — anonymous-user identification is solved more simply here:
  guest progress lives in localStorage and merges on login.
- Email/password auth — OAuth-only was a deliberate choice (no password storage).

## Overview

The application is built on **Nuxt 3 (Vue 3)** on the frontend and
**FastAPI (Python)** on the backend. It uses an **SSR + SPA hybrid** pattern:
public pages are server-rendered for SEO, while the user cabinet and auth run
as an SPA.

```md
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Nuxt 3 App (Vue 3 + Pinia + Vuetify)                    │  │
│  │  - SSR for public pages                                   │  │
│  │  - SPA for /cabinet and /auth                             │  │
│  │  - useAsyncData for server-side data loading              │  │
│  │  - mainApi for client requests with CSRF + Auth           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP (JSON)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER (Node.js / Nitro)                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Nuxt Server Handler                                      │  │
│  │  - server/routes/api.ts — proxy to the backend            │  │
│  │  - middleware/auth.global.ts — route protection           │  │
│  │  - plugins/auth.ts — auth initialization                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP (JSON)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI / Python)                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  FastAPI App                                              │  │
│  │  - /openapi.json — schema for type generation             │  │
│  │  - JWT authentication (access + refresh tokens)           │  │
│  │  - CORS middleware                                        │  │
│  │  - Pydantic models for validation                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Project structure

```md
front/
├── .env                        # Environment variables
├── package.json                # Dependencies and scripts
├── nuxt.config.ts              # Nuxt configuration
├── api.ts                      # API client ($fetch wrapper)
├── server/
│   └── routes/
│       └── api.ts              # Server proxy → backend
├── middleware/
│   └── auth.global.ts          # Route middleware for protected routes
├── plugins/
│   └── auth.ts                 # Nuxt plugin for auth initialization
├── stores/
│   ├── auth.ts                 # Pinia store for authentication
│   └── globalStore.ts          # Global state (loading, posting)
├── composables/
│   ├── useAuth.ts              # Authentication logic
│   ├── useFingerprint.ts       # FingerprintJS for anonymous users
│   ├── useContentView.ts       # View tracking
│   └── useHttpErrorNotifications.ts
├── pages/
│   └── landing/
│       └── home/
│           └── index.vue       # Home page (SSR)
├── components/
│   └── pages/
│       └── home/
│           └── sections/
│               └── News.vue    # News section (useAsyncData)
└── types/
    └── data-types.ts           # TypeScript types
```

---

## 2. Dependencies (package.json)

### Main packages

```json
{
  "name": "app-front",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare"
  },
  "dependencies": {
    "@pinia/nuxt": "0.11.2",
    "@vueuse/nuxt": "^13.0.0",
    "@nuxtjs/i18n": "^10.2.1",
    "nuxt": "^4.4.4",
    "nuxt-open-fetch": "0.13.7",
    "vue": "^3.5.0",
    "vuetify": "^3.7.0",
    "@fingerprintjs/fingerprintjs": "^5.2.0"
  },
  "devDependencies": {
    "@nuxt/vite-builder": "^4.2.2",
    "@types/node": "25.0.3",
    "@vitejs/plugin-vue": "^5.2.4",
    "typescript": "^5.9.3",
    "vitest": "^4.1.4"
  }
}
```

### What each package does

| Package                        | Purpose                                          |
| ------------------------------ | ------------------------------------------------ |
| `nuxt`                         | Framework (SSR + SPA + routing)                  |
| `@pinia/nuxt`                  | State management                                 |
| `nuxt-open-fetch`              | TypeScript type generation from the OpenAPI schema |
| `@vueuse/nuxt`                 | Vue utilities (useAsyncData, useFetch, etc.)     |
| `@nuxtjs/i18n`                 | Internationalization                             |
| `vuetify`                      | UI components (Material Design)                  |
| `@fingerprintjs/fingerprintjs` | Anonymous user identification                    |

---

## 3. Nuxt configuration (nuxt.config.ts)

```typescript
import type { ModuleOptions } from "nuxt-open-fetch";
import type { NuxtConfig } from "nuxt/schema";

export default defineNuxtConfig(<{ openFetch: ModuleOptions } & NuxtConfig>{
  // SSR enabled globally
  ssr: true,

  // Route rules — which pages are SSR and which are SPA
  routeRules: {
    "/": { ssr: true }, // Home — SSR (SEO)
    "/news/**": { ssr: true }, // News — SSR
    "/cabinet/**": { ssr: false }, // Cabinet — SPA
    "/auth/**": { ssr: false }, // Auth — SPA
  },

  // Server handlers (proxy to the backend)
  serverHandlers: [{ route: "/api/**", handler: "~/server/routes/api.ts" }],

  // Modules
  modules: ["@pinia/nuxt", "nuxt-open-fetch", "@vueuse/nuxt", "@nuxtjs/i18n"],

  // Environment configuration
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.BACKEND_HOST,
    },
  },

  // Vite settings
  vite: {
    ssr: {
      noExternal: ["vuetify"],
    },
  },
});
```

---

## 4. Server proxy (server/routes/api.ts)

All API requests go through `/api/**` → proxy → backend. This allows:

- Avoiding CORS problems in dev mode
- Using relative URLs on the client

```typescript
import {
  createError,
  defineEventHandler,
  getRequestURL,
  proxyRequest,
} from "h3";

export default defineEventHandler(async (event) => {
  const target = process.env.BACKEND_HOST; // http://localhost:8000

  if (!target) {
    throw createError({
      statusCode: 500,
      statusMessage: "BACKEND_HOST is not configured",
    });
  }

  const url = getRequestURL(event);
  const path = url.pathname.replace(/^\/api/, "") || "/";

  // /api/news → http://localhost:8000/news
  return proxyRequest(event, `${target}${path}${url.search}`);
});
```

---

## 5. API client (api.ts)

A `$fetch` wrapper that automatically adds:

- The JWT token in the `Authorization` header
- The CSRF token in the `X-CSRF-TOKEN` header
- Auto-refresh of the token on 401

```typescript
import { useSumoApi } from "#open-fetch";

const AUTH_ENDPOINT_PATTERNS = [
  /^\/auth\/login$/,
  /^\/auth\/register$/,
  /^\/auth\/refresh$/,
  // ...
];

function isAuthEndpoint(request: string): boolean {
  return AUTH_ENDPOINT_PATTERNS.some((p) => p.test(request));
}

function getCsrfToken(): string | null {
  return useCookie<string | null>("XSRF-TOKEN").value;
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = requestTokenRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function requestTokenRefresh(): Promise<boolean> {
  const { data } = await $fetch<AuthResponseDto>("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });
  authStore.setSession(data);
  return true;
}

// Main API client
export const mainApi = {
  async(path: string, opts: any = {}) {
    // Attach the token and CSRF
    if (!isAuthEndpoint(path)) {
      opts.headers = {
        ...opts.headers,
        Authorization: `Bearer ${accessToken}`,
        "X-CSRF-TOKEN": getCsrfToken(),
      };
    }

    // On 401 — try to refresh the token and retry the request
    opts.retry = 1;
    opts.retryStatusCodes = [401];

    return useSumoApi(path, opts);
  },
};
```

---

## 6. Authentication

### 6.1. Store (stores/auth.ts)

```typescript
import { defineStore } from "pinia";
import type { AuthResponseDto, UserProfileDto } from "#open-fetch-schemas/api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    profile: null as UserProfileDto | null,
    accessExpiresAtUtc: null as string | null,
    refreshExpiresAtUtc: null as string | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.profile,
  },

  actions: {
    setSession(data: AuthResponseDto) {
      this.profile = data.profile;
      this.accessExpiresAtUtc = data.accessExpiresAtUtc;
      this.refreshExpiresAtUtc = data.refreshExpiresAtUtc;
    },
    clear() {
      this.profile = null;
    },
  },
});
```

### 6.2. Plugin (plugins/auth.ts)

Auth initialization on app load:

```typescript
export default defineNuxtPlugin(async () => {
  const { ensureCsrf, fetchProfile } = useAuth();

  if (import.meta.server) {
    // On the server — only if a CSRF token exists
    const csrfToken = useCookie<string | null>("XSRF-TOKEN");
    if (!csrfToken.value) return;
    await fetchProfile();
    return;
  }

  // On the client — always initialize
  await ensureCsrf();
  await fetchProfile();
});
```

### 6.3. Route middleware (middleware/auth.global.ts)

Route protection at the navigation level:

```typescript
import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();
  const isProtected = to.path.startsWith("/cabinet");
  const isAuthRoute = to.path.startsWith("/auth/");

  // Unauthenticated user heading to a protected route → login
  if (!authStore.isAuthenticated && isProtected) {
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath },
    });
  }

  // Authenticated user heading to an auth route → home
  if (authStore.isAuthenticated && isAuthRoute) {
    return navigateTo({ name: "home" });
  }
});
```

### 6.4. Composable (composables/useAuth.ts)

```typescript
export function useAuth() {
  const authStore = useAuthStore();

  async function ensureCsrf(): Promise<void> {
    await $fetch("/api/auth/csrf", { method: "GET", credentials: "include" });
  }

  async function fetchProfile(): Promise<void> {
    try {
      const profile = await $fetch<UserProfileDto>("/api/auth/profile", {
        credentials: "include",
      });
      authStore.setProfile(profile);
    } catch {
      authStore.clear();
    }
  }

  async function login(email: string, password: string): Promise<void> {
    const data = await $fetch<AuthResponseDto>("/api/auth/login", {
      method: "POST",
      body: { email, password },
      credentials: "include",
    });
    authStore.setSession(data);
  }

  async function logout(): Promise<void> {
    await $fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    authStore.clear();
  }

  return { ensureCsrf, fetchProfile, login, logout };
}
```

---

## 7. SSR data fetching (useAsyncData)

### 7.1. The pattern

```vue
<script setup lang="ts">
// Data is loaded on the server, embedded into the HTML,
// and hydrated on the client without an extra request
const { data: newsResponse } = await useAsyncData(() =>
  $fetch<NewsResponseDto>("/api/news?page=1&limit=6"),
);

const news = computed(() =>
  (newsResponse.value?.items ?? []).map((item) => ({
    slug: item.slug,
    title: item.title,
    // ...
  })),
);
</script>
```

### 7.2. How it works

```md
┌─────────────────────────────────────────────────────────────┐
│                     SERVER (Node.js)                        │
├─────────────────────────────────────────────────────────────┤
│  1. Request GET /                                           │
│  2. Nuxt renders the page                                   │
│  3. Encounters await useAsyncData(...)                      │
│  4. Calls $fetch('/api/news') → proxy → backend             │
│  5. Receives the data                                       │
│  6. Serializes it into <script id="__NUXT_DATA__">          │
└─────────────────────────────────────────────────────────────┘
                              │ HTML
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                         │
├─────────────────────────────────────────────────────────────┤
│  1. Receives HTML with the data                             │
│  2. Nuxt parses __NUXT_DATA__                               │
│  3. Creates a reactive ref with the data                    │
│  4. The component renders without an extra request          │
└─────────────────────────────────────────────────────────────┘
```

### 7.3. Important nuances

| Aspect          | Description                                              |
| --------------- | -------------------------------------------------------- |
| Key             | Unique identifier for hydration (auto-generated)          |
| Default value   | `default: () => []` — for type safety during hydration    |
| Reactivity      | `data` is a ref, usable in computed/watch                 |
| Refreshing      | `refresh()` — to re-run the request                       |

---

## 8. API typing (nuxt-open-fetch)

### 8.1. Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  openFetch: {
    schema: process.env.OPENAPI_SCHEMA_HOST
      ? `${process.env.OPENAPI_SCHEMA_HOST}/openapi.json`
      : "./api.json",
  },
});
```

### 8.2. Type generation

```bash
# Download the OpenAPI schema from the backend
curl http://localhost:8000/openapi.json > api.json

# Types are generated automatically on nuxt prepare / dev
pnpm postinstall
```

### 8.3. Using the types

```typescript
import type { NewsResponseDto, NewsArticleDto } from "#open-fetch-schemas/api";

const { data } = await useAsyncData(() => $fetch<NewsResponseDto>("/api/news"));
```

---

## 9. Environment variables (.env)

```env
# Backend host (FastAPI)
BACKEND_HOST=http://localhost:8000

# For type generation (optional)
OPENAPI_SCHEMA_HOST=http://localhost:8000

# Public keys (available on the client)
PUBLIC_API_KEY=your-api-key
```

---

## 10. FastAPI backend — minimal example

### 10.1. Structure

```md
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Entry point
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── news.py          # /news endpoints
│   │   └── auth.py          # /auth endpoints
│   ├── models/
│   │   ├── __init__.py
│   │   └── news.py          # Pydantic models
│   ├── dependencies.py      # Dependencies (auth, db)
│   └── config.py            # Settings
├── requirements.txt
└── .env
```

### 10.2. Minimal example

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Nuxt dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/news")
async def list_news(page: int = 1, limit: int = 6):
    return {
        "page": page,
        "resultsPerPage": limit,
        "totalPages": 1,
        "totalItems": 10,
        "items": [
            {
                "id": "1",
                "slug": "test-news",
                "title": "Test News",
                "description": "Description",
                "viewCount": 100,
                "status": "Published",
                "publishedAtUtc": "2024-01-01T00:00:00Z",
                "createdAtUtc": "2024-01-01T00:00:00Z",
                "updatedAtUtc": "2024-01-01T00:00:00Z",
                "skinPath": None,
                "tags": [],
            }
        ],
    }
```

### 10.3. Pydantic models

```python
# app/models/news.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NewsTag(BaseModel):
    id: str
    name: str

class NewsItem(BaseModel):
    id: str
    slug: str
    title: str
    description: Optional[str] = None
    viewCount: int = 0
    status: str  # "Draft" | "Published"
    publishedAtUtc: Optional[datetime] = None
    createdAtUtc: datetime
    updatedAtUtc: datetime
    skinPath: Optional[str] = None
    tags: list[NewsTag] = []

class NewsResponse(BaseModel):
    page: int
    resultsPerPage: int
    totalPages: int
    totalItems: int
    items: list[NewsItem]
```

### 10.4. JWT authentication

```python
# app/dependencies.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

security = HTTPBearer()

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### 10.5. requirements.txt

```md
fastapi==0.115.0
uvicorn[standard]==0.30.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
pydantic==2.9.0
```

---

## 11. Reproduction checklist

| Component  | Stack                    | Status |
| ---------- | ------------------------ | ------ |
| Framework  | Nuxt 3 + Vue 3           | ✅     |
| UI         | Vuetify 3                | ✅     |
| State      | Pinia                    | ✅     |
| API client | nuxt-open-fetch + $fetch | ✅     |
| Proxy      | Nuxt server handler      | ✅     |
| SSR        | useAsyncData             | ✅     |
| Auth       | JWT + Cookies            | ✅     |
| CSRF       | Cookie-based             | ✅     |
| Typing     | OpenAPI → TypeScript     | ✅     |
| Routing    | Pages + Router           | ✅     |
| Middleware | Route guards             | ✅     |
| Backend    | FastAPI                  | ✅     |
| CORS       | FastAPI middleware       | ✅     |

---

## 12. Key patterns

### 12.1. Hybrid SSR/SPA

```typescript
// nuxt.config.ts
routeRules: {
  '/': { ssr: true },           // Public — SSR (SEO)
  '/news/**': { ssr: true },    // Content — SSR
  '/cabinet/**': { ssr: false }, // Cabinet — SPA
  '/auth/**': { ssr: false },    // Auth — SPA
}
```

### 12.2. Server-side proxy

```typescript
// server/routes/api.ts
// /api/news → http://localhost:8000/news
return proxyRequest(event, `${target}${path}${url.search}`);
```

### 12.3. useAsyncData for SSR

```vue
<script setup>
const { data } = await useAsyncData(
  "unique-key",
  () => $fetch < ResponseType > "/api/endpoint",
);
</script>
```

### 12.4. mainApi for client requests

```typescript
// With automatic token and CSRF attachment
await mainApi("/endpoint", {
  method: "POST",
  body: { data },
});
```

### 12.5. Route protection

```typescript
// middleware/auth.global.ts
if (!authStore.isAuthenticated && isProtected) {
  return navigateTo("/auth/login");
}
```

---

## 13. Run commands

### Frontend

```bash
cd front
pnpm install
pnpm dev  # http://localhost:3000
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Type generation

```bash
cd front
curl http://localhost:8000/openapi.json > api.json
pnpm nuxt prepare
```

---

## 14. Final diagram

```md
Browser
  │
  ├── GET / ──────────────────────► Nuxt Server (SSR)
  │                                    │
  │                                    ├── useAsyncData → /api/news
  │                                    │                   │
  │                                    │                   ▼
  │                                    │            Nuxt Server Handler
  │                                    │                   │
  │                                    │                   ▼
  │                                    │            FastAPI (Python)
  │                                    │                   │
  │                                    │                   ▼
  │                                    │            JSON Response
  │                                    │
  │                                    ▼
  │                              HTML with data
  │                              (__NUXT_DATA__)
  │
  └── Hydration ──────────────────► Vue App (SPA mode, no extra requests)
```
