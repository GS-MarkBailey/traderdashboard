import type { FixtureListEntry } from '../lib/fixtureTaxonomy'
import { formatKickoffDate, formatKickoffTime } from '../lib/fixture'
import { formatFixtureLabel } from '../lib/fixtureTaxonomy'
import {
  TABLE_BODY_CLASS,
  TABLE_CELL_CLASS,
  TABLE_HEAD_CELL_CLASS,
  TABLE_HEADER_CLASS,
  TABLE_LABEL_CLASS,
  TABLE_MICRO_META_CLASS,
  TABLE_PLAYER_NAME_CLASS,
} from '../lib/tableTypography'

interface FixtureListViewProps {
  breadcrumb?: string
  title: string
  entries: FixtureListEntry[]
  showCountry?: boolean
  showCompetition?: boolean
  selectedFixtureId?: string
  onSelectFixture: (fixtureId: string) => void
}

export function FixtureListView({
  breadcrumb,
  title,
  entries,
  showCountry = false,
  showCompetition = false,
  selectedFixtureId,
  onSelectFixture,
}: FixtureListViewProps) {
  const minWidth =
    showCountry && showCompetition
      ? 'min-w-[48rem]'
      : showCompetition
        ? 'min-w-[42rem]'
        : 'min-w-[36rem]'

  return (
    <div className="min-w-0 w-full bg-white">
      <div className="border-b border-[#e5e7eb] px-4 py-3 sm:px-6">
        {breadcrumb ? (
          <p className={TABLE_MICRO_META_CLASS}>{breadcrumb}</p>
        ) : null}
        <h1
          className={`${breadcrumb ? 'mt-1' : ''} ${TABLE_HEADER_CLASS} text-[13px] text-gray-900`}
        >
          {title}
        </h1>
        <p className={`mt-1 ${TABLE_MICRO_META_CLASS}`}>
          {entries.length} fixture{entries.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="p-4 sm:px-6">
        <div className="w-full max-w-full overflow-x-auto rounded-xl border border-[#e5e7eb] bg-white">
          <table
            className={`w-full border-collapse text-left ${TABLE_BODY_CLASS} ${minWidth}`}
          >
            <thead>
              <tr className="bg-[#f9fafb]">
                <th className={TABLE_HEAD_CELL_CLASS}>Fixture</th>
                {showCountry ? (
                  <th className={TABLE_HEAD_CELL_CLASS}>Country</th>
                ) : null}
                {showCompetition ? (
                  <th className={TABLE_HEAD_CELL_CLASS}>Competition</th>
                ) : null}
                <th className={TABLE_HEAD_CELL_CLASS}>Fixture ID</th>
                <th className={TABLE_HEAD_CELL_CLASS}>Kickoff</th>
                <th className={TABLE_HEAD_CELL_CLASS}>Time</th>
                <th className={TABLE_HEAD_CELL_CLASS}>Trader</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(({ fixture, competition, competitionLogoUrl, country }) => {
                const selected = fixture.id === selectedFixtureId

                return (
                  <tr
                    key={fixture.id}
                    className={`cursor-pointer transition-colors hover:bg-[#f9fafb] ${
                      selected ? 'bg-[#eff6ff]' : ''
                    }`}
                    onClick={() => onSelectFixture(fixture.id)}
                  >
                    <td className={`${TABLE_CELL_CLASS} ${TABLE_PLAYER_NAME_CLASS} ${selected ? 'bg-[#eff6ff]' : ''}`}>
                      {formatFixtureLabel(fixture)}
                    </td>
                    {showCountry ? (
                      <td className={`${TABLE_CELL_CLASS} ${TABLE_LABEL_CLASS} ${selected ? 'bg-[#eff6ff]' : ''}`}>
                        {country}
                      </td>
                    ) : null}
                    {showCompetition ? (
                      <td className={`${TABLE_CELL_CLASS} ${TABLE_LABEL_CLASS} ${selected ? 'bg-[#eff6ff]' : ''}`}>
                        <div className="flex min-w-0 items-center gap-1.5">
                          <img
                            src={competitionLogoUrl}
                            alt=""
                            className="h-4 w-4 shrink-0 object-contain"
                            loading="lazy"
                          />
                          <span className="min-w-0 truncate">{competition}</span>
                        </div>
                      </td>
                    ) : null}
                    <td className={`${TABLE_CELL_CLASS} ${TABLE_LABEL_CLASS} ${selected ? 'bg-[#eff6ff]' : ''}`}>
                      {fixture.id}
                    </td>
                    <td className={`${TABLE_CELL_CLASS} ${TABLE_LABEL_CLASS} ${selected ? 'bg-[#eff6ff]' : ''}`}>
                      {formatKickoffDate(fixture.kickoffAt)}
                    </td>
                    <td className={`${TABLE_CELL_CLASS} ${TABLE_LABEL_CLASS} ${selected ? 'bg-[#eff6ff]' : ''}`}>
                      {formatKickoffTime(fixture.kickoffAt)}
                    </td>
                    <td className={`${TABLE_CELL_CLASS} ${TABLE_LABEL_CLASS} ${selected ? 'bg-[#eff6ff]' : ''}`}>
                      {fixture.traderName}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
