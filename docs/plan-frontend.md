# Frontend Development Plan

## Phase 1: Foundation (Current → MVP)

### 1.1 Project Setup & Tooling

- [x] Vue 3 + TypeScript + Vite — done
- [x] Pinia store — done
- [x] Vue Router — done
- [x] SCSS architecture (variables, mixins) — done
- [x] ESLint (Antfu config) — done
- [x] Husky + lint-staged setup
  - [x] Install `husky`, `lint-staged`
  - [x] Add pre-commit hook: `npx lint-staged` (eslint --fix)
  - [x] Add pre-push hook: `npm run typecheck` (vue-tsc --noEmit)
- [x] Path aliases (`@/`) — verify in tsconfig
- [x] VS Code settings (format on save, ESLint only) — done
- [x] Remove Prettier, use ESLint as sole formatter — done

### 1.2 i18n (vue-i18n)

- [x] Install `vue-i18n@9`
- [x] Create `frontend/i18n/` directory
  - [x] `frontend/i18n/index.ts` — i18n setup
  - [x] `frontend/i18n/locales/en.json` — English translations
  - [x] `frontend/i18n/locales/ru.json` — Russian translations
- [x] Create `frontend/components/LanguageSwitcher.vue` — toggle EN/RU button
- [x] Wrap UI strings in `$t()` calls (App.vue, HomePage.vue)
- [x] Add `$t()` to all topic pages (7 js-core modules)

### 1.2b Pinia Persisted State

- [x] Install `pinia-plugin-persistedstate`
- [x] Connect in main.ts
- [x] Progress store persists to localStorage (fallback for backend)

### 1.3 API Layer (Backend-ready)

- [x] Create `frontend/api/` directory
  - [x] `frontend/api/client.ts` — fetch wrapper with base URL, error handling
  - [x] `frontend/api/types.ts` — shared API types (mirrors backend models)
  - [x] `frontend/api/progress.ts` — progress endpoints (mocked for now)
  - [x] `frontend/api/auth.ts` — auth endpoints (mocked for now)
- [x] Define API response types matching backend schema
- [x] Create `frontend/mocks/` — MSW handlers for API mocking
  - [x] `frontend/mocks/handlers.ts` — mock API handlers
  - [x] `frontend/mocks/browser.ts` — browser worker setup
  - [x] `frontend/mocks/server.ts` — server worker setup (for tests)
- [x] Integrate MSW in main.ts (dev mode only)

### 1.4 Pinia Store Refactoring

- [x] Install `pinia-plugin-persistedstate`
- [x] Refactor `stores/progress.ts`:
  - [x] Keep localStorage as fallback (persistedstate)
  - [x] Add `syncWithBackend()` method for future backend sync
  - [x] Add `isOnline` state
- [x] Create `stores/auth.ts`:
  - [x] `user: User | null`
  - [x] `isAuthenticated: boolean`
  - [x] `login(provider)`, `logout()`, `fetchProfile()` methods
  - [x] Persist to localStorage
- [x] Create `stores/ui.ts`:
  - [x] `sidebarCollapsed: Record<string, boolean>` (`Set<string>`)
  - [x] `language: 'en' | 'ru'` (delegated to i18n module)
  - [x] `theme: 'light' | 'dark'` (prepared for future use)

### 1.5 UI Components Library

- [x] Create `frontend/components/ui/` directory
  - [x] `UiButton.vue` — reusable button (variants: primary, secondary, ghost)
  - [x] `UiCard.vue` — card container
  - [x] `CodeBlock.vue` — code block with language highlighting
  - [x] `UiBadge.vue` — difficulty badge (easy/medium/hard)
  - [x] `UiProgressBar.vue` — XP progress bar
  - [x] `UiIcon.vue` — icon wrapper
  - [x] `UiSpinner.vue` — loading spinner
  - [x] `UiModal.vue` — modal dialog
  - [x] `UiChip.vue` - chip (PRACTICE-FIRST LEARNING on main page)
- [x] Create `frontend/components/layout/` directory
  - [x] `AppSidebar.vue` — extract from App.vue
  - [x] `AppHeader.vue` — mobile header
  - [x] `AppFooter.vue` — footer with copyright and GitHub link

### 1.6 Topic Pages Refactoring

- [x] Create `frontend/components/topic/TopicPage.vue` — reusable topic page layout
- [x] Create `frontend/components/topic/CompleteButton.vue` — "Complete module" button
- [x] Refactor all 7 js-core topics to use shared components
- [x] Add difficulty badge to each topic page
- [x] Add XP reward display to each topic page

### 1.7 Styling & Fonts

- [x] Extract all inline styles to separate `.scss` files
  - [x] `frontend/assets/scss/_fonts.scss` — JetBrains Mono font faces
  - [x] `frontend/assets/scss/_base.scss` — reset and global styles
  - [x] `frontend/assets/scss/_index.scss` — main entry point
  - [x] `frontend/assets/scss/pages/_app.scss` — App.vue styles
  - [x] `frontend/assets/scss/pages/_home.scss` — HomePage.vue styles
  - [x] `frontend/assets/scss/pages/_topic.scss` — shared topic styles
  - [x] `frontend/assets/scss/components/_language-switcher.scss`
- [x] Download JetBrains Mono fonts locally
- [x] Set JetBrains Mono as global font-family
- [x] Remove all `<style scoped>` from Vue components
- [x] Remove unused `styles.css`

### 1.8 Project Structure & Documentation

- [x] Rename `src/` to `frontend/`
- [x] Move all frontend configs to `frontend/`
- [x] Move `index.html` to `frontend/`
- [x] Delete `nuxt-app/` directory
- [x] Create `CONTRIBUTING.md`
- [x] Create `SECURITY.md`
- [x] Create `LICENSE.md` (CC BY-NC 4.0)
- [x] Create `docs/AI-GUIDE.md`
- [x] Create `frontend/.env.example`
- [x] Create `backend/.env.example`
- [x] Update `README.md` with English description
- [x] Update `.gitignore`

---

## Phase 2: Testing

### 2.1 Unit Tests (Vitest)

- [x] Install `vitest`, `@vue/test-utils`, `jsdom`
- [x] Configure `vitest.config.ts` with `@/` alias resolution
- [x] Create `frontend/tests/useTopics.test.ts` — 28 tests covering:
  - [x] `buildCategory` — happy path + defaults
  - [x] `buildRoutes` — route generation + empty categories
  - [x] `slugify` — PascalCase conversion
  - [x] `categoryFromPath` — path extraction + invalid paths
  - [x] `humanize` — kebab/snake/PascalCase
  - [x] `extractMeta` — `{ default }` format + direct + null/undefined
  - [x] `calculateXp` — explicit xp + difficulty + defaults
  - [x] `buildTopicItem` — full meta + empty meta
  - [x] `createFallbackCategory` — fallback creation
  - [x] `sortCategories` — sort order + items sort
- [x] Create `frontend/mocks/topics.ts` — mock data for tests
- [x] Create `frontend/stores/__tests__/progress.test.ts` — 16 tests covering: defaults, module completion, XP/level up, challenges, reset, localStorage persistence, corrupted data
- [x] Create `frontend/components/ui/__tests__/UiButton.test.ts` — 14 tests covering: slot, variants, sizes, disabled, type, click
- [x] Create `frontend/components/ui/__tests__/UiProgressBar.test.ts` — 14 tests covering: value/max, percent calc, capping, label, sizes
- [x] Target: 80% coverage on stores and composables

### 2.2 MSW (Mock Service Worker)

- [x] Install `msw`
- [x] Create `frontend/mocks/handlers.ts` — mock API handlers
  - [x] `GET /api/progress` → returns mock progress
  - [x] `POST /api/progress/complete` → returns updated progress
  - [x] `GET /api/auth/me` → returns mock user
  - [x] `POST /api/auth/logout` → returns success
- [x] Create `frontend/mocks/browser.ts` — browser worker setup
- [x] Create `frontend/mocks/server.ts` — server worker setup (for tests)
- [x] Integrate MSW in test setup
- [x] Write tests with mocked API responses — 10 tests covering: progress API, auth API, error handling

### 2.3 E2E Tests (Playwright)

- [x] Install `@playwright/test`
- [x] Configure `playwright.config.ts`
- [x] Create `e2e/home.spec.ts` — 5 tests: dashboard, stats, progress bar, categories, language switcher
- [x] Create `e2e/topic.spec.ts` — 6 tests: navigation, badge, XP reward, complete button, back navigation, multiple topics
- [x] Create `e2e/progress.spec.ts` — 5 tests: complete module, checkmark, XP increase, persistence, multiple modules
- [x] Create `e2e/i18n.spec.ts` — 5 tests: default EN, switch RU, switch back, persistence, topic page
- [x] Create `e2e/auth.spec.ts` — 6 tests (skipped, enabled after Phase 3 auth implementation)

---

## Phase 3: Auth Integration (After Backend Ready)

### 3.1 OAuth2 Flow

- [x] Create `frontend/components/auth/AuthButton.vue` — login button per provider
- [x] Create `frontend/pages/AuthCallback.vue` — OAuth callback handler
- [x] Update `stores/auth.ts`:
  - [x] `login(provider)` → redirect to backend OAuth endpoint (with CSRF state)
  - [x] Handle callback → extract token → store in Pinia (`handleCallback()`)
  - [x] `logout()` → call backend + clear token → redirect to home
  - [x] `fetchProfile()` → GET /api/auth/me (via api client)
- [x] Create `frontend/composables/useAuthGuard.ts` — route guard for protected routes
- [x] Add auth middleware to router

### 3.2 User Profile

- [x] Create `frontend/pages/ProfilePage.vue`
  - [x] Display user avatar, name, email
  - [x] Show level, XP, progress stats
  - [x] Show completed modules list
  - [x] Logout button
- [x] Create `frontend/components/profile/UserCard.vue`
- [x] Create `frontend/components/profile/ProgressStats.vue`

### 3.3 Backend Sync

- [ ] Update `stores/progress.ts`:
  - [ ] On login: fetch progress from backend → merge with local
  - [ ] On module complete: POST to backend → update local on success
  - [ ] Handle offline mode: queue changes → sync when online
- [x] Add request interceptor to `frontend/api/client.ts`:
  - [x] Attach JWT token to all requests
  - [x] Handle 401 → redirect to login

---

## Phase 4: Polish & Deploy

### 4.1 UI/UX Improvements

- [x] Add dark mode toggle
- [x] Add animations (page transitions, XP gain animation)
- [x] Add toast notifications (success/error messages)
- [ ] Improve mobile responsiveness
- [ ] Add keyboard navigation support
- [ ] Add loading skeletons

### 4.2 Performance

- [x] Lazy load topic pages (dynamic imports)
- [x] Optimize bundle size (code splitting)
- [ ] Add service worker for offline support (future)

### 4.3 CI/CD (GitHub Actions)

- [x] Create `.github/workflows/ci.yml`:
  - [x] Lint check
  - [x] Type check (vue-tsc)
  - [x] Unit tests
  - [x] Build check
- [ ] Create `.github/workflows/deploy.yml`:
  - [ ] Deploy frontend to Railway on push to main
