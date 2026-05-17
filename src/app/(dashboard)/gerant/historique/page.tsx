'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { formatDate, formatMontant, cn } from '@/lib/utils';
import type { Transaction, Client, Laveur } from '@/lib/types';
import { Receipt, Users, UserCheck, Clock, Star, TrendingUp, Car } from 'lucide-react';

type Tab = 'transactions' | 'clients' | 'laveurs';

export default function HistoriquePage() {
  const { user } = useAuth();
  const lavageId = user?.lavage_id ?? '';

  const [tab, setTab] = useState<Tab>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [laveurs, setLaveurs] = useState<Laveur[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!lavageId) return;
    setLoading(true);
    try {
      const [txRes, clRes, lvRes] = await Promise.all([
        api.get(endpoints.transactions(lavageId), { params: { per_page: 100 } }).catch(() => null),
        api.get(endpoints.clients(lavageId)).catch(() => null),
        api.get(endpoints.laveurs(lavageId)).catch(() => null),
      ]);

      if (txRes?.data?.success) {
        const d = txRes.data.data;
        setTransactions(Array.isArray(d) ? d : (d?.data ?? []));
      }
      if (clRes?.data?.success) {
        const d = clRes.data.data;
        setClients(Array.isArray(d) ? d : (d?.data ?? []));
      }
      if (lvRes?.data?.success) {
        const d = lvRes.data.data;
        setLaveurs(Array.isArray(d) ? d : (d?.data ?? []));
      }
    } finally {
      setLoading(false);
    }
  }, [lavageId]);

  useEffect(() => { load(); }, [load]);

  const typeColors: Record<string, string> = {
    'intérieur': 'bg-blue-100 text-blue-700',
    'interieur': 'bg-blue-100 text-blue-700',
    'extérieur': 'bg-green/10 text-green-dark',
    'exterieur': 'bg-green/10 text-green-dark',
    'complet':   'bg-primary/10 text-primary',
  };

  function timeAgo(dateStr: string) {
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `Il y a ${diff}s`;
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    return formatDate(dateStr, 'dd/MM/yyyy');
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'transactions', label: 'Transactions', icon: Receipt,   count: transactions.length },
    { id: 'clients',      label: 'Clients',      icon: Users,     count: clients.length },
    { id: 'laveurs',      label: 'Laveurs',      icon: UserCheck, count: laveurs.length },
  ];

  return (
    <div className="animate-fade-in">
      <Header title="Historique & Traçabilité" subtitle="Gérant" />

      <div className="p-6 space-y-5">
        {/* Onglets */}
        <div className="flex gap-2 bg-surface-variant rounded-2xl p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
                tab === t.id
                  ? 'bg-white text-navy shadow-card'
                  : 'text-text-secondary hover:text-navy'
              )}
            >
              <t.icon size={15} />
              {t.label}
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full font-bold',
                tab === t.id ? 'bg-primary/10 text-primary' : 'bg-light-grey text-text-secondary'
              )}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="card overflow-hidden">
          {loading ? (
            <LoadingSpinner />
          ) : tab === 'transactions' ? (
            transactions.length === 0 ? (
              <EmptyState icon={Receipt} title="Aucune transaction" />
            ) : (
              <div className="divide-y divide-light-grey">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-start gap-4 px-5 py-4 hover:bg-surface-variant/50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white flex-shrink-0">
                      <Receipt size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded-lg',
                          typeColors[tx.type_lavage?.toLowerCase()] ?? 'bg-light-grey text-text-secondary'
                        )}>
                          {tx.type_lavage}
                        </span>
                        {tx.client?.nom_complet && (
                          <span className="text-sm font-semibold text-navy">{tx.client.nom_complet}</span>
                        )}
                        {tx.client?.immatriculation && (
                          <span className="text-xs text-text-light">{tx.client.immatriculation}</span>
                        )}
                      </div>
                      <div className="text-xs text-text-secondary mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1"><UserCheck size={10} /> {tx.laveur?.nom_complet ?? '—'}</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {timeAgo(tx.created_at)}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-navy text-sm">{tx.montant_formate ?? formatMontant(tx.montant)}</div>
                      {tx.commission_laveur > 0 && (
                        <div className="text-xs text-warning">−{tx.commission_formate}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : tab === 'clients' ? (
            clients.length === 0 ? (
              <EmptyState icon={Users} title="Aucun client" />
            ) : (
              <div className="divide-y divide-light-grey">
                {clients.map((c) => (
                  <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-variant/50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-gradient-navy flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {c.nom_complet?.slice(0, 2).toUpperCase() || <Car size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-navy text-sm">{c.nom_complet || 'Client anonyme'}</div>
                      <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-3">
                        <span>{c.immatriculation}</span>
                        <span>{c.type_vehicule}</span>
                        {c.telephone && <span>{c.telephone}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 text-warning font-semibold text-sm">
                        <Star size={12} fill="currentColor" /> {c.points_fidelite} pts
                      </div>
                      <div className="text-xs text-text-light">{c.nombre_visites} visite(s)</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            laveurs.length === 0 ? (
              <EmptyState icon={UserCheck} title="Aucun laveur" />
            ) : (
              <div className="divide-y divide-light-grey">
                {laveurs.map((l) => (
                  <div key={l.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-variant/50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center text-green-dark text-sm font-bold flex-shrink-0">
                      {l.initiales}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-navy text-sm">{l.nom_complet}</div>
                      <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-3">
                        {l.telephone && <span>{l.telephone}</span>}
                        <span className="flex items-center gap-1">
                          <TrendingUp size={10} /> {l.taux_commission}% commission
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={cn(
                        'text-xs font-semibold px-2.5 py-1 rounded-full',
                        l.is_active ? 'bg-green/10 text-green-dark' : 'bg-light-grey text-text-secondary'
                      )}>
                        {l.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}