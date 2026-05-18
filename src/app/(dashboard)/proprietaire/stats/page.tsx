'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { formatMontant, formatMontantCompact } from '@/lib/utils';
import type { LavageComparaison, EvolutionPoint } from '@/lib/types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import {
  TrendingUp, Receipt, Users, UserCheck, BarChart2, Activity, Building2,
} from 'lucide-react';

const COLORS = ['#FF6B00', '#1E3A8A', '#22C55E', '#3B82F6', '#F59E0B', '#EF4444'];

export default function StatsPage() {
  const { user } = useAuth();
  const [comparaison, setComparaison] = useState<LavageComparaison[]>([]);
  const [evolution, setEvolution] = useState<EvolutionPoint[]>([]);
  const [selectedLavage, setSelectedLavage] = useState('');
  const [selectedLavageNom, setSelectedLavageNom] = useState('');
  const [periode, setPeriode] = useState<'7' | '30'>('30');
  const [loading, setLoading] = useState(true);
  const [loadingEvol, setLoadingEvol] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get(endpoints.statsComparaison);
      if (res.data?.success) {
        const list: LavageComparaison[] = res.data.data ?? [];
        setComparaison(list);
        if (list.length > 0 && !selectedLavage) {
          setSelectedLavage(list[0].id);
          setSelectedLavageNom(list[0].nom);
        }
      }
    } finally { setLoading(false); }
  }, [user, selectedLavage]);

  const loadEvolution = useCallback(async (lavageId: string, p: '7' | '30') => {
    if (!lavageId) return;
    setLoadingEvol(true);
    try {
      const res = await api.get(endpoints.statsEvolution(lavageId), { params: { periode: p } });
      if (res.data?.success) setEvolution(res.data.data?.evolution ?? []);
    } finally { setLoadingEvol(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (selectedLavage) loadEvolution(selectedLavage, periode);
  }, [selectedLavage, periode, loadEvolution]);

  function selectLavage(id: string) {
    const l = comparaison.find((c) => c.id === id);
    setSelectedLavage(id);
    setSelectedLavageNom(l?.nom ?? '');
  }

  const globalCA = comparaison.reduce((s, l) => s + l.ca_mois, 0);
  const globalTx = comparaison.reduce((s, l) => s + l.transactions_mois, 0);
  const globalClients = comparaison.reduce((s, l) => s + l.clients_actifs_mois, 0);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <Header title="Stats avancées" subtitle="Propriétaire" />
        <div className="p-6"><LoadingSpinner /></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Header title="Stats avancées" subtitle="Propriétaire" />

      <div className="p-6 space-y-6">

        {/* KPIs globaux */}
        <div>
          <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
            <Activity size={16} /> Vue globale — Tous lavages
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl p-5 bg-gradient-primary text-white shadow-primary">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp size={18} className="opacity-80" />
                <span className="text-sm font-medium opacity-80">CA ce mois</span>
              </div>
              <div className="text-3xl font-black">{formatMontantCompact(globalCA)}</div>
              <div className="text-xs opacity-70 mt-1">Répartis sur {comparaison.length} lavage(s)</div>
            </div>
            <div className="rounded-2xl p-5 bg-gradient-navy text-white">
              <div className="flex items-center gap-3 mb-3">
                <Receipt size={18} className="opacity-80" />
                <span className="text-sm font-medium opacity-80">Transactions / mois</span>
              </div>
              <div className="text-3xl font-black">{globalTx}</div>
              <div className="text-xs opacity-70 mt-1">Toutes sources</div>
            </div>
            <div className="rounded-2xl p-5 bg-gradient-to-br from-green/20 to-green/10 border border-green/25">
              <div className="flex items-center gap-3 mb-3">
                <Users size={18} className="text-green-dark opacity-80" />
                <span className="text-sm font-medium text-green-dark/80">Clients actifs</span>
              </div>
              <div className="text-3xl font-black text-green-dark">{globalClients}</div>
              <div className="text-xs text-green-dark/70 mt-1">Ce mois</div>
            </div>
          </div>
        </div>

        {/* Graphe CA par lavage (Barchart) */}
        {comparaison.length > 1 && (
          <div className="card p-5">
            <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
              <BarChart2 size={16} /> CA mensuel par lavage
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={comparaison} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF8" />
                <XAxis dataKey="nom" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => formatMontantCompact(v)} width={55} />
                <Tooltip formatter={(v: number) => [formatMontant(v), 'CA mois']} />
                <Bar dataKey="ca_mois" radius={[6, 6, 0, 0]}>
                  {comparaison.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Évolution CA — sélection lavage */}
        {comparaison.length > 0 && (
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-bold text-navy flex items-center gap-2">
                <TrendingUp size={16} /> Évolution CA
                {selectedLavageNom && <span className="text-sm font-normal text-text-light">— {selectedLavageNom}</span>}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                {comparaison.length > 1 && (
                  <select value={selectedLavage} onChange={(e) => selectLavage(e.target.value)}
                    className="input !py-1.5 !px-3 text-sm w-auto">
                    {comparaison.map((l) => (
                      <option key={l.id} value={l.id}>{l.nom}</option>
                    ))}
                  </select>
                )}
                <div className="flex gap-1 bg-surface-variant p-1 rounded-lg">
                  {(['7', '30'] as const).map((p) => (
                    <button key={p} onClick={() => setPeriode(p)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                        periode === p ? 'bg-white text-navy shadow-card' : 'text-text-secondary'
                      }`}>
                      {p}j
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {loadingEvol ? (
              <div className="flex items-center justify-center h-48"><LoadingSpinner /></div>
            ) : evolution.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={evolution}>
                  <defs>
                    <linearGradient id="statsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F1F5C" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0F1F5C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF8" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }}
                    tickFormatter={(v) => formatMontantCompact(v)} width={55} />
                  <Tooltip formatter={(v: number) => [formatMontant(v), 'CA']}
                    labelFormatter={(d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} />
                  <Area type="monotone" dataKey="ca" stroke="#0F1F5C" strokeWidth={2.5}
                    fill="url(#statsGrad)" dot={{ fill: '#0F1F5C', strokeWidth: 0, r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-text-light">
                <EmptyState icon={BarChart2} title="Aucune donnée sur cette période" />
              </div>
            )}
          </div>
        )}

        {/* Tableau comparatif */}
        <div>
          <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
            <Building2 size={16} /> Performance par lavage (ce mois)
          </h2>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-navy/5 to-surface-variant border-b border-light-grey">
                    {['Lavage', 'CA mois', 'Transactions', 'Clients actifs', 'Laveurs', 'Ticket moyen'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-grey">
                  {comparaison.map((l, i) => (
                    <tr key={l.id}
                      onClick={() => selectLavage(l.id)}
                      className={`hover:bg-surface-variant/40 transition-colors cursor-pointer ${selectedLavage === l.id ? 'bg-primary/3' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="font-semibold text-navy text-sm">{l.nom}</span>
                          {l.ville && <span className="text-xs text-text-light">{l.ville}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-primary text-sm">{formatMontant(l.ca_mois)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-navy font-semibold">{l.transactions_mois}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-navy flex items-center gap-1">
                          <Users size={12} className="text-green-dark" /> {l.clients_actifs_mois}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-navy flex items-center gap-1">
                          <UserCheck size={12} className="text-navy" /> {l.nombre_laveurs}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-navy">
                        {l.ticket_moyen > 0 ? formatMontant(l.ticket_moyen) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}