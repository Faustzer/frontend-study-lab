# Authentication System

> Полное описание системы авторизации frontend-study-lab.
> Этот документ — спецификация для реализации бэкенд-эндпоинтов.

---

## Архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend                                 │
│                                                                 │
│  AuthModal.vue ──► AuthButton.vue ──► auth.login(provider)     │
│       │                                    │                    │
│       │                                    ▼                    │
│       │                          window.location.href =         │
│       │                          /api/auth/{provider}?state=   │
│       │                                    │                    │
│       │                          ┌─────────▼──────────┐        │
│       │                          │   Backend (OAuth)   │        │
│       │                          │  1. Redirect to     │        │
│       │                          │     Google/Twitch/  │        │
│       │                          │     Discord         │        │
│       │                          │  2. User authorizes │        │
│       │                          │  3. Callback with   │        │
│       │                          │     token + user    │        │
│       │                          └─────────┬──────────┘        │
│       │                                    │                    │
│       │                          Redirect to:                   │
│       │                          /auth/callback?token=...       │
│       │                                    │                    │
│       ▼                                    ▼                    │
│  AuthCallback.vue ◄────────────────────────┘                  │
│       │                                                         │
│       ▼                                                         │
│  auth.handleCallback(params)                                   │
│    ├─ verify state (CSRF)                                      │
│    ├─ parse token + user                                       │
│    └─ auth.setSession(token, user)                             │
│              │                                                  │
│              ▼                                                  │
│  stores/auth.ts ──► Pinia + localStorage                       │
│  api/client.ts  ◄── api.setToken(token)                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## OAuth2 Flow (пошагово)

### 1. Инициация входа

Пользователь нажимает кнопку провайдера в `AuthModal.vue`:

```
AuthButton.vue  →  auth.login('google')
```

`stores/auth.ts` → `login(provider)`:
1. Генерирует `state` = 32 случайных байта (CSRF-токен)
2. Сохраняет `state` в `localStorage` (`frontend-study-lab-oauth-state`)
3. Редиректит браузер на: `{API_URL}/auth/{provider}?state={state}`

### 2. Авторизация на стороне провайдера

Бэкенд получает запрос на `/auth/{provider}?state={state}`:
1. Сохраняет `state` в сессию/cookie
2. Редиректит пользователя на OAuth-страницу провайдера (Google/Twitch/Discord)
3. Пользователь авторизуется на стороне провайдера
4. Провайдер редиректит обратно на бэкенд с authorization code

### 3. Callback от провайдера → бэкенд

Бэкенд получает callback от провайдера:
1. Обменивает authorization code на access token провайдера
2. Получает профиль пользователя от провайдера
3. Создаёт/обновляет пользователя в БД
4. Генерирует JWT-токен для frontend
5. Редиректит на frontend: `/auth/callback?token={jwt}&user={encoded_json}&state={state}`

### 4. Обработка callback на frontend

`AuthCallback.vue` монтируется и вызывает:

```ts
auth.handleCallback(urlSearchParams)
```

`stores/auth.ts` → `handleCallback(params)`:
1. Проверяет `state` из URL === `state` из localStorage (CSRF-защита)
2. Удаляет `state` из localStorage (одноразовый)
3. Извлекает `token` и `user` из URL-параметров
4. Парсит JSON пользователя
5. Вызывает `setSession(token, user)` → сохраняет в Pinia + localStorage
6. Синхронизирует токен с `api.setToken(token)`

При успехе → показывает «✓ Вход выполнен!» → через 800мс редиректит на `/`.

При ошибке → показывает «✗ Не удалось войти» + кнопку «На главную».

---

## CSRF-защита (state parameter)

### Зачем

Без `state` злоумышленник может:
1. Авторизоваться на сайте → получить валидный callback URL
2. Отправить жертве ссылку с чужим токеном: `/auth/callback?token=EVIL&user=...`
3. Жертва переходит → в её браузере сохраняется токен злоумышленника
4. Весь прогресс жертвы уходит в аккаунт злоумышленника

### Как работает

```
Жертва нажимает "Войти":
  → state = crypto.random(32)  // 256^32 вариантов, невозможно подобрать
  → localStorage.setItem('oauth-state', state)
  → redirect: /api/auth/google?state=abc123...

Злоумышленник отправляет ссылку:
  → /auth/callback?token=EVIL&state=guess123

handleCallback():
  → URL.state ("guess123") !== localStorage.state ("abc123...")
  → ❌ clearSession() — атака отклонена
```

---

## Файлы авторизации

### Store

| Файл | Назначение |
|---|---|
| `stores/auth.ts` | Pinia store: token, user, login/logout/fetchProfile/handleCallback |
| `stores/ui.ts` | `authModalOpen`, `openAuthModal()`, `closeAuthModal()`, `shouldShowAuthModal()` |

### API Layer

| Файл | Назначение |
|---|---|
| `api/client.ts` | HTTP-клиент с JWT-авторизацией (`Authorization: Bearer {token}`) |
| `api/auth.ts` | `getMe()`, `logout()`, `getLoginUrl(provider)` |
| `api/types.ts` | `User`, `ApiResponse<T>`, `ApiError` |

### Компоненты

| Файл | Назначение |
|---|---|
| `components/auth/AuthButton.vue` | Кнопка входа через провайдер (Google/Twitch/Discord) |
| `components/auth/AuthModal.vue` | Модалка авторизации + dev-кнопка для тестирования |
| `pages/AuthCallback.vue` | Страница обработки OAuth callback |
| `pages/ProfilePage.vue` | Профиль пользователя (requiresAuth) |
| `components/profile/UserCard.vue` | Карточка пользователя (аватар, имя, email) |
| `components/profile/ProgressStats.vue` | Статистика прогресса (уровень, XP, модули) |

### Composables

| Файл | Назначение |
|---|---|
| `composables/useAuthGuard.ts` | Route guard: `meta.requiresAuth` → проверка + модалка |

### Роутинг

| Маршрут | Компонент | Meta |
|---|---|---|
| `/` | `HomePage` | — |
| `/auth/callback` | `AuthCallback` | — |
| `/profile` | `ProfilePage` | `requiresAuth: true` |
| `/:category/:module` | Topic pages | — |

---

## Store API: `stores/auth.ts`

### State

```ts
token: string | null       // JWT-токен
user: User | null          // Профиль пользователя
```

### Computed

```ts
isAuthenticated: boolean   // !!token && !!user
userDisplayName: string    // user.displayName ?? ''
userAvatar: string         // user.avatarUrl ?? ''
userProvider: string | null // user.provider ?? null
```

### Methods

#### `login(provider: 'google' | 'twitch' | 'discord')`
Генерирует CSRF state → сохраняет в localStorage → редиректит на `{API_URL}/auth/{provider}?state={state}`.

#### `handleCallback(params: URLSearchParams): boolean`
Проверяет state → извлекает token + user → `setSession()`. Возвращает `true` при успехе.

#### `setSession(newToken: string, newUser: User)`
Сохраняет token + user в Pinia. Watchers автоматически:
- Пишут в localStorage
- Синхронизируют `api.setToken(token)`

#### `fetchProfile(): Promise<User | null>`
GET `/api/auth/me` через API client. При ошибке → `clearSession()`.

#### `logout(): Promise<void>`
POST `/api/auth/logout` → `clearSession()`. Если бэкенд недоступен — всё равно чистит локально.

#### `clearSession()`
Удаляет token, user, state из Pinia + localStorage + API client.

---

## localStorage Keys

| Key | Содержимое | Когда очищается |
|---|---|---|
| `frontend-study-lab-token` | JWT-токен | logout / clearSession |
| `frontend-study-lab-user` | JSON User | logout / clearSession |
| `frontend-study-lab-oauth-state` | CSRF state | handleCallback (одноразовый) |
| `frontend-study-lab-auth-modal-shown` | `'1'` | closeAuthModal (чтобы не показывать каждый раз) |

---

## API Client: авторизация запросов

`api/client.ts` автоматически прикрепляет JWT ко всем запросам:

```ts
headers.Authorization = `Bearer ${this.token}`
```

Синхронизация:
- При `setSession()` → watcher вызывает `api.setToken(token)`
- При `clearSession()` → watcher вызывает `api.setToken(null)`
- При инициализации: если токен есть в localStorage → `api.setToken(token)`

---

## Route Guard: `useAuthGuard.ts`

Расширяет `RouteMeta` типом `requiresAuth?: boolean`.

```ts
router.beforeEach((to, from, next) => {
  const { guard } = useAuthGuard()
  guard(to, from, next)
})
```

Логика guard:
- `to.meta.requiresAuth === true` + `!auth.isAuthenticated` → `ui.openAuthModal()` + `next(false)`
- Иначе → `next()`

---

## Auth Modal: автоматическое открытие

`App.vue` → `onMounted()`:

```ts
if (!auth.isAuthenticated && ui.shouldShowAuthModal()) {
  ui.openAuthModal()
}
```

- `shouldShowAuthModal()` проверяет `localStorage.getItem('frontend-study-lab-auth-modal-shown') !== '1'`
- Если пользователь не авторизован и модалка ещё не была показана → открывается
- При закрытии → флаг сохраняется, модалка больше не появляется автоматически
- В сайдбаре кнопка «Войти» всегда может открыть модалку повторно

---

## Dev-режим: тестирование без бэкенда

В `AuthModal.vue` при `import.meta.env.DEV === true` отображается кнопка:

```
🛠 Dev Login (mock)
```

Нажатие вызывает:
```ts
auth.setSession('dev-mock-token', mockUser)
```

Это минует OAuth-редирект и сразу создаёт сессию с мок-пользователем:

```ts
{
  id: 'dev-user-1',
  email: 'dev@test.com',
  displayName: 'Dev User',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dev',
  provider: 'google',
  createdAt: '...'
}
```

На проде кнопка не отображается.

---

## MSW Mock Handlers

В dev-режиме MSW перехватывает API-запросы:

| Endpoint | Method | MSW Response |
|---|---|---|
| `/api/auth/me` | GET | `{ data: mockUser }` |
| `/api/auth/logout` | POST | `{ data: null }` |
| `/api/progress` | GET | `{ data: mockProgress }` |
| `/api/progress/complete` | POST | Обновляет mockProgress |
| `/api/progress/challenge/complete` | POST | Обновляет mockProgress |

---

## i18n Keys

### `auth.*`

| Key | EN | RU |
|---|---|---|
| `auth.login` | Log in | Войти |
| `auth.logout` | Log out | Выйти |
| `auth.profile` | Profile | Профиль |
| `auth.loginWith` | Log in with {provider} | Войти через {provider} |
| `auth.callbackLoading` | Signing in... | Выполняется вход... |
| `auth.callbackSuccess` | Signed in! | Вход выполнен! |
| `auth.callbackError` | Sign-in failed. Please try again. | Не удалось войти. Попробуйте снова. |
| `auth.callbackRetry` | Go home | На главную |
| `auth.modalTitle` | Sign in to your account | Войдите в аккаунт |
| `auth.modalWarning` | Without signing in... | Без входа... |
| `auth.modalSkip` | Continue without signing in | Продолжить без входа |

### `profile.*`

| Key | EN | RU |
|---|---|---|
| `profile.title` | Profile | Профиль |
| `profile.modulesCompleted` | Completed | Завершено |
| `profile.completedModules` | Completed Modules | Завершённые модули |
| `profile.noModules` | No completed modules yet | Пока нет завершённых модулей |
| `profile.provider.google` | Google | Google |
| `profile.provider.twitch` | Twitch | Twitch |
| `profile.provider.discord` | Discord | Discord |

---

## Бэкенд-эндпоинты (спецификация для реализации)

### `GET /api/auth/{provider}?state={state}`

Инициация OAuth-редиректа.

**Параметры:**
- `provider`: `'google' | 'twitch' | 'discord'`
- `state`: строка, которую бэкенд должен сохранить и вернуть в callback

**Действия бэкенда:**
1. Валидировать `provider`
2. Сохранить `state` в сессию/cookie/Redis
3. Сформировать URL OAuth-авторизации провайдера с `redirect_uri` и `state`
4. Редирект (302) на URL провайдера

---

### `GET /api/auth/{provider}/callback?code={code}&state={state}`

Callback от OAuth-провайдера.

**Действия бэкенда:**
1. Проверить `state` против сохранённого (CSRF)
2. Обменять `code` на access token провайдера
3. Получить профиль пользователя от провайдера (email, name, avatar)
4. Найти или создать пользователя в БД (`users` table)
5. Сгенерировать JWT-токен
6. Закодировать пользователя как URL-safe JSON
7. Редирект (302) на frontend:

```
{FRONTEND_URL}/auth/callback?token={jwt}&user={encoded_user_json}&state={state}
```

**User JSON для URL-параметра:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "displayName": "User Name",
  "avatarUrl": "https://...",
  "provider": "google",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

---

### `GET /api/auth/me`

Возвращает профиль текущего пользователя.

**Headers:**
```
Authorization: Bearer {jwt}
```

**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "User Name",
    "avatarUrl": "https://...",
    "provider": "google",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

**Response 401:**
```json
{
  "message": "Unauthorized",
  "status": 401
}
```

---

### `POST /api/auth/logout`

Инвалидирует JWT-сессию.

**Headers:**
```
Authorization: Bearer {jwt}
```

**Request Body:** `{}`

**Response 200:**
```json
{
  "data": null
}
```

---

### Переменные окружения бэкенда

| Variable | Description | Example |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-xxx` |
| `TWITCH_CLIENT_ID` | Twitch Client ID | `xxx` |
| `TWITCH_CLIENT_SECRET` | Twitch Client Secret | `xxx` |
| `DISCORD_CLIENT_ID` | Discord Client ID | `xxx` |
| `DISCORD_CLIENT_SECRET` | Discord Client Secret | `xxx` |
| `JWT_SECRET` | Секрет для подписи JWT | `random-32-bytes` |
| `JWT_EXPIRES_IN` | Время жизни JWT | `7d` |
| `FRONTEND_URL` | URL frontend для callback-редиректа | `https://study-lab.dev` |

---

### БД: таблица `users`

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Уникальный ID |
| `email` | VARCHAR(255) | Email от провайдера |
| `display_name` | VARCHAR(100) | Имя пользователя |
| `avatar_url` | TEXT | URL аватара |
| `provider` | ENUM('google','twitch','discord') | OAuth-провайдер |
| `provider_id` | VARCHAR(255) | ID пользователя у провайдера |
| `created_at` | TIMESTAMP | Дата регистрации |
| `updated_at` | TIMESTAMP | Дата обновления |

**Уникальный индекс:** `(provider, provider_id)` — один пользователь на один аккаунт провайдера.

---

## Что ещё не реализовано (Phase 3.3)

- [ ] Backend sync: при логине — fetch прогресса с бэкенда → merge с localStorage
- [ ] Backend sync: при completeModule — POST на бэкенд → обновить локально при успехе
- [ ] Offline queue: если нет сети — складывать изменения в очередь → синхронизировать при появлении сети
- [ ] 401 interceptor: если бэкенд вернул 401 → `clearSession()` + редирект на логин
- [ ] Token refresh: если JWT истёк — обновить через refresh token (если бэкенд поддерживает)
