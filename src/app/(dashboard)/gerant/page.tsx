'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import StatCard from '@/components/ui/StatCard';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { formatMontant, formatMontantCompact, formatDate, todayISO, cn } from '@/lib/utils';
import type { Transaction, DashboardStats, LaveurCommission } from '@/lib/types';
import {
  TrendingUp, Receipt, Users, HandCoins, RefreshCw, Clock,
  ChevronRight, Car,
} from 'lucide-react';
import Link from 'next/link';

export default function GerantDashboard() {
  const { user } = useAuth();
  const lavageId = user?.lavage_id ?? '';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [commissions, setCommissions] = useState<{ total: number; par_laveur: LaveurCommission[] }>({ total: 0, par_laveur: [] });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    if (!lavageId) return;
    setLoading(true);
    try {
      const today = todayISO();
      const [statsRes, txRes, commRes] = await Promise.all([
        api.get(endpoints.statsLavage(lavageId)),
        api.get(endpoints.transactions(lavageId), { params: { start_date: today, end_date: today, per_page: 10 } }),
        api.get(endpoints.statsCommissions(lavageId)),
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (txRes.data?.success) {
        const raw = txRes.data.data;
        setTransactions(Array.isArray(raw) ? raw : (raw?.data ?? []));
      }
      if (commRes.data?.success) {
        setCommissions({
          total: commRes.data.data?.total_a_payer ?? 0,
          par_laveur: commRes.data.data?.par_laveur ?? [],
        });
      }
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [lavageId]);

  useEffect(() => { load(); }, [load]);

  const typeColors: Record<string, string> = {
    'intérieur': 'bg-info/10 text-info',
    'interieur':  'bg-info/10 text-info',
    'extérieur':  'bg-green/10 text-green-dark',
    'exterieur':  'bg-green/10 text-green-dark',
    'complet':    'bg-primary/10 text-primary',
  };

  return (
    <div className="animate-fade-in">
      <Header
        title="Tableau de bord"
        subtitle={`Gérant • ${formatDate(lastRefresh.toISOString(), 'HH:mm')}`}
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            icon={TrendingUp}
            label="CA du jour"
            value={stats ? formatMontantCompact(stats.ca_jour) + ' FCFA' : '—'}
            sub={stats ? formatMontant(stats.ca_mois) + ' ce mois' : undefined}
            gradient="primary"
            loading={loading}
          />
          <StatCard
            icon={Receipt}
            label="Transactions"
            value={stats?.transactions_jour?.toString() ?? '—'}
            sub={`${stats?.transactions_mois ?? 0} ce mois`}
            gradient="navy"
            loading={loading}
          />
          <StatCard
            icon={Users}
            label="Clients actifs"
            value={stats?.clients_actifs?.toString() ?? '—'}
            gradient="green"
            loading={loading}
          />
          <StatCard
            icon={HandCoins}
            label="Commissions"
            value={commissions.total > 0 ? formatMontantCompact(commissions.total) + ' FCFA' : '0 FCFA'}
            sub={`${commissions.par_laveur.length} laveur(s)`}
            gradient="warning"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent transactions */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-light-grey">
              <h2 className="font-bold text-navy">Transactions du jour</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={load}
                  disabled={loading}
                  className="text-text-light hover:text-navy transition-colors"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
                <Link
                  href="/gerant/transactions"
                  className="text-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Voir tout <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : transactions.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="Aucune transaction aujourd'hui"
                description="Les transactions enregistrées apparaîtront ici"
              />
            ) : (
              <div className="divide-y divide-light-grey">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 px-6 py-3 hover:bg-surface-variant/50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-surface-variant flex items-center justify-center">
                      <Car size={16} className="text-text-secondary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-xs font-semibold px-2 py-0.5 rounded-lg',
                            typeColors[tx.type_lavage?.toLowerCase()] ?? 'bg-light-grey text-text-secondary'
                          )}
                        >
                          {tx.type_lavage}
                        </span>
                        {tx.client && (
                          <span className="text-sm text-navy font-medium truncate">
                            {tx.client.nom_complet ?? tx.client.immatriculation}
                          </span>
                        )}
                        {!tx.client && (
                          <span className="text-sm text-text-light italic">Anonyme</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-text-light">
                        <Clock size={10} />
                        {formatDate(tx.created_at, 'HH:mm')}
                        {tx.laveur && <span>• {tx.laveur.nom_complet}</span>}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-navy">{tx.montant_formate}</div>
                      {tx.commission_laveur > 0 && (
                        <div className="text-xs text-warning">−{tx.commission_formate}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Commissions laveurs */}
          <div className="card">
            <div className="px-5 py-4 border-b border-light-grey">
              <h2 className="font-bold text-navy">Commissions laveurs</h2>
              <p className="text-xs text-text-light mt-0.5">Aujourd'hui</p>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : commissions.par_laveur.length === 0 ? (
              <EmptyState icon={HandCoins} title="Aucune commission" />
            ) : (
              <div className="divide-y divide-light-grey">
                {commissions.par_laveur.map((c) => (
                  <div key={c.laveur_id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-navy flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {c.nom_complet.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-navy truncate">{c.nom_complet}</div>
                      <div className="text-xs text-text-light">{c.nombre_lavages} lavage(s)</div>
                    </div>
                    <div className="text-sm font-bold text-warning flex-shrink-0">
                      {c.commission_formate}
                    </div>
                  </div>
                ))}

                <div className="px-5 py-3 bg-surface-variant">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-navy">Total</span>
                    <span className="font-bold text-primary">{formatMontant(commissions.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}