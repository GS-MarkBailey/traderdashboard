import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import type { PlayerMarket, StrengthMode } from '../types/trading'
import {
  adjustStrength,
  calculatePriceFromStrength,
  formatStrength,
  getEffectiveStrength,
  parseStrengthInput,
  strengthChangesPrice,
  validateMarketCell,
} from '../lib/pricing'

interface UseMarketCellEditorOptions {
  cellKey: string
  market: PlayerMarket
  proposedStrength: number | null
  strengthMode: StrengthMode
  maxStrengthInMatch: number
  effectivelySuspended?: boolean
  onProposeStrength: (strength: number) => void
  onSubmitProposals: (strength: number) => void
  onNavigateToNextAttention: (pendingStrength?: number) => void
}

export function useMarketCellEditor({
  market,
  proposedStrength,
  strengthMode,
  maxStrengthInMatch,
  effectivelySuspended = market.suspended,
  onProposeStrength,
  onSubmitProposals,
  onNavigateToNextAttention,
}: UseMarketCellEditorOptions) {
  const committedStrength = market.strength
  const hasProposal = proposedStrength !== null
  const activeStrength = proposedStrength ?? committedStrength
  const [strengthDraft, setStrengthDraft] = useState(formatStrength(activeStrength))
  const [isStrengthFocused, setIsStrengthFocused] = useState(false)
  const strengthInputRef = useRef<HTMLInputElement>(null)
  const draftStrengthRef = useRef(activeStrength)
  const skipBlurProposeRef = useRef(false)
  const onProposeStrengthRef = useRef(onProposeStrength)

  onProposeStrengthRef.current = onProposeStrength

  useEffect(() => {
    if (!isStrengthFocused) {
      setStrengthDraft(formatStrength(activeStrength))
      draftStrengthRef.current = activeStrength
    }
  }, [activeStrength, isStrengthFocused])

  useEffect(() => {
    const input = strengthInputRef.current
    if (!input) return

    const onWheel = (event: WheelEvent) => {
      if (document.activeElement !== input) return

      event.preventDefault()
      event.stopPropagation()

      if (effectivelySuspended || event.deltaY === 0) return

      const direction = event.deltaY < 0 ? 1 : -1
      const step = event.shiftKey ? 0.001 : 0.0001
      const next = adjustStrength(parseStrengthInput(input.value), direction * step)
      draftStrengthRef.current = next
      setStrengthDraft(formatStrength(next))
      onProposeStrengthRef.current(next)
    }

    input.addEventListener('wheel', onWheel, { passive: false })
    return () => input.removeEventListener('wheel', onWheel)
  }, [effectivelySuspended])

  const strengthForCalc = isStrengthFocused
    ? parseStrengthInput(strengthDraft)
    : activeStrength

  const effectiveStrength = getEffectiveStrength(
    strengthForCalc,
    strengthMode,
    maxStrengthInMatch,
  )
  const ourPrice = calculatePriceFromStrength(effectiveStrength)

  const committedEffectiveStrength = getEffectiveStrength(
    committedStrength,
    strengthMode,
    maxStrengthInMatch,
  )
  const committedPrice = calculatePriceFromStrength(committedEffectiveStrength)
  const draftStrength = parseStrengthInput(strengthDraft)
  const showAsProposed =
    hasProposal ||
    (isStrengthFocused &&
      strengthChangesPrice(
        committedStrength,
        draftStrength,
        strengthMode,
        maxStrengthInMatch,
      ))

  const validation = validateMarketCell(market, ourPrice)

  const isSuspended = effectivelySuspended
  const hasIssue =
    !isSuspended &&
    (validation.hasZeroStrength || validation.hasPriceIssue || validation.hasLineIssue)

  let rowBg = 'bg-white'
  if (isSuspended) rowBg = 'bg-[#fffbeb]'
  else if (validation.hasZeroStrength) rowBg = 'bg-[#fde8e8]'
  else if (hasIssue) rowBg = 'bg-[#fdf0f0]'

  const priceAlert = !isSuspended && validation.hasPriceIssue
  const lineAlert = !isSuspended && validation.hasLineIssue

  const proposeFromDraft = () => {
    const next = parseStrengthInput(strengthDraft)
    draftStrengthRef.current = next
    onProposeStrength(next)
  }

  const adjustStrengthByStep = (direction: 1 | -1, shiftKey: boolean) => {
    if (effectivelySuspended) return

    const step = shiftKey ? 0.001 : 0.0001
    const next = adjustStrength(parseStrengthInput(strengthDraft), direction * step)
    draftStrengthRef.current = next
    setStrengthDraft(formatStrength(next))
    onProposeStrength(next)
  }

  const handleStrengthKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const direction = e.key === 'ArrowUp' ? 1 : -1
      adjustStrengthByStep(direction, e.shiftKey)
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      const next = parseStrengthInput(strengthDraft)
      draftStrengthRef.current = next
      setStrengthDraft(formatStrength(next))
      skipBlurProposeRef.current = true
      onSubmitProposals(next)
      return
    }

    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()
      const next = parseStrengthInput(strengthDraft)
      draftStrengthRef.current = next
      setStrengthDraft(formatStrength(next))
      skipBlurProposeRef.current = true
      onProposeStrength(next)
      onNavigateToNextAttention(next)
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      onProposeStrength(committedStrength)
      setStrengthDraft(formatStrength(committedStrength))
      ;(e.target as HTMLInputElement).blur()
    }
  }

  const handleStrengthKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      onProposeStrength(draftStrengthRef.current)
    }
  }

  const handleStrengthChange = (value: string) => {
    setStrengthDraft(value)
    if (value.trim() === '') return
    onProposeStrength(parseStrengthInput(value))
  }

  const handleStrengthFocus = () => setIsStrengthFocused(true)

  const handleStrengthBlur = () => {
    setIsStrengthFocused(false)
    if (skipBlurProposeRef.current) {
      skipBlurProposeRef.current = false
      return
    }
    proposeFromDraft()
  }

  const hasStrengthValue = parseStrengthInput(strengthDraft) > 0

  return {
    strengthDraft,
    strengthInputRef: strengthInputRef as RefObject<HTMLInputElement>,
    hasStrengthValue,
    ourPrice,
    committedPrice,
    showAsProposed,
    rowBg,
    priceAlert,
    lineAlert,
    handleStrengthChange,
    handleStrengthFocus,
    handleStrengthBlur,
    handleStrengthKeyDown,
    handleStrengthKeyUp,
  }
}
