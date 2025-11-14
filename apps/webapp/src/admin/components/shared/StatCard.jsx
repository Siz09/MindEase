import PropTypes from 'prop-types'

export default function StatCard({
  label,
  value,
  trend,
  icon,
  trendPositive = trend >= 0,
  trendPeriod = 'last week',
}) {
  const hasValidTrend = typeof trend === 'number' && !Number.isNaN(trend)

  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <p className="stat-label">{label}</p>
        <h3 className="stat-value">{typeof value === "number" ? value.toLocaleString() : value}</h3>
        {hasValidTrend && (
          <p className={`stat-trend ${trendPositive ? "positive" : "negative"}`}>
            {trendPositive ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}% vs {trendPeriod}
          </p>
        )}
      </div>
    </div>
  )
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  trend: PropTypes.number,
  icon: PropTypes.node.isRequired,
  trendPositive: PropTypes.bool,
  trendPeriod: PropTypes.string,
}
