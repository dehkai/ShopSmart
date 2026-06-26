'use client'

import { useEffect, useState } from 'react'

export function useIsMobile(breakpoint = 1024) {
  // Initialize with false to prevent SSR hydration mismatch
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    
    // Set initial value on client mount
    setIsMobile(mql.matches)

    const onChange = () => {
      setIsMobile(mql.matches)
    }

    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [breakpoint])

  return isMobile
}
