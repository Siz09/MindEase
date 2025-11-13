export default function Badge({ type = "info", children }) {
  return <span className={`badge badge-${type}`}>{children}</span>
}
