'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { formatMontant, formatMontantCompact, formatDate, todayISO, cn } from '@/lib/utils';
import type { Transaction, LaveurCommission, LavageFullStats, EvolutionPoint } from '@/lib/types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, Receipt, Users, HandCoins, RefreshCw, Clock,
  ChevronRight, Car, ArrowUpRight, ArrowDownRight, Wallet,
  UserCheck, Activity, Hash, BarChart2, Zap,
} from 'lucide-react';
import Link from 'next/link';

const SERVICE_COLORS = ['#FF6B00', '#1E3A8A', '#22C55E', '#3B82F6', '#F59E0B', '#EF4444'];

const typeColors: Record<string, string> = {
  'lavage simple':        'bg-green/10 text-green-dark border-green/20',
  'lavage complet':       'bg-info/10 text-info border-info/20',
  'lavage premium':       'bg-primary/10 text-primary border-primary/20',
  'nettoyage intérieur':  'bg-navy/10 text-navy border-navy/20',
  'cirage':               'bg-warning/10 text-warning border-warning/20',
  'polissage':            'bg-error/10 text-error border-error/20',
};

export default function GerantDashboard() {
  const { user } = useAuth();
  const lavageId = user?.lavage_id ?? '';

  const [stats, setStats] = useState<LavageFullStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [commissions, setCommissions] = useState<{ total: number; par_laveur: LaveurCommission[] }>({
    total: 0, par_laveur: [],
  });
  const [evolution, setEvolution] = useState<EvolutionPoint[]>([]);
  const [periode, setPeriode] = useState<'7' | '30'>('7');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadEvolution = useCallback(async (p: '7' | '30') => {
    if (!lavageId) return;
    try {
      const res = await api.get(endpoints.statsEvolution(lavageId), { params: { periode: p } });
      if (res.data?.success) setEvolution(res.data.data?.evolution ?? []);
    } catch { /* ignore */ }
  }, [lavageId]);

  const load = useCallback(async (isRefresh = false) => {
    if (!lavageId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const today = todayISO();
      const [statsRes, txRes, commRes] = await Promise.all([
        api.get(endpoints.statsLavage(lavageId)),
        api.get(endpoints.transactions(lavageId), { params: { start_date: today, end_date: today, per_page: 8 } }),
        api.get(endpoints.statsCommissions(lavageId)),
      ]);

      if (statsRes.data?.success) {
        const d = statsRes.data.data;
        setStats({
          ca_jour:            d.chiffre_affaires?.aujourd_hui     ?? 0,
          ca_hier:            d.chiffre_affaires?.hier              ?? 0,
          ca_mois:            d.chiffre_affaires?.ce_mois           ?? 0,
          ca_mois_dernier:    d.chiffre_affaires?.mois_dernier      ?? 0,
          ca_semaine:         d.chiffre_affaires?.cette_semaine     ?? 0,
          transactions_jour:  d.transactions?.aujourd_hui           ?? 0,
          transactions_mois:  d.transactions?.ce_mois               ?? 0,
          ticket_moyen:       d.transactions?.ticket_moyen          ?? 0,
          clients_total:      d.vue_ensemble?.clients_total         ?? 0,
          clients_actifs_mois:d.vue_ensemble?.clients_actifs_mois   ?? 0,
          laveurs_actifs:     d.vue_ensemble?.laveurs_actifs        ?? 0,
          types_lavage:       d.types_lavage                        ?? [],
          top_clients:        d.top_clients                         ?? [],
        });
      }
      if (txRes.data?.success) {
        const raw = txRes.data.data;
        setTransactions(Array.isArray(raw) ? raw : (raw?.data ?? []));
      }
      if (commRes.data?.success) {
        setCommissions({
          total:      commRes.data.data?.total_a_payer ?? 0,
          par_laveur: commRes.data.data?.par_laveur    ?? [],
        });
      }
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lavageId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadEvolution(periode); }, [loadEvolution, periode]);

  // Auto-refresh toutes les 60 secondes
  useEffect(() => {
    const interval = setInterval(() => load(true), 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const caVsHierPct   = stats && stats.ca_hier > 0
    ? ((stats.ca_jour - stats.ca_hier) / stats.ca_hier * 100) : null;
  const caVsMoisPct   = stats && stats.ca_mois_dernier > 0
    ? ((stats.ca_mois - stats.ca_mois_dernier) / stats.ca_mois_dernier * 100) : null;

  type CardDef = {
    label: string; value: string; sub?: string; trend: number | null;
    gradient: string; icon: React.ElementType; iconColor: string;
  };

  const cards: CardDef[] = stats ? [
    {
      label: 'CA Aujourd\'hui', value: formatMontantCompact(stats.ca_jour),
      sub: caVsHierPct !== null ? `${caVsHierPct >= 0 ? '+' : ''}${caVsHierPct.toFixed(1)}% vs hier` : 'vs hier',
      trend: caVsHierPct,
      gradient: 'from-primary/20 to-primary/5 border-primary/25', icon: TrendingUp, iconColor: '#FF6B00',
    },
    {
      label: 'CA Ce Mois', value: formatMontantCompact(stats.ca_mois),
      sub: caVsMoisPct !== null ? `${caVsMoisPct >= 0 ? '+' : ''}${caVsMoisPct.toFixed(1)}% vs mois passé` : undefined,
      trend: caVsMoisPct,
      gradient: 'from-navy/10 to-navy/3 border-navy/15', icon: Wallet, iconColor: '#1E3A5F',
    },
    {
      label: 'Transactions', value: stats.transactions_jour.toString(),
      sub: `${stats.transactions_mois} ce mois`, trend: null,
      gradient: 'from-green/15 to-green/3 border-green/20', icon: Receipt, iconColor: '#22C55E',
    },
    {
      label: 'Ticket Moyen', value: stats.ticket_moyen > 0 ? formatMontantCompact(stats.ticket_moyen) : '—',
      sub: 'Ce mois', trend: null,
      gradient: 'from-info/15 to-info/3 border-info/20', icon: Hash, iconColor: '#3B82F6',
    },
    {
      label: 'Clients Actifs', value: stats.clients_actifs_mois.toString(),
      sub: `${stats.clients_total} enregistrés`, trend: null,
      gradient: 'from-warning/15 to-warning/3 border-warning/20', icon: Users, iconColor: '#F59E0B',
    },
    {
      label: 'Laveurs Actifs', value: stats.laveurs_actifs.toString(),
      sub: commissions.total > 0 ? `${formatMontant(commissions.total)} comm.` : 'Aucune commission',
      trend: null,
      gradient: 'from-error/10 to-error/3 border-error/15', icon: UserCheck, iconColor: '#EF4444',
    },
  ] : [];

  return (
    <div className="animate-fade-in">
      <Header
        title="Tableau de bord"
        subtitle={`Gérant • Actualisé à ${formatDate(lastRefresh.toISOString(), 'HH:mm')}`}
      />

      <div className="p-6 space-y-6">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-light-grey animate-pulse h-[88px]" />
              ))
            : cards.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className={cn('rounded-2xl p-4 bg-gradient-to-br border', c.gradient)}>
                    <div className="flex items-center justify-between mb-1.5">
                      <Icon size={15} style={{ color: c.iconColor }} />
                      {c.trend !== null && (
                        <span className={cn('text-xs font-bold flex items-center gap-0.5',
                          c.trend >= 0 ? 'text-green-dark' : 'text-error')}>
                          {c.trend >= 0
                            ? <ArrowUpRight size={11} />
                            : <ArrowDownRight size={11} />}
                          {Math.abs(c.trend).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <div className="text-[22px] font-black text-navy leading-tight">{c.value}</div>
                    <div className="text-[11px] font-semibold mt-0.5" style={{ color: c.iconColor }}>
                      {c.label}
                    </div>
                    {c.sub && <div className="text-[11px] text-text-light mt-0.5 truncate">{c.sub}</div>}
                  </div>
                );
              })}
        </div>

        {/* ── Evolution + Services ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Graphique évolution CA */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-light-grey">
              <div className="flex items-center gap-2">
                <Activity size={17} className="text-primary" />
                <h2 className="font-bold text-navy">Évolution du CA</h2>
              </div>
              <div className="flex gap-1 bg-surface-variant rounded-xl p-1">
                {(['7', '30'] as const).map((p) => (
                  <button key={p} onClick={() => setPeriode(p)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                      periode === p ? 'bg-white text-navy shadow-sm' : 'text-text-secondary hover:text-navy'
                    )}>
                    {p}j
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5">
              {evolution.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center gap-2 text-text-light">
                  <Zap size={28} className="opacity-30" />
                  <span className="text-sm">Aucune donnée sur cette période</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={evolution} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v: string) => { const [,m,d] = v.split('-'); return `${d}/${m}`; }}
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      axisLine={false} tickLine={false} width={38}
                    />
                    <Tooltip
                      formatter={(v: number) => [formatMontant(v), 'CA']}
                      labelFormatter={(l: string) => {
                        const [y, m, d] = l.split('-');
                        return `${d}/${m}/${y}`;
                      }}
                      contentStyle={{
                        borderRadius: '12px', border: '1px solid #E5E7EB',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone" dataKey="ca"
                      stroke="#FF6B00" strokeWidth={2.5}
                      fill="url(#caGrad)" dot={false}
                      activeDot={{ r: 5, fill: '#FF6B00', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Services du mois */}
          <div className="card">
            <div className="px-5 py-4 border-b border-light-grey">
              <div className="flex items-center gap-2">
                <BarChart2 size={17} className="text-info" />
                <h2 className="font-bold text-navy">Services ce mois</h2>
              </div>
            </div>
            {loading ? <LoadingSpinner /> : !stats?.types_lavage?.length ? (
              <EmptyState icon={BarChart2} title="Aucune donnée" />
            ) : (
              <div className="p-5 space-y-4">
                {stats.types_lavage.slice(0, 6).map((t, i) => {
                  const maxNombre = Math.max(...stats.types_lavage.map((x) => x.nombre), 1);
                  const pct = Math.round((t.nombre / maxNombre) * 100);
                  return (
                    <div key={t.type_lavage}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-semibold text-navy truncate max-w-[65%]">{t.type_lavage}</span>
                        <span className="text-xs font-bold text-text-secondary">{t.nombre}x</span>
                      </div>
                      <div className="h-2.5 bg-light-grey rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: SERVICE_COLORS[i % SERVICE_COLORS.length] }}
                        />
                      </div>
                      <div className="text-xs text-text-light mt-0.5">{formatMontant(t.ca)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Transactions du jour + Commissions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transactions récentes */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-light-grey">
              <div className="flex items-center gap-2.5">
                <Receipt size={17} className="text-green-dark" />
                <h2 className="font-bold text-navy">Transactions du jour</h2>
                {transactions.length > 0 && (
                  <span className="bg-green/10 text-green-dark text-xs font-bold px-2 py-0.5 rounded-full border border-green/20">
                    {transactions.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => load(true)} disabled={refreshing}
                  className="text-text-light hover:text-navy transition-colors" title="Actualiser">
                  <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                </button>
                <Link href="/gerant/transactions"
                  className="text-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                  Tout voir <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            {loading ? <LoadingSpinner /> : transactions.length === 0 ? (
              <EmptyState icon={Receipt} title="Aucune transaction aujourd'hui"
                description="Les transactions apparaîtront ici en temps réel" />
            ) : (
              <div className="divide-y divide-light-grey">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-primary/3 transition-colors group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center">
                      <Car size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded-lg border',
                          typeColors[tx.type_lavage?.toLowerCase()] ?? 'bg-light-grey text-text-secondary border-light-grey'
                        )}>
                          {tx.type_lavage}
                        </span>
                        {tx.client ? (
                          <span className="text-sm text-navy font-medium truncate">
                            {tx.client.nom_complet ?? tx.client.immatriculation}
                          </span>
                        ) : (
                          <span className="text-sm text-text-light italic">Anonyme</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-text-light">
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
          <div className="card flex flex-col">
            <div className="px-5 py-4 border-b border-light-grey">
              <div className="flex items-center gap-2">
                <HandCoins size={17} className="text-warning" />
                <div>
                  <h2 className="font-bold text-navy">Commissions</h2>
                  <p className="text-xs text-text-light">À payer aujourd'hui</p>
                </div>
              </div>
            </div>

            {loading ? <LoadingSpinner /> : commissions.par_laveur.length === 0 ? (
              <EmptyState icon={HandCoins} title="Aucune commission" />
            ) : (
              <>
                <div className="divide-y divide-light-grey flex-1">
                  {commissions.par_laveur.map((c) => (
                    <div key={c.laveur_id} className="px-5 py-3 flex items-center gap-3 hover:bg-surface-variant/40 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-gradient-navy flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {c.nom_complet.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-navy truncate">{c.nom_complet}</div>
                        <div className="text-xs text-text-light">
                          {c.nombre_lavages} lavage(s) • {formatMontant(c.ca_genere)}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-warning flex-shrink-0">{c.commission_formate}</div>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 bg-gradient-to-r from-warning/15 to-warning/5 border-t border-warning/20 rounded-b-2xl">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-navy">Total à verser</span>
                    <span className="font-black text-warning text-lg">{formatMontant(commissions.total)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}