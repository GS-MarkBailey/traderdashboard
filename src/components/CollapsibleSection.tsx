import { useState, type ReactNode } from 'react'
import { TABLE_HEADER_CLASS } from '../lib/tableTypography'

function SectionChevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={`h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform ${
        expanded ? 'rotate-90' : ''
      }`}
    >
      <path
        d="M6 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface CollapsibleSectionProps {
  title: string
  defaultExpanded?: boolean
  headerActions?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}

export function CollapsibleSection({
  title,
  defaultExpanded = true,
  headerActions,
  className = '',
  bodyClassName = '',
  children,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <section className={className}>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="-ml-1 flex min-w-0 items-center gap-1.5 rounded-md px-1 py-1 text-left hover:bg-gray-50"
        >
          <SectionChevron expanded={expanded} />
          <h2 className={`${TABLE_HEADER_CLASS} text-gray-900`}>{title}</h2>
        </button>

        {headerActions && expanded ? (
          <div className="flex shrink-0 items-center gap-2">{headerActions}</div>
        ) : null}
      </div>

      {expanded ? <div className={bodyClassName}>{children}</div> : null}
    </section>
  )
}
