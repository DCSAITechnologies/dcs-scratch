// The hosted preview build (VITE_LOGO_BUNDLE=1) cannot serve 1,000+ logo files, so the logos
// travel as one JSON map of data URIs (scripts/build-preview-artifact.mjs), loaded before render.
const BUNDLE = import.meta.env.VITE_LOGO_BUNDLE === '1'
let map: Record<string, string> = {}

export async function loadLogoBundle() {
  if (!BUNDLE) return
  try {
    map = await (await fetch('./logos.json')).json()
  } catch {
    // no bundle: every connector falls back to its monogram
  }
}

export const logoUrl = (src: string) => (BUNDLE ? map[src] ?? '' : src)
