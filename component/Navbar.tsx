'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Sparkles } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Mon Stock', icon: Layers },
    { href: '/leboncoin', label: 'Annonces Leboncoin', icon: Sparkles },
  ];

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-black text-sm shadow-xs">
              3D
            </div>
            <div>
              <span className="font-extrabold text-neutral-900 text-base tracking-tight block leading-none">
                AJC 3D
              </span>
              <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">
                Gestion & Ventes
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-2xl border border-neutral-200/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-indigo-600' : ''} />
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