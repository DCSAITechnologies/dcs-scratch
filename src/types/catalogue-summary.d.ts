declare module 'virtual:catalogue-summary' {
  export type FeaturedRow = { id: string; n: string; p: string; cat: string; s: string; auth: string; logo: string; d: string; r: number | null; caps: string[] }
  export const TOTAL_CATALOGUED: number
  export const PUBLISHED_COUNT: number
  export const UNPUBLISHED_COUNT: number
  export const RUNTIME_VERIFIED_COUNT: number
  export const LEGACY_REFERENCE_COUNT: number
  export const CATEGORY_COUNTS: { cat: string; published: number; held: number }[]
  export const FEATURED_ROWS: Record<string, FeaturedRow>
  export const POPULAR_STRIP: { id: string; n: string; logo: string | null; ref: boolean }[]
  export const FEATURED: { homeStrip: string[]; homePreview: string[]; navPopular: string[]; enterpriseLogos: string[]; heroNodes: string[] }
}
