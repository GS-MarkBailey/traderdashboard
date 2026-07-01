interface CompetitionLogoProps {
  logoUrl: string
  className?: string
}

export function CompetitionLogo({
  logoUrl,
  className = 'h-3 w-3 shrink-0 object-contain',
}: CompetitionLogoProps) {
  return (
    <img
      src={logoUrl}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className={className}
    />
  )
}
