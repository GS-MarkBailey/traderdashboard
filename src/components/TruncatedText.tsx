import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { useClearOnScroll } from '../hooks/useClearOnScroll'

interface TooltipAnchor {
  x: number
  y: number
}

function TruncatedTextPopover({
  text,
  anchor,
  placement,
}: {
  text: string
  anchor: TooltipAnchor
  placement: 'above' | 'below'
}) {
  const offset = 8

  return (
    <div
      className="pointer-events-none fixed z-[100] max-w-[min(20rem,calc(100vw-1rem))] -translate-x-1/2 rounded-lg border border-app-border bg-app-surface px-2.5 py-1.5 text-[11px] font-medium leading-snug text-app-text shadow-lg"
      style={
        placement === 'above'
          ? { left: anchor.x, top: anchor.y - offset, transform: 'translate(-50%, -100%)' }
          : { left: anchor.x, top: anchor.y + offset, transform: 'translateX(-50%)' }
      }
    >
      {text}
    </div>
  )
}

function resolveTooltipText(children: ReactNode, title?: string): string | null {
  if (title !== undefined && title !== '') return title
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children)
  }
  return null
}

function isElementTruncated(element: HTMLElement): boolean {
  return (
    element.scrollWidth > element.clientWidth + 1 ||
    element.scrollHeight > element.clientHeight + 1
  )
}

interface TruncatedTextProps {
  children: ReactNode
  title?: string
  className?: string
  as?: 'span' | 'p' | 'div' | 'h3' | 'h4'
  placement?: 'above' | 'below'
}

export function TruncatedText({
  children,
  title,
  className = '',
  as: Tag = 'span',
  placement = 'below',
}: TruncatedTextProps) {
  const spanRef = useRef<HTMLSpanElement>(null)
  const paragraphRef = useRef<HTMLParagraphElement>(null)
  const divRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const subheadingRef = useRef<HTMLHeadingElement>(null)

  const ref =
    Tag === 'p'
      ? paragraphRef
      : Tag === 'div'
        ? divRef
        : Tag === 'h4'
          ? headingRef
          : Tag === 'h3'
            ? subheadingRef
            : spanRef

  const tooltipText = resolveTooltipText(children, title)
  const [anchor, setAnchor] = useState<TooltipAnchor | null>(null)

  const checkTruncation = useCallback(() => {
    const element = ref.current
    if (!element) return false
    return isElementTruncated(element)
  }, [ref])

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver(() => {
      if (!anchor) return
      if (!checkTruncation()) setAnchor(null)
    })

    observer.observe(element)
    if (element.parentElement) {
      observer.observe(element.parentElement)
    }

    return () => observer.disconnect()
  }, [anchor, checkTruncation, children, ref, tooltipText])

  const clearAnchor = useCallback(() => setAnchor(null), [])
  useClearOnScroll(clearAnchor, anchor !== null)

  const showTooltip = (event: MouseEvent<HTMLElement>) => {
    if (!tooltipText) return

    const element = ref.current ?? event.currentTarget
    if (!isElementTruncated(element)) return

    const rect = element.getBoundingClientRect()
    setAnchor({
      x: rect.left + rect.width / 2,
      y: placement === 'above' ? rect.top : rect.bottom,
    })
  }

  const mergedClassName = className.includes('truncate')
    ? `min-w-0 ${className}`
    : `min-w-0 truncate ${className}`

  const sharedProps = {
    className: mergedClassName,
    onMouseEnter: showTooltip,
    onMouseLeave: clearAnchor,
    children,
  }

  const element =
    Tag === 'p' ? (
      <p ref={paragraphRef} {...sharedProps} />
    ) : Tag === 'div' ? (
      <div ref={divRef} {...sharedProps} />
    ) : Tag === 'h4' ? (
      <h4 ref={headingRef} {...sharedProps} />
    ) : Tag === 'h3' ? (
      <h3 ref={subheadingRef} {...sharedProps} />
    ) : (
      <span ref={spanRef} {...sharedProps} />
    )

  return (
    <>
      {element}

      {anchor && tooltipText ? (
        <TruncatedTextPopover text={tooltipText} anchor={anchor} placement={placement} />
      ) : null}
    </>
  )
}
