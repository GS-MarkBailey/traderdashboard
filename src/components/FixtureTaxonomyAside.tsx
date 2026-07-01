import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { Fixture, FixtureTaxonomy } from '../types/trading'
import {
  formatFixtureLabel,
  getAllSportsGroupNodeId,
  getExpandedNodeIdsForNavigation,
  isCountrySelected,
  isLeagueSelected,
  isSportSelected,
  taxonomyNodeId,
  type CountrySelection,
  type FixtureNavigation,
  type LeagueSelection,
  type SportSelection,
} from '../lib/fixtureTaxonomy'
import { formatKickoffDateTime } from '../lib/fixture'
import {
  TABLE_HEADER_CLASS,
  TABLE_MICRO_META_CLASS,
  TABLE_ROW_LABEL_CLASS,
} from '../lib/tableTypography'
import { CountryFlag } from './CountryFlag'
import { CompetitionLogo } from './CompetitionLogo'
import { SportIcon } from './SportIcon'

interface FixtureTaxonomyAsideProps {
  taxonomy: FixtureTaxonomy
  navigation: FixtureNavigation
  onSelectSport: (selection: SportSelection) => void
  onSelectCountry: (selection: CountrySelection) => void
  onSelectLeague: (selection: LeagueSelection) => void
  onSelectFixture: (fixtureId: string) => void
}

function TreeChevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={`h-3 w-3 shrink-0 text-gray-400 transition-transform ${
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

function PanelChevron({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className="h-3.5 w-3.5 shrink-0 text-gray-500"
    >
      {collapsed ? (
        <path
          d="M6 4l4 4-4 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M10 4L6 8l4 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

function BranchButton({
  label,
  leading,
  expanded,
  depth,
  selected = false,
  onToggle,
  onSelect,
}: {
  label: string
  leading?: ReactNode
  expanded: boolean
  depth: number
  selected?: boolean
  onToggle: () => void
  onSelect?: () => void
}) {
  const labelClass =
    depth === 0 ? TABLE_HEADER_CLASS : TABLE_ROW_LABEL_CLASS

  return (
    <div
      className={`flex w-full min-w-0 items-center gap-0.5 rounded ${
        selected ? 'bg-[#eff6ff]' : ''
      }`}
      style={{ paddingLeft: `${depth * 12 + 6}px` }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
        aria-expanded={expanded}
        className="inline-flex shrink-0 items-center justify-center rounded p-0.5 hover:bg-[#f3f4f6]"
      >
        <TreeChevron expanded={expanded} />
      </button>
      <button
        type="button"
        onClick={onSelect ?? onToggle}
        aria-current={selected ? 'true' : undefined}
        className={`flex min-w-0 flex-1 items-center gap-1 truncate rounded px-1 py-1 text-left hover:bg-[#f3f4f6] ${labelClass} ${
          selected ? 'font-semibold text-[#1d4ed8]' : ''
        }`}
      >
        {leading}
        <span className="min-w-0 truncate">{label}</span>
      </button>
    </div>
  )
}

function FixtureButton({
  fixture,
  selected,
  depth,
  onSelect,
}: {
  fixture: Fixture
  selected: boolean
  depth: number
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? 'page' : undefined}
      className={`flex w-full min-w-0 flex-col rounded py-1 pr-1.5 text-left ${
        selected
          ? 'bg-[#eff6ff] text-[#1d4ed8]'
          : 'text-gray-700 hover:bg-[#f3f4f6]'
      }`}
      style={{ paddingLeft: `${depth * 12 + 22}px` }}
    >
      <span
        className={`truncate ${
          selected ? 'text-[10px] font-semibold' : 'text-[10px] font-medium'
        }`}
      >
        {formatFixtureLabel(fixture)}
      </span>
      <span className={`truncate ${TABLE_MICRO_META_CLASS}`}>
        {formatKickoffDateTime(fixture.kickoffAt)}
      </span>
    </button>
  )
}

export function FixtureTaxonomyAside({
  taxonomy,
  navigation,
  onSelectSport,
  onSelectCountry,
  onSelectLeague,
  onSelectFixture,
}: FixtureTaxonomyAsideProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() =>
    new Set([getAllSportsGroupNodeId(), ...getExpandedNodeIdsForNavigation(navigation)]),
  )

  useEffect(() => {
    setExpandedNodes((current) => {
      const next = new Set(current)
      for (const nodeId of getExpandedNodeIdsForNavigation(navigation)) {
        next.add(nodeId)
      }
      return next
    })
  }, [navigation])

  const selectedFixtureId =
    navigation.kind === 'fixture' ? navigation.fixtureId : null

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((current) => {
      const next = new Set(current)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  return (
    <aside
      aria-expanded={!collapsed}
      className={`flex h-full min-h-0 shrink-0 flex-col self-stretch overflow-hidden border-r border-[#e5e7eb] bg-white transition-[width] duration-200 ease-in-out ${
        collapsed ? 'w-10' : 'w-[15.5rem]'
      }`}
    >
      {collapsed ? (
        <div className="flex flex-col items-center gap-2 border-b border-[#e5e7eb] py-2">
          <button
            type="button"
            title="Expand fixtures"
            aria-label="Expand fixtures sidebar"
            onClick={() => setCollapsed(false)}
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white hover:bg-[#f3f4f6]"
          >
            <PanelChevron collapsed />
          </button>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2 border-b border-[#e5e7eb] px-3 py-2.5">
          <div className="min-w-0">
            <h2 className={TABLE_HEADER_CLASS}>Fixtures</h2>
            <p className={`mt-0.5 ${TABLE_MICRO_META_CLASS}`}>
              Sport · Country · League
            </p>
          </div>
          <button
            type="button"
            title="Collapse fixtures"
            aria-label="Collapse fixtures sidebar"
            onClick={() => setCollapsed(true)}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-gray-200 bg-white hover:bg-[#f3f4f6]"
          >
            <PanelChevron collapsed={false} />
          </button>
        </div>
      )}

      {!collapsed ? (
      <nav
        aria-label="Fixture taxonomy"
        className="min-h-0 flex-1 overflow-y-auto px-1.5 py-2"
      >
        <div className="mb-1">
          <BranchButton
            label="All Sports"
            expanded={expandedNodes.has(getAllSportsGroupNodeId())}
            depth={0}
            onToggle={() => toggleNode(getAllSportsGroupNodeId())}
          />

          {expandedNodes.has(getAllSportsGroupNodeId())
            ? taxonomy.map((sport) => {
          const sportNodeId = taxonomyNodeId('sport', sport.id)
          const sportExpanded = expandedNodes.has(sportNodeId)
          const sportSelection: SportSelection = { sportId: sport.id }

          return (
            <div key={sport.id} className="mb-1">
              <BranchButton
                label={sport.name}
                leading={<SportIcon iconSlug={sport.iconSlug} />}
                expanded={sportExpanded}
                depth={1}
                selected={isSportSelected(navigation, sportSelection)}
                onToggle={() => toggleNode(sportNodeId)}
                onSelect={() => onSelectSport(sportSelection)}
              />

              {sportExpanded
                ? sport.countries.map((country) => {
                    const countryNodeId = taxonomyNodeId(
                      'country',
                      sport.id,
                      country.id,
                    )
                    const countryExpanded = expandedNodes.has(countryNodeId)
                    const countrySelection: CountrySelection = {
                      sportId: sport.id,
                      countryId: country.id,
                    }

                    return (
                      <div key={country.id}>
                        <BranchButton
                          label={country.name}
                          leading={<CountryFlag countryCode={country.countryCode} />}
                          expanded={countryExpanded}
                          depth={2}
                          selected={isCountrySelected(navigation, countrySelection)}
                          onToggle={() => toggleNode(countryNodeId)}
                          onSelect={() => onSelectCountry(countrySelection)}
                        />

                        {countryExpanded
                          ? country.leagues.map((league) => {
                              const leagueNodeId = taxonomyNodeId(
                                'league',
                                sport.id,
                                country.id,
                                league.id,
                              )
                              const leagueExpanded = expandedNodes.has(leagueNodeId)

                              const leagueSelection: LeagueSelection = {
                                sportId: sport.id,
                                countryId: country.id,
                                leagueId: league.id,
                              }

                              return (
                                <div key={league.id}>
                                  <BranchButton
                                    label={league.name}
                                    leading={<CompetitionLogo logoUrl={league.logoUrl} />}
                                    expanded={leagueExpanded}
                                    depth={3}
                                    selected={isLeagueSelected(navigation, leagueSelection)}
                                    onToggle={() => toggleNode(leagueNodeId)}
                                    onSelect={() => onSelectLeague(leagueSelection)}
                                  />

                                  {leagueExpanded
                                    ? league.fixtures.map((item) => (
                                        <FixtureButton
                                          key={item.id}
                                          fixture={item}
                                          selected={item.id === selectedFixtureId}
                                          depth={4}
                                          onSelect={() => onSelectFixture(item.id)}
                                        />
                                      ))
                                    : null}
                                </div>
                              )
                            })
                          : null}
                      </div>
                    )
                  })
                : null}
            </div>
          )
        })
            : null}
        </div>
      </nav>
      ) : null}
    </aside>
  )
}
