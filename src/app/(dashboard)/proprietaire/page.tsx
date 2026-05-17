'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import StatCard from '@/components/ui/StatCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { formatMontant, formatMontantCompact } from '@/lib/utils';
import type { Lavage, LavageStats } from '@/lib/types';
import { TrendingUp, Receipt, Users, UserCheck, Activity, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface LavageWithStats extends Lavage {
  stats?: LavageStats;
}

export default function ProprietaireDashboard() {
  const { user } = useAuth();
  const [lavages, setLavages] = useState<LavageWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ ca_jour: 0, tx_jour: 0, ca_mois: 0 });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get(endpoints.lavages);
      if (res.data?.success) {
        const list: Lavage[] = res.data.data ?? [];
        const withStats: LavageWithStats[] = await Promise.all(
          list.map(async (l): Promise<LavageWithStats> => {
            try {
              const s = await api.get(endpoints.statsLavage(l.id));
              return { ...l, stats: s.data?.success ? s.data.data : undefined };
            } catch {
              return { ...l };
            }
          })
        );
        setLavages(withStats);

        const tot = withStats.reduce(
          (acc, l) => ({
            ca_jour: acc.ca_jour + (l.stats?.ca_jour ?? 0),
            tx_jour: acc.tx_jour + (l.stats?.transactions_jour ?? 0),
            ca_mois: acc.ca_mois + (l.stats?.ca_mois ?? 0),
          }),
          { ca_jour: 0, tx_jour: 0, ca_mois: 0 }
        );
        setTotals(tot);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="animate-fade-in">
      <Header title="Vue d'ensemble" subtitle={`Propriétaire • ${user?.prenom} ${user?.nom}`} />

      <div className="p-6 space-y-6">
        {/* Global stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={TrendingUp}
            label="CA total du jour"
            value={formatMontantCompact(totals.ca_jour) + ' FCFA'}
            sub={formatMontant(totals.ca_mois) + ' ce mois'}
            gradient="primary"
            loading={loading}
          />
          <StatCard
            icon={Receipt}
            label="Transactions du jour"
            value={totals.tx_jour.toString()}
            gradient="navy"
            loading={loading}
          />
          <StatCard
            icon={Activity}
            label="Lavages actifs"
            value={lavages.filter((l) => l.is_active).length.toString()}
            sub={`${lavages.length} au total`}
            gradient="green"
            loading={loading}
          />
        </div>

        {/* Per-lavage cards */}
        <div>
          <h2 className="text-base font-bold text-navy mb-4">Mes lavages</h2>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {lavages.map((lavage) => (
                <div key={lavage.id} className="card p-5 hover:shadow-card-hover transition-shadow group">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-navy text-base">{lavage.nom}</h3>
                      {lavage.adresse && (
                        <p className="text-xs text-text-light mt-0.5">{lavage.adresse}</p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      lavage.is_active ? 'bg-green/10 text-green-dark' : 'bg-light-grey text-text-secondary'
                    }`}>
                      {lavage.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: 'CA jour', value: lavage.stats ? formatMontantCompact(lavage.stats.ca_jour) + ' FCFA' : '—', icon: TrendingUp },
                      { label: 'Transactions', value: lavage.stats?.transactions_jour?.toString() ?? '—', icon: Receipt },
                      { label: 'Clients', value: lavage.stats?.clients_actifs?.toString() ?? '—', icon: Users },
                      { label: 'Laveurs', value: lavage.stats?.laveurs_actifs?.toString() ?? '—', icon: UserCheck },
                    ].map((s) => (
                      <div key={s.label} className="bg-surface-variant rounded-xl p-3">
                        <div className="text-lg font-bold text-navy">{s.value}</div>
                        <div className="text-xs text-text-secondary">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/proprietaire/activite"
                    className="flex items-center justify-between text-sm font-semibold text-primary hover:gap-2 transition-all group-hover:underline"
                  >
                    Voir l'activité <ChevronRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}