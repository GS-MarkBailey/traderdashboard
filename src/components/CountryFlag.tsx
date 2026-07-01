import { getCountryFlagUrl, type CountryCode } from '../lib/countryFlags'

interface CountryFlagProps {
  countryCode: CountryCode
  className?: string
}

export function CountryFlag({
  countryCode,
  className = 'h-3 w-4 shrink-0 rounded-[2px] object-cover',
}: CountryFlagProps) {
  const src = getCountryFlagUrl(countryCode, 40)
  const srcSet = [
    `${getCountryFlagUrl(countryCode, 20)} 1x`,
    `${getCountryFlagUrl(countryCode, 40)} 2x`,
    `${getCountryFlagUrl(countryCode, 80)} 3x`,
  ].join(', ')

  return (
    <img
      src={src}
      srcSet={srcSet}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className={className}
    />
  )
}
