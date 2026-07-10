# План миграции: Vue 3 SPA → Nuxt 4

> Обновлено 2026-07-10. Исходная версия этого плана предполагала порядок
> «Nuxt → бэкенд → интеграция», но проект пошёл другим путём: бэкенд (FastAPI),
> авторизация, синхронизация прогресса, CI/CD и прод-деплой уже реализованы
> в текущей Vue 3 SPA. Осталась только сама миграция на Nuxt — этот документ
> описывает достижимый путь для неё.

## Что уже сделано (вне этого плана)

| Было в старом плане | Статус | Где |
|---|---|---|
| Фаза 2: FastAPI бэкенд | ✅ в проде (Railway) | `backend/`, `plan-backend.md` |
| Фаза 3: интеграция фронт+бэк | ✅ | `api/client.ts`, stores, offline-очередь |
| Фаза 3.3: аутентификация | ✅ (Google OAuth в проде) | `AUTH.md` |
| Фаза 4.1: профиль | ✅ | `pages/ProfilePage.vue` |
| Фаза 4.2: skeletons, ошибки | ✅ | `UiSkeleton`, `PageSkeleton`, toasts |
| Фаза 4.4: CI/CD | ✅ | `ci.yml`, `backend-ci.yml`, `deploy.yml` (Pages) |

---

## Вектор: зачем и куда мигрируем

**Цели миграции** (в порядке важности):

1. **SEO для страниц топиков** — сейчас SPA отдаёт пустой HTML; пререндер
   даст поисковикам контент. Для учебной платформы это основной трафик.
2. **DX Nuxt** — file-based routing, layouts, auto-imports вместо ручного
   `router.ts` и glob-магии в `useTopics`.
3. **Изучение Nuxt** — проект в том числе учебный.

**Ключевое ограничение — хостинг.** Прод-фронтенд живёт на GitHub Pages
(статика), бэкенд + Postgres занимают free tier Railway (~1GB). Полноценный
SSR требует Node-сервер, которого бесплатно нет. Поэтому:

```
Достижимый путь:   SPA (Vue) → Nuxt SPA-режим → Nuxt SSG (nuxt generate)
                                                  └─ остаётся статикой,
                                                     деплой на Pages не меняется

Отложено:          Nuxt SSR/hybrid (routeRules с ssr:true на сервере)
                   └─ только если появится Node-хостинг (NuxtHub /
                      Cloudflare Workers / платный Railway)
```

SSG закрывает цель №1 (SEO): публичные страницы (главная, топики)
пререндерятся при сборке, а всё интерактивное (прогресс, профиль, авторизация)
гидратируется на клиенте — как сейчас. Контент топиков статичен по своей
природе, поэтому SSG здесь эквивалентен SSR без затрат на сервер.

**Версия Nuxt: 4.x** (стабильна с 2025; старая рекомендация «оставаться на
3.12» устарела). Модули: `@pinia/nuxt`, `@nuxtjs/i18n` v10+, `@nuxt/test-utils`.

---

## Фаза 0: Подготовка (~1 день)

- [ ] Все чеки зелёные: `pnpm run lint && pnpm run typecheck && pnpm run test:run && pnpm run build`
- [ ] Прогнать e2e: `pnpm run test:e2e` — это регрессионная сетка миграции
- [ ] Зафиксировать состояние: `git tag v1.0.0-spa`
- [ ] Миграцию вести в долгоживущей ветке `feat/nuxt-migration`, мержить в main
      только когда e2e проходят против Nuxt-сборки

## Фаза 1: Nuxt-скелет в SPA-режиме (~2-4 дня)

Цель фазы: приложение работает на Nuxt с `ssr: false` — поведение идентично
текущему, меняется только каркас. Никакого SSR-кода на этом шаге.

- [ ] `pnpm add nuxt@^4 @pinia/nuxt @nuxtjs/i18n && pnpm add -D @nuxt/test-utils`
- [ ] `nuxt.config.ts`: `ssr: false`, alias `@/` → `frontend/`, SCSS через
      `css` + `vite.css.preprocessorOptions` (variables/mixins в additionalData)
- [ ] `App.vue` → `app.vue` + `layouts/default.vue` (sidebar, header, footer, модалки)
- [ ] `pages/index.vue` (HomePage), `pages/profile.vue`, `pages/auth/callback.vue`
- [ ] Топики: `pages/[category]/[module].vue` — динамический роут поверх
      существующего `useTopics` (glob-каталог оставить, он источник данных)
- [ ] Удалить `router.ts`; guard из `useAuthGuard` → `middleware/auth.global.ts`
- [ ] `main.ts` → `plugins/` (Pinia persistedstate, MSW для dev)
- [ ] Проверка: `nuxt dev` + все e2e зелёные

## Фаза 2: i18n, stores, API (~2-3 дня)

- [ ] `@nuxtjs/i18n`: locales en/ru, `defineI18nConfig`, сохранить ключи как есть
      (компоненты используют `useI18n().t()` — совместимо)
- [ ] Stores без изменений (`@pinia/nuxt` + persistedstate); убрать ручную регистрацию
- [ ] `api/client.ts`: оставить как есть ИЛИ перевести на `$fetch` — решить по факту;
      обязательного требования нет, 401-interceptor и token должны сохраниться
- [ ] `VITE_API_URL` → `runtimeConfig.public.apiBase` (env `NUXT_PUBLIC_API_BASE`)
- [ ] Проверка: dev против локального бэкенда (`pnpm run dev-wait`), логин через
      dev-login, синк прогресса

## Фаза 3: Тесты (~1-2 дня)

- [ ] `vitest.config.ts` → `defineVitestConfig` из `@nuxt/test-utils/config`
- [ ] Все unit-тесты проходят (auto-imports могут потребовать правок импортов)
- [ ] e2e: обновить селекторы, если разметка layout изменилась; все зелёные

## Фаза 4: SSG и деплой (~1-2 дня)

- [ ] `ssr: true` + `nitro.prerender` / `routeRules` с `prerender: true` для
      `/` и всех `/{category}/{module}` (список маршрутов генерировать из каталога топиков)
- [ ] Страницы с клиентским состоянием: `/profile`, `/auth/callback` — `ssr: false`
- [ ] Guard на SSR-безопасность: доступ к `localStorage`/`window` только в
      `onMounted` / `import.meta.client` (stores персистентности!)
- [ ] `nuxt generate` → `deploy.yml`: заменить `vite build` на generate,
      публиковать `.output/public` на Pages (404.html fallback сохранить)
- [ ] Проверить SEO: `curl` страницы топика отдаёт контент в HTML
- [ ] `git tag v2.0.0-nuxt`

## Фаза 5 (отложено): настоящий SSR

Не планируется, пока хостинг статический. Триггер для возврата к этой фазе —
переезд фронтенда на Node-хостинг. Тогда: `routeRules` (`/` и топики — SSR,
кабинет — SPA), серверный прокси `/api/**` → FastAPI, cookie-auth вместо
localStorage. Паттерны — в `ARCHITECTURE-EXAMPLE.md`.

---

## Риски

| Риск | Вероятность | Митигция |
|---|---|---|
| `import.meta.glob` топиков не заведётся в Nuxt как есть | Средняя | Фаза 1: каталог остаётся во Vite-плагине Nuxt; в крайнем случае — генерация списка скриптом (как `backend/scripts/gen_catalog.py`) |
| persistedstate/localStorage ломает SSG-пререндер | Высокая | `ssr: false` для страниц с состоянием; обращения к window только на клиенте |
| e2e завязаны на текущую разметку | Низкая | Разметка переносится как есть; чинить селекторы по факту |
| Миграция затянется и заблокирует фичи | Средняя | Ветка `feat/nuxt-migration`; main живёт своей жизнью; фазы 1-4 мержатся одним PR только целиком зелёными |

## Критерий готовности

Миграция завершена, когда: все unit + e2e зелёные против Nuxt-сборки,
`curl https://study.faustze.tech/js-core/bind` отдаёт HTML с контентом топика,
логин/прогресс/оффлайн-очередь работают как до миграции.

## Связанные документы

- [plan-frontend.md](plan-frontend.md) — план текущей SPA (закрыт)
- [plan-backend.md](plan-backend.md) — план бэкенда (закрыт, кроме Twitch/Discord)
- [ARCHITECTURE-EXAMPLE.md](ARCHITECTURE-EXAMPLE.md) — референс Nuxt+FastAPI и сравнение с текущей архитектурой
- [AUTH.md](AUTH.md) — устройство авторизации
