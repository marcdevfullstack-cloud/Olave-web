'use client';

import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bell, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
}

export default function Header({ title, subtitle, onMenuToggle }: HeaderProps) {
  const { user } = useAuth();
  const today = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  return (
    <header className="h-16 bg-white border-b border-light-grey px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-text-secondary hover:text-navy transition-colors"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-lg font-bold text-navy leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-text-light capitalize">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden sm:block text-xs text-text-light capitalize">{today}</span>

        <button className="relative w-9 h-9 rounded-xl bg-surface-variant flex items-center justify-center hover:bg-light-grey transition-colors">
          <Bell size={16} className="text-text-secondary" />
        </button>

        {user && (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {user.prenom?.[0]?.toUpperCase()}{user.nom?.[0]?.toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-navy leading-tight">
                {user.prenom} {user.nom}
              </div>
              <div className="text-xs text-text-light capitalize">{user.role}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}