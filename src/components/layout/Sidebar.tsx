'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Receipt, Users, UserCheck, ShoppingBag,
  Activity, UserCog, Heart, LogOut, ChevronLeft, ChevronRight,
  History, DollarSign, Camera, CreditCard, BarChart2, FileText, Headphones,
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const gerantNav: NavItem[] = [
  { href: '/gerant',              icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/gerant/transactions', icon: Receipt,          label: 'Transactions' },
  { href: '/gerant/clients',      icon: Users,            label: 'Clients' },
  { href: '/gerant/laveurs',      icon: UserCheck,        label: 'Laveurs' },
  { href: '/gerant/boutique',     icon: ShoppingBag,      label: 'Boutique' },
  { href: '/gerant/historique',   icon: History,          label: 'Historique' },
  { href: '/gerant/rapports',     icon: FileText,         label: 'Rapports PDF' },
];

const proprietaireNav: NavItem[] = [
  { href: '/proprietaire',              icon: LayoutDashboard, label: 'Vue d\'ensemble' },
  { href: '/proprietaire/activite',     icon: Activity,        label: 'Activité' },
  { href: '/proprietaire/employes',     icon: UserCog,         label: 'Employés' },
  { href: '/proprietaire/gerants',      icon: Users,           label: 'Gérants' },
  { href: '/proprietaire/salaires',     icon: DollarSign,      label: 'Salaires' },
  { href: '/proprietaire/fidelite',     icon: Heart,           label: 'Fidélité' },
  { href: '/proprietaire/boutique',     icon: ShoppingBag,     label: 'Boutique' },
  { href: '/proprietaire/surveillance', icon: Camera,          label: 'Surveillance' },
  { href: '/proprietaire/stats',        icon: BarChart2,       label: 'Stats avancées' },
  { href: '/proprietaire/rapports',     icon: FileText,        label: 'Rapports PDF' },
  { href: '/proprietaire/abonnement',   icon: CreditCard,      label: 'Abonnement' },
  { href: '/proprietaire/support',      icon: Headphones,      label: 'Support 24/7' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const nav = user?.role === 'proprietaire' ? proprietaireNav : gerantNav;

  function isActive(href: string) {
    if (href.split('/').length === 2) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-30 flex flex-col transition-all duration-300 ease-in-out',
        'bg-gradient-to-b from-navy to-navy-light',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-white/10',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
          <Image src="/logo.png" alt="Olave" width={32} height={32} className="object-contain" />
        </div>
        {!collapsed && (
          <span className="text-white font-black text-xl tracking-tight">olave</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group relative',
                active
                  ? 'bg-white/15 text-white shadow-inner'
                  : 'text-white/60 hover:bg-white/8 hover:text-white',
                collapsed && 'justify-center'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full" />
              )}
              <item.icon
                size={18}
                className={cn(
                  'flex-shrink-0 transition-transform group-hover:scale-110',
                  active ? 'text-primary-light' : ''
                )}
              />
              {!collapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-2 pb-4 border-t border-white/10 pt-4 space-y-1">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2">
            <div className="text-white text-sm font-semibold truncate">
              {user.prenom} {user.nom}
            </div>
            <div className="text-white/50 text-xs capitalize">{user.role}</div>
          </div>
        )}

        <button
          onClick={logout}
          title={collapsed ? 'Déconnexion' : undefined}
          className={cn(
            'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-white/60',
            'hover:bg-error/15 hover:text-error transition-all duration-200',
            collapsed && 'justify-center'
          )}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Déconnexion</span>}
        </button>
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-light-grey rounded-full flex items-center justify-center shadow-card hover:shadow-card-hover transition-shadow z-10"
      >
        {collapsed
          ? <ChevronRight size={12} className="text-navy" />
          : <ChevronLeft size={12} className="text-navy" />
        }
      </button>
    </aside>
  );
}