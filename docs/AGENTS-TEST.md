# AGENTS-Test.md — Guide to Writing Tests with AI

> Based on [Vitest Guide: Writing Tests with AI](https://vitest.dev/guide/learn/writing-tests-with-ai.html)

---

## 1. Providing context

### What the AI needs to write tests

- **The source file** — full code of the function under test, with types and imports
- **Existing project tests** — so the AI follows project conventions (`it` vs `test`, `describe` structure, naming style)
- **Vitest config** — `vitest.config.ts` (globals, environment, setupFiles)
- **Dependency types** — mock signatures, interfaces

### This project's conventions

```typescript
// Use it(), not test()
describe('functionName', () => {
  it('does something specific', () => {
    // Arrange -> Act -> Assert
  })
})

// Imports without .ts extensions
import { foo } from '@/helpers/foo'

// Mocks live in a separate file
import { mockItems } from '@/mocks/topics'

// Type the result
const result: TopicCategory = buildCategory(slug, meta, items)
```

---

## 2. Writing good prompts

### ❌ Bad prompt

```md
Write tests for useTopics
```

### ✅ Good prompt

```md
Write tests for the buildCategory function from helpers/useTopics.ts.
Cover the happy path with full data and the edge case with empty meta.
Use mockTopicItems from @/mocks/topics for items.
```

### Tips

| Tip | Example |
|-------|--------|
| Ask for edge cases explicitly | "Include tests for empty arrays, undefined, boundary values" |
| Specify the structure | "Group tests by function using describe blocks" |
| Reference existing tests | "Follow the style of tests/useTopics.test.ts" |
| Say what NOT to do | "Don't mock modules, test the real implementation" |
| Use short names | `"returns empty array"` instead of `"should correctly return an empty array when given no items"` |

---

## 3. Test pattern (Arrange -> Act -> Assert)

```typescript
it('build TopicCategory from slug and metadata', () => {
  // Arrange — prepare the data
  const slug = 'js-core'
  const meta = { title: 'JavaScript Core', icon: '🟨', order: 1 }
  const items: TopicItem[] = mockItems

  // Act — call the function
  const result: TopicCategory = buildCategory(slug, meta, items)

  // Assert — check the result
  expect(result.slug).toBe('js-core')
  expect(result.title).toBe('JavaScript Core')
  expect(result.items).toHaveLength(2)
})
```

---

## 4. Typing in tests

```typescript
// ✅ Type the result
const result: TopicCategory = buildCategory(slug, meta, items)

// ✅ For arrays — pull elements into variables
const first = result[0]
expect(first.path).toBe('/js-core/bind')

// ✅ For optional fields — check existence first
expect(first.meta).toBeDefined()
expect(first.meta!.category).toBe('js-core')
```

---

## 5. Data mocks

### Structure

```md
frontend/mocks/
  topics.ts       — mockTopicItems, mockTopicCategories (data for unit tests)
  handlers.ts     — MSW API handlers (auth, progress)
  browser.ts      — MSW worker for dev mode
  server.ts       — MSW server for tests
```

### Principles

- Mocks must match the types (`TopicItem`, `TopicCategory`)
- All required fields must be filled
- Use realistic data

---

## 6. Common pitfalls

| Mistake | Fix |
|--------|---------|
| `jest.fn()` instead of `vi.fn()` | Use the Vitest API, not Jest |
| `import { it } from 'vitest'` with `globals: true` | Don't import when globals are enabled |
| Mocks not cleaned up | Enable `restoreMocks: true` in the config |
| Long test names | Short, behavior-describing names |
| `vitest` instead of `vitest run` in CI | Use `vitest run` for a single pass |
| `result[0].prop` without a check | `expect(result).toHaveLength(N)` first |

---

## 7. Reviewing AI-generated tests

### Checklist

- [ ] **Do the tests run?** — always run `pnpm run test:run` before committing
- [ ] **Do they test behavior, not implementation?** — don't assert internal calls
- [ ] **Are edge cases covered?** — empty data, undefined, boundary values
- [ ] **Are assertions meaningful?** — not `expect(x).toBeDefined()`, but concrete values
- [ ] **No mock leaks?** — `vi.mock` doesn't break other tests

---

## 8. Iteration workflow

1. Generate initial tests with a specific prompt
2. Run them immediately — catch errors early
3. Check every test against the checklist
4. Ask to rewrite problematic sections
5. Hand-edit the small stuff

---

## 9. Running tests

```bash
# Watch mode
pnpm run test

# Single pass (same as CI)
pnpm run test:run

# A specific file
pnpm vitest run --config frontend/vitest.config.ts frontend/tests/useTopics.test.ts

# E2E (Playwright; port 5173 is sometimes taken — see playwright.config.ts)
pnpm run test:e2e
```

---

## 10. Current test map

| Where | What it covers |
|---|---|
| `frontend/tests/` | Topic catalog logic (`useTopics`), toasts (`useToast`) |
| `frontend/api/__tests__/api.test.ts` | API client via MSW (progress, auth, errors) |
| `frontend/stores/__tests__/` | Pinia stores: progress (XP, levels, persistence) + progress-sync (queue, MSW) |
| `frontend/components/ui/__tests__/` | UI kit (UiButton, UiProgressBar, UiSkeleton) |
| `frontend/e2e/` | Playwright: home, topic, progress, i18n, auth (partially skipped until full OAuth) |
| `backend/tests/` | pytest: JWT, auth endpoints, OAuth callbacks (mocked providers), progress |

Backend tests run from `backend/`: `.venv/bin/python -m pytest tests/ -q`
(in-memory SQLite, real providers are never called).
