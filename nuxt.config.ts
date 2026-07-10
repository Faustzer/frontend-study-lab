export default defineNuxtConfig({
  // Phase 1 of docs/MIGRATION.md: SPA mode only — behavior identical to the
  // previous Vite SPA. SSG (ssr: true + prerender) comes in Phase 4.
  ssr: false,

  compatibilityDate: '2026-07-10',

  srcDir: 'frontend/',

  dir: {
    public: 'frontend/public',
  },

  modules: ['@pinia/nuxt'],

  css: ['@/assets/scss/index.scss'],

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  devtools: { enabled: true },

  typescript: {
    tsConfig: {
      compilerOptions: {
        // Match the old tsconfig.app.json; tightening this is a separate task
        noUncheckedIndexedAccess: false,
      },
      // Unit/e2e specs were excluded from the old vue-tsc run as well;
      // they are typechecked by their own tooling (Phase 3)
      exclude: [
        '../frontend/tests/**',
        '../frontend/**/__tests__/**',
        '../frontend/e2e/**',
        '../frontend/test/**',
      ],
    },
  },
})
