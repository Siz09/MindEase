import { NavLink } from "react-router-dom"
import { useAdminAuth } from "./AdminAuthContext"

const navIcons = {
  dashboard: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="12" width="5" height="9" rx="1" />
      <rect x="10" y="7" width="5" height="14" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  ),
  users: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="8" r="3" />
      <path d="M2 21c0-2.5 2.5-4 5-4s5 1.5 5 4" />
      <path d="M12 17c0-2.2 2.2-3.6 4.5-3.6S21 14.8 21 17" />
    </svg>
  ),
  crisis: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 3 21 19H3z" />
      <line x1="12" y1="8" x2="12" y2="13" />
      <circle cx="12" cy="17" r="1" />
    </svg>
  ),
  content: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 4h7l4 3 4-3h5v16H19l-4-3-4 3H4z" />
      <path d="M4 12h16" />
    </svg>
  ),
  analytics: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <polyline points="3 17 9 11 13 15 21 6" />
      <polyline points="3 12 6 12 8 6 12 12 16 9 21 9" />
    </svg>
  ),
  system: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
      <path d="M5 5l2 2" />
      <path d="M17 17l2 2" />
      <path d="M5 19l2-2" />
      <path d="M17 7l2-2" />
    </svg>
  ),
  audit: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9 3h6v4H9z" />
      <rect x="4" y="7" width="16" height="14" rx="2" />
      <path d="M8 13h8" />
      <path d="M8 17h8" />
    </svg>
  ),
  settings: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <circle cx="7.5" cy="7" r="2" />
      <line x1="4" y1="17" x2="20" y2="17" />
      <circle cx="16.5" cy="17" r="2" />
    </svg>
  ),
}

const navItems = [
  {
    section: "Main",
    items: [
      { to: "/admin", label: "Dashboard", icon: navIcons.dashboard, end: true },
      { to: "/admin/users", label: "User Management", icon: navIcons.users },
    ],
  },
  {
    section: "Operations",
    items: [
      { to: "/admin/crisis-monitoring", label: "Crisis Monitoring", icon: navIcons.crisis },
      { to: "/admin/content", label: "Content Library", icon: navIcons.content },
    ],
  },
  {
    section: "System",
    items: [
      { to: "/admin/analytics", label: "Analytics", icon: navIcons.analytics },
      { to: "/admin/system", label: "System Health", icon: navIcons.system },
      { to: "/admin/audit-logs", label: "Audit Logs", icon: navIcons.audit },
    ],
  },
  {
    section: "Configuration",
    items: [{ to: "/admin/settings", label: "Settings", icon: navIcons.settings }],
  },
]

export default function AdminSidebar({ sidebarOpen, setSidebarOpen }) {
  const { logout } = useAdminAuth()

  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false)
    }
  }

  return (
    <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="admin-sidebar-brand">MindEase Admin</div>

      <nav className="admin-nav">
        {navItems.map((section) => (
          <div key={section.section} className="admin-nav-section">
            <div className="admin-nav-section-title">{section.section}</div>
            {section.items.map(({ to, label, icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
                onClick={handleNavClick}
              >
                <span className="admin-nav-icon" aria-hidden="true">
                  {icon}
                </span>
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <button
          className="btn btn-ghost"
          onClick={() => {
            logout()
            window.location.href = "/login"
          }}
          style={{ width: "100%" }}
        >
          Sign Out
        </button>
        <div style={{ marginTop: "var(--spacing-md)", textAlign: "center" }}>v1.0 • Admin Only</div>
      </div>
    </aside>
  )
}
