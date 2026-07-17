'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  QrCode,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface MenuItem {
  label: string;
  icon?: string;
  href?: string;
  badge?: number;
  isCategory?: boolean;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  unreadMessages?: number;
}

// Couleur unique pour tout le sidebar
const SIDEBAR_COLOR = '#22855f';

export default function AdminLayout({ 
  children, 
  title, 
  subtitle, 
  icon, 
  iconBg = 'from-[#22855f] to-[#1a6b4a]',
  unreadMessages = 0 
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    // 🏠 Dashboard
    { label: "Tableau de bord", icon: "📊", href: "/admin/dashboard" },
    // 👥 Gestion des personnes
    { label: "GESTION DES PERSONNES", isCategory: true },
    { label: "Utilisateurs", icon: "👥", href: "/admin/utilisateurs" },
    { label: "Agences", icon: "🏢", href: "/admin/agences" },
    // 🧾 Produits & QR
    { label: "PRODUITS & QR", isCategory: true },
    { label: "Générer QR", icon: "🔢", href: "/admin/generer" },
    { label: "Les Étiquettes", icon: "🏷️", href: "/admin/etiquettes" },
    // 🧳 Voyageurs & Pèlerins
    { label: "VOYAGEURS & PÈLERINS", isCategory: true },
    { label: "Pèlerins Hajj", icon: "🕋", href: "/admin/hajj" },
    { label: "Voyageurs", icon: "✈️", href: "/admin/voyageurs" },
    // 📬 Opérations
    { label: "OPÉRATIONS", isCategory: true },
    { label: "Messages", icon: "📩", href: "/admin/messages", badge: unreadMessages },
    { label: "Trouvailles", icon: "🔍", href: "/admin/trouvailles" },
    // ⚙️ Configuration
    { label: "CONFIGURATION", isCategory: true },
    { label: "Paramètres", icon: "⚙️", href: "/admin/parametres" },
    { label: "APIs & Features", icon: "⚡", href: "/admin/parametres/fonctionnalites" },
  ];

  return (
    <div className="min-h-screen bg-[#0c1121] flex">
      {/* Sidebar */}
      <>
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-[260px] bg-[#080c1a] 
          transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col shadow-2xl
        `}>
          {/* Logo */}
          <div className="p-5 border-b border-[#1a1a3a]">
            <div className="flex items-center justify-between">
              <Link href="/admin/dashboard" className="flex items-center gap-2.5">
                <img src="/logo.png" alt="QRTags" className="h-16 w-auto object-contain brightness-0 invert" />
              </Link>
              <button
                className="lg:hidden text-[#94a3b8] hover:text-white transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 overflow-y-auto space-y-1.5">
            {menuItems.map((item, index) => {
              // Render category button
              if (item.isCategory) {
                return (
                  <div
                    key={index}
                    className="w-full flex items-center justify-center px-4 py-3 rounded-xl text-white font-bold text-sm uppercase tracking-wider transition-all duration-200 mt-4 first:mt-0"
                    style={{ backgroundColor: SIDEBAR_COLOR }}
                  >
                    {item.label}
                  </div>
                );
              }
              
              // Render menu button
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={index}
                  href={item.href!}
                  className={`
                    relative w-full flex items-center gap-3 px-4 py-3 rounded-xl 
                    text-left transition-all duration-200 group
                    ${isActive 
                      ? 'text-white shadow-lg' 
                      : 'bg-[#1e293b] text-white hover:bg-[#2d3748] hover:scale-[1.01] active:scale-[0.99]'
                    }
                  `}
                  style={isActive ? { backgroundColor: SIDEBAR_COLOR } : {}}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="text-lg group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                  <span className="font-medium text-sm flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="absolute top-2 right-3 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center animate-pulse shadow-lg">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer - Déconnexion */}
          <div className="p-4 border-t border-[#1a1a3a]">
            <Link
              href="/"
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#0d152a] text-[#94a3b8] hover:text-white hover:bg-[#1a2238] transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-sm">Déconnexion</span>
            </Link>
          </div>
        </aside>
      </>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-[#111827] border-b border-[#2d3748] p-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-[#f1f5f9] p-2 hover:bg-[#1e293b] rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[#f1f5f9] font-bold">{title}</span>
              {unreadMessages > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  {unreadMessages}
                </span>
              )}
            </div>
            <Link href="/" className="text-[#94a3b8] p-2 hover:bg-[#1e293b] rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center gap-4 mb-8">
            {icon && (
              <div className={`w-12 h-12 bg-gradient-to-br ${iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-[#f1f5f9]">{title}</h1>
              {subtitle && <p className="text-[#94a3b8] text-sm mt-0.5">{subtitle}</p>}
            </div>
          </div>

          {/* Page Content */}
          {children}
        </main>
      </div>
    </div>
  );
}
