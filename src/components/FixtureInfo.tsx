import { Fragment, type ReactNode } from 'react'
import type { Fixture, MainMarketSectionId, MainMarketSectionScore } from '../types/trading'
import { formatKickoffDateTime } from '../lib/fixture'
import {
  TABLE_HEADER_CLASS,
  TABLE_MICRO_LABEL_CLASS,
  TABLE_ROW_LABEL_CLASS,
} from '../lib/tableTypography'
import { CompetitionLogo } from './CompetitionLogo'
import { RedCardScoreChip, SectionScoreChip } from './SectionScoreChip'

export interface FixtureSectionScore {
  id: MainMarketSectionId
  label: string
  score: MainMarketSectionScore
  hasDataIssue?: boolean
}

interface FixtureInfoProps {
  fixture: Fixture
  tournamentLogoUrl?: string | null
  matchMinute?: number
  sectionScores?: FixtureSectionScore[]
  redCardScore?: MainMarketSectionScore | null
  redCardHasDataIssue?: boolean
}

function MetadataItem({
  label,
  value,
  tabular = false,
  leading,
}: {
  label: string
  value: string
  tabular?: boolean
  leading?: ReactNode
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <dt className={`${TABLE_MICRO_LABEL_CLASS} shrink-0 whitespace-nowrap`}>{label}</dt>
      <dd
        className={`flex min-w-0 items-center gap-1 ${TABLE_ROW_LABEL_CLASS} font-medium text-gray-700 ${
          tabular ? 'tabular-nums' : ''
        }`}
      >
        {leading}
        <span className="min-w-0 truncate">{value}</span>
      </dd>
    </div>
  )
}

export function FixtureInfo({
  fixture,
  tournamentLogoUrl,
  matchMinute,
  sectionScores,
  redCardScore,
  redCardHasDataIssue = false,
}: FixtureInfoProps) {
  return (
    <div className="min-w-0 w-full border-b border-[#e5e7eb] bg-white px-2 py-2 sm:px-4 sm:py-3">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className={`min-w-0 ${TABLE_HEADER_CLASS} text-[13px] text-gray-900`}>
              {fixture.homeTeam} v {fixture.awayTeam}
            </h1>
            {matchMinute !== undefined ? (
              <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium tabular-nums text-blue-700">
                {matchMinute}&apos; match time
              </span>
            ) : null}
          </div>

          <dl className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
            <MetadataItem label="ID" value={fixture.id} />
            <MetadataItem label="K/O" value={formatKickoffDateTime(fixture.kickoffAt)} tabular />
            <MetadataItem
              label="Tournament"
              value={fixture.tournament}
              leading={
                tournamentLogoUrl ? (
                  <CompetitionLogo logoUrl={tournamentLogoUrl} />
                ) : undefined
              }
            />
          </dl>

          {sectionScores && sectionScores.length > 0 ? (
            <div className="flex min-w-0 flex-wrap items-center gap-2 pt-0.5">
              {sectionScores.map((entry) => (
                <Fragment key={entry.id}>
                  <SectionScoreChip
                    sectionId={entry.id}
                    score={entry.score}
                    label={entry.label}
                    hasDataIssue={entry.hasDataIssue}
                  />
                  {entry.id === 'cards' && redCardScore ? (
                    <RedCardScoreChip
                      score={redCardScore}
                      hasDataIssue={redCardHasDataIssue}
                    />
                  ) : null}
                </Fragment>
              ))}
            </div>
          ) : null}
        </div>

        <div className="shrink-0 text-right">
          <p className={TABLE_MICRO_LABEL_CLASS}>Trader</p>
          <p className={`mt-0.5 ${TABLE_HEADER_CLASS} text-gray-900`}>
            {fixture.traderName}
          </p>
        </div>
      </div>
    </div>
  )
}
