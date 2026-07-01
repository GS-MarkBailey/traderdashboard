function segmentPercentages(
  healthy: number,
  suspended: number,
  attention: number,
  total: number,
) {
  if (total <= 0) {
    return { healthy: 100, suspended: 0, attention: 0 }
  }

  return {
    healthy: Math.round((healthy / total) * 100),
    suspended: Math.round((suspended / total) * 100),
    attention: Math.round((attention / total) * 100),
  }
}

export function HealthSegmentLegend() {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-app-text-muted">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
        Healthy
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
        Suspended
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />
        Needs attention
      </span>
    </div>
  )
}

export function HealthSegmentBar({
  healthy,
  suspended,
  attention,
  total,
}: {
  healthy: number
  suspended: number
  attention: number
  total: number
}) {
  const percentages = segmentPercentages(healthy, suspended, attention, total)
  const healthyWidth = total > 0 ? (healthy / total) * 100 : 100
  const suspendedWidth = total > 0 ? (suspended / total) * 100 : 0
  const attentionWidth = total > 0 ? (attention / total) * 100 : 0

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex min-w-0 items-center gap-2">
        <div
          className="flex h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-app-subtle"
          role="img"
          aria-label={`${percentages.healthy}% healthy, ${percentages.suspended}% suspended, ${percentages.attention}% needing attention`}
        >
          {healthyWidth > 0 ? (
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${healthyWidth}%` }}
            />
          ) : null}
          {suspendedWidth > 0 ? (
            <div
              className="h-full bg-amber-400 transition-all"
              style={{ width: `${suspendedWidth}%` }}
            />
          ) : null}
          {attentionWidth > 0 ? (
            <div
              className="h-full bg-red-500 transition-all"
              style={{ width: `${attentionWidth}%` }}
            />
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1.5 text-[10px] font-medium tabular-nums">
          <span className="w-7 text-right text-emerald-600 dark:text-emerald-400">{percentages.healthy}%</span>
          <span className="w-7 text-right text-amber-600 dark:text-amber-400">{percentages.suspended}%</span>
          <span className="w-7 text-right text-red-600 dark:text-red-400">{percentages.attention}%</span>
        </div>
      </div>
    </div>
  )
}
