# Nuxt 3 + FastAPI — Архитектура Fullstack приложения

## Обзор

Это приложение построено на стеке **Nuxt 3 (Vue 3)** на фронтенде и **FastAPI (Python)** на бэкенде. Используется паттерн **SSR + SPA hybrid**: публичные страницы рендерятся на сервере для SEO, а личный кабинет и авторизация работают как SPA.

```md
┌─────────────────────────────────────────────────────────────────┐
│                        КЛИЕНТ (Browser)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Nuxt 3 App (Vue 3 + Pinia + Vuetify)                    │  │
│  │  - SSR для публичных страниц                              │  │
│  │  - SPA для /cabinet и /auth                               │  │
│  │  - useAsyncData для серверной загрузки данных              │  │
│  │  - mainApi для клиентских запросов с CSRF + Auth          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP (JSON)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    СЕРВЕР (Node.js / Nitro)                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Nuxt Server Handler                                      │  │
│  │  - server/routes/api.ts — прокси на бэкенд                │  │
│  │  - middleware/auth.global.ts — защита роутов              │  │
│  │  - plugins/auth.ts — инициализация auth                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP (JSON)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    БЭКЕНД (FastAPI / Python)                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  FastAPI App                                              │  │
│  │  - /openapi.json — схема для генерации типов            │  │
│  │  - JWT аутентификация (access + refresh tokens)          │  │
│  │  - CORS middleware                                        │  │
│  │  - Pydantic модели для валидации                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Структура проекта

```md
front/
├── .env                        # Переменные окружения
├── package.json                # Зависимости и скрипты
├── nuxt.config.ts              # Конфигурация Nuxt
├── api.ts                      # Клиент API (обёртка над $fetch)
├── server/
│   └── routes/
│       └── api.ts              # Серверный прокси → бэкенд
├── middleware/
│   └── auth.global.ts          # Route middleware для защиты роутов
├── plugins/
│   └── auth.ts                 # Nuxt plugin для инициализации auth
├── stores/
│   ├── auth.ts                 # Pinia store для аутентификации
│   └── globalStore.ts          # Глобальное состояние (loading, posting)
├── composables/
│   ├── useAuth.ts              # Логика аутентификации
│   ├── useFingerprint.ts       # FingerprintJS для анонимов
│   ├── useContentView.ts       # Регистрация просмотров
│   └── useHttpErrorNotifications.ts
├── pages/
│   └── landing/
│       └── home/
│           └── index.vue       # Главная страница (SSR)
├── components/
│   └── pages/
│       └── home/
│           └── sections/
│               └── News.vue    # Секция новостей (useAsyncData)
└── types/
    └── data-types.ts           # TypeScript типы
```

---

## 2. Зависимости (package.json)

### Основные пакеты

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

### Что делает каждый пакет

| Пакет                          | Назначение                                      |
| ------------------------------ | ----------------------------------------------- |
| `nuxt`                         | Фреймворк (SSR + SPA + маршрутизация)           |
| `@pinia/nuxt`                  | State management                                |
| `nuxt-open-fetch`              | Автогенерация TypeScript типов из OpenAPI схемы |
| `@vueuse/nuxt`                 | Утилиты Vue (useAsyncData, useFetch и др.)      |
| `@nuxtjs/i18n`                 | Интернационализация                             |
| `vuetify`                      | UI компоненты (Material Design)                 |
| `@fingerprintjs/fingerprintjs` | Идентификация анонимных пользователей           |

---

## 3. Конфигурация Nuxt (nuxt.config.ts)

```typescript
import type { ModuleOptions } from "nuxt-open-fetch";
import type { NuxtConfig } from "nuxt/schema";

export default defineNuxtConfig(<{ openFetch: ModuleOptions } & NuxtConfig>{
  // SSR включён глобально
  ssr: true,

  // Правила маршрутизации — какие страницы SSR, какие SPA
  routeRules: {
    "/": { ssr: true }, // Главная — SSR (SEO)
    "/news/**": { ssr: true }, // Новости — SSR
    "/cabinet/**": { ssr: false }, // Кабинет — SPA
    "/auth/**": { ssr: false }, // Авторизация — SPA
  },

  // Серверные обработчики (прокси на бэкенд)
  serverHandlers: [{ route: "/api/**", handler: "~/server/routes/api.ts" }],

  // Модули
  modules: ["@pinia/nuxt", "nuxt-open-fetch", "@vueuse/nuxt", "@nuxtjs/i18n"],

  // Конфигурация окружения
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.BACKEND_HOST,
    },
  },

  // Настройки Vite
  vite: {
    ssr: {
      noExternal: ["vuetify"],
    },
  },
});
```

---

## 4. Серверный прокси (server/routes/api.ts)

Все запросы к API идут через `/api/**` → прокси → бэкенд. Это позволяет:

- Избежать CORS проблем в dev-режиме
- Использовать относительные URL на клиенте

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

## 5. Клиент API (api.ts)

Обёртка над `$fetch` с автоматическим добавлением:

- JWT токена в `Authorization` header
- CSRF токена в `X-CSRF-TOKEN` header
- Авто-refresh токена при 401

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

// Главный API клиент
export const mainApi = {
  async(path: string, opts: any = {}) {
    // Добавляем токен и CSRF
    if (!isAuthEndpoint(path)) {
      opts.headers = {
        ...opts.headers,
        Authorization: `Bearer ${accessToken}`,
        "X-CSRF-TOKEN": getCsrfToken(),
      };
    }

    // При 401 — пытаемся обновить токен и повторить запрос
    opts.retry = 1;
    opts.retryStatusCodes = [401];

    return useSumoApi(path, opts);
  },
};
```

---

## 6. Аутентификация

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

Инициализация аутентификации при загрузке приложения:

```typescript
export default defineNuxtPlugin(async () => {
  const { ensureCsrf, fetchProfile } = useAuth();

  if (import.meta.server) {
    // На сервере — только если есть CSRF токен
    const csrfToken = useCookie<string | null>("XSRF-TOKEN");
    if (!csrfToken.value) return;
    await fetchProfile();
    return;
  }

  // На клиенте — всегда инициализируем
  await ensureCsrf();
  await fetchProfile();
});
```

### 6.3. Route Middleware (middleware/auth.global.ts)

Защита роутов на уровне навигации:

```typescript
import { useAuthStore } from "~/stores/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();
  const isProtected = to.path.startsWith("/cabinet");
  const isAuthRoute = to.path.startsWith("/auth/");

  // Если не авторизован и пытается в защищённый роут → на логин
  if (!authStore.isAuthenticated && isProtected) {
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath },
    });
  }

  // Если авторизован и пытается в auth роут → на главную
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

## 7. SSR запросы данных (useAsyncData)

### 7.1. Паттерн

```vue
<script setup lang="ts">
// Данные загружаются на сервере, вставляются в HTML,
// гидратируются на клиенте без дополнительного запроса
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

### 7.2. Как это работает

```md
┌─────────────────────────────────────────────────────────────┐
│                     СЕРВЕР (Node.js)                        │
├─────────────────────────────────────────────────────────────┤
│  1. Запрос GET /                                            │
│  2. Nuxt рендерит страницу                                  │
│  3. Встречает await useAsyncData(...)                        │
│  4. Вызывает $fetch('/api/news') → прокси → бэкенд         │
│  5. Получает данные                                         │
│  6. Сериализует в <script id="__NUXT_DATA__">              │
└─────────────────────────────────────────────────────────────┘
                              │ HTML
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     КЛИЕНТ (Browser)                         │
├─────────────────────────────────────────────────────────────┤
│  1. Получает HTML с данными                                 │
│  2. Nuxt парсит __NUXT_DATA__                               │
│  3. Создает reactive ref с данными                          │
│  4. Компонент рендерится без дополнительного запроса        │
└─────────────────────────────────────────────────────────────┘
```

### 7.3. Важные нюансы

| Аспект                | Описание                                                    |
| --------------------- | ----------------------------------------------------------- |
| Ключ                  | Уникальный идентификатор для гидратации (авто-генерируется) |
| Значение по умолчанию | `default: () => []` — для типобезопасности при гидратации   |
| Реактивность          | `data` — ref, можно использовать в computed/watch           |
| Обновление            | `refresh()` — для повторного запроса                        |

---

## 8. Типизация API (nuxt-open-fetch)

### 8.1. Конфигурация

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

### 8.2. Генерация типов

```bash
# Скачать OpenAPI схему с бэкенда
curl http://localhost:8000/openapi.json > api.json

# Типы генерируются автоматически при nuxt prepare / dev
pnpm postinstall
```

### 8.3. Использование типов

```typescript
import type { NewsResponseDto, NewsArticleDto } from "#open-fetch-schemas/api";

const { data } = await useAsyncData(() => $fetch<NewsResponseDto>("/api/news"));
```

---

## 9. Переменные окружения (.env)

```env
# Хост бэкенда (FastAPI)
BACKEND_HOST=http://localhost:8000

# Для генерации типов (опционально)
OPENAPI_SCHEMA_HOST=http://localhost:8000

# Публичные ключи (доступны на клиенте)
PUBLIC_API_KEY=your-api-key
```

---

## 10. FastAPI бэкенд — минимальный пример

### 10.1. Структура

```md
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Точка входа
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── news.py          # /news endpoints
│   │   └── auth.py          # /auth endpoints
│   ├── models/
│   │   ├── __init__.py
│   │   └── news.py          # Pydantic модели
│   ├── dependencies.py      # Зависимости (auth, db)
│   └── config.py            # Настройки
├── requirements.txt
└── .env
```

### 10.2. Минимальный пример

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

### 10.3. Pydantic модели

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

### 10.4. JWT аутентификация

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

## 11. Чеклист для воспроизведения

| Компонент  | Стек                     | Статус |
| ---------- | ------------------------ | ------ |
| Фреймворк  | Nuxt 3 + Vue 3           | ✅     |
| UI         | Vuetify 3                | ✅     |
| State      | Pinia                    | ✅     |
| API клиент | nuxt-open-fetch + $fetch | ✅     |
| Прокси     | Nuxt server handler      | ✅     |
| SSR        | useAsyncData             | ✅     |
| Auth       | JWT + Cookies            | ✅     |
| CSRF       | Cookie-based             | ✅     |
| Типизация  | OpenAPI → TypeScript     | ✅     |
| Роутинг    | Pages + Router           | ✅     |
| Middleware | Route guards             | ✅     |
| Бэкенд     | FastAPI                  | ✅     |
| CORS       | FastAPI middleware       | ✅     |

---

## 12. Ключевые паттерны

### 12.1. Hybrid SSR/SPA

```typescript
// nuxt.config.ts
routeRules: {
  '/': { ssr: true },           // Публичные — SSR (SEO)
  '/news/**': { ssr: true },    // Контент — SSR
  '/cabinet/**': { ssr: false }, // Кабинет — SPA
  '/auth/**': { ssr: false },    // Авторизация — SPA
}
```

### 12.2. Прокси на сервере

```typescript
// server/routes/api.ts
// /api/news → http://localhost:8000/news
return proxyRequest(event, `${target}${path}${url.search}`);
```

### 12.3. useAsyncData для SSR

```vue
<script setup>
const { data } = await useAsyncData(
  "unique-key",
  () => $fetch < ResponseType > "/api/endpoint",
);
</script>
```

### 12.4. mainApi для клиентских запросов

```typescript
// С авто-добавлением токена и CSRF
await mainApi("/endpoint", {
  method: "POST",
  body: { data },
});
```

### 12.5. Защита роутов

```typescript
// middleware/auth.global.ts
if (!authStore.isAuthenticated && isProtected) {
  return navigateTo("/auth/login");
}
```

---

## 13. Команды для запуска

### Фронтенд

```bash
cd front
pnpm install
pnpm dev  # http://localhost:3000
```

### Бэкенд

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Генерация типов

```bash
cd front
curl http://localhost:8000/openapi.json > api.json
pnpm nuxt prepare
```

---

## 14. Итоговая схема

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
  │                              HTML с данными
  │                              (__NUXT_DATA__)
  │
  └── Гидратация ──────────────────► Vue App (SPA mode)ез доп. запросов)
```
