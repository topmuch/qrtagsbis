'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  QrCode,
  LogOut,
  Menu,
  X,
  Bell,
  MessageCircle,
  Search,
  User,
  AlertTriangle,
  Home,
  CheckCircle,
  Moon,
  Sun,
  HelpCircle,
  BarChart3,
  Globe,
  ExternalLink,
  Copy,
  Tag,
  Wallet,
  MoreVertical
} from "lucide-react";
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import AdvertisementBanner from '@/components/AdvertisementBanner';

// Demo agency data - used as fallback
export const DEMO_AGENCY = {
  id: 'demo-agency-1',
  name: 'FRANCINE MAKELA',
  slug: 'diop',
  email: 'contact@francine-makela.com',
  phone: '+221 77 123 45 67',
  address: 'Dakar, Sénégal'
};

// Agency Context for sharing agency data across pages
interface AgencyContextType {
  agencyId: string;
  agencyName: string;
  agencyData: typeof DEMO_AGENCY | null;
  userName: string;
  userEmail: string;
}

export const AgencyContext = createContext<AgencyContextType>({
  agencyId: DEMO_AGENCY.id,
  agencyName: DEMO_AGENCY.name,
  agencyData: null,
  userName: '',
  userEmail: ''
});

export const useAgency = () => useContext(AgencyContext);

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

// Modern Sidebar Component - Orange Theme with Black Buttons
function Sidebar({ isOpen, setIsOpen, unreadMessages, onLogout, userName, agencySlug }: { isOpen: boolean; setIsOpen: (open: boolean) => void; unreadMessages?: number; onLogout: () => void; userName: string; agencySlug: string }) {
  const pathname = usePathname();
  
  const menuItems: MenuItem[] = [
    { label: "Tableau de bord", icon: <Home className="w-5 h-5" />, href: "/agence/tableau-de-bord" },
    { label: "Tags", icon: <QrCode className="w-5 h-5" />, href: "/agence/baggages" },
    { label: "Objets perdus", icon: <AlertTriangle className="w-5 h-5" />, href: "/agence/perdus" },
    { label: "Objets trouvés", icon: <CheckCircle className="w-5 h-5" />, href: "/agence/trouvailles" },
    { label: "Activations", icon: <Tag className="w-5 h-5" />, href: "/agence/activations" },
    { label: "Portefeuille", icon: <Wallet className="w-5 h-5" />, href: "/agence/portefeuille" },
    { label: "Assistance", icon: <MessageCircle className="w-5 h-5" />, href: "/agence/assistance", badge: unreadMessages },
    { label: "Rapports", icon: <BarChart3 className="w-5 h-5" />, href: "/agence/rapports" },
    { label: "Profil", icon: <User className="w-5 h-5" />, href: "/agence/profil" },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - QRTags Emerald Background */}
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

        {/* Agency Info */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/20">
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
              <span className="text-white font-semibold text-sm">{userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AG'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName || 'Agence'}</p>
              <p className="text-xs text-white/60">@{agencySlug || 'agence'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.href || 
                (item.href !== '/agence/tableau-de-bord' && pathname.startsWith(item.href));
              
              return (
                <li key={index}>
                  <Link
                    href={item.href}
                    className={`
                      relative flex items-center gap-3 px-4 py-2.5 rounded-xl
                      transition-all duration-200 group
                      ${isActive 
                        ? 'bg-black text-white shadow-lg' 
                        : 'bg-black text-white hover:bg-black/80'
                      }
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="shrink-0 text-white">
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
            
            {/* Separator */}
            <li className="my-3 border-t border-white/20" />
            
            {/* Contacter */}
            <li>
              <Link
                href="/agence/assistance"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black/30 text-white hover:bg-black/40 transition-all duration-200"
                onClick={() => setIsOpen(false)}
              >
                <HelpCircle className="w-5 h-5" />
                <span className="font-medium text-sm">Contacter</span>
              </Link>
            </li>
            
            {/* Blog */}
            <li>
              <Link
                href="/agence/blog"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black/30 text-white hover:bg-black/40 transition-all duration-200"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <span className="font-medium text-sm">📰 Blog QRTags</span>
              </Link>
            </li>
            
            {/* Advertisement in Sidebar */}
            <li className="mt-4">
              <AdvertisementBanner position="sidebar" />
            </li>
            
            {/* Déconnexion */}
            <li>
              <button
                onClick={onLogout}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-rose-500/20 text-white hover:bg-rose-500/30 transition-all duration-200 w-full"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Déconnexion</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}

// Modern Header Component
function Header({ unreadMessages, onMenuClick, userName, agencySlug, mobileActionsOpen, setMobileActionsOpen }: { unreadMessages?: number; onMenuClick: () => void; userName: string; agencySlug: string; mobileActionsOpen: boolean; setMobileActionsOpen: (open: boolean) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  const publicUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/agency/${agencySlug}`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
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
              placeholder="Rechercher un tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 w-full"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                // Trigger command modal - will be handled by parent
                window.dispatchEvent(new CustomEvent('openCommandModal'));
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              <Tag className="w-4 h-4" />
              <span className="hidden xl:inline">Générer des Tags</span>
            </Link>
            <Link
              href="/agence/perdus"
              className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-medium transition-colors border border-rose-200 dark:border-rose-800"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden xl:inline">Perdus</span>
            </Link>
            <Link
              href="/agence/trouvailles"
              className="flex items-center gap-2 px-3 py-1.5 bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] dark:text-[#10B981] rounded-xl text-sm font-medium transition-colors border border-[#10B981]/20 dark:border-[#10B981]/30"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden xl:inline">Trouvés</span>
            </Link>
          </div>
          
          {/* Public Page Button */}
          <div className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-[#10B981]/10 to-[#F59E0B]/10 dark:from-[#10B981]/20 dark:to-[#F59E0B]/20 border border-[#10B981]/30 rounded-xl px-3 py-1.5">
            <Globe className="w-4 h-4 text-[#10B981]" />
            <span className="text-sm text-slate-600 dark:text-slate-300">Page publique</span>
            <button
              onClick={handleCopy}
              className={`p-1 rounded-lg transition-colors ${copied ? 'text-[#10B981]' : 'hover:bg-[#10B981]/20 text-[#10B981]'}`}
              title="Copier le lien"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <Link
              href={`/agency/${agencySlug}`}
              target="_blank"
              className="p-1 rounded-lg hover:bg-[#10B981]/20 text-[#10B981] transition-colors"
              title="Voir la page"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
          
          {/* Mobile Quick Actions Dropdown */}
          <div className="lg:hidden relative">
            <button
              onClick={() => setMobileActionsOpen(!mobileActionsOpen)}
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Actions rapides"
            >
              <MoreVertical className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            {mobileActionsOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-2">
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent('openCommandModal'));
                    setMobileActionsOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Tag className="w-4 h-4" />
                  Générer des Tags
                </Link>
                <Link
                  href="/agence/perdus"
                  onClick={() => setMobileActionsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Objets perdus
                </Link>
                <Link
                  href="/agence/trouvailles"
                  onClick={() => setMobileActionsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-700 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Objets trouvés
                </Link>
                <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                <Link
                  href={`/agency/${agencySlug}`}
                  target="_blank"
                  onClick={() => setMobileActionsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Page publique
                </Link>
                <button
                  onClick={() => { handleCopy(); setMobileActionsOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copier le lien
                </button>
              </div>
            )}
          </div>
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-[#10B981]" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>
          
          {/* Notifications */}
          <Link 
            href="/agence/assistance"
            className="relative p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </Link>
          
          {/* User */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
            <div className="w-9 h-9 rounded-full bg-[#10B981] flex items-center justify-center">
              <span className="text-white font-semibold text-sm">{userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AG'}</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{userName || 'Agence'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Agence partenaire</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function AgencyRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { user, loading, logout, isAgency } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect if not authenticated or not agency
  useEffect(() => {
    if (loading) return;
    
    // Skip redirect for login page
    if (pathname === '/agence/connexion') return;
    
    if (!user) {
      router.replace('/agence/connexion');
      return;
    }
    
    if (!isAgency) {
      // User is authenticated but not agency - redirect to admin area
      router.replace('/admin/tableau-de-bord');
    }
  }, [user, loading, isAgency, router, pathname]);

  // Fetch unread messages count
  useEffect(() => {
    if (!user || !isAgency || pathname === '/agence/connexion') return;
    
    const fetchUnreadCount = async () => {
      try {
        const currentAgencyId = user?.agencyId || user?.agency?.id;
        if (!currentAgencyId) return; // Skip if no agency ID
        const res = await fetch(`/api/agency/messages?agencyId=${currentAgencyId}&count=true`);
        if (!res.ok) return; // Don't crash on API error
        const data = await res.json();
        if (data.unreadCount !== undefined) {
          setUnreadMessages(data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }
    };

    fetchUnreadCount();
    // Poll every 30 seconds for new messages
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, isAgency, pathname]);

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.replace('/agence/connexion');
  };

  // Get the actual agency ID from user data — no hardcoded fallback
  const agencyId = user?.agencyId || user?.agency?.id || '';
  const agencyName = user?.agency?.name || user?.name || DEMO_AGENCY.name;
  const agencySlug = user?.agency?.slug || DEMO_AGENCY.slug;
  const agencyData = user?.agency ? {
    id: user.agency.id,
    name: user.agency.name,
    slug: user.agency.slug,
    email: user.agency.email || DEMO_AGENCY.email,
    phone: user.agency.phone || DEMO_AGENCY.phone,
    address: user.agency.address || DEMO_AGENCY.address
  } : null;

  // Don't wrap login page with sidebar
  if (pathname === '/agence/connexion') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
          <span className="text-slate-500">Vérification...</span>
        </div>
      </div>
    );
  }

  if (!user || !isAgency) {
    return null;
  }

  return (
    <AgencyContext.Provider value={{
      agencyId,
      agencyName,
      agencyData: agencyData || DEMO_AGENCY,
      userName: user.name || 'Agence',
      userEmail: user.email
    }}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} unreadMessages={unreadMessages} onLogout={handleLogout} userName={user.name || 'Agence'} agencySlug={agencySlug} />

        <div className="flex-1 flex flex-col min-w-0">
          <Header unreadMessages={unreadMessages} onMenuClick={() => setSidebarOpen(true)} userName={user.name || 'Agence'} agencySlug={agencySlug} mobileActionsOpen={mobileActionsOpen} setMobileActionsOpen={setMobileActionsOpen} />

          <main className="flex-1 p-6 lg:p-8">
            {/* Advertisement Banner */}
            <AdvertisementBanner className="mb-6" />
            
            {children}
          </main>
        </div>
      </div>
    </AgencyContext.Provider>
  );
}
