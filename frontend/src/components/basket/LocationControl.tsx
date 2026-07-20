'use client'

import { useEffect } from 'react'
import { MapPin, Loader2, RotateCcw, Navigation } from 'lucide-react'
import { useGeolocation, type Coordinates } from '@/hooks/useGeolocation'
import { StateSelector } from '@/components/basket/StateSelector'

type LocationMode = 'gps' | 'region'

interface LocationControlProps {
  mode: LocationMode
  onModeChange: (mode: LocationMode) => void
  selectedState: string
  onStateChange: (state: string) => void
  radiusKm: number
  onRadiusChange: (km: number) => void
  onLocationChange: (coords: Coordinates | null) => void
}

const RADIUS_OPTIONS = [5, 10, 25] as const

export function LocationControl({
  mode,
  onModeChange,
  selectedState,
  onStateChange,
  radiusKm,
  onRadiusChange,
  onLocationChange,
}: LocationControlProps) {
  const { status, coords, error, request } = useGeolocation()

  // Switching into "Near me" is an explicit user action — request once if we
  // haven't resolved a position yet (idle/prompt). Never auto-prompt on load.
  useEffect(() => {
    if (mode === 'gps' && (status === 'idle' || status === 'prompt')) {
      request()
    }
  }, [mode, status, request])

  // Propagate coords up only while GPS mode is the active, granted mode.
  useEffect(() => {
    onLocationChange(mode === 'gps' && status === 'granted' ? coords : null)
  }, [mode, status, coords, onLocationChange])

  return (
    <div className="flex flex-col gap-3">
      <label
        className="text-[10px] font-bold uppercase tracking-wider text-muted/60"
        style={{ letterSpacing: '0.1em' }}
      >
        Where are you shopping?
      </label>

      {/* Segmented mode toggle */}
      <div className="relative grid grid-cols-2 p-1 bg-overlay-sm border border-border rounded-xl">
        <div
          aria-hidden
          className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-surface-dim shadow-md transition-transform duration-200 motion-reduce:transition-none"
          style={{
            transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
            transform: mode === 'region' ? 'translateX(100%)' : 'translateX(0)',
          }}
        />
        <button
          type="button"
          onClick={() => onModeChange('gps')}
          className={`relative z-10 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors active:scale-[0.97] cursor-pointer ${
            mode === 'gps' ? 'text-fg' : 'text-subtle hover:text-fg'
          }`}
          aria-pressed={mode === 'gps'}
        >
          <MapPin className="w-3.5 h-3.5" />
          Near me
        </button>
        <button
          type="button"
          onClick={() => onModeChange('region')}
          className={`relative z-10 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors active:scale-[0.97] cursor-pointer ${
            mode === 'region' ? 'text-fg' : 'text-subtle hover:text-fg'
          }`}
          aria-pressed={mode === 'region'}
        >
          By state
        </button>
      </div>

      {/* Active mode content */}
      {mode === 'gps' ? (
        <GpsPanel
          status={status}
          coords={coords}
          error={error}
          request={request}
          radiusKm={radiusKm}
          onRadiusChange={onRadiusChange}
        />
      ) : (
        <div className="starting:opacity-0 starting:translate-y-1 opacity-100 translate-y-0 transition-[opacity,transform] duration-[180ms] ease-out motion-reduce:transition-none">
          <StateSelector value={selectedState} onChange={onStateChange} />
        </div>
      )}
    </div>
  )
}

interface GpsPanelProps {
  status: ReturnType<typeof useGeolocation>['status']
  coords: Coordinates | null
  error: string | null
  request: () => void
  radiusKm: number
  onRadiusChange: (km: number) => void
}

function GpsPanel({ status, coords, error, request, radiusKm, onRadiusChange }: GpsPanelProps) {
  if (status === 'unsupported') {
    return (
      <p className="text-xs text-subtle px-1">
        Location isn&apos;t supported on this device — switch to &quot;By state&quot; instead.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3 starting:opacity-0 starting:translate-y-1 opacity-100 translate-y-0 transition-[opacity,transform] duration-[180ms] ease-out motion-reduce:transition-none">
      {status === 'granted' && coords ? (
        <>
          <div className="flex items-center justify-between gap-3 w-full bg-overlay-sm border border-border rounded-xl px-4 py-3 shadow-md starting:opacity-0 starting:scale-[0.97] transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none">
            <span className="flex items-center gap-2 text-xs font-semibold text-fg">
              <Navigation className="w-4 h-4 text-primary" />
              Using your location
            </span>
            <button
              type="button"
              onClick={request}
              className="flex items-center gap-1 text-[11px] font-semibold text-subtle hover:text-fg transition-colors active:scale-[0.97] cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Refresh
            </button>
          </div>

          {/* Radius pills */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-subtle shrink-0">Within</span>
            <div className="flex gap-1.5">
              {RADIUS_OPTIONS.map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => onRadiusChange(km)}
                  aria-pressed={radiusKm === km}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-colors active:scale-[0.97] cursor-pointer ${
                    radiusKm === km
                      ? 'bg-primary/15 border-primary/40 text-primary'
                      : 'bg-overlay-sm border-border text-subtle hover:text-fg hover:border-border/60'
                  }`}
                >
                  {km} km
                </button>
              ))}
            </div>
          </div>
        </>
      ) : status === 'loading' ? (
        <div className="flex items-center justify-center gap-2 w-full bg-overlay-sm border border-border rounded-xl px-4 py-3 text-xs font-semibold text-fg shadow-md">
          <Loader2 className="w-4 h-4 animate-spin" />
          Finding you…
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={request}
            className="w-full flex items-center justify-center gap-2 bg-overlay-sm border border-border hover:bg-overlay-md hover:border-border/60 text-fg text-xs font-semibold rounded-xl px-4 py-3 outline-none cursor-pointer transition-colors active:scale-[0.97] shadow-md"
          >
            <MapPin className="w-4 h-4" />
            Use my location
          </button>
          {status === 'denied' && (
            <p className="text-xs text-subtle px-1">
              Location off — enable it in your browser settings, or switch to &quot;By state&quot;.
            </p>
          )}
          {status === 'error' && error && <p className="text-xs text-subtle px-1">{error}</p>}
        </>
      )}
    </div>
  )
}
