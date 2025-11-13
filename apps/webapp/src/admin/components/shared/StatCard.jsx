export default function StatCard({ label, value, trend, icon, trendPositive }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <p className="stat-label">{label}</p>
        <h3 className="stat-value">{typeof value === "number" ? value.toLocaleString() : value}</h3>
        {trend && (
          <p className={`stat-trend ${trendPositive ? "positive" : "negative"}`}>
            {trendPositive ? "↑" : "↓"} {Math.abs(trend)}% vs last week
          </p>
        )}
      </div>
    </div>
  )
}
