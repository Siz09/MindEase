import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext';
import { useState, useRef, useEffect } from 'react';

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
};

const navItems = [
  {
    section: 'Main',
    items: [
      { to: '/admin', label: 'Dashboard', icon: navIcons.dashboard, end: true },
      { to: '/admin/users', label: 'User Management', icon: navIcons.users },
    ],
  },
  {
    section: 'Operations',
    items: [
      { to: '/admin/crisis-monitoring', label: 'Crisis Monitoring', icon: navIcons.crisis },
      { to: '/admin/content', label: 'Content Library', icon: navIcons.content },
    ],
  },
  {
    section: 'System',
    items: [
      { to: '/admin/analytics', label: 'Analytics', icon: navIcons.analytics },
      { to: '/admin/system', label: 'System Health', icon: navIcons.system },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: navIcons.audit },
    ],
  },
];

export default function AdminSidebar({ sidebarOpen, setSidebarOpen }) {
  const { logout, adminUser } = useAdminAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSettings = () => {
    navigate('/admin/settings');
    setUserMenuOpen(false);
    handleNavClick();
  };

  const userInitial = (adminUser?.email || 'A').charAt(0).toUpperCase();
  const userEmail = adminUser?.email || 'Admin';

  return (
    <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
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
                className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
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

      {/* ChatGPT-like User Profile */}
      <div className="admin-user-profile" ref={userMenuRef}>
        <button
          className="admin-user-profile-button"
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          aria-label="User menu"
        >
          <div className="admin-user-profile-avatar">{userInitial}</div>
          <div className="admin-user-profile-info">
            <div className="admin-user-profile-name">{userEmail}</div>
            <div className="admin-user-profile-role">Administrator</div>
          </div>
          <svg
            className={`admin-user-profile-chevron ${userMenuOpen ? 'open' : ''}`}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>

        {userMenuOpen && (
          <div className="admin-user-menu-dropdown">
            <button className="admin-user-menu-item" onClick={handleSettings}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
              </svg>
              <span>Settings</span>
            </button>
            <div className="admin-user-menu-divider" />
            <button className="admin-user-menu-item" onClick={handleLogout}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
