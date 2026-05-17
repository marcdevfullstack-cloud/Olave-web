'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Laveur, Lavage, User } from '@/lib/types';
import { UserCheck, UserCog } from 'lucide-react';

type Tab = 'gerants' | 'laveurs';

export default function EmployesPage() {
  const [lavages, setLavages] = useState<Lavage[]>([]);
  const [selectedLavage, setSelectedLavage] = useState('');
  const [tab, setTab] = useState<Tab>('gerants');
  const [gerants, setGerants] = useState<User[]>([]);
  const [laveurs, setLaveurs] = useState<Laveur[]>([]);
  const [loading, setLoading] = useState(false);

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
      const [gRes, lRes] = await Promise.all([
        api.get(endpoints.gerants),
        api.get(endpoints.laveurs(selectedLavage)),
      ]);
      if (gRes.data?.success) setGerants(gRes.data.data ?? []);
      if (lRes.data?.success) setLaveurs(lRes.data.data ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [selectedLavage]);

  useEffect(() => { if (selectedLavage) load(); }, [load, selectedLavage]);

  return (
    <div className="animate-fade-in">
      <Header title="Employés" subtitle="Propriétaire" />

      <div className="p-6 space-y-5">
        {lavages.length > 1 && (
          <select
            value={selectedLavage}
            onChange={(e) => setSelectedLavage(e.target.value)}
            className="input w-auto"
          >
            {lavages.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
          </select>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-variant p-1 rounded-xl w-fit">
          {[
            { key: 'gerants', label: 'Gérants', icon: UserCog },
            { key: 'laveurs', label: 'Laveurs', icon: UserCheck },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as Tab)}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all',
                tab === key ? 'bg-white text-navy shadow-card' : 'text-text-secondary hover:text-navy'
              )}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : tab === 'gerants' ? (
          gerants.length === 0 ? (
            <EmptyState icon={UserCog} title="Aucun gérant" />
          ) : (
            <div className="card divide-y divide-light-grey overflow-hidden">
              {gerants.map((g) => (
                <div key={g.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-variant/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {g.prenom?.[0]?.toUpperCase()}{g.nom?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-navy">{g.prenom} {g.nom}</div>
                    <div className="text-sm text-text-secondary">{g.email}</div>
                  </div>
                  <span className="badge-orange">Gérant</span>
                </div>
              ))}
            </div>
          )
        ) : (
          laveurs.length === 0 ? (
            <EmptyState icon={UserCheck} title="Aucun laveur" />
          ) : (
            <div className="card divide-y divide-light-grey overflow-hidden">
              {laveurs.map((l) => (
                <div key={l.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-variant/50 transition-colors">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0',
                    l.is_active ? 'bg-gradient-navy' : 'bg-light-grey'
                  )}>
                    {l.initiales}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-navy">{l.nom_complet}</div>
                    {l.telephone && <div className="text-sm text-text-secondary">{l.telephone}</div>}
                    <div className="text-xs text-text-light">Commission : {l.taux_commission}%</div>
                  </div>
                  <span className={l.is_active ? 'badge-green' : 'badge-grey'}>
                    {l.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}