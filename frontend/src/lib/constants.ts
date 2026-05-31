export const MALAYSIAN_STATES = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Perak',
  'Perlis',
  'Pulau Pinang',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
  'W.P. Kuala Lumpur',
  'W.P. Labuan',
  'W.P. Putrajaya',
] as const

export type MalaysianState = (typeof MALAYSIAN_STATES)[number]

export const CONFIDENCE_THRESHOLD_HIGH = 0.8
export const CONFIDENCE_THRESHOLD_MID = 0.5

export const BACKEND_TIMEOUT_MS = 30_000
