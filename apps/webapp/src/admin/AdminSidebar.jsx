"use client"

import { NavLink } from "react-router-dom"
import { useAdminAuth } from "./AdminAuthContext"

export default function AdminSidebar({ sidebarOpen, setSidebarOpen }) {
  const { logout } = useAdminAuth()

  const navItems = [
    {
      section: "Main",
      items: [
        { to: "/admin", label: "Dashboard", icon: "📊", end: true },
        { to: "/admin/users", label: "User Management", icon: "👥" },
      ],
    },
    {
      section: "Operations",
      items: [
        { to: "/admin/crisis-monitoring", label: "Crisis Monitoring", icon: "🚨" },
        { to: "/admin/content", label: "Content Library", icon: "📚" },
      ],
    },
    {
      section: "System",
      items: [
        { to: "/admin/analytics", label: "Analytics", icon: "📈" },
        { to: "/admin/system", label: "System Health", icon: "⚙️" },
        { to: "/admin/audit-logs", label: "Audit Logs", icon: "📋" },
      ],
    },
    {
      section: "Configuration",
      items: [{ to: "/admin/settings", label: "Settings", icon: "🔧" }],
    },
  ]

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
                <span className="admin-nav-icon">{icon}</span>
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
