import { useEffect } from 'react'

/** Clear hover state when the user scrolls — mouseleave often never fires. */
export function useClearOnScroll(clear: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return

    window.addEventListener('scroll', clear, true)
    window.addEventListener('blur', clear)

    return () => {
      window.removeEventListener('scroll', clear, true)
      window.removeEventListener('blur', clear)
    }
  }, [clear, active])
}
