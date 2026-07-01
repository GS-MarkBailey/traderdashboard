/** Sporticon slug — PNG basename in public/sports/ (Apache 2.0, ookamiinc/Sporticon). */
export type SportIconSlug = string

export function getSportIconUrl(iconSlug: SportIconSlug): string {
  return `/sports/${iconSlug}.png`
}
