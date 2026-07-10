# Authentication System

> Full description of the frontend-study-lab authentication system.
> This document started as a backend spec; the backend is now implemented
> (`backend/app/routes/auth.py`) and this describes the working system.
> Google OAuth is configured in production; Twitch/Discord will work once
> their apps are registered in the provider consoles (see `plan-backend.md`,
> Phase 4).

---

## Architecture

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

## OAuth2 Flow (step by step)

### 1. Login initiation

The user clicks a provider button in `AuthModal.vue`:

```
AuthButton.vue  →  auth.login('google')
```

`stores/auth.ts` → `login(provider)`:
1. Generates `state` = 32 random bytes (CSRF token)
2. Stores `state` in `localStorage` (`frontend-study-lab-oauth-state`)
3. Redirects the browser to: `{API_URL}/auth/{provider}?state={state}`

### 2. Authorization on the provider side

The backend receives the request on `/api/auth/{provider}?state={state}`:
1. authlib stores its own internal state in a session cookie (SessionMiddleware,
   max_age=600), while the frontend's `state` is passed through the provider
   (round-trip)
2. Redirects the user to the provider's OAuth page (Google/Twitch/Discord)
3. The user authorizes on the provider side
4. The provider redirects back to the backend with an authorization code

### 3. Provider callback → backend

The backend receives the provider callback:
1. Exchanges the authorization code for the provider's access token
   (authlib verifies its own state)
2. Fetches and normalizes the user profile (`_fetch_profile`: one shape for
   every provider)
3. Creates/updates the user in the DB (`upsert_oauth_user`, unique on
   `provider + provider_id`)
4. Generates a JWT for the frontend
5. Redirects to the frontend:
   `{FRONTEND_URL}/auth/callback?token={jwt}&user={encoded_json}&state={state}`

On any OAuth error (user denied, malformed profile) it redirects to
`/auth/callback?error=oauth_failed` instead of crashing.

### 4. Callback handling on the frontend

`AuthCallback.vue` mounts and calls:

```ts
auth.handleCallback(urlSearchParams)
```

`stores/auth.ts` → `handleCallback(params)`:
1. Verifies `state` from the URL === `state` from localStorage (CSRF protection)
2. Removes `state` from localStorage (single-use)
3. Extracts `token` and `user` from the URL params
4. Parses the user JSON
5. Calls `setSession(token, user)` → persists to Pinia + localStorage
6. Syncs the token via `api.setToken(token)`

On success → shows "✓ Signed in!" → redirects to `/` after 800ms.

On failure → shows "✗ Sign-in failed" + a "Go home" button.

---

## CSRF protection (state parameter)

### Why

Without `state` an attacker could:
1. Log in to the site → obtain a valid callback URL
2. Send the victim a link with a foreign token: `/auth/callback?token=EVIL&user=...`
3. The victim opens it → the attacker's token is stored in their browser
4. All of the victim's progress goes to the attacker's account

### How it works

```
Victim clicks "Log in":
  → state = crypto.random(32)  // 256^32 possibilities, unguessable
  → localStorage.setItem('oauth-state', state)
  → redirect: /api/auth/google?state=abc123...

Attacker sends a link:
  → /auth/callback?token=EVIL&state=guess123

handleCallback():
  → URL.state ("guess123") !== localStorage.state ("abc123...")
  → ❌ clearSession() — attack rejected
```

---

## Auth-related files

### Store

| File | Purpose |
|---|---|
| `stores/auth.ts` | Pinia store: token, user, login/logout/fetchProfile/handleCallback |
| `stores/ui.ts` | `authModalOpen`, `openAuthModal()`, `closeAuthModal()`, `shouldShowAuthModal()` |

### API Layer

| File | Purpose |
|---|---|
| `api/client.ts` | HTTP client with JWT auth (`Authorization: Bearer {token}`) |
| `api/auth.ts` | `getMe()`, `logout()`, `getLoginUrl(provider)` |
| `api/types.ts` | `User`, `ApiResponse<T>`, `ApiError` |

### Components

| File | Purpose |
|---|---|
| `components/auth/AuthButton.vue` | Provider login button (Google/Twitch/Discord) |
| `components/auth/AuthModal.vue` | Auth modal + dev button for testing |
| `pages/AuthCallback.vue` | OAuth callback handling page |
| `pages/ProfilePage.vue` | User profile (requiresAuth) |
| `components/profile/UserCard.vue` | User card (avatar, name, email) |
| `components/profile/ProgressStats.vue` | Progress stats (level, XP, modules) |

### Composables

| File | Purpose |
|---|---|
| `composables/useAuthGuard.ts` | Route guard: `meta.requiresAuth` → check + modal |

### Routing

| Route | Component | Meta |
|---|---|---|
| `/` | `HomePage` | — |
| `/auth/callback` | `AuthCallback` | — |
| `/profile` | `ProfilePage` | `requiresAuth: true` |
| `/:category/:module` | Topic pages | — |

---

## Store API: `stores/auth.ts`

### State

```ts
token: string | null       // JWT token
user: User | null          // User profile
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
Generates a CSRF state → stores it in localStorage → redirects to
`{API_URL}/auth/{provider}?state={state}`.

#### `handleCallback(params: URLSearchParams): boolean`
Verifies state → extracts token + user → `setSession()`. Returns `true` on success.

#### `setSession(newToken: string, newUser: User)`
Saves token + user to Pinia. Watchers automatically:
- Write to localStorage
- Sync `api.setToken(token)`

#### `fetchProfile(): Promise<User | null>`
GET `/api/auth/me` via the API client. On failure → `clearSession()`.

#### `logout(): Promise<void>`
POST `/api/auth/logout` → `clearSession()`. Clears locally even if the backend
is unreachable.

#### `clearSession()`
Removes token, user, and state from Pinia + localStorage + the API client.

---

## localStorage Keys

| Key | Contents | Cleared when |
|---|---|---|
| `frontend-study-lab-token` | JWT token | logout / clearSession |
| `frontend-study-lab-user` | User JSON | logout / clearSession |
| `frontend-study-lab-oauth-state` | CSRF state | handleCallback (single-use) |
| `frontend-study-lab-auth-modal-shown` | `'1'` | closeAuthModal (so the modal isn't shown every time) |

---

## API Client: request authorization

`api/client.ts` automatically attaches the JWT to every request:

```ts
headers.Authorization = `Bearer ${this.token}`
```

Synchronization:
- On `setSession()` → a watcher calls `api.setToken(token)`
- On `clearSession()` → a watcher calls `api.setToken(null)`
- On init: if a token exists in localStorage → `api.setToken(token)`

---

## Route Guard: `useAuthGuard.ts`

Extends `RouteMeta` with `requiresAuth?: boolean`.

```ts
router.beforeEach((to, from, next) => {
  const { guard } = useAuthGuard()
  guard(to, from, next)
})
```

Guard logic:
- `to.meta.requiresAuth === true` + `!auth.isAuthenticated` → `ui.openAuthModal()` + `next(false)`
- Otherwise → `next()`

---

## Auth Modal: automatic opening

`App.vue` → `onMounted()`:

```ts
if (!auth.isAuthenticated && ui.shouldShowAuthModal()) {
  ui.openAuthModal()
}
```

- `shouldShowAuthModal()` checks `localStorage.getItem('frontend-study-lab-auth-modal-shown') !== '1'`
- If the user is not authenticated and the modal hasn't been shown yet → it opens
- On close → the flag is stored, the modal no longer opens automatically
- The "Log in" button in the sidebar can always reopen it

---

## Dev mode: testing without OAuth

Two mechanisms:

**1. Frontend mock.** `AuthModal.vue` shows a button when
`import.meta.env.DEV === true`:

```
🛠 Dev Login (mock)
```

Clicking it calls:
```ts
auth.setSession('dev-mock-token', mockUser)
```

This skips the OAuth redirect and creates a session with a mock user:

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

The button is not rendered in production.

**2. Backend endpoint `POST /api/auth/dev-login`.** Creates a real user in the
DB and returns a valid JWT — for local development against the real backend
and for tests. Enabled only with `DEV_LOGIN_ENABLED=true`, otherwise 404.
Disabled in production.

---

## MSW Mock Handlers

In dev mode MSW starts with `onUnhandledRequest: 'bypass'`: only requests
matching the handlers are intercepted, everything else goes to the real backend
(the `pnpm run dev-wait` script waits for local Postgres + API and starts the
dev server):

| Endpoint | Method | MSW Response |
|---|---|---|
| `/api/auth/me` | GET | `{ data: mockUser }` |
| `/api/auth/logout` | POST | `{ data: null }` |
| `/api/progress` | GET | `{ data: mockProgress }` |
| `/api/progress/complete` | POST | Updates mockProgress |
| `/api/progress/challenge/complete` | POST | Updates mockProgress |

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

## Backend endpoints (implemented in `backend/app/routes/auth.py`)

### `GET /api/auth/{provider}?state={state}`

Initiates the OAuth redirect.

**Parameters:**
- `provider`: `'google' | 'twitch' | 'discord'`
- `state`: a string from the frontend, round-tripped through the provider back
  into the callback

**What the backend does:**
1. Validates `provider`: unknown or unconfigured (no client_id in env) → 404
2. Builds the provider's OAuth authorization URL with `redirect_uri` and `state` (authlib)
3. Redirects (302) to the provider URL

Providers are registered at startup only when their credentials are set —
which is why Twitch/Discord currently return 404 in production.

---

### `GET /api/auth/{provider}/callback?code={code}&state={state}`

Callback from the OAuth provider.

**What the backend does:**
1. Exchanges `code` for the provider's access token (authlib verifies its own
   state from the session cookie)
2. Fetches the user profile from the provider (email, name, avatar) and
   normalizes it
3. Finds or creates the user in the DB (`users`, upsert on `provider + provider_id`)
4. Generates a JWT
5. Encodes the user as URL-safe JSON
6. Redirects (302) to the frontend (on error — `?error=oauth_failed`):

```
{FRONTEND_URL}/auth/callback?token={jwt}&user={encoded_user_json}&state={state}
```

**User JSON in the URL parameter:**
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

Returns the current user's profile.

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

JWTs are stateless — the server invalidates nothing, the client just discards
the token. The endpoint exists to keep the frontend contract (and for future
revocation if ever needed).

**Response 200:**
```json
{
  "data": null
}
```

---

### Backend environment variables

| Variable | Description | Example |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-xxx` |
| `TWITCH_CLIENT_ID` | Twitch Client ID (not configured yet) | `xxx` |
| `TWITCH_CLIENT_SECRET` | Twitch Client Secret (not configured yet) | `xxx` |
| `DISCORD_CLIENT_ID` | Discord Client ID (not configured yet) | `xxx` |
| `DISCORD_CLIENT_SECRET` | Discord Client Secret (not configured yet) | `xxx` |
| `JWT_SECRET` | JWT signing secret (HS256) | `random-32-bytes` |
| `JWT_EXPIRES_DAYS` | JWT lifetime in days | `7` |
| `FRONTEND_URL` | Frontend URL for the callback redirect | `https://study.faustze.tech` |
| `DEV_LOGIN_ENABLED` | Enable `/api/auth/dev-login` (dev only!) | `false` |

The full list lives in `backend/app/config.py` and `backend/.env.example`.

---

### DB: `users` table

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Unique ID |
| `email` | VARCHAR(255) | Email from the provider |
| `display_name` | VARCHAR(100) | Display name |
| `avatar_url` | TEXT | Avatar URL |
| `provider` | VARCHAR(50) | OAuth provider ('google'/'twitch'/'discord') |
| `provider_id` | VARCHAR(255) | User ID at the provider |
| `created_at` | TIMESTAMP | Registration date |
| `updated_at` | TIMESTAMP | Last update |

**Unique index:** `(provider, provider_id)` — one user per provider account.

---

## Backend sync (Phase 3.3 — implemented)

- [x] Backend sync: on login `progress.syncWithBackend()` — flush the local queue → fetch progress → merge
- [x] On completeModule — write to the persistent queue (`frontend-study-lab-progress-queue`) → POST to the backend
- [x] Offline queue: unsent completions stay queued and are flushed on the `online`
  event or on the next `syncWithBackend()`; concurrent calls share one in-flight flush
- [x] 401 interceptor: `api.setOnUnauthorized()` (registered in App.vue) → `auth.clearSession()` + open AuthModal
  (a modal, not a redirect — a guest can keep working locally)

## Not implemented (deliberately)

- **Token refresh** — the JWT lives 7 days, there are no refresh tokens.
  Expired → 401 → login modal. Enough for a learning project where auth is optional.
- **JWT revocation** — logout is purely client-side (see `/api/auth/logout` above).
