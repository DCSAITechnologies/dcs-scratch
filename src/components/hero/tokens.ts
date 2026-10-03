// Light-theme tokens and derived numbers shared by the hero concepts and the
// light homepage demo (/preview/*). Every number comes from the catalogue at build time.
import { TOTAL_CATALOGUED, FEATURED, FEATURED_ROWS } from 'virtual:catalogue-summary'

export const C = {
  bg: '#F5F6F8', surface: '#FFFFFF', ink: '#0B1220', ink2: '#2B3446', muted: '#566074',
  line: '#E3E7EE', line2: '#D2D8E2', silver: '#5E6779', blue: '#2850D8', blueSoft: '#EDF2FF', blueLine: '#B9C9F6',
}
/** "1,000+" — the catalogue total rounded down to the hundred. */
export const SCALE = `${(Math.floor(TOTAL_CATALOGUED / 100) * 100).toLocaleString('en-US')}+`
export const NODES = FEATURED.heroNodes.map((id) => FEATURED_ROWS[id])
