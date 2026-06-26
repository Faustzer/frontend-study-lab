# План миграции: Vue 3 SPA → Nuxt 3 SSR/SPA Hybrid + FastAPI Backend

## Общая стратегия

Миграция делится на **4 фазы**, каждая из которых добавляет функциональность, не ломая предыдущую. После каждого шага приложение должно работать.

---

## Фаза 0: Подготовка (1-2 дня)

### Шаг 0.1: Аудит текущего кода

- [ ] Завершить все незавершённые задачи из Фазы 1 `plan-frontend.md`
- [ ] Убедиться, что `npm run build`, `npm run test:run`, `npm run lint` проходят
- [ ] Зафиксировать текущее состояние в git: `git tag v0.1.0-spa`

### Шаг 0.2: Выбор версии Nuxt

- [ ] **Рекомендация**: использовать Nuxt 3.12+ (стабильная ветка)
- [ ] Nuxt 4 пока не рекомендуется для продакшена (экосистема модулей не дозрела)

---

## Фаза 1: Миграция на Nuxt 3 (1-2 недели)

### Шаг 1.1: Установка Nuxt 3 и зависимостей

```bash
npm install nuxt@^3.12 @nuxtjs/i18n@^8 @pinia/nuxt@^0.5
npm install -D @nuxt/test-utils nuxt-vitest
```

- [ ] Добавить `nuxt.config.ts` в корень проекта
- [ ] Настроить `alias` для `@/` → `frontend/`
- [ ] Настроить SCSS в `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  css: ['~/assets/scss/_index.scss'],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "~/assets/scss/_variables.scss" as *; @use "~/assets/scss/_mixins.scss" as *;`,
        },
      },
    },
  },
})
```

### Шаг 1.2: Перенос структуры файлов

**Новая структура:**

```md
frontend/
├── app.vue              # Бывший App.vue → Nuxt layout
├── pages/               # Бывшие страницы → Nuxt file-based routing
│   ├── index.vue        # HomePage.vue
│   └── [...slug].vue    # Динамические топики (или pages/topics/[slug].vue)
├── layouts/
│   └── default.vue      # Вынести sidebar + header из App.vue
├── components/          # Без изменений
├── composables/         # Без изменений
├── stores/              # Без изменений (с @pinia/nuxt)
├── i18n/                # Адаптировать для @nuxtjs/i18n
├── api/                 # Без изменений
├── mocks/               # Без изменений
├── topics/              # Без изменений
├── types/               # Без изменений
├── tests/               # Без изменений
├── assets/scss/         # Без изменений
├── nuxt.config.ts       # Новый
└── .env                 # Без изменений
```

- [ ] Создать `frontend/layouts/default.vue` (sidebar + контент)
- [ ] Переименовать `App.vue` → `app.vue` (Nuxt 3 convention)
- [ ] Удалить `frontend/router.ts` (Nuxt генерирует роуты из файлов)

### Шаг 1.3: Миграция страниц

- [ ] Создать `frontend/pages/index.vue` — перенести HomePage.vue
- [ ] Создать `frontend/pages/topics/[slug].vue` — динамический роут для топиков
- [ ] Использовать `useAsyncData` для загрузки данных топика:

```vue
<script setup lang="ts">
const route = useRoute()
const { data: topic } = await useAsyncData(`topic-${route.params.slug}`, () =>
  getTopicBySlug(route.params.slug as string)
)
</script>
```

### Шаг 1.4: Миграция i18n

- [ ] Удалить `frontend/i18n/index.ts` (vue-i18n setup)
- [ ] Настроить `@nuxtjs/i18n` в `nuxt.config.ts`:

```typescript
modules: [
  ['@nuxtjs/i18n', {
    locales: ['en', 'ru'],
    defaultLocale: 'en',
    vueI18n: './i18n/config.ts',
  }]
]
```

- [ ] Создать `frontend/i18n/config.ts`:

```typescript
import en from './locales/en.json'
import ru from './locales/ru.json'

export default defineI18nConfig(() => ({
  legacy: false,
  messages: { en, ru },
}))
```

- [ ] Заменить `$t()` на `useI18n().t()` или сохранить совместимость через `<i18n-t>` компонент

### Шаг 1.5: Миграция Pinia stores

- [ ] Добавить `@pinia/nuxt` в `modules` nuxt.config.ts
- [ ] Stores работают без изменений, но нужно убрать ручную регистрацию из `main.ts`
- [ ] `pinia-plugin-persistedstate` работает с `@pinia/nuxt` — оставить как есть

### Шаг 1.6: Миграция API слоя

- [ ] Заменить `frontend/api/client.ts` на Nuxt `$fetch`:

```typescript
// frontend/api/client.ts — новый
const config = useRuntimeConfig()

export const api = {
  async get<T>(path: string) {
    return $fetch<T>(`${config.public.apiBase}${path}`)
  },
  async post<T>(path: string, body: unknown) {
    return $fetch<T>(`${config.public.apiBase}${path}`, {
      method: 'POST',
      body,
    })
  },
}
```

- [ ] Настроить `runtimeConfig` в `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || '/api',
    },
  },
})
```

### Шаг 1.7: Настройка MSW для Nuxt

- [ ] MSW интегрируется через Nuxt plugin или dev server middleware
- [ ] Создать `frontend/server/api/[...].ts` — прокси на бэкенд (когда будет готов)
- [ ] Для dev без бэкенда — оставить MSW как есть, но интегрировать через `setupNuxt`

### Шаг 1.8: Тестирование

- [ ] Настроить `nuxt-vitest` для тестирования компонентов
- [ ] Адаптировать `vitest.config.ts` для Nuxt:

```typescript
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
  },
})
```

- [ ] Проверить, что все 28 тестов `useTopics.test.ts` проходят
- [ ] Добавить тесты для новых страниц (pages/index.vue, pages/topics/[slug].vue)

### Шаг 1.9: Сборка и проверка

- [ ] `npx nuxt prepare` — генерация типов
- [ ] `npx nuxt dev` — проверка dev сервера
- [ ] `npx nuxt build` — проверка production сборки
- [ ] Зафиксировать: `git tag v0.2.0-nuxt`

---

## Фаза 2: Бэкенд FastAPI (2-3 недели)

### Шаг 2.1: Инициализация Python проекта

- [ ] Создать `backend/` директорию
- [ ] Создать `backend/pyproject.toml`:

```toml
[project]
name = "studylab-backend"
version = "0.1.0"
requires-python = ">=3.11"

[tool.poetry]
name = "studylab-backend"
version = "0.1.0"

[tool.poetry.dependencies]
fastapi = "^0.115"
uvicorn = {version = "^0.30", extras = ["standard"]}
sqlalchemy = {version = "^2.0", extras = ["asyncio"]}
asyncpg = "^0.30"
alembic = "^1.13"
pydantic = "^2.9"
pydantic-settings = "^2.5"
python-jose = {version = "^3.3", extras = ["cryptography"]}
passlib = {version = "^1.7", extras = ["bcrypt"]}
authlib = "^1.3"
httpx = "^0.27"
python-dotenv = "^1.0"

[tool.poetry.group.dev.dependencies]
pytest = "^8.3"
pytest-asyncio = "^0.24"
ruff = "^0.6"
mypy = "^1.11"
```

- [ ] Создать виртуальное окружение: `python -m venv .venv`

### Шаг 2.2: Docker окружение

- [ ] Создать `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && poetry install --no-root
COPY . .
CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] Создать `docker-compose.yml` в корне:

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
    env_file: ./backend/.env
    depends_on:
      - db
volumes:
  pgdata:
```

- [ ] Создать `backend/.env.example`:

```env
DATABASE_URL=postgresql+asyncpg://studylab:studylab@localhost:5432/studylab
SECRET_KEY=change-me-in-production
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
```

### Шаг 2.3: FastAPI приложение

- [ ] Создать `backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, progress

app = FastAPI(title="StudyLab API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])

@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] Создать `backend/app/config.py` (Pydantic Settings)
- [ ] Создать `backend/app/database.py` (async engine + session)
- [ ] Создать `backend/app/models/` (SQLAlchemy таблицы)
- [ ] Создать `backend/app/schemas/` (Pydantic модели)
- [ ] Создать `backend/app/routers/` (эндпоинты)
- [ ] Создать `backend/app/services/` (бизнес-логика)
- [ ] Создать `backend/app/utils/jwt.py` (JWT утилиты)

### Шаг 2.4: База данных и миграции

- [ ] Инициализировать Alembic: `alembic init backend/alembic`
- [ ] Настроить `alembic/env.py` для async SQLAlchemy
- [ ] Создать начальную миграцию: `alembic revision --autogenerate -m "initial"`
- [ ] Применить: `alembic upgrade head`
- [ ] Проверить таблицы в PostgreSQL

### Шаг 2.5: API эндпоинты

- [ ] `GET /api/auth/{provider}` — инициация OAuth2
- [ ] `GET /api/auth/{provider}/callback` — OAuth2 callback
- [ ] `GET /api/auth/me` — текущий пользователь
- [ ] `POST /api/auth/logout` — выход
- [ ] `GET /api/progress` — прогресс пользователя
- [ ] `POST /api/progress/complete` — завершить модуль
- [ ] `POST /api/progress/challenge/complete` — завершить челлендж
- [ ] `GET /docs` — Swagger UI (автоматически)

### Шаг 2.6: Тесты бэкенда

- [ ] Создать `backend/tests/conftest.py` (test DB, async client)
- [ ] Создать `backend/tests/test_auth.py`
- [ ] Создать `backend/tests/test_progress.py`
- [ ] Запустить: `pytest backend/tests/ -v`

### Шаг 2.7: Проверка

- [ ] `docker compose up -d` — запуск всех сервисов
- [ ] Открыть `http://localhost:8000/docs` — проверить Swagger
- [ ] `curl http://localhost:8000/health` — проверить health check
- [ ] Зафиксировать: `git tag v0.3.0-backend`

---

## Фаза 3: Интеграция фронтенд + бэкенд (1 неделя)

### Шаг 3.1: Серверный прокси Nuxt → FastAPI

- [ ] Создать `frontend/server/api/[...].ts`:

```typescript
import { defineEventHandler, proxyRequest, getQuery, getRequestURL } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiTarget = config.apiBackend || 'http://localhost:8000'

  const url = getRequestURL(event)
  const path = url.pathname.replace(/^\/api/, '') || '/'

  return proxyRequest(event, `${apiTarget}${path}${url.search}`)
})
```

- [ ] Добавить в `nuxt.config.ts`:

```typescript
runtimeConfig: {
  public: {
    apiBase: '/api',  // Клиентские запросы через прокси
  },
  apiBackend: process.env.API_BACKEND_URL || 'http://localhost:8000',
}
```

### Шаг 3.2: Адаптация API клиента

- [ ] Обновить `frontend/api/progress.ts` — запросы через `$fetch` к `/api/progress`
- [ ] Обновить `frontend/api/auth.ts` — запросы через `$fetch` к `/api/auth`
- [ ] Убрать MSW для прогресса/аутентификации (теперь реальный бэкенд)
- [ ] Оставить MSW только для edge cases и тестов

### Шаг 3.3: Аутентификация

- [ ] Создать `frontend/stores/auth.ts`:

```typescript
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
  },
  actions: {
    async login(provider: string) {
      window.location.href = `/api/auth/${provider}`
    },
    async fetchProfile() {
      const data = await $fetch<User>('/api/auth/me')
      this.user = data
    },
    async logout() {
      await $fetch('/api/auth/logout', { method: 'POST' })
      this.user = null
      this.token = null
    },
  },
})
```

- [ ] Создать `frontend/plugins/auth.ts`:

```typescript
export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  if (import.meta.client) {
    const token = useCookie('access_token').value
    if (token) {
      await authStore.fetchProfile()
    }
  }
})
```

- [ ] Создать `frontend/middleware/auth.global.ts`:

```typescript
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const isProtected = to.path.startsWith('/profile')

  if (!authStore.isAuthenticated && isProtected) {
    return navigateTo('/')
  }
})
```

### Шаг 3.4: Синхронизация прогресса

- [ ] Обновить `frontend/stores/progress.ts`:

```typescript
export const useProgressStore = defineStore('progress', {
  state: () => ({
    xp: 0,
    level: 1,
    completedModules: [] as string[],
    isOnline: true,
  }),
  actions: {
    async syncWithBackend() {
      try {
        const data = await $fetch<Progress>('/api/progress')
        this.xp = data.xp
        this.level = data.level
        this.completedModules = data.completedModules
        this.isOnline = true
      } catch {
        this.isOnline = false
      }
    },
    async completeModule(slug: string, xpReward: number) {
      // Локальное обновление
      this.xp += xpReward
      this.completedModules.push(slug)

      // Синхронизация с бэкендом
      if (this.isOnline) {
        await $fetch('/api/progress/complete', {
          method: 'POST',
          body: { moduleSlug: slug, xpReward },
        })
      }
    },
  },
})
```

### Шаг 3.5: Проверка интеграции

- [ ] Запустить бэкенд: `docker compose up -d`
- [ ] Запустить фронтенд: `npx nuxt dev`
- [ ] Проверить: главная страница загружается
- [ ] Проверить: топики работают
- [ ] Проверить: прогресс сохраняется в БД
- [ ] Зафиксировать: `git tag v0.4.0-integrated`

---

## Фаза 4: Финальная полировка (1 неделя)

### Шаг 4.1: Пользовательский профиль

- [ ] Создать `frontend/pages/profile.vue`
- [ ] Создать `frontend/components/profile/UserCard.vue`
- [ ] Создать `frontend/components/profile/ProgressStats.vue`

### Шаг 4.2: Обработка ошибок

- [ ] Создать `frontend/pages/error.vue`
- [ ] Добавить error handler в `app.vue`
- [ ] Добавить loading states (skeletons)

### Шаг 4.3: Оптимизация

- [ ] Настроить route rules в `nuxt.config.ts`:

```typescript
routeRules: {
  '/': { ssr: true },
  '/topics/**': { ssr: true },
  '/profile/**': { ssr: false },
  '/auth/**': { ssr: false },
}
```

- [ ] Lazy load тяжёлых компонентов
- [ ] Оптизировать бандл: `npx nuxt analyze`

### Шаг 4.4: CI/CD

- [ ] Создать `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run test:run
      - run: npm run lint
      - run: npm run build
```

- [ ] Создать `.github/workflows/deploy.yml` (опционально)

### Шаг 4.5: Финальная проверка

- [ ] Все тесты проходят
- [ ] `npx nuxt build` без ошибок
- [ ] Swagger доступен на `/docs`
- [ ] Фронтенд и бэкенд работают вместе
- [ ] Зафиксировать: `git tag v1.0.0`

---

## Контрольный список зависимостей

| Зависимость | Фаза | Статус |
|-------------|------|--------|
| `nuxt@^3.12` | 1.1 | ⬜ |
| `@nuxtjs/i18n@^8` | 1.1 | ⬜ |
| `@pinia/nuxt@^0.5` | 1.1 | ⬜ |
| `@nuxt/test-utils` | 1.8 | ⬜ |
| `fastapi` | 2.1 | ⬜ |
| `sqlalchemy[asyncio]` | 2.1 | ⬜ |
| `asyncpg` | 2.1 | ⬜ |
| `alembic` | 2.4 | ⬜ |
| `python-jose[cryptography]` | 2.1 | ⬜ |
| `authlib` | 2.1 | ⬜ |
| `docker compose` | 2.2 | ⬜ |

---

## Риск-менеджмент

| Риск | Вероятность | Решение |
|------|-------------|---------|
| Nuxt 4 нестабилен | Высокая | Использовать Nuxt 3.12+ |
| Миграция i18n сломает строки | Средняя | Тесты + поэтапный перенос |
| OpenAPI схема не готова | Средняя | Временно без nuxt-open-fetch |
| OAuth2 требует настройки провайдеров | Низкая | Отложить до Финала |

---

## Ссылки на связанные документы

- [Frontend Plan](plan-frontend.md) — текущий план разработки фронтенда
- [Backend Plan](plan-backend.md) — план разработки бэкенда
- [Architecture](ARCHITECTURE.md) — целевая архитектура (Nuxt 3 + FastAPI)
- [README](../README.md) — описание проекта
