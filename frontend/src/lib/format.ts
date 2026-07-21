/**
 * Human-readable distance. When `source` is 'driving' (real road-network
 * distance from OpenRouteService) the figure is shown plainly — it should
 * already track Google Maps' driving distance closely. Otherwise it's a
 * haversine (as-the-crow-flies) fallback, prefixed "~" so it isn't read as
 * a road-distance promise. Single source of truth for every result surface.
 */
export function formatDistance(
  km: number,
  source?: 'driving' | 'straight_line' | null
): string {
  const prefix = source === 'driving' ? '' : '~'
  if (km < 1) {
    return `${prefix}${Math.round(km * 1000)} m`
  }
  return `${prefix}${km.toFixed(1)} km`
}

interface MapsTarget {
  premise: string
  address?: string | null
  latitude?: number | null
  longitude?: number | null
}

/**
 * Google Maps deep link for a store. Prefers the exact stored coordinate
 * (the pin the distance was measured from) so the map the user opens matches
 * our distance, with the premise name attached as a marker label via Google's
 * `lat,lng(label)` query syntax — otherwise the pin shows raw coordinates
 * instead of the store name. Falls back to a name+address text search when
 * we have no coordinate. Single source of truth for every "Directions" link.
 */
export function storeMapsUrl(store: MapsTarget): string {
  const hasCoords = store.latitude != null && store.longitude != null
  const query = hasCoords
    ? `${store.latitude},${store.longitude}(${store.premise})`
    : store.address
      ? `${store.premise}, ${store.address}`
      : store.premise
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
