'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { formatMontant, formatMontantCompact } from '@/lib/utils';
import type { Lavage, ProprietaireDashboardStats, EvolutionPoint } from '@/lib/types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, Receipt, Users, UserCheck, Activity, ChevronRight,
  ArrowUpRight, ArrowDownRight, Wallet, RefreshCw, Clock,
  Building2, Zap, DollarSign, BarChart2,
} from 'lucide-react';
import Link from 'next/link';

export default function ProprietaireDashboard() {
  const { user } = useAuth();
  const [dashStats, setDashStats] = useState<ProprietaireDashboardStats | null>(null);
  const [lavages, setLavages] = useState<Lavage[]>([]);
  const [evolution, setEvolution] = useState<EvolutionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [dashRes, lavagesRes] = await Promise.allSettled([
        api.get(endpoints.statsDashboard),
        api.get(endpoints.lavages),
      ]);

      let lavageList: Lavage[] = [];

      if (dashRes.status === 'fulfilled' && dashRes.value.data?.success) {
        setDashStats(dashRes.value.data.data);
      }

      if (lavagesRes.status === 'fulfilled' && lavagesRes.value.data?.success) {
        const d = lavagesRes.value.data.data;
        lavageList = Array.isArray(d) ? d : (d?.data ?? []);
        setLavages(lavageList);
      }

      // Graphe évolution 7j pour le premier lavage
      if (lavageList.length > 0) {
        const evRes = await api.get(endpoints.statsEvolution(lavageList[0].id), { params: { periode: '7' } }).catch(() => null);
        if (evRes?.data?.success) setEvolution(evRes.data.data?.evolution ?? []);
      }

      setLastRefresh(new Date());
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => load(true), 60_000);
    return () => clearInterval(t);
  }, [load]);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <Header title="Vue d'ensemble" subtitle="Propriétaire" />
        <div className="p-6"><LoadingSpinner /></div>
      </div>
    );
  }

  const evol = dashStats?.evolution_ca;
  const evolutionPositive = (evol?.pourcentage ?? 0) >= 0;

  const kpiCards = dashStats ? [
    {
      label: 'CA du jour', value: formatMontantCompact(dashStats.ca_jour),
      sub: `${dashStats.transactions_jour} tx`,
      gradient: 'from-primary/20 to-primary/5', border: 'border-primary/25', text: 'text-primary', icon: TrendingUp,
    },
    {
      label: 'CA ce mois', value: formatMontantCompact(dashStats.ca_mois),
      sub: `${dashStats.transactions_mois} transactions`,
      gradient: 'from-navy/15 to-navy/5', border: 'border-navy/20', text: 'text-navy', icon: Wallet,
    },
    {
      label: 'Lavages', value: `${dashStats.nombre_lavages_actifs}/${dashStats.nombre_lavages}`,
      sub: 'actifs / total',
      gradient: 'from-info/15 to-info/5', border: 'border-info/20', text: 'text-info', icon: Building2,
    },
    {
      label: 'Total clients', value: dashStats.nombre_total_clients.toString(),
      sub: 'tous lavages',
      gradient: 'from-green/15 to-green/5', border: 'border-green/20', text: 'text-green-dark', icon: Users,
    },
    {
      label: 'Laveurs actifs', value: dashStats.nombre_total_laveurs.toString(),
      sub: `${dashStats.nombre_total_gerants} gérant(s)`,
      gradient: 'from-warning/15 to-warning/5', border: 'border-warning/20', text: 'text-warning', icon: UserCheck,
    },
    {
      label: 'Salaires / mois', value: formatMontantCompact(dashStats.salaires_mois),
      sub: 'masse salariale',
      gradient: 'from-error/15 to-error/5', border: 'border-error/20', text: 'text-error', icon: DollarSign,
    },
  ] : [];

  return (
    <div className="animate-fade-in">
      <Header title="Vue d'ensemble" subtitle={`Propriétaire • ${user?.prenom} ${user?.nom}`} />

      <div className="p-6 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {kpiCards.map((card) => (
            <div key={card.label} className={`rounded-2xl p-4 bg-gradient-to-br ${card.gradient} border ${card.border}`}>
              <div className="flex items-center justify-between mb-2">
                <card.icon size={18} className={card.text} />
                <span className="text-xs text-text-light">{card.sub}</span>
              </div>
              <div className={`text-2xl font-black ${card.text}`}>{card.value}</div>
              <div className="text-xs font-medium text-text-secondary mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Évolution mensuelle + graphe */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Tendance mensuelle */}
          {evol && (
            <div className={`rounded-2xl p-5 text-white shadow-lg ${evolutionPositive ? 'bg-gradient-primary' : 'bg-gradient-navy'}`}>
              <div className="text-sm font-medium opacity-80">Évolution CA mensuel</div>
              <div className="text-3xl font-black mt-2">{formatMontantCompact(evol.mois_actuel)}</div>
              <div className="text-sm opacity-70 mt-1">
                vs {formatMontantCompact(evol.mois_dernier)} le mois dernier
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1.5">
                  {evolutionPositive
                    ? <ArrowUpRight size={15} />
                    : <ArrowDownRight size={15} />
                  }
                  <span className="font-bold text-sm">{Math.abs(evol.pourcentage).toFixed(1)}%</span>
                </div>
                <span className="text-xs opacity-70 capitalize">{evol.tendance}</span>
              </div>
              {dashStats?.lavage_plus_performant && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="text-xs opacity-70 flex items-center gap-1.5"><Zap size={11} /> Meilleur lavage</div>
                  <div className="font-bold mt-0.5">{dashStats.lavage_plus_performant.nom}</div>
                  <div className="text-sm opacity-80">{formatMontantCompact(dashStats.lavage_plus_performant.ca_mois)}</div>
                </div>
              )}
            </div>
          )}

          {/* Graphe évolution 7j */}
          <div className={`card p-5 ${evol ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-navy flex items-center gap-2">
                <Activity size={15} /> CA — 7 derniers jours
                {lavages[0] && <span className="text-xs font-normal text-text-light">({lavages[0].nom})</span>}
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-light flex items-center gap-1">
                  <Clock size={11} /> {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button onClick={() => load(true)} disabled={refreshing}
                  className="p-1.5 rounded-lg hover:bg-surface-variant transition-colors">
                  <RefreshCw size={13} className={`text-text-secondary ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            {evolution.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={evolution}>
                  <defs>
                    <linearGradient id="propGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF8" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }}
                    tickFormatter={(v) => formatMontantCompact(v)} width={52} />
                  <Tooltip
                    formatter={(v: number) => [formatMontant(v), 'CA']}
                    labelFormatter={(d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  />
                  <Area type="monotone" dataKey="ca" stroke="#FF6B00" strokeWidth={2.5}
                    fill="url(#propGrad)" dot={{ fill: '#FF6B00', strokeWidth: 0, r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-text-light text-sm">
                <BarChart2 size={32} className="mr-2 opacity-40" /> Aucune donnée disponible
              </div>
            )}
          </div>
        </div>

        {/* Per-Lavage Cards */}
        <div>
          <h2 className="text-base font-bold text-navy mb-4 flex items-center gap-2">
            <Building2 size={16} /> Mes lavages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {lavages.map((lavage) => (
              <div key={lavage.id} className="card p-5 hover:shadow-card-hover transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-navy flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {lavage.nom.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-navy">{lavage.nom}</h3>
                      {lavage.ville && <p className="text-xs text-text-light mt-0.5">{lavage.ville}</p>}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    lavage.is_active ? 'bg-green/10 text-green-dark' : 'bg-light-grey text-text-secondary'
                  }`}>
                    {lavage.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="rounded-xl p-3 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15">
                    <div className="text-sm font-black text-primary leading-tight">
                      {formatMontantCompact(lavage.chiffre_affaires_mois ?? 0)}
                    </div>
                    <div className="text-xs text-primary/70 mt-0.5">CA mois</div>
                  </div>
                  <div className="rounded-xl p-3 bg-gradient-to-br from-navy/10 to-navy/5 border border-navy/15">
                    <div className="text-sm font-black text-navy leading-tight">{lavage.nombre_clients ?? 0}</div>
                    <div className="text-xs text-navy/70 mt-0.5">Clients</div>
                  </div>
                  <div className="rounded-xl p-3 bg-gradient-to-br from-green/10 to-green/5 border border-green/15">
                    <div className="text-sm font-black text-green-dark leading-tight">{lavage.nombre_laveurs ?? 0}</div>
                    <div className="text-xs text-green-dark/70 mt-0.5">Laveurs</div>
                  </div>
                  <div className="rounded-xl p-3 bg-gradient-to-br from-info/10 to-info/5 border border-info/15">
                    <div className="text-sm font-black text-info leading-tight">{lavage.nombre_gerants ?? 0}</div>
                    <div className="text-xs text-info/70 mt-0.5">Gérants</div>
                  </div>
                </div>

                <Link href="/proprietaire/activite"
                  className="flex items-center justify-between text-sm font-semibold text-primary group-hover:underline">
                  Voir l'activité
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}