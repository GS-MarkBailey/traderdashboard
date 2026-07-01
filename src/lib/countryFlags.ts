/** ISO 3166-1 alpha-2 (or flagcdn subdivision code, e.g. gb-eng). */
export type CountryCode = string

const FLAG_CDN_BASE = 'https://flagcdn.com'

/** Build a flag image URL from an ISO / flagcdn country code. */
export function getCountryFlagUrl(countryCode: CountryCode, width = 40): string {
  return `${FLAG_CDN_BASE}/w${width}/${countryCode.toLowerCase()}.png`
}
