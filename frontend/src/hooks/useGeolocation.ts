'use client'

import { useCallback, useEffect, useState } from 'react'

export type GeolocationStatus =
  | 'idle'
  | 'prompt'
  | 'granted'
  | 'denied'
  | 'loading'
  | 'error'
  | 'unsupported'

export interface Coordinates {
  lat: number
  lng: number
  accuracy: number
}

interface UseGeolocationResult {
  status: GeolocationStatus
  coords: Coordinates | null
  error: string | null
  request: () => void
}

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
}

// Reads current permission state on mount WITHOUT triggering the browser
// prompt, so callers can render the right UI (CTA vs. denied hint) before
// the user ever clicks anything.
export function useGeolocation(): UseGeolocationResult {
  const [status, setStatus] = useState<GeolocationStatus>('idle')
  const [coords, setCoords] = useState<Coordinates | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setStatus('unsupported')
      return
    }

    if (!navigator.permissions?.query) {
      // Permissions API unsupported for 'geolocation' (e.g. Safari) —
      // fall back to a contextual prompt on explicit user action.
      setStatus('prompt')
      return
    }

    let cancelled = false
    let permissionStatus: PermissionStatus | undefined

    const handleChange = () => {
      if (permissionStatus) setStatus(permissionStatus.state as GeolocationStatus)
    }

    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((result) => {
        if (cancelled) return
        permissionStatus = result
        setStatus(result.state as GeolocationStatus)
        result.addEventListener('change', handleChange)
      })
      .catch(() => {
        if (!cancelled) setStatus('prompt')
      })

    return () => {
      cancelled = true
      permissionStatus?.removeEventListener('change', handleChange)
    }
  }, [])

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setStatus('unsupported')
      return
    }

    setStatus('loading')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
        setStatus('granted')
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied')
          setError('Location permission denied.')
        } else if (err.code === err.TIMEOUT) {
          setStatus('error')
          setError("Couldn't get your location in time.")
        } else {
          setStatus('error')
          setError('Location unavailable.')
        }
      },
      GEOLOCATION_OPTIONS
    )
  }, [])

  return { status, coords, error, request }
}
