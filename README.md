# Frontend Study Lab

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)

A practice-first learning platform for frontend development. Learn JavaScript, TypeScript, CSS, Vue, and more through interactive examples and hands-on coding — not documentation.

## Why This Project?

Most tutorials drown you in theory. This is different. Each topic gives you:

- **Minimal theory** — just enough to understand the concept
- **Interactive demos** — see it working in real time
- **Production-ready code** — patterns you'll actually use
- **Gamification** — earn XP, level up, track progress

## Tech Stack

| Layer        | Tools                                              |
| ------------ | -------------------------------------------------- |
| Framework    | Vue 3 + TypeScript                                 |
| Build        | Vite                                               |
| State        | Pinia (with persisted state)                       |
| i18n         | vue-i18n (EN / RU)                                 |
| Styling      | SCSS (variables, mixins, modules)                  |
| Testing      | Vitest (unit), Playwright (e2e), MSW (API mocking) |
| Code Quality | ESLint (Antfu), Husky + lint-staged                |

## Project Structure

```md
frontend/
├── api/ # API client layer (ready for backend)
│ ├── client.ts # Fetch wrapper with JWT support
│ ├── types.ts # Shared API types
│ ├── progress.ts # Progress endpoints
│ └── auth.ts # Auth endpoints
├── assets/scss/ # Global styles (variables, mixins, demo-page)
├── components/
│ ├── layout/
│ │   ├── AppHeader.vue # Mobile header with burger and XP bar
│ │   ├── AppSidebar.vue # Sidebar with navigation and categories
│ │   └── AppOverlay.vue # Mobile sidebar overlay
│ ├── topic/
│   │   └── CompleteButton.vue # "Complete module" button
│   ├── ui/
│   │   ├── UiButton.vue # Reusable button (primary/secondary/ghost)
│   │   ├── UiCard.vue # Card container with glass effect
│   │   ├── UiBadge.vue # Difficulty badge (easy/medium/hard)
│   │   ├── UiProgressBar.vue # XP progress bar
│   │   ├── UiSpinner.vue # Loading spinner
│   │   ├── UiModal.vue # Modal dialog
│   │   ├── UiChip.vue # Chip/tag component
│   │   ├── CodeBlock.vue # Code block with language highlighting
│   │   └── UiIcon.vue # Icon wrapper (Iconify logos)
│   └── LanguageSwitcher.vue # EN/RU language toggle
├── composables/
│   └── useTopics.ts # Auto-scans topics/ → routes + navigation
├── helpers/
│   └── useTopics.ts # Pure helper functions (slugify, buildCategory, etc.)
├── i18n/ # Translations (en.json, ru.json)
├── mocks/
│   ├── topics.ts # Test mock data (mockTopicItems, mockTopicCategories)
│   └── msw/ # MSW handlers for API mocking
├── pages/
│   └── HomePage.vue # Dashboard with stats and categories
├── stores/
│   ├── progress.ts # Pinia store (XP, levels, completed modules)
│   ├── auth.ts # Auth store (user, token)
│   └── ui.ts # UI store (sidebar, theme)
├── topics/ # Learning modules
│   ├── js-core/ # ✅ 7 modules (bind, curry, debounce, etc.)
│   ├── js-dom/ # 🚧 placeholder
│   ├── js-async/ # 🚧 placeholder
│   ├── css/ # 🚧 placeholder
│   ├── scss/ # 🚧 placeholder
│   ├── typescript/ # 🚧 placeholder
│   ├── vue/ # 🚧 placeholder
│   └── nuxt/ # 🚧 placeholder
├── types/ # TypeScript interfaces (topic.ts, meta.ts, progress.ts)
├── tests/ # Vitest unit tests
│   └── useTopics.test.ts # Tests for helpers and composables
├── App.vue # Root layout (header + sidebar + content)
├── main.ts # App entry point
├── router.ts # Dynamic route generation
└── index.html # Entry point
```

## How It Works

### Topic Structure

Each topic is a self-contained module:

```md
frontend/topics/<category>/<module>/
├── \_meta.json # title, difficulty, xp, order, tags
├── <Module>.vue # Interactive demo page
└── <module>.ts # Implementation
```

### Adding a New Topic

1. Create folder: `frontend/topics/<category>/<module>/`
2. Add `_meta.json` with title, difficulty, xp, order
3. Create `<Module>.vue` (interactive demo) and `<module>.ts` (implementation)
4. Done — routing, navigation, and XP are automatic

### Gamification

- Complete modules → earn XP (30/60/100 based on difficulty)
- XP accumulates → level up
- Progress persists in localStorage (backend sync ready)

## Available Categories

| Category         | Icon | Modules | Status     |
| ---------------- | ---- | ------- | ---------- |
| JavaScript Core  | 🟨   | 7       | ✅ Ready   |
| JavaScript DOM   | 🌳   | 0       | 🚧 Planned |
| JavaScript Async | ⚡   | 0       | 🚧 Planned |
| CSS              | 🎨   | 0       | 🚧 Planned |
| SCSS             | 💅   | 0       | 🚧 Planned |
| TypeScript       | 🔷   | 0       | 🚧 Planned |
| Vue 3            | 💚   | 0       | 🚧 Planned |
| Nuxt             | ⛰️   | 0       | 🚧 Planned |

## JavaScript Core Modules

| Module     | Difficulty | XP  | Topics                           |
| ---------- | ---------- | --- | -------------------------------- |
| Bind       | Medium     | 60  | this, context, functions         |
| Curry      | Medium     | 60  | functions, closures, fp          |
| Debounce   | Easy       | 30  | timing, optimization, events     |
| Deep Clone | Medium     | 60  | objects, recursion, immutability |
| Deep Equal | Medium     | 60  | objects, comparison, recursion   |
| Memoize    | Easy       | 30  | cache, optimization, closures    |
| Throttle   | Easy       | 30  | timing, optimization, events     |

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Type check + production build
npm run typecheck    # TypeScript check only
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run test         # Vitest (watch mode)
npm run test:run     # Vitest (single run)
```

## Testing

Tests use Vitest with jsdom environment. Mock data lives in `frontend/mocks/`.

```bash
npm run test:run     # Run all tests once
npm run test         # Watch mode
npx vitest run frontend/tests/useTopics.test.ts  # Single file
```

## Development

Want to contribute? See [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Local setup instructions
- Project structure overview
- Development workflow (branching, commits, PRs)
- Adding new topics (with examples)
- Code style guidelines

Quick start:

```bash
git clone https://github.com/Faustze/frontend-study-lab.git
cd frontend-study-lab
npm install
cp frontend/.env.example frontend/.env
npm run dev
```

## Roadmap

- [x] Vue 3 + TypeScript + Vite setup
- [x] Pinia store with persisted state
- [x] vue-i18n (EN/RU)
- [x] API layer (client, types, endpoints)
- [x] MSW API mocking
- [x] Husky + lint-staged
- [x] Dynamic topic routing
- [x] Gamification (XP, levels, progress)
- [x] Unit tests (Vitest) — helpers/useTopics.ts covered
- [x] UI component library (UiButton, UiCard, UiBadge, UiProgressBar, UiSpinner, UiModal, UiChip, CodeBlock, UiIcon)
- [x] Layout components (AppHeader, AppSidebar, AppOverlay)
- [x] Topic components (CompleteButton)
- [x] Code blocks with overflow handling
- [ ] E2E tests (Playwright)
- [ ] Backend (FastAPI + PostgreSQL)
- [ ] OAuth2 (Google, Twitch, Discord)
- [ ] User profiles
- [ ] Dark mode
- [ ] Deploy to Railway
