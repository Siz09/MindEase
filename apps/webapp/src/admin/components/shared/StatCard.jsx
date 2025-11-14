export default function StatCard({
  label,
  value,
  trend,
  icon,
  trendPositive,
  trendPeriod = 'last week',
}) {
  const hasValidTrend = typeof trend === 'number' && !Number.isNaN(trend)
  const actualTrendPositive = trendPositive ?? (hasValidTrend && trend >= 0)

  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <p className="stat-label">{label}</p>
        <h3 className="stat-value">{typeof value === "number" ? value.toLocaleString() : value}</h3>
        {hasValidTrend && (
          <p className={`stat-trend ${actualTrendPositive ? "positive" : "negative"}`}>
            {actualTrendPositive ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}% vs {trendPeriod}
          </p>
        )}
      </div>
    </div>
  )
}
