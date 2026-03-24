import { useRef, useEffect } from 'react'

export default function PickleballScene() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let cleanup: (() => void) | undefined
    let cancelled = false

    import('./createScene').then(({ createScene }) => {
      if (cancelled || !containerRef.current) return
      const { dispose } = createScene(containerRef.current)
      cleanup = dispose
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ height: 'clamp(350px, 50vw, 600px)' }}
    />
  )
}
