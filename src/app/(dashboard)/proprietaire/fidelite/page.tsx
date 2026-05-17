'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Client, Lavage } from '@/lib/types';
import { Heart, Search, Star, Trophy } from 'lucide-react';

export default function FidelitePage() {
  const [lavages, setLavages] = useState<Lavage[]>([]);
  const [selectedLavage, setSelectedLavage] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
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
      const res = await api.get(endpoints.clients(selectedLavage));
      if (res.data?.success) {
        const d = res.data.data;
        setClients(Array.isArray(d) ? d : (d?.data ?? []));
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [selectedLavage]);

  useEffect(() => { if (selectedLavage) load(); }, [load, selectedLavage]);

  const filtered = clients
    .filter((c) => !search || c.nom_complet?.toLowerCase().includes(search.toLowerCase()) || c.immatriculation?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.points_fidelite - a.points_fidelite);

  const totalPoints = clients.reduce((s, c) => s + c.points_fidelite, 0);
  const top3 = [...clients].sort((a, b) => b.points_fidelite - a.points_fidelite).slice(0, 3);

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
          {[
            { label: 'Total clients', value: clients.length, color: 'text-navy' },
            { label: 'Points distribués', value: totalPoints.toLocaleString(), color: 'text-warning' },
            { label: 'Clients fidèles', value: clients.filter((c) => c.points_fidelite >= 100).length, color: 'text-primary' },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-text-secondary mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Top 3 */}
        {top3.length > 0 && top3[0].points_fidelite > 0 && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-warning" />
              <h3 className="font-bold text-navy">Top clients</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {top3.map((c, i) => (
                <div key={c.id} className={cn(
                  'rounded-2xl p-4 text-center',
                  i === 0 ? 'bg-gradient-primary text-white shadow-primary' : 'bg-surface-variant'
                )}>
                  <div className={cn('text-2xl font-black mb-2', i === 0 ? 'text-white' : 'text-navy')}>{i + 1}</div>
                  <div className={cn('font-semibold text-sm truncate', i === 0 ? 'text-white' : 'text-navy')}>
                    {c.nom_complet || c.immatriculation}
                  </div>
                  <div className={cn('flex items-center justify-center gap-1 mt-1 text-xs font-semibold', i === 0 ? 'text-white/80' : 'text-warning')}>
                    <Star size={10} fill="currentColor" /> {c.points_fidelite} pts
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un client…" className="input pl-10" />
        </div>

        {/* List */}
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Heart} title="Aucun client" />
        ) : (
          <div className="card divide-y divide-light-grey overflow-hidden">
            {filtered.map((client, index) => (
              <div key={client.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-variant/50 transition-colors">
                <div className="w-8 text-center text-sm font-bold text-text-light">#{index + 1}</div>
                <div className="w-10 h-10 rounded-xl bg-gradient-navy flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {client.nom_complet?.slice(0, 2).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy">{client.nom_complet || 'Anonyme'}</span>
                    <span className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full',
                      client.nombre_visites > 0 ? 'bg-green/10 text-green-dark' : 'bg-light-grey text-text-secondary'
                    )}>
                      {client.nombre_visites > 0 ? 'Payé' : 'En attente'}
                    </span>
                  </div>
                  <div className="text-sm text-text-secondary">{client.immatriculation} • {client.type_vehicule}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-warning font-bold">
                    <Star size={14} fill="currentColor" />
                    {client.points_fidelite}
                  </div>
                  <div className="text-xs text-text-light">{client.nombre_visites} visite(s)</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}