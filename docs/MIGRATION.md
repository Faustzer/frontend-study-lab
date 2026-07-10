# Migration Plan: Vue 3 SPA → Nuxt 4

> Updated 2026-07-10. The original version of this plan assumed the order
> "Nuxt → backend → integration", but the project went the other way: the
> backend (FastAPI), authentication, progress sync, CI/CD, and production
> deploy are already implemented in the current Vue 3 SPA. Only the Nuxt
> migration itself remains — this document describes an achievable path for it.

## Already done (outside this plan)

| Old plan item | Status | Where |
|---|---|---|
| Phase 2: FastAPI backend | ✅ in prod (Railway) | `backend/`, `plan-backend.md` |
| Phase 3: frontend+backend integration | ✅ | `api/client.ts`, stores, offline queue |
| Phase 3.3: authentication | ✅ (Google OAuth in prod) | `AUTH.md` |
| Phase 4.1: user profile | ✅ | `pages/ProfilePage.vue` |
| Phase 4.2: skeletons, error handling | ✅ | `UiSkeleton`, `PageSkeleton`, toasts |
| Phase 4.4: CI/CD | ✅ | `ci.yml`, `backend-ci.yml`, `deploy.yml` (Pages) |

---

## Vector: why and where we are migrating

**Migration goals** (in order of importance):

1. **SEO for topic pages** — the SPA currently serves empty HTML; prerendering
   gives search engines real content. For a learning platform this is the main
   traffic source.
2. **Nuxt DX** — file-based routing, layouts, and auto-imports instead of the
   hand-written `router.ts` and glob magic in `useTopics`.
3. **Learning Nuxt** — the project is educational by nature.

**The key constraint is hosting.** The production frontend lives on GitHub
Pages (static), and the backend + Postgres occupy the Railway free tier (~1GB).
Full SSR requires a Node server, which we don't have for free. Therefore:

```
Achievable path:   SPA (Vue) → Nuxt SPA mode → Nuxt SSG (nuxt generate)
                                                └─ stays static,
                                                   Pages deploy unchanged

Deferred:          Nuxt SSR/hybrid (routeRules with ssr:true on a server)
                   └─ only if Node hosting appears (NuxtHub /
                      Cloudflare Workers / paid Railway)
```

SSG covers goal #1 (SEO): public pages (home, topics) are prerendered at build
time, while everything interactive (progress, profile, auth) hydrates on the
client — same as today. Topic content is inherently static, so SSG here is
equivalent to SSR without paying for a server.

**Nuxt version: 4.x** (stable since 2025; the old "stay on 3.12" advice is
outdated). Modules: `@pinia/nuxt`, `@nuxtjs/i18n` v10+, `@nuxt/test-utils`.

---

## Phase 0: Preparation (~1 day)

- [ ] All checks green: `pnpm run lint && pnpm run typecheck && pnpm run test:run && pnpm run build`
- [ ] Run e2e: `pnpm run test:e2e` — this is the migration's regression net
- [ ] Snapshot the state: `git tag v1.0.0-spa`
- [ ] Do the migration in a long-lived `feat/nuxt-migration` branch; merge to
      main only when e2e passes against the Nuxt build

## Phase 1: Nuxt skeleton in SPA mode (~2-4 days)

Goal: the app runs on Nuxt with `ssr: false` — behavior identical to today,
only the scaffolding changes. No SSR code at this step.

- [ ] `pnpm add nuxt@^4 @pinia/nuxt @nuxtjs/i18n && pnpm add -D @nuxt/test-utils`
- [ ] `nuxt.config.ts`: `ssr: false`, alias `@/` → `frontend/`, SCSS via
      `css` + `vite.css.preprocessorOptions` (variables/mixins in additionalData)
- [ ] `App.vue` → `app.vue` + `layouts/default.vue` (sidebar, header, footer, modals)
- [ ] `pages/index.vue` (HomePage), `pages/profile.vue`, `pages/auth/callback.vue`
- [ ] Topics: `pages/[category]/[module].vue` — dynamic route on top of the
      existing `useTopics` (keep the glob catalog, it is the data source)
- [ ] Delete `router.ts`; move the `useAuthGuard` guard to `middleware/auth.global.ts`
- [ ] `main.ts` → `plugins/` (Pinia persistedstate, MSW for dev)
- [ ] Verify: `nuxt dev` + all e2e green

## Phase 2: i18n, stores, API (~2-3 days)

- [ ] `@nuxtjs/i18n`: en/ru locales, `defineI18nConfig`, keep keys as-is
      (components use `useI18n().t()` — compatible)
- [ ] Stores unchanged (`@pinia/nuxt` + persistedstate); drop manual registration
- [ ] `api/client.ts`: keep as-is OR move to `$fetch` — decide on the spot;
      no hard requirement, the 401 interceptor and token handling must survive
- [ ] `VITE_API_URL` → `runtimeConfig.public.apiBase` (env `NUXT_PUBLIC_API_BASE`)
- [ ] Verify: dev against the local backend (`pnpm run dev-wait`), log in via
      dev-login, progress sync works

## Phase 3: Tests (~1-2 days)

- [ ] `vitest.config.ts` → `defineVitestConfig` from `@nuxt/test-utils/config`
- [ ] All unit tests pass (auto-imports may require import fixes)
- [ ] e2e: update selectors if the layout markup changed; all green

## Phase 4: SSG and deploy (~1-2 days)

- [ ] `ssr: true` + `nitro.prerender` / `routeRules` with `prerender: true` for
      `/` and every `/{category}/{module}` (generate the route list from the topic catalog)
- [ ] Pages with client state: `/profile`, `/auth/callback` — `ssr: false`
- [ ] SSR-safety guard: access `localStorage`/`window` only in
      `onMounted` / `import.meta.client` (store persistence!)
- [ ] `nuxt generate` → `deploy.yml`: replace `vite build` with generate,
      publish `.output/public` to Pages (keep the 404.html fallback)
- [ ] Verify SEO: `curl` of a topic page returns content in the HTML
- [ ] `git tag v2.0.0-nuxt`

## Phase 5 (deferred): real SSR

Not planned while hosting is static. The trigger to revisit this phase is
moving the frontend to Node hosting. Then: `routeRules` (`/` and topics — SSR,
profile — SPA), a server proxy `/api/**` → FastAPI, cookie auth instead of
localStorage. Patterns are in `ARCHITECTURE-EXAMPLE.md`.

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Topic `import.meta.glob` doesn't work in Nuxt as-is | Medium | Phase 1: the catalog stays in Nuxt's Vite layer; worst case — generate the list with a script (like `backend/scripts/gen_catalog.py`) |
| persistedstate/localStorage breaks SSG prerender | High | `ssr: false` for stateful pages; touch window only on the client |
| e2e is coupled to current markup | Low | Markup is ported as-is; fix selectors as needed |
| Migration drags on and blocks features | Medium | `feat/nuxt-migration` branch; main lives its own life; phases 1-4 merge as one PR only when fully green |

## Definition of done

The migration is complete when: all unit + e2e tests are green against the
Nuxt build, `curl https://study.faustze.tech/js-core/bind` returns HTML with
topic content, and login/progress/offline queue work exactly as before.

## Related documents

- [plan-frontend.md](plan-frontend.md) — current SPA plan (closed)
- [plan-backend.md](plan-backend.md) — backend plan (closed except Twitch/Discord)
- [ARCHITECTURE-EXAMPLE.md](ARCHITECTURE-EXAMPLE.md) — Nuxt+FastAPI reference and comparison with the current architecture
- [AUTH.md](AUTH.md) — how authentication works
