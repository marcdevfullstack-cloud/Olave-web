'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Client, Lavage } from '@/lib/types';
import { Heart, Search, Star, Trophy } from 'lucide-react';

const tierConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  bronze:   { label: 'Bronze',  color: '#CD7F32', bg: '#CD7F3215', icon: '🥉' },
  silver:   { label: 'Argent',  color: '#9CA3AF', bg: '#9CA3AF15', icon: '🥈' },
  gold:     { label: 'Or',      color: '#F59E0B', bg: '#F59E0B15', icon: '🥇' },
  platinum: { label: 'Platine', color: '#3B82F6', bg: '#3B82F615', icon: '💎' },
};

export default function FidelitePage() {
  const [lavages, setLavages] = useState<Lavage[]>([]);
  const [selectedLavage, setSelectedLavage] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loyaltyMap, setLoyaltyMap] = useState<Record<string, { points: number; tier: string }>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get(endpoints.lavages).then((res) => {
      if (res.data?.success) {
        const list: Lavage[] = res.data.data ?? [];
        setLavages(list);
        if (list.length > 0) setSelectedLavage(list[0].id);
      }
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!selectedLavage) return;
    setLoading(true);
    try {
      const [clientsRes, loyaltyRes] = await Promise.allSettled([
        api.get(endpoints.clients(selectedLavage)),
        api.get(endpoints.loyaltyLeaderboard(selectedLavage), { params: { limit: 500 } }),
      ]);

      if (clientsRes.status === 'fulfilled' && clientsRes.value.data?.success) {
        const d = clientsRes.value.data.data;
        setClients(Array.isArray(d) ? d : (d?.data ?? []));
      }

      if (loyaltyRes.status === 'fulfilled' && loyaltyRes.value.data?.success) {
        const leaderboard: Array<{ client: { id: string }; points_balance: number; tier: string }> =
          loyaltyRes.value.data.data ?? [];
        const map: Record<string, { points: number; tier: string }> = {};
        leaderboard.forEach((entry) => {
          if (entry.client?.id) {
            map[entry.client.id] = { points: entry.points_balance, tier: entry.tier };
          }
        });
        setLoyaltyMap(map);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [selectedLavage]);

  useEffect(() => { if (selectedLavage) load(); }, [load, selectedLavage]);

  // Construire la liste triée par points (via loyaltyMap)
  const clientsWithPoints = clients.map((c) => ({
    ...c,
    loyaltyPoints: loyaltyMap[c.id]?.points ?? 0,
    loyaltyTier: loyaltyMap[c.id]?.tier ?? '',
  }));

  const filtered = clientsWithPoints
    .filter((c) => !search ||
      c.nom_complet?.toLowerCase().includes(search.toLowerCase()) ||
      c.immatriculation?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.loyaltyPoints - a.loyaltyPoints);

  const totalPoints = Object.values(loyaltyMap).reduce((s, v) => s + v.points, 0);
  const loyaltyCount = Object.keys(loyaltyMap).length;
  const top3 = [...filtered].slice(0, 3);

  return (
    <div className="animate-fade-in">
      <Header title="Fidélité clients" subtitle="Propriétaire" />

      <div className="p-6 space-y-5">
        {lavages.length > 1 && (
          <select value={selectedLavage} onChange={(e) => setSelectedLavage(e.target.value)} className="input w-auto">
            {lavages.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
          </select>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl p-4 text-center bg-gradient-to-br from-navy/15 to-navy/5 border border-navy/20">
            <div className="text-2xl font-black text-navy">{clients.length}</div>
            <div className="text-xs font-medium text-navy/60 mt-1">Total clients</div>
          </div>
          <div className="rounded-2xl p-4 text-center bg-gradient-to-br from-warning/15 to-warning/5 border border-warning/20">
            <div className="text-2xl font-black text-warning">{totalPoints.toLocaleString()}</div>
            <div className="text-xs font-medium text-warning/70 mt-1">Points distribués</div>
          </div>
          <div className="rounded-2xl p-4 text-center bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20">
            <div className="text-2xl font-black text-primary">{loyaltyCount}</div>
            <div className="text-xs font-medium text-primary/70 mt-1">Clients fidèles</div>
          </div>
        </div>

        {/* Top 3 */}
        {top3.length > 0 && top3[0].loyaltyPoints > 0 && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-warning" />
              <h3 className="font-bold text-navy">Top clients fidèles</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {top3.map((c, i) => {
                const tier = tierConfig[c.loyaltyTier];
                return (
                  <div key={c.id} className={cn(
                    'rounded-2xl p-4 text-center',
                    i === 0 ? 'bg-gradient-primary text-white shadow-primary' : 'bg-surface-variant'
                  )}>
                    <div className="text-lg mb-1">{tier?.icon ?? (i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉')}</div>
                    <div className={cn('font-semibold text-sm truncate', i === 0 ? 'text-white' : 'text-navy')}>
                      {c.nom_complet || c.immatriculation}
                    </div>
                    <div className={cn('flex items-center justify-center gap-1 mt-1 text-xs font-bold', i === 0 ? 'text-white/90' : 'text-warning')}>
                      <Star size={10} fill="currentColor" /> {c.loyaltyPoints} pts
                    </div>
                    {tier && (
                      <div className={cn('text-xs mt-0.5', i === 0 ? 'text-white/70' : 'text-text-light')}>
                        {tier.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client…" className="input pl-10" />
        </div>

        {/* List */}
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Heart} title="Aucun client" />
        ) : (
          <div className="card divide-y divide-light-grey overflow-hidden">
            {filtered.map((client, index) => {
              const tier = tierConfig[client.loyaltyTier];
              return (
                <div key={client.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-variant/50 transition-colors">
                  <div className="w-7 text-center text-sm font-bold text-text-light flex-shrink-0">
                    #{index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-navy flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {client.nom_complet?.slice(0, 2).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy">{client.nom_complet || 'Anonyme'}</span>
                      {tier && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: tier.bg, color: tier.color }}>
                          {tier.icon} {tier.label}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-text-secondary">{client.immatriculation} · {client.type_vehicule}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {client.loyaltyPoints > 0 ? (
                      <div className="flex items-center gap-1 text-warning font-bold">
                        <Star size={14} fill="currentColor" />
                        {client.loyaltyPoints}
                      </div>
                    ) : (
                      <div className="text-xs text-text-light">0 pt</div>
                    )}
                    <div className="text-xs text-text-light">{client.nombre_visites} visite(s)</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}