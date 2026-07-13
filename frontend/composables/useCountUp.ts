import { onMounted, onUnmounted, ref } from 'vue'

/**
 * Каунт-ап чисел при появлении экрана: ease-фактор растёт 0→1 за
 * ~900 мс по easeOutCubic. Значение стата = Math.round(target * ease).
 *
 * Обязателен fallback через setTimeout: если rAF неактивен (фоновая
 * вкладка, prerender), числа всё равно доводятся до финала.
 */
export function useCountUp(duration = 900) {
  const ease = ref(0)

  onMounted(() => {
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration)
      ease.value = 1 - (1 - t) ** 3
      if (t < 1)
        raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const fallback = setTimeout(() => {
      ease.value = 1
    }, duration + 200)

    onUnmounted(() => {
      cancelAnimationFrame(raf)
      clearTimeout(fallback)
    })
  })

  return { ease }
}
