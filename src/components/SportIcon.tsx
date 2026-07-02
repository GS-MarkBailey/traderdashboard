import { getSportIconUrl, type SportIconSlug } from '../lib/sportIcons'

interface SportIconProps {
  iconSlug: SportIconSlug
  className?: string
}

export function SportIcon({
  iconSlug,
  className = 'h-3 w-3 shrink-0 object-contain',
}: SportIconProps) {
  return (
    <img
      src={getSportIconUrl(iconSlug)}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className={`${className} brightness-0 dark:invert`}
    />
  )
}
