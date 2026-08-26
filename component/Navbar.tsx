'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Package, LayoutDashboard, Boxes, History, BarChart3, Sparkles 
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Actions & Achats', icon: LayoutDashboard },
    { href: '/stock', label: 'État des stocks', icon: Boxes },
    { href: '/history', label: 'Journaux', icon: History },
    { href: '/stats', label: 'Statistiques', icon: BarChart3 },
    { href: '/leboncoin', label: 'Leboncoin', icon: Sparkles },
  ];

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Logo & Titre */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-inner">
              <Package size={22} />
            </div>
            <div>
              <span className="font-black text-white text-lg tracking-tight block leading-tight">
                AJC 3D
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Gestion Filament & Ventes
              </span>
            </div>
          </div>

          {/* Menu de navigation multi-pages */}
          <nav className="flex flex-wrap items-center bg-slate-900 p-1.5 rounded-2xl border border-slate-800 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={16} className={item.href === '/leboncoin' && !isActive ? 'text-amber-400' : ''} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

        </div>
      </div>
    </header>
  );
}