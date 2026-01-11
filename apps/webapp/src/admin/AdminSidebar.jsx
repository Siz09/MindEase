import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  BookOpen,
  BarChart3,
  Activity,
  FileText,
  Settings,
  LogOut,
  ChevronsUpDown,
  BadgeCheck,
  Bell,
  CreditCard,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../components/ui/Avatar';
import { cn } from '../lib/utils';
import { useSidebar } from '../components/ui/sidebar';
import { toast } from 'react-toastify';

const navIcons = {
  dashboard: LayoutDashboard,
  users: Users,
  crisis: AlertTriangle,
  content: BookOpen,
  analytics: BarChart3,
  system: Activity,
  audit: FileText,
  settings: Settings,
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

function NavUser({ user, onLogout, onSettings }) {
  const { isMobile } = useSidebar();
  const userInitial = (user?.email || 'A').charAt(0).toUpperCase();
  const userEmail = user?.email || 'Admin';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">{userInitial}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userEmail}</span>
                <span className="truncate text-xs">Administrator</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">{userInitial}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{userEmail}</span>
                  <span className="truncate text-xs">Administrator</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onSettings}>
                <BadgeCheck className="mr-2 h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
                <span className="ml-auto text-xs text-muted-foreground">Coming Soon</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
                <span className="ml-auto text-xs text-muted-foreground">Coming Soon</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function TeamSwitcher() {
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <LayoutDashboard className="h-4 w-4" />
      </div>
      <div className="flex flex-col group-data-[collapsible=icon]:hidden">
        <span className="text-sm font-semibold">MindEase</span>
        <span className="text-xs text-muted-foreground">Admin</span>
      </div>
    </div>
  );
}

export default function AdminSidebar() {
  const { logout, adminUser } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      toast.error(err?.message || 'Failed to log out. Please try again.');
      console.error('Logout error:', err);
    }
  };

  const handleSettings = () => {
    navigate('/admin/settings');
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-r">
      <SidebarHeader className="border-b p-4">
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        {navItems.map((section) => (
          <SidebarGroup key={section.section} className="mb-6">
            <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {section.section}
            </SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map(({ to, label, icon: Icon, end }) => {
                const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
                return (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={label}
                      className={cn(
                        'w-full justify-start gap-3',
                        isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      )}
                    >
                      <NavLink to={to} end={end}>
                        {Icon && <Icon className="h-4 w-4" />}
                        <span>{label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <NavUser user={adminUser} onLogout={handleLogout} onSettings={handleSettings} />
      </SidebarFooter>
    </Sidebar>
  );
}
