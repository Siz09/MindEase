"use client"

import { useAdminAuth } from "./AdminAuthContext"

export default function AdminHeader() {
  const { adminUser, logout } = useAdminAuth()

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <div className="admin-header-logo">
          <span>🧠</span>
          <span>MindEase</span>
        </div>
        <div className="admin-header-title">Admin Dashboard</div>
      </div>

      <div className="admin-header-right">
        <div className="admin-search-box">
          <span>🔍</span>
          <input type="text" placeholder="Search users, logs..." />
        </div>

        <div className="admin-header-actions">
          <div className="admin-notification-bell">
            🔔<span className="admin-notification-badge">3</span>
          </div>

          <div className="admin-user-menu">
            <div className="admin-user-info">
              <div className="admin-user-info-name">{adminUser?.email || "Admin"}</div>
              <div className="admin-user-info-role">Administrator</div>
            </div>
            <div className="admin-user-avatar">{(adminUser?.email || "A").charAt(0).toUpperCase()}</div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                logout()
                window.location.href = "/login"
              }}
              style={{ marginLeft: "var(--spacing-lg)" }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
