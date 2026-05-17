import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatMontant(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value)) + ' FCFA';
}

export function formatMontantCompact(value: number): string {
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
  if (value >= 1_000) return (value / 1_000).toFixed(0) + 'K';
  return Math.round(value).toString();
}

export function formatDate(dateStr: string, fmt = 'dd MMM yyyy HH:mm'): string {
  try {
    return format(parseISO(dateStr), fmt, { locale: fr });
  } catch {
    return dateStr;
  }
}

export function formatDateOnly(dateStr: string): string {
  return formatDate(dateStr, 'dd MMM yyyy');
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getInitiales(nomComplet: string): string {
  const parts = nomComplet.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return nomComplet.slice(0, 2).toUpperCase();
}

export function typeColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'intérieur':
    case 'interieur':
      return 'badge-info';
    case 'extérieur':
    case 'exterieur':
      return 'badge-green';
    case 'complet':
      return 'badge-orange';
    default:
      return 'badge-grey';
  }
}

export function stockStatusColor(status: string): string {
  switch (status) {
    case 'normal':  return 'badge-green';
    case 'faible':  return 'badge-warning';
    case 'rupture': return 'badge-red';
    default:        return 'badge-grey';
  }
}