'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  QrCode,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Search,
  LayoutDashboard,
  Layers,
  Users,
  Building2,
  MessageSquare,
  Settings,
  BarChart3,
  Shield,
  PlusCircle,
  CreditCard,
  Wallet,
  UserCheck,
  Megaphone,
  FileText,
  ToggleRight,
} from "lucide-react";
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/admin/NotificationBell';
import { PERMISSIONS, ROLES, ROLE_COLORS, Permission } from '@/lib/permissions';

// Types
interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  badge?: number;
  isCategory?: boolean;
  permission?: Permission;
  roles?: string[];
}

// Modern Sidebar Component - Emerald Theme
function Sidebar({
  isOpen,
  setIsOpen,
  unreadMessages,
  onLogout,
  userName,
  userRole
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  unreadMessages?: number;
  onLogout: () => void;
  userName: string;
  userRole: string;
}) {
  const pathname = usePathname();
  const { can } = useAuth();

  // Menu items with permissions
  const allMenuItems: MenuItem[] = useMemo(() => [
    // Dashboard
    { label: "Tableau de bord", icon: <LayoutDashboard className="w-5 h-5" />, href: "/admin/tableau-de-bord", permission: PERMISSIONS.VIEW_DASHBOARD },

    // Tags Category
    { label: "TAGS & QR", icon: null, isCategory: true },

    // Tags / QR Codes
    { label: "Tags / QR Codes", icon: <QrCode className="w-5 h-5" />, href: "/admin/etiquettes", permission: PERMISSIONS.VIEW_TAGS },

    // Generate tags
    { label: "Générer des tags", icon: <PlusCircle className="w-5 h-5" />, href: "/admin/generer", permission: PERMISSIONS.GENERATE_QR },

    // Management Category
    { label: "GESTION", icon: null, isCategory: true },

    // Agencies
    { label: "Agences", icon: <Building2 className="w-5 h-5" />, href: "/admin/agences", permission: PERMISSIONS.VIEW_AGENCIES, roles: ['superadmin', 'admin'] },

    // Agency Types
    { label: "Types d'agences", icon: <Layers className="w-5 h-5" />, href: "/admin/types-agences", permission: PERMISSIONS.MANAGE_AGENCY_TYPES, roles: ['superadmin', 'admin'] },

    // Users
    { label: "Utilisateurs", icon: <Users className="w-5 h-5" />, href: "/admin/utilisateurs", permission: PERMISSIONS.VIEW_USERS, roles: ['superadmin', 'admin'] },

    // Subscriptions
    { label: "Abonnements", icon: <CreditCard className="w-5 h-5" />, href: "/admin/abonnements", permission: PERMISSIONS.MANAGE_SUBSCRIPTIONS, roles: ['superadmin', 'admin'] },

    // Payments
    { label: "Paiements", icon: <Wallet className="w-5 h-5" />, href: "/admin/paiements", permission: PERMISSIONS.MANAGE_PAYMENTS, roles: ['superadmin', 'admin'] },

    // Communication Category
    { label: "COMMUNICATION", icon: null, isCategory: true },

    // Messages
    { label: "Messages", icon: <MessageSquare className="w-5 h-5" />, href: "/admin/messages", badge: unreadMessages, permission: PERMISSIONS.VIEW_MESSAGES },

    // Found items
    { label: "Objets trouvés", icon: <Search className="w-5 h-5" />, href: "/admin/trouvailles", permission: PERMISSIONS.VIEW_TROUVAILLES },

    // CRM
    { label: "CRM", icon: <UserCheck className="w-5 h-5" />, href: "/admin/crm", permission: PERMISSIONS.VIEW_CRM, roles: ['superadmin', 'admin', 'agent'] },

    // Analysis Category
    { label: "ANALYSE", icon: null, isCategory: true },

    // Reports
    { label: "Rapports", icon: <BarChart3 className="w-5 h-5" />, href: "/admin/rapports", permission: PERMISSIONS.VIEW_REPORTS },

    // Marketing
    { label: "Marketing", icon: <Megaphone className="w-5 h-5" />, href: "/admin/marketing", roles: ['superadmin'] },

    // Blog
    { label: "Blog", icon: <FileText className="w-5 h-5" />, href: "/admin/blog", permission: PERMISSIONS.VIEW_MESSAGES, roles: ['superadmin', 'admin'] },

    // Settings Category
    { label: "PARAMÈTRES", icon: null, isCategory: true, permission: PERMISSIONS.VIEW_SETTINGS },

    // Security
    { label: "Sécurité", icon: <Shield className="w-5 h-5" />, href: "/admin/securite", permission: PERMISSIONS.VIEW_SETTINGS, roles: ['superadmin', 'admin'] },

    // Settings
    { label: "Paramètres", icon: <Settings className="w-5 h-5" />, href: "/admin/parametres", permission: PERMISSIONS.VIEW_SETTINGS },

    // Features
    { label: "Fonctionnalités", icon: <ToggleRight className="w-5 h-5" />, href: "/admin/parametres/fonctionnalites", permission: PERMISSIONS.MANAGE_FEATURES, roles: ['superadmin', 'admin'] },
  ], [unreadMessages]);

  // Filter menu items based on permissions and remove empty categories
  const menuItems = useMemo(() => {
    const visibleItems = allMenuItems.filter(item => {
      if (item.isCategory) return true;

      if (item.permission && !can(item.permission)) {
        return false;
      }

      if (item.roles && item.roles.length > 0) {
        return item.roles.includes(userRole);
      }

      return true;
    });

    // Remove categories with no visible children
    return visibleItems.filter((item, index) => {
      if (!item.isCategory) return true;
      // Check if next item is not a category (has visible children)
      const nextItem = visibleItems[index + 1];
      return nextItem && !nextItem.isCategory;
    });
  }, [allMenuItems, can, userRole]);

  // Get role display info
  const roleLabel = ROLES[userRole as keyof typeof ROLES] || userRole;
  const roleColor = ROLE_COLORS[userRole as keyof typeof ROLE_COLORS] || 'bg-gray-500';

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Emerald Background */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[280px] bg-[#10B981]
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col shadow-2xl
      `}>
        {/* Close button (mobile) */}
        <div className="p-4 lg:hidden flex justify-end">
          <button
            className="text-white/60 hover:text-white transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Brand */}
        <div className="px-6 py-4 hidden lg:flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">QRTags</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto pt-2 lg:pt-0">
          <ul className="space-y-1">
            {menuItems.map((item, index) => {
              if (item.isCategory) {
                return (
                  <li key={index} className="pt-4 first:pt-0">
                    <span className="px-4 text-xs font-semibold text-white/70 uppercase tracking-wider">
                      {item.label}
                    </span>
                  </li>
                );
              }

              const isActive = pathname === item.href;

              return (
                <li key={index}>
                  <Link
                    href={item.href!}
                    className={`
                      relative flex items-center gap-3 px-4 py-2.5 rounded-xl
                      transition-all duration-200 group
                      ${isActive
                        ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                        : 'text-white/90 hover:bg-white/10 hover:text-white'
                      }
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="shrink-0">
                      {item.icon}
                    </span>
                    <span className="font-medium text-sm flex-1">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Logout Button */}
          <div className="mt-6 pt-4 border-t border-white/20">
            <button
              onClick={onLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/80 hover:bg-red-500/30 hover:text-white transition-all duration-200 w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Déconnexion</span>
            </button>
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/20">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm">
            <div className={`w-10 h-10 rounded-full ${roleColor} flex items-center justify-center`}>
              <span className="text-white font-semibold text-sm">
                {userName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName || 'Utilisateur'}</p>
              <p className="text-xs text-white/60">{roleLabel}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// Modern Header Component
function Header({
  unreadMessages,
  onMenuClick,
  userName,
  userRole
}: {
  unreadMessages?: number;
  onMenuClick: () => void;
  userName: string;
  userRole: string;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, toggleTheme } = useTheme();

  const roleLabel = ROLES[userRole as keyof typeof ROLES] || userRole;
  const roleColor = ROLE_COLORS[userRole as keyof typeof ROLE_COLORS] || 'bg-gray-500';

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>

          {/* Search */}
          <div className="hidden md:flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 w-80">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 w-full"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-emerald-500" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>

          {/* Notifications Bell with Dropdown */}
          <NotificationBell />

          {/* User */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
            <div className={`w-9 h-9 rounded-full ${roleColor} flex items-center justify-center`}>
              <span className="text-white font-semibold text-sm">
                {userName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{userName || 'Utilisateur'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { user, loading, logout, isSuperAdmin, isAdmin, isAgent } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if user has admin access (superadmin, admin, or agent)
  const hasAdminAccess = isSuperAdmin || isAdmin || isAgent;

  // Redirect if not authenticated or not admin role
  useEffect(() => {
    if (loading) return;

    // Skip redirect for login page
    if (pathname === '/admin/connexion') return;

    if (!user) {
      router.replace('/admin/connexion');
      return;
    }

    if (!hasAdminAccess) {
      // User is authenticated but not admin role - redirect to agency area
      router.replace('/agence/tableau-de-bord');
    }
  }, [user, loading, hasAdminAccess, router, pathname]);

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.replace('/admin/connexion');
  };

  // Don't wrap login page with sidebar
  if (pathname === '/admin/connexion') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-slate-500">Vérification...</span>
        </div>
      </div>
    );
  }

  if (!user || !hasAdminAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        unreadMessages={unreadMessages}
        onLogout={handleLogout}
        userName={user.name || 'Utilisateur'}
        userRole={user.role}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          unreadMessages={unreadMessages}
          onMenuClick={() => setSidebarOpen(true)}
          userName={user.name || 'Utilisateur'}
          userRole={user.role}
        />

        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
