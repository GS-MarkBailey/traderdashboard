import { useEffect, useRef, useState } from 'react'
import type { ProposalSummary } from '../lib/proposals'
import { formatStrength } from '../lib/pricing'
import { TruncatedText } from './TruncatedText'

interface ProposalsPopoverProps {
  proposals: ProposalSummary[]
  disabled?: boolean
  visible?: boolean
  onConfirmAll: () => void
  onRejectAll: () => void
  onRejectOne: (key: string) => void
}

export function ProposalsPopover({
  proposals,
  disabled = false,
  visible = true,
  onConfirmAll,
  onRejectAll,
  onRejectOne,
}: ProposalsPopoverProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const count = proposals.length

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key === 'Enter' && count > 0) {
        event.preventDefault()
        onConfirmAll()
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, count, onConfirmAll])

  useEffect(() => {
    if (count === 0) setOpen(false)
  }, [count])

  const handleConfirmAll = () => {
    onConfirmAll()
    setOpen(false)
  }

  if (!visible) return null

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`relative rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          count > 0
            ? 'border-[#93c5fd] bg-[#eff6ff] text-[#1d4ed8] hover:bg-[#dbeafe]'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        Proposals
        {count > 0 && (
          <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[#2563eb] px-1.5 py-0.5 text-[11px] font-bold text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Price proposals</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {count === 0
                ? 'No pending changes. Edit strengths in the grid to add proposals.'
                : `${count} pending change${count === 1 ? '' : 's'}. Press Enter to confirm all.`}
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {count === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Changes will appear here before you submit.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {proposals.map((proposal) => (
                  <li
                    key={proposal.key}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <TruncatedText className="text-sm font-medium text-gray-900">
                          {proposal.playerName}
                        </TruncatedText>
                        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">
                          {proposal.teamBadge}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        {proposal.marketLabel}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums">
                        <span className="text-gray-500">
                          Strength{' '}
                          <span className="text-gray-400 line-through">
                            {formatStrength(proposal.committedStrength)}
                          </span>{' '}
                          <span className="font-semibold text-[#1d4ed8]">
                            {formatStrength(proposal.proposedStrength)}
                          </span>
                        </span>
                        <span className="text-gray-500">
                          Price{' '}
                          <span className="text-gray-400 line-through">
                            {proposal.committedPrice}
                          </span>{' '}
                          <span className="font-semibold text-[#1d4ed8]">
                            {proposal.proposedPrice}
                          </span>
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRejectOne(proposal.key)}
                      className="shrink-0 rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3">
            <button
              type="button"
              onClick={onRejectAll}
              disabled={count === 0}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject all
            </button>
            <button
              type="button"
              onClick={handleConfirmAll}
              disabled={count === 0}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirm all
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
