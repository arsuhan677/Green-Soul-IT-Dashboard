import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FolderKanban,
  Wrench,
  FileText,
  FileCheck,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Bell,
  UserCog,
  Shield,
  KeyRound,
  History,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import { usePermissions, PermissionKey } from '@/hooks/usePermissions';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface SidebarProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  permission?: PermissionKey;
}

const navigationItems: NavItem[] = [
  { name: 'ড্যাশবোর্ড', href: '/', icon: LayoutDashboard, permission: 'can_view_dashboard' },
  { name: 'লিড', href: '/leads', icon: Users, permission: 'can_manage_leads' },
  { name: 'ক্লায়েন্ট', href: '/clients', icon: UserCheck, permission: 'can_manage_clients' },
  { name: 'প্রজেক্ট', href: '/projects', icon: FolderKanban, permission: 'can_manage_projects' },
  { name: 'সার্ভিস', href: '/services', icon: Wrench, permission: 'can_manage_services' },
  { name: 'কোটেশন', href: '/quotations', icon: FileCheck, permission: 'can_manage_invoices' },
  { name: 'ইনভয়েস', href: '/invoices', icon: FileText, permission: 'can_manage_invoices' },
  { name: 'ইউজার', href: '/users', icon: UserCog, adminOnly: true },
  { name: 'ক্লায়েন্ট অ্যাক্সেস', href: '/client-access', icon: KeyRound, adminOnly: true },
  { name: 'রোল', href: '/roles', icon: Shield, adminOnly: true },
  { name: 'পারমিশন', href: '/permissions', icon: KeyRound, adminOnly: true },
  { name: 'কার্যকলাপ লগ', href: '/activity-logs', icon: History, adminOnly: true },
  { name: 'সেটিংস', href: '/settings', icon: Settings },
];

export function AppLayout({ children }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, roles, signOut } = useAuth();
  const { settings: companySettings } = useCompany();
  const { toast } = useToast();
  const { hasPermission, isAdmin, loading: permissionsLoading } = usePermissions();

  // Filter navigation based on permissions
  const filteredNavItems = navigationItems.filter(item => {
    // Admin-only items
    if (item.adminOnly) {
      return isAdmin;
    }
    // Permission-based items
    if (item.permission) {
      return hasPermission(item.permission);
    }
    // Always show (like settings)
    return true;
  });
  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "লগআউট সফল",
      description: "আপনি সফলভাবে লগআউট করেছেন",
    });
    navigate('/auth');
  };

  const getRoleName = () => {
    if (roles.includes('admin')) return 'অ্যাডমিন';
    if (roles.includes('sales')) return 'সেলস';
    if (roles.includes('project_manager')) return 'প্রজেক্ট ম্যানেজার';
    if (roles.includes('staff')) return 'স্টাফ';
    return 'ব্যবহারকারী';
  };

  const getInitial = () => {
    if (profile?.name) {
      return profile.name.charAt(0);
    }
    return 'ব';
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 bg-sidebar transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              <motion.div
                key="full-logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                {companySettings?.logo_url ? (
                  <img 
                    src={companySettings.logo_url} 
                    alt={companySettings.company_name_bn || 'Logo'} 
                    className="w-10 h-10 rounded-xl object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                    {companySettings?.company_name_bn?.charAt(0) || 'আ'}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-bold text-sidebar-foreground text-sm">
                    {companySettings?.company_name_bn || 'আশমা টেক'}
                  </span>
                  <span className="text-xs text-sidebar-foreground/60">সিআরএম</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="mini-logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mx-auto"
              >
                {companySettings?.logo_url ? (
                  <img 
                    src={companySettings.logo_url} 
                    alt={companySettings.company_name_bn || 'Logo'} 
                    className="w-10 h-10 rounded-xl object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                    {companySettings?.company_name_bn?.charAt(0) || 'আ'}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
          >
            <ChevronDown
              className={cn(
                'w-5 h-5 transition-transform duration-300',
                sidebarOpen ? 'rotate-90' : '-rotate-90'
              )}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'sidebar-item',
                  isActive && 'active'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence mode="wait">
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <NavLink
            to="/profile"
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer',
              !sidebarOpen && 'justify-center',
              location.pathname === '/profile' && 'bg-sidebar-accent'
            )}
          >
            <div className="w-9 h-9 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-medium text-sm">
              {getInitial()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{profile?.name || 'ব্যবহারকারী'}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{getRoleName()}</p>
              </div>
            )}
          </NavLink>
          {sidebarOpen && (
            <button 
              onClick={handleSignOut}
              className="sidebar-item w-full mt-2 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              <span>লগআউট</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border h-16">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-3">
            {companySettings?.logo_url ? (
              <img 
                src={companySettings.logo_url} 
                alt={companySettings.company_name_bn || 'Logo'} 
                className="w-9 h-9 rounded-xl object-contain"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                {companySettings?.company_name_bn?.charAt(0) || 'আ'}
              </div>
            )}
            <span className="font-bold text-foreground">
              {companySettings?.company_name_bn || 'আশমা টেক'} সিআরএম
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed right-0 top-0 bottom-0 z-50 w-72 bg-sidebar"
            >
              <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
                <span className="font-bold text-sidebar-foreground">মেনু</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {filteredNavItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn('sidebar-item', isActive && 'active')}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>
              {/* Mobile Logout Button */}
              <div className="p-4 border-t border-sidebar-border">
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="sidebar-item w-full text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-5 h-5" />
                  <span>লগআউট</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 min-h-screen transition-all duration-300',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20',
          'pt-16 lg:pt-0'
        )}
      >
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between h-16 px-6 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {navigationItems.find(item => item.href === location.pathname)?.name || 'ড্যাশবোর্ড'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
            </button>
            <div className="h-8 w-px bg-border" />
            <NavLink 
              to="/profile"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-sm">
                {getInitial()}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{profile?.name || 'ব্যবহারকারী'}</p>
                <p className="text-xs text-muted-foreground">{getRoleName()}</p>
              </div>
            </NavLink>
            <button 
              onClick={handleSignOut}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="লগআউট"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
