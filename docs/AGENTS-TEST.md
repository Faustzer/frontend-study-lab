# AGENTS-Test.md — Гайд по написанию тестов с AI

> Основано на [Vitest Guide: Writing Tests with AI](https://vitest.dev/guide/learn/writing-tests-with-ai.html)

---

## 1. Предоставление контекста

### Что нужно дать AI для написания тестов

- **Исходный файл** — полный код тестируемой функции с типами и импортами
- **Существующие тесты проекта** — чтобы AI следовал конвенциям проекта (`it` vs `test`, структура `describe`, стиль именования)
- **Конфиг Vitest** — `vitest.config.ts` (globals, environment, setupFiles)
- **Типы зависимостей** — сигнатуры моков, интерфейсы

### Конвенции этого проекта

```typescript
// Используем it(), не test()
describe('functionName', () => {
  it('does something specific', () => {
    // Arrange -> Act -> Assert
  })
})

// Импорты без расширений .ts
import { foo } from '@/helpers/foo'

// Моки в отдельном файле
import { mockItems } from '@/mocks/topics'

// Типизация результата
const result: TopicCategory = buildCategory(slug, meta, items)
```

---

## 2. Написание хороших промптов

### ❌ Плохой промпт

```md
Напиши тесты для useTopics
```

### ✅ Хороший промпт

```md
Напиши тесты для функции buildCategory из helpers/useTopics.ts.
Проверь happy path с полными данными и edge case с пустым meta.
Используй mockTopicItems из @/mocks/topics для items.
```

### Советы

| Совет | Пример |
|-------|--------|
| Проси edge cases явно | "Включи тесты для пустых массивов, undefined, граничных значений" |
| Указывай структуру | "Группируй тесты по функциям через describe блоки" |
| Ссылайся на существующие тесты | "Следуй стилю из tests/useTopics.test.ts" |
| Говори что НЕ делать | "Не мокируй модули, тестируй реальную реализацию" |
| Используй короткие имена | `"returns empty array"` вместо `"should correctly return an empty array when given no items"` |

---

## 3. Паттерн теста (Arrange -> Act -> Assert)

```typescript
it('build TopicCategory from slug and metadata', () => {
  // Arrange — подготовка данных
  const slug = 'js-core'
  const meta = { title: 'JavaScript Core', icon: '🟨', order: 1 }
  const items: TopicItem[] = mockItems

  // Act — вызов функции
  const result: TopicCategory = buildCategory(slug, meta, items)

  // Assert — проверка результата
  expect(result.slug).toBe('js-core')
  expect(result.title).toBe('JavaScript Core')
  expect(result.items).toHaveLength(2)
})
```

---

## 4. Типизация в тестах

```typescript
// ✅ Указывай тип результата
const result: TopicCategory = buildCategory(slug, meta, items)

// ✅ Для массивов — выноси элементы в переменные
const first = result[0]
expect(first.path).toBe('/js-core/bind')

// ✅ Для опциональных полей — проверяй существование
expect(first.meta).toBeDefined()
expect(first.meta!.category).toBe('js-core')
```

---

## 5. Моки данных

### Структура

```md
frontend/mocks/
  topics.ts       — mockTopicItems, mockTopicCategories
```

### Принципы

- Моки должны соответствовать типам (`TopicItem`, `TopicCategory`)
- Все обязательные поля должны быть заполнены
- Используй реалистичные данные

---

## 6. Типичные ошибки (Common Pitfalls)

| Ошибка | Решение |
|--------|---------|
| `jest.fn()` вместо `vi.fn()` | Используй Vitest API, не Jest |
| `import { it } from 'vitest'` при `globals: true` | Не импортируй, если globals включены |
| Моки не очищаются | Включи `restoreMocks: true` в конфиге |
| Длинные имена тестов | Короткие, описывающие поведение |
| `vitest` вместо `vitest run` в CI | Используй `vitest run` для однократного запуска |
| `result[0].prop` без проверки | Сначала `expect(result).toHaveLength(N)` |

---

## 7. Ревью AI-сгенерированных тестов

### Чек-лист

- [ ] **Тесты запускаются?** — всегда запускай `npm run test` перед коммитом
- [ ] **Проверяют поведение, а не реализацию?** — не тестируй внутренние вызовы
- [ ] **Есть edge cases?** — пустые данные, undefined, граничные значения
- [ ] **Утверждения осмысленные?** — не `expect(x).toBeDefined()`, а конкретные значения
- [ ] **Нет утечек моков?** — `vi.mock` не ломает другие тесты

---

## 8. Workflow итераций

1. Генерируй начальные тесты с конкретным промптом
2. Запусти сразу — поймай ошибки
3. Проверь каждый тест по чек-листу
4. Попроси переписать проблемные секции
5. Отредактируй вручную мелкие правки

---

## 9. Запуск тестов

```bash
# Все тесты
npm run test

# Конкретный файл
npx vitest run frontend/tests/useTopics.test.ts

# С покрытием
npx vitest run --coverage
```
