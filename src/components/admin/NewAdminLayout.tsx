'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  QrCode,
  LogOut,
  Menu,
  X,
  Bell,
  Users,
  Building,
  Package,
  MessageSquare,
  Search,
  Settings,
  Globe,
  LayoutDashboard,
  Layers,
  ShoppingBag,
  Scan,
  HelpCircle,
  ChevronRight
} from "lucide-react";

// Modern color palette - Orange & Black theme
const COLORS = {
  primary: '#000000',      // Black for buttons
  secondary: '#2563EB',    // Orange
  accent: '#06b6d4',       // Cyan
  success: '#2563EB',      // Emerald
  warning: '#f59e0b',      // Amber
  danger: '#ef4444',       // Red
  sidebar: '#2563EB',      // Orange sidebar
};

interface MenuItem {
  label: string;
  icon: ReactNode;
  href?: string;
  badge?: number;
  isCategory?: boolean;
}

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  unreadMessages?: number;
}

export default function AdminLayout({ children, title, subtitle, unreadMessages = 0 }: AdminLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState(unreadMessages);

  // Fetch unread messages count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/messages/unread-count');
        const data = await res.json();
        setMessages(data.count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    fetchUnread();
  }, []);

  const menuItems: MenuItem[] = [
    { label: "Tableau de bord", icon: <LayoutDashboard className="w-5 h-5" />, href: "/admin/dashboard" },
    { label: "GESTION", icon: null, isCategory: true },
    { label: "Utilisateurs", icon: <Users className="w-5 h-5" />, href: "/admin/utilisateurs" },
    { label: "Agences", icon: <Building className="w-5 h-5" />, href: "/admin/agences" },
    { label: "PRODUITS", icon: null, isCategory: true },
    { label: "Générer QR", icon: <QrCode className="w-5 h-5" />, href: "/admin/generer" },
    { label: "Étiquettes", icon: <Layers className="w-5 h-5" />, href: "/admin/etiquettes" },
    { label: "VOYAGEURS", icon: null, isCategory: true },
    { label: "Pèlerins Hajj", icon: <Users className="w-5 h-5" />, href: "/admin/hajj" },
    { label: "Voyageurs", icon: <Package className="w-5 h-5" />, href: "/admin/voyageurs" },
    { label: "MESSAGES", icon: null, isCategory: true },
    { label: "Messages", icon: <MessageSquare className="w-5 h-5" />, href: "/admin/messages", badge: messages },
    { label: "Trouvailles", icon: <Scan className="w-5 h-5" />, href: "/admin/trouvailles" },
    { label: "CONFIGURATION", icon: null, isCategory: true },
    { label: "Paramètres", icon: <Settings className="w-5 h-5" />, href: "/admin/parametres" },
    { label: "Clés et API", icon: <Globe className="w-5 h-5" />, href: "/admin/parametres/fonctionnalites" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <>
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-[280px] bg-[#2563EB]
          transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col shadow-2xl
        `}>
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <Link href="/admin/dashboard" className="flex items-center">
              <img src="/logo.png" alt="QRTags" className="h-16 w-auto object-contain brightness-0 invert" />
            </Link>
            <button
              className="lg:hidden absolute top-6 right-4 text-white/60 hover:text-white transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item, index) => {
                if (item.isCategory) {
                  return (
                    <li key={index} className="pt-4 first:pt-0">
                      <span className="px-4 text-xs font-semibold text-white/40 uppercase tracking-wider">
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
                        relative flex items-center gap-3 px-4 py-3 rounded-xl
                        transition-all duration-200 group
                        ${isActive 
                          ? 'bg-black text-white shadow-lg' 
                          : 'text-white hover:bg-white/20 hover:text-white'
                        }
                      `}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className={`shrink-0 ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                        {item.icon}
                      </span>
                      <span className="font-medium text-sm flex-1">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="bg-[#ef4444] text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-white/10">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Déconnexion</span>
            </Link>
          </div>
        </aside>
      </>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              
              {/* Page Title */}
              {(title || subtitle) && (
                <div className="hidden lg:block">
                  {title && <h1 className="text-lg font-semibold text-slate-800">{title}</h1>}
                  {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
                </div>
              )}

              {/* Search */}
              <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2.5 w-80">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400 w-full"
                />
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Link href="/admin/messages" className="relative p-2.5 hover:bg-slate-100 rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-slate-600" />
                {messages > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#ef4444] rounded-full"></span>
                )}
              </Link>
              
              {/* User */}
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">SA</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-700">Super Admin</p>
                  <p className="text-xs text-slate-500">Administrateur</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8">
          {/* Mobile Page Title */}
          {(title || subtitle) && (
            <div className="lg:hidden mb-6">
              {title && <h1 className="text-xl font-bold text-slate-800">{title}</h1>}
              {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
