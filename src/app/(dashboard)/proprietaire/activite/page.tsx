'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { formatMontant, formatDate, todayISO, cn } from '@/lib/utils';
import type { Transaction, Lavage, LaveurCommission } from '@/lib/types';
import { Receipt, HandCoins, Clock, TrendingUp } from 'lucide-react';

type Tab = 'transactions' | 'commissions';

export default function ActivitePage() {
  const [lavages, setLavages] = useState<Lavage[]>([]);
  const [selectedLavage, setSelectedLavage] = useState('');
  const [tab, setTab] = useState<Tab>('transactions');
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [commissions, setCommissions] = useState<LaveurCommission[]>([]);
  const [totalComm, setTotalComm] = useState(0);
  const [caTotal, setCaTotal] = useState(0);
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
      const [txRes, commRes] = await Promise.all([
        api.get(endpoints.transactions(selectedLavage), { params: { start_date: startDate, end_date: endDate, per_page: 50 } }),
        api.get(endpoints.statsCommissions(selectedLavage)),
      ]);
      if (txRes.data?.success) {
        const list = Array.isArray(txRes.data.data) ? txRes.data.data : (txRes.data.data?.data ?? []);
        setTransactions(list);
        setCaTotal(list.reduce((s: number, t: Transaction) => s + t.montant, 0));
      }
      if (commRes.data?.success) {
        setCommissions(commRes.data.data?.par_laveur ?? []);
        setTotalComm(commRes.data.data?.total_a_payer ?? 0);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [selectedLavage, startDate, endDate]);

  useEffect(() => { if (selectedLavage) load(); }, [load, selectedLavage]);

  const typeColors: Record<string, string> = {
    'lavage simple':       'bg-green/10 text-green-dark',
    'lavage complet':      'bg-info/10 text-info',
    'lavage premium':      'bg-primary/10 text-primary',
    'nettoyage intérieur': 'bg-navy/10 text-navy',
    'cirage':              'bg-warning/10 text-warning',
    'polissage':           'bg-error/10 text-error',
  };

  const currentLavage = lavages.find((l) => l.id === selectedLavage);

  return (
    <div className="animate-fade-in">
      <Header title="Activité" subtitle="Propriétaire" />

      <div className="p-6 space-y-5">
        {/* Controls */}
        <div className="card p-4 flex flex-wrap gap-4 items-center">
          {lavages.length > 1 && (
            <select
              value={selectedLavage}
              onChange={(e) => setSelectedLavage(e.target.value)}
              className="input !py-2 w-auto"
            >
              {lavages.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
            </select>
          )}

          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">Du</label>
            <input type="date" value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input !py-2 !px-3 text-sm w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">Au</label>
            <input type="date" value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input !py-2 !px-3 text-sm w-auto"
            />
          </div>
          <button onClick={load} className="btn-primary !py-2 !px-5 !min-w-0 text-sm">
            Actualiser
          </button>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 border-l-4 border-primary">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-primary" />
              <span className="text-xs text-text-secondary font-medium">CA période</span>
            </div>
            <div className="text-xl font-bold text-navy">{formatMontant(caTotal)}</div>
          </div>
          <div className="card p-4 border-l-4 border-navy">
            <div className="flex items-center gap-2 mb-1">
              <Receipt size={16} className="text-navy" />
              <span className="text-xs text-text-secondary font-medium">Transactions</span>
            </div>
            <div className="text-xl font-bold text-navy">{transactions.length}</div>
          </div>
          <div className="card p-4 border-l-4 border-warning">
            <div className="flex items-center gap-2 mb-1">
              <HandCoins size={16} className="text-warning" />
              <span className="text-xs text-text-secondary font-medium">Commissions</span>
            </div>
            <div className="text-xl font-bold text-navy">{formatMontant(totalComm)}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-variant p-1 rounded-xl w-fit">
          {(['transactions', 'commissions'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize',
                tab === t ? 'bg-white text-navy shadow-card' : 'text-text-secondary hover:text-navy'
              )}
            >
              {t === 'transactions' ? 'Transactions' : 'Commissions laveurs'}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSpinner />
        ) : tab === 'transactions' ? (
          transactions.length === 0 ? (
            <EmptyState icon={Receipt} title="Aucune transaction sur cette période" />
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-variant border-b border-light-grey">
                      {['Heure', 'Type', 'Client', 'Laveur', 'Montant', 'Commission'].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-grey">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-surface-variant/40 transition-colors">
                        <td className="px-5 py-3 text-sm text-text-secondary whitespace-nowrap">
                          <div className="flex items-center gap-1.5"><Clock size={12} />{formatDate(tx.created_at, 'dd/MM HH:mm')}</div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-lg', typeColors[tx.type_lavage?.toLowerCase()] ?? 'bg-light-grey text-text-secondary')}>
                            {tx.type_lavage}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-navy">
                          {tx.client?.nom_complet ?? <span className="text-text-light italic">Anonyme</span>}
                        </td>
                        <td className="px-5 py-3 text-sm text-navy">{tx.laveur?.nom_complet ?? '—'}</td>
                        <td className="px-5 py-3 font-bold text-navy">{tx.montant_formate}</td>
                        <td className="px-5 py-3 text-sm text-warning font-medium">
                          {tx.commission_laveur > 0 ? `−${tx.commission_formate}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          commissions.length === 0 ? (
            <EmptyState icon={HandCoins} title="Aucune commission aujourd'hui" />
          ) : (
            <div className="space-y-3">
              <div className="bg-gradient-primary rounded-2xl p-5 text-white shadow-primary">
                <div className="text-sm opacity-80">Total commissions à payer</div>
                <div className="text-3xl font-black mt-1">{formatMontant(totalComm)}</div>
              </div>
              {commissions.map((c) => (
                <div key={c.laveur_id} className="card p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-navy flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {c.nom_complet.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-navy">{c.nom_complet}</div>
                    <div className="text-sm text-text-secondary">{c.nombre_lavages} lavage(s) • {formatMontant(c.ca_genere)} générés</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-warning text-lg">{c.commission_formate}</div>
                    <div className="text-xs text-text-light">20% commission</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}