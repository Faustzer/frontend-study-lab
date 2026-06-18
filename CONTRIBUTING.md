# Contributing to Frontend Study Lab

Thank you for your interest in contributing! This document explains how to set up the project, make changes, and submit pull requests.

## Getting Prerequisites

- **Node.js** 20+ and **npm**
- **Git**
- **VS Code** (recommended) with extensions:
  - `Vue.volar` — Vue 3 language support
  - `dbaeumer.vscode-eslint` — ESLint integration
  - `esbenp.prettier-vscode` — Prettier formatting

## Local Setup

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/frontend-study-lab.git
cd frontend-study-lab

# 2. Install dependencies
npm install

# 3. Create environment file
cp frontend/.env.example frontend/.env

# 4. Start dev server
npm run dev
```

The app will be available at `http://localhost:5173` (or next available port).

## Project Structure

```md
frontend-study-lab/
├── frontend/ # Main application code
│ ├── api/ # API client layer
│ ├── assets/scss/ # Global styles
│ ├── components/ # Reusable components
│ ├── composables/ # Vue composables
│ ├── i18n/ # Translations (en/ru)
│ ├── mocks/ # MSW API mocks
│ ├── pages/ # Route pages
│ ├── stores/ # Pinia stores
│ ├── topics/ # Learning modules
│ │ ├── js-core/ # ✅ 7 completed modules
│ │ ├── js-dom/ # 🚧 empty
│ │ ├── js-async/ # 🚧 empty
│ │ ├── css/ # 🚧 empty
│ │ ├── scss/ # 🚧 empty
│ │ ├── typescript/ # 🚧 empty
│ │ ├── vue/ # 🚧 empty
│ │ └── nuxt/ # 🚧 empty
│ ├── types/ # TypeScript interfaces
│ ├── App.vue # Root component
│ ├── main.ts # Entry point
│ └── router.ts # Route definitions
├── docs/
│ ├── AI-GUIDE.md # AI assistant rules
│ ├── plan-frontend.md # Development roadmap
│ ├── plan-backend.md # Backend roadmap
│ └── skeleton.md # Topic creation template
├── .husky/ # Git hooks
├── .github/workflows/ # CI/CD (future)
├── index.html # HTML entry
├── package.json # Dependencies and scripts
└── README.md # Project overview
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming:

- `feat/` — new feature or topic
- `fix/` — bug fix
- `docs/` — documentation changes
- `refactor/` — code refactoring

### 2. Make Changes

- Follow the existing code style (ESLint + Prettier run automatically on save)
- Add i18n translations for both EN and RU
- Update `_meta.json` when creating new topics

### 3. Test Your Changes

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Fix lint errors automatically
npm run lint:fix

# Build (verifies everything compiles)
npm run build
```

### 4. Commit

```bash
git add .
git commit -m "feat: add debounce topic page"
```

Commit message format:

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation
- `style:` — formatting
- `refactor:` — code restructuring
- `test:` — adding tests

Husky will run lint-staged automatically before commit.

### 5. Push and Create PR

```bash
git push origin feat/your-feature-name
```

Then create a Pull Request on GitHub with:

- Clear description of changes
- Screenshots (if UI changes)
- Reference to related issue (if any)

## Adding a New Topic

Topics are the core learning modules. Each topic is a self-contained interactive demo.

### Quick Start

1. Read `docs/skeleton.md` for the template
2. Create folder: `frontend/topics/<category>/<module>/`
3. Add files:
   - `_meta.json` — metadata (title, difficulty, xp, order)
   - `<Module>.vue` — interactive demo page
   - `<module>.ts` — implementation

### Example: Adding "Event Delegation" to js-dom

```bash
mkdir -p frontend/topics/js-dom/event-delegation
```

**`_meta.json`:**

```json
{
  "title": "Event Delegation",
  "description": "Handle events on parent instead of individual children",
  "difficulty": "medium",
  "xp": 60,
  "order": 1,
  "tags": ["dom", "events", "performance"]
}
```

**`EventDelegation.vue`:**

```vue
<template>
  <section class="demo">
    <div class="demo-card">
      <div class="demo-header">
        <p class="demo-label">{{ $t("categories.js-dom.title") }}</p>
        <span class="difficulty difficulty-medium">Medium • +60 XP</span>
      </div>
      <h2>Event Delegation</h2>
      <p class="demo-copy">Brief explanation here...</p>
      <!-- Interactive demo -->
      <pre class="code">{{ codeExample }}</pre>
      <button class="complete-btn" :class="{ completed }" @click="onComplete">
        <span v-if="completed">{{ $t("common.completed") }}</span>
        <span v-else>{{ $t("common.complete") }} → +60 XP</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useProgressStore } from "@/stores/progress";

const progress = useProgressStore();
const completed = ref(progress.isModuleCompleted("event-delegation"));

function onComplete() {
  if (completed.value) return;
  progress.completeModule("event-delegation", 60);
  completed.value = true;
}

const codeExample = ["// Your code example here"].join("\n");
</script>

<style scoped lang="scss">
@use "@/assets/scss/demo-page";
// Page-specific styles
</style>
```

**`event-delegation.ts`:**

```typescript
export function delegate(
  parent: HTMLElement,
  event: string,
  selector: string,
  handler: Function,
) {
  parent.addEventListener(event, (e) => {
    const target = e.target as HTMLElement;
    if (target.matches(selector)) {
      handler(e, target);
    }
  });
}
```

### After Creating a Topic

- Routing is automatic (via `useTopics` composable)
- Navigation updates automatically
- XP and progress tracking work automatically
- Run `npm run lint` and `npm run build` to verify

## Code Style

- **TypeScript** — strict mode enabled
- **Vue** — Composition API with `<script setup>`
- **SCSS** — use variables from `assets/scss/_variables.scss`
- **i18n** — all UI strings must use `$t()` with both EN and RU translations
- **Naming** — PascalCase for components, camelCase for functions/variables

## Need Help?

- Open an issue on GitHub
- Contact: `faustze9@gmail.com`

## License

This project is licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).

By contributing, you agree that your contributions will be licensed under the same license.

**Key points:**

- ✅ Free to use, modify, and distribute for non-commercial purposes
- ❌ Commercial use is not permitted without explicit permission
- 📧 For commercial licensing inquiries: `faustze9@gmail.com`
