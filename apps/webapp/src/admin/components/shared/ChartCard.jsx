import Card from "./Card"

export default function ChartCard({ title, subtitle, children, height = "300px" }) {
  return (
    <Card
      header={
        <div>
          <h3 className="card-header-title">{title}</h3>
          {subtitle && <p style={{ fontSize: "12px", color: "var(--gray)", margin: "4px 0 0 0" }}>{subtitle}</p>}
        </div>
      }
    >
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </Card>
  )
}
