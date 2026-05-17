'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { formatMontant } from '@/lib/utils';
import { TrendingUp, Receipt, Users, UserCheck, BarChart2, Activity } from 'lucide-react';

interface EvolutionPoint { date: string; ca: number; transactions: number }
interface LavageStats { ca_jour: number; ca_mois: number; transactions_jour: number; transactions_mois: number; clients_actifs: number; laveurs_actifs: number }
interface LavageItem { id: string; nom: string; stats?: LavageStats; evolution?: EvolutionPoint[] }

export default function StatsPage() {
  const { user } = useAuth();
  const [lavages, setLavages] = useState<LavageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLavage, setSelectedLavage] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get(endpoints.lavages);
      if (res.data?.success) {
        const list: { id: string; nom: string }[] = res.data.data ?? [];
        const withData = await Promise.all(
          list.map(async (l) => {
            const [sRes, eRes] = await Promise.all([
              api.get(endpoints.statsLavage(l.id)).catch(() => null),
              api.get(endpoints.statsEvolution(l.id)).catch(() => null),
            ]);
            return {
              ...l,
              stats: sRes?.data?.success ? sRes.data.data : undefined,
              evolution: eRes?.data?.success ? (eRes.data.data ?? []) : [],
            };
          })
        );
        setLavages(withData);
        if (withData.length > 0) setSelectedLavage(withData[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const current = lavages.find((l) => l.id === selectedLavage);

  const globalCA = lavages.reduce((s, l) => s + (l.stats?.ca_mois ?? 0), 0);
  const globalTx = lavages.reduce((s, l) => s + (l.stats?.transactions_mois ?? 0), 0);
  const globalClients = lavages.reduce((s, l) => s + (l.stats?.clients_actifs ?? 0), 0);

  return (
    <div className="animate-fade-in">
      <Header title="Stats avancées" subtitle="Propriétaire" />

      <div className="p-6 space-y-6">
        {loading ? <LoadingSpinner /> : (
          <>
            {/* KPIs globaux */}
            <div>
              <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
                <Activity size={16} /> Vue globale — Tous lavages
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: TrendingUp, label: 'CA ce mois', value: formatMontant(globalCA), sub: `Répartis sur ${lavages.length} lavage(s)`, color: 'bg-gradient-primary text-white' },
                  { icon: Receipt, label: 'Transactions / mois', value: globalTx.toString(), sub: 'Toutes sources', color: 'bg-gradient-navy text-white' },
                  { icon: Users, label: 'Clients actifs', value: globalClients.toString(), sub: 'Total base clients', color: 'bg-green/10 text-green-dark' },
                ].map((s) => (
                  <div key={s.label} className={`card p-5 ${s.color}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <s.icon size={18} className="opacity-80" />
                      <span className="text-sm font-medium opacity-80">{s.label}</span>
                    </div>
                    <div className="text-3xl font-black">{s.value}</div>
                    {s.sub && <div className="text-xs opacity-70 mt-1">{s.sub}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Comparaison par lavage */}
            <div>
              <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
                <BarChart2 size={16} /> Performance par lavage
              </h2>
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-variant border-b border-light-grey">
                      {['Lavage', 'CA jour', 'CA mois', 'Tx jour', 'Tx mois', 'Clients', 'Laveurs'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-grey">
                    {lavages.map((l) => (
                      <tr key={l.id} className="hover:bg-surface-variant/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-navy text-sm">{l.nom}</div>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-green-dark">{l.stats ? formatMontant(l.stats.ca_jour) : '—'}</td>
                        <td className="px-4 py-3 text-sm font-bold text-navy">{l.stats ? formatMontant(l.stats.ca_mois) : '—'}</td>
                        <td className="px-4 py-3 text-sm text-navy">{l.stats?.transactions_jour ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-navy">{l.stats?.transactions_mois ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-navy">{l.stats?.clients_actifs ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-navy">{l.stats?.laveurs_actifs ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Évolution sélectionnée */}
            {lavages.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-navy flex items-center gap-2">
                    <TrendingUp size={16} /> Évolution CA — 30 jours
                  </h2>
                  {lavages.length > 1 && (
                    <select
                      value={selectedLavage}
                      onChange={(e) => setSelectedLavage(e.target.value)}
                      className="input !py-1.5 !px-3 text-sm w-auto"
                    >
                      {lavages.map((l) => (
                        <option key={l.id} value={l.id}>{l.nom}</option>
                      ))}
                    </select>
                  )}
                </div>
                {current?.evolution && current.evolution.length > 0 ? (
                  <div className="card p-5">
                    {/* Graphe simplifié en barres CSS */}
                    {(() => {
                      const maxCA = Math.max(...current.evolution.map((p) => p.ca), 1);
                      return (
                        <div className="space-y-2">
                          {current.evolution.slice(-14).map((point) => (
                            <div key={point.date} className="flex items-center gap-3">
                              <span className="text-xs text-text-secondary w-16 flex-shrink-0">
                                {new Date(point.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                              </span>
                              <div className="flex-1 h-6 bg-surface-variant rounded-lg overflow-hidden">
                                <div
                                  className="h-full bg-gradient-primary rounded-lg transition-all"
                                  style={{ width: `${Math.max((point.ca / maxCA) * 100, 2)}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-navy w-24 text-right flex-shrink-0">
                                {formatMontant(point.ca)}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="card p-8 text-center">
                    <BarChart2 size={40} className="mx-auto text-text-light mb-3" />
                    <div className="text-text-secondary text-sm">Données d&apos;évolution non disponibles</div>
                  </div>
                )}
              </div>
            )}

            {/* KPIs par lavage — cartes détaillées */}
            <div>
              <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
                <UserCheck size={16} /> Détail par lavage
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lavages.map((l) => (
                  <div key={l.id} className="card p-5">
                    <h3 className="font-bold text-navy mb-4">{l.nom}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'CA aujourd\'hui', value: l.stats ? formatMontant(l.stats.ca_jour) : '—', icon: TrendingUp },
                        { label: 'CA ce mois', value: l.stats ? formatMontant(l.stats.ca_mois) : '—', icon: TrendingUp },
                        { label: 'Tx aujourd\'hui', value: l.stats?.transactions_jour?.toString() ?? '—', icon: Receipt },
                        { label: 'Tx ce mois', value: l.stats?.transactions_mois?.toString() ?? '—', icon: Receipt },
                        { label: 'Clients', value: l.stats?.clients_actifs?.toString() ?? '—', icon: Users },
                        { label: 'Laveurs actifs', value: l.stats?.laveurs_actifs?.toString() ?? '—', icon: UserCheck },
                      ].map((s) => (
                        <div key={s.label} className="bg-surface-variant rounded-xl p-3">
                          <div className="text-lg font-bold text-navy">{s.value}</div>
                          <div className="text-xs text-text-secondary">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}