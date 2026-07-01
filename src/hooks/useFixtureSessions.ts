import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type {
  IssueTimelinePoint,
  MainMarketSettings,
  Player,
} from '../types/trading'
import {
  createEmptyFixtureSession,
  type FixtureSession,
} from '../lib/fixtureTaxonomy'
import type { ProposalMap } from '../lib/proposals'

export function useFixtureSessions(selectedFixtureId: string) {
  const [sessions, setSessions] = useState<Record<string, FixtureSession>>({})

  const session = sessions[selectedFixtureId] ?? createEmptyFixtureSession()

  const patchSession = useCallback(
    (
      updater:
        | Partial<FixtureSession>
        | ((current: FixtureSession) => FixtureSession),
    ) => {
      setSessions((previous) => {
        const current = previous[selectedFixtureId] ?? createEmptyFixtureSession()
        const next =
          typeof updater === 'function' ? updater(current) : { ...current, ...updater }

        return { ...previous, [selectedFixtureId]: next }
      })
    },
    [selectedFixtureId],
  )

  const setPlayers = useCallback<Dispatch<SetStateAction<Player[]>>>(
    (action) => {
      patchSession((current) => ({
        ...current,
        players: typeof action === 'function' ? action(current.players) : action,
      }))
    },
    [patchSession],
  )

  const setProposals = useCallback<Dispatch<SetStateAction<ProposalMap>>>(
    (action) => {
      patchSession((current) => ({
        ...current,
        proposals:
          typeof action === 'function' ? action(current.proposals) : action,
      }))
    },
    [patchSession],
  )

  const setMainMarkets = useCallback<Dispatch<SetStateAction<MainMarketSettings>>>(
    (action) => {
      patchSession((current) => ({
        ...current,
        mainMarkets:
          typeof action === 'function' ? action(current.mainMarkets) : action,
      }))
    },
    [patchSession],
  )

  const setMatchMinute = useCallback<Dispatch<SetStateAction<number>>>(
    (action) => {
      patchSession((current) => ({
        ...current,
        matchMinute:
          typeof action === 'function' ? action(current.matchMinute) : action,
      }))
    },
    [patchSession],
  )

  const setIssueTimeline = useCallback<
    Dispatch<SetStateAction<IssueTimelinePoint[]>>
  >(
    (action) => {
      patchSession((current) => ({
        ...current,
        issueTimeline:
          typeof action === 'function' ? action(current.issueTimeline) : action,
      }))
    },
    [patchSession],
  )

  const replaceSession = useCallback((nextSession: FixtureSession) => {
    patchSession(nextSession)
  }, [patchSession])

  return useMemo(
    () => ({
      session,
      setPlayers,
      setProposals,
      setMainMarkets,
      setMatchMinute,
      setIssueTimeline,
      replaceSession,
    }),
    [
      session,
      setPlayers,
      setProposals,
      setMainMarkets,
      setMatchMinute,
      setIssueTimeline,
      replaceSession,
    ],
  )
}
