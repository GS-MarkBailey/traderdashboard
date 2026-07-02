import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MainMarketSectionId, Player } from '../types/trading'
import { generateMockPlayers } from '../lib/mockData'
import {
  findCountryBySelection,
  findFixtureById,
  findTournamentLogoForFixture,
  findLeagueBySelection,
  findSportBySelection,
  getDefaultFixtureId,
  getDefaultNavigation,
  leagueToFixtureEntries,
  type CountrySelection,
  type FixtureNavigation,
  type LeagueSelection,
  type SportSelection,
  getFixtureTaxonomy,
} from '../lib/fixtureTaxonomy'
import { createDefaultMainMarkets, DEFAULT_SECTION_SCORES, MAIN_MARKET_SECTIONS, updateMainMarketSectionStrength } from '../lib/mainMarkets'
import {
  applyMainSectionStrengthToPlayers,
  getLinkedProposalKeysForSectionSlot,
  removeProposalKeys,
  hasSectionScoreDataIssue,
  resolveRedCardScores,
  resolveSectionScores,
  syncAllMainSectionStrengthsFromPlayers,
} from '../lib/mainMarketPlayerSync'
import type { TradingTier } from '../lib/tradingTier'
import { isMainSectionVisibleForTier } from '../lib/tradingTier'
import {
  generateIssueTimeline,
  pickKickoffMinute,
  snapshotToTimelinePoint,
  upsertTimelinePoint,
} from '../lib/issueTimeline'
import {
  buildMarketHealthSnapshot,
  getMaxStrengthInMatch,
} from '../lib/marketHealth'
import type { ProposalMap } from '../lib/proposals'
import { useFixtureSessions } from '../hooks/useFixtureSessions'
import { AppHeaderNav, type AppNavSection } from './AppHeaderNav'
import { FixtureTaxonomyAside } from './FixtureTaxonomyAside'
import { FixtureInfo } from './FixtureInfo'
import { FixtureListView } from './FixtureListView'
import { MainMarketIssuesPanel } from './MainMarketIssuesPanel'
import { MarketMonitor } from './MarketMonitor'
import { PlayerGridTable } from './PlayerGridTable'
import { ScreenTabs, type AppScreen } from './ScreenTabs'
import { TierSelect } from './TierSelect'
import { ThemeSelect } from './ThemeSelect'

const MATCH_TICK_MS = 5000

export function AppShell() {
  const taxonomy = useMemo(() => getFixtureTaxonomy(), [])
  const [screen, setScreen] = useState<AppScreen>('manage')
  const [navigation, setNavigation] = useState<FixtureNavigation>(getDefaultNavigation)
  const [strengthMode, setStrengthMode] = useState<'absolute' | 'relative'>('absolute')
  const [tier, setTier] = useState<TradingTier>('tier1')
  const [appSection, setAppSection] = useState<AppNavSection>('fixtures')

  const sessionFixtureId =
    navigation.kind === 'fixture' ? navigation.fixtureId : getDefaultFixtureId()

  const {
    session,
    setPlayers,
    setProposals,
    setMainMarkets,
    setMatchMinute,
    setIssueTimeline,
    replaceSession,
  } = useFixtureSessions(sessionFixtureId)

  const { players, proposals, mainMarkets, matchMinute, issueTimeline } = session

  const selectedFixture = useMemo(() => {
    if (navigation.kind !== 'fixture') return null
    return findFixtureById(navigation.fixtureId)
  }, [navigation])

  const selectedFixtureTournamentLogo = useMemo(() => {
    if (navigation.kind !== 'fixture') return null
    return findTournamentLogoForFixture(navigation.fixtureId)
  }, [navigation])

  const selectedSport = useMemo(() => {
    if (navigation.kind !== 'sport') return null
    return findSportBySelection({ sportId: navigation.sportId })
  }, [navigation])

  const selectedCountry = useMemo(() => {
    if (navigation.kind !== 'country') return null
    return findCountryBySelection({
      sportId: navigation.sportId,
      countryId: navigation.countryId,
    })
  }, [navigation])

  const selectedLeague = useMemo(() => {
    if (navigation.kind !== 'league') return null
    return findLeagueBySelection({
      sportId: navigation.sportId,
      countryId: navigation.countryId,
      leagueId: navigation.leagueId,
    })
  }, [navigation])

  const fixtureSectionScores = useMemo(() => {
    if (!selectedFixture) return []

    const storedScores = mainMarkets.sectionScores ?? DEFAULT_SECTION_SCORES
    const scores = resolveSectionScores(players, storedScores)

    return MAIN_MARKET_SECTIONS.filter((section) =>
      isMainSectionVisibleForTier(tier, section.id),
    ).map((section) => ({
      id: section.id,
      label: section.id === 'cards' ? 'Yellow cards' : section.label,
      score: scores[section.id],
      hasDataIssue: hasSectionScoreDataIssue(
        section.id,
        players,
        storedScores,
        scores,
      ),
    }))
  }, [selectedFixture, players, mainMarkets.sectionScores, tier])

  const fixtureRedCardScore = useMemo(() => {
    if (!selectedFixture) return null
    if (!isMainSectionVisibleForTier(tier, 'cards')) return null
    return resolveRedCardScores(players)
  }, [selectedFixture, players, tier])

  const fixtureRedCardHasDataIssue = false

  const handleSelectSport = useCallback((selection: SportSelection) => {
    setNavigation({ kind: 'sport', sportId: selection.sportId })
  }, [])

  const handleSelectCountry = useCallback((selection: CountrySelection) => {
    setNavigation({
      kind: 'country',
      sportId: selection.sportId,
      countryId: selection.countryId,
    })
  }, [])

  const handleSelectLeague = useCallback((selection: LeagueSelection) => {
    setNavigation({
      kind: 'league',
      sportId: selection.sportId,
      countryId: selection.countryId,
      leagueId: selection.leagueId,
    })
  }, [])

  const handleSelectFixture = useCallback((fixtureId: string) => {
    setNavigation({ kind: 'fixture', fixtureId })
  }, [])

  const applyMainMarketSectionStrength = useCallback(
    (sectionId: MainMarketSectionId, slotIndex: number, strength: number) => {
      setPlayers((currentPlayers) => {
        const proposalKeys = getLinkedProposalKeysForSectionSlot(
          currentPlayers,
          sectionId,
          slotIndex,
        )
        setProposals((currentProposals) =>
          removeProposalKeys(currentProposals, proposalKeys),
        )
        return applyMainSectionStrengthToPlayers(
          currentPlayers,
          sectionId,
          slotIndex,
          strength,
        )
      })
      setMainMarkets((current) =>
        updateMainMarketSectionStrength(current, sectionId, slotIndex, strength),
      )
    },
    [setMainMarkets, setPlayers, setProposals],
  )

  const maxStrengthInMatch = useMemo(
    () => getMaxStrengthInMatch(players, proposals),
    [players, proposals],
  )

  const healthSnapshot = useMemo(() => {
    if (players.length === 0) return null

    return buildMarketHealthSnapshot(
      players,
      proposals,
      strengthMode,
      maxStrengthInMatch,
    )
  }, [players, proposals, strengthMode, maxStrengthInMatch])

  const seedTimeline = useCallback(
    (nextPlayers: Player[], nextProposals: ProposalMap) => {
      const minute = pickKickoffMinute()
      const maxStrength = getMaxStrengthInMatch(nextPlayers, nextProposals)
      const snapshot = buildMarketHealthSnapshot(
        nextPlayers,
        nextProposals,
        strengthMode,
        maxStrength,
      )
      const endPoint = snapshotToTimelinePoint(minute, snapshot)

      setMatchMinute(minute)
      setIssueTimeline(generateIssueTimeline(minute, endPoint))
    },
    [setIssueTimeline, setMatchMinute, strengthMode],
  )

  const handleImport = useCallback(() => {
    const nextPlayers = generateMockPlayers()
    const baseMarkets = createDefaultMainMarkets()
    const nextMainMarkets = syncAllMainSectionStrengthsFromPlayers(
      {
        ...baseMarkets,
        sectionScores: resolveSectionScores(nextPlayers, baseMarkets.sectionScores),
      },
      nextPlayers,
    )

    replaceSession({
      players: nextPlayers,
      proposals: {},
      mainMarkets: nextMainMarkets,
      matchMinute: 0,
      issueTimeline: [],
    })
    seedTimeline(nextPlayers, {})
  }, [replaceSession, seedTimeline])

  useEffect(() => {
    if (players.length === 0 || screen !== 'monitor' || !healthSnapshot) return

    const point = snapshotToTimelinePoint(matchMinute, healthSnapshot)
    setIssueTimeline((current) => upsertTimelinePoint(current, point))
  }, [
    screen,
    players.length,
    matchMinute,
    healthSnapshot?.issueCells,
    healthSnapshot?.unpricedCells,
    healthSnapshot?.priceIssueCells,
    healthSnapshot?.lineIssueCells,
    setIssueTimeline,
  ])

  useEffect(() => {
    if (screen !== 'monitor') return

    const timer = window.setInterval(() => {
      setMatchMinute((current) => Math.min(90, current + 1))
    }, MATCH_TICK_MS)

    return () => window.clearInterval(timer)
  }, [screen, setMatchMinute])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-app-bg">
      <header className="z-30 flex w-full shrink-0 flex-wrap items-center gap-3 border-b border-app-border bg-app-surface px-4 py-3">
        <img
          src="/genius-sports-logo.png"
          alt="Genius Sports"
          className="h-8 w-auto shrink-0 object-contain brightness-0 dark:invert"
        />

        <AppHeaderNav value={appSection} onChange={setAppSection} />

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {screen === 'monitor' && navigation.kind === 'fixture' && players.length > 0 ? (
            <span className="text-xs text-app-text-muted">
              {players.length} players loaded
            </span>
          ) : null}

          <ThemeSelect />
          <TierSelect value={tier} onChange={setTier} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <FixtureTaxonomyAside
          taxonomy={taxonomy}
          navigation={navigation}
          onSelectSport={handleSelectSport}
          onSelectCountry={handleSelectCountry}
          onSelectLeague={handleSelectLeague}
          onSelectFixture={handleSelectFixture}
        />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          {navigation.kind === 'sport' && selectedSport ? (
            <FixtureListView
              title={selectedSport.sportName}
              entries={selectedSport.entries}
              showCountry
              showCompetition
              onSelectFixture={handleSelectFixture}
            />
          ) : navigation.kind === 'country' && selectedCountry ? (
            <FixtureListView
              breadcrumb={selectedCountry.sportName}
              title={selectedCountry.countryName}
              entries={selectedCountry.entries}
              showCompetition
              onSelectFixture={handleSelectFixture}
            />
          ) : navigation.kind === 'league' && selectedLeague ? (
            <FixtureListView
              breadcrumb={`${selectedLeague.sportName} · ${selectedLeague.countryName}`}
              title={selectedLeague.league.name}
              entries={leagueToFixtureEntries(selectedLeague.league)}
              onSelectFixture={handleSelectFixture}
            />
          ) : selectedFixture ? (
            <div className="flex min-w-0 w-full flex-col">
              <FixtureInfo
                fixture={selectedFixture}
                tournamentLogoUrl={selectedFixtureTournamentLogo}
                matchMinute={matchMinute}
                sectionScores={fixtureSectionScores}
                redCardScore={fixtureRedCardScore}
                redCardHasDataIssue={fixtureRedCardHasDataIssue}
              />
              <div className="bg-app-surface px-2 pt-2 sm:px-4 sm:pt-3">
                <ScreenTabs value={screen} onChange={setScreen} />
              </div>
              {screen === 'manage' ? (
                <PlayerGridTable
                  players={players}
                  setPlayers={setPlayers}
                  proposals={proposals}
                  setProposals={setProposals}
                  strengthMode={strengthMode}
                  setStrengthMode={setStrengthMode}
                  mainMarkets={mainMarkets}
                  setMainMarkets={setMainMarkets}
                  tier={tier}
                  onImport={handleImport}
                  onApplyMainMarketSectionStrength={applyMainMarketSectionStrength}
                />
              ) : screen === 'monitor' ? (
                <div className="p-4">
                  <MarketMonitor
                    mainMarkets={mainMarkets}
                    players={players}
                    proposals={proposals}
                    strengthMode={strengthMode}
                    matchMinute={matchMinute}
                    issueTimeline={issueTimeline}
                    tier={tier}
                  />
                </div>
              ) : (
                <MainMarketIssuesPanel
                  settings={mainMarkets}
                  tier={tier}
                  onApplySectionStrength={applyMainMarketSectionStrength}
                />
              )}
            </div>
          ) : (
            <div className="flex h-full min-h-[16rem] items-center justify-center p-6 text-sm text-app-text-muted">
              Select a league or fixture from the sidebar.
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  )
}
