// Start the MSW worker in dev before the app makes any requests,
// same as the old bootstrap() in main.ts.
export default defineNuxtPlugin(async () => {
  if (!import.meta.dev)
    return

  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
})
