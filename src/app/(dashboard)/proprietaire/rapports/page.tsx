'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { formatMontant, formatDate, todayISO } from '@/lib/utils';
import type { Transaction } from '@/lib/types';
import { FileText, Download, Loader2, TrendingUp, Receipt, Calendar } from 'lucide-react';

interface Lavage { id: string; nom: string }

export default function RapportsProprietairePage() {
  const { user } = useAuth();
  const [lavages, setLavages] = useState<Lavage[]>([]);
  const [selectedLavage, setSelectedLavage] = useState('');
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [generating, setGenerating] = useState(false);
  const [loadingLavages, setLoadingLavages] = useState(false);
  const [preview, setPreview] = useState<{ transactions: Transaction[]; ca: number } | null>(null);

  const loadLavages = useCallback(async () => {
    if (lavages.length > 0 || !user) return;
    setLoadingLavages(true);
    try {
      const res = await api.get(endpoints.lavages);
      if (res.data?.success) {
        const d = res.data.data;
        const list: Lavage[] = Array.isArray(d) ? d : (d?.data ?? []);
        setLavages(list);
        if (list.length > 0) setSelectedLavage(list[0].id);
      }
    } finally {
      setLoadingLavages(false);
    }
  }, [user, lavages.length]);

  useState(() => { loadLavages(); });

  const fetchData = async () => {
    if (!selectedLavage) return;
    setGenerating(true);
    try {
      const res = await api.get(endpoints.transactions(selectedLavage), {
        params: { start_date: startDate, end_date: endDate, per_page: 500 },
      });
      if (res.data?.success) {
        const d = res.data.data;
        const list: Transaction[] = Array.isArray(d) ? d : (d?.data ?? []);
        const ca = list.reduce((s, t) => s + t.montant, 0);
        setPreview({ transactions: list, ca });
      }
    } finally {
      setGenerating(false);
    }
  };

  function exportCSV() {
    if (!preview) return;
    const lavageNom = lavages.find((l) => l.id === selectedLavage)?.nom ?? 'lavage';
    const rows = [
      ['Date', 'Type', 'Client', 'Immatriculation', 'Laveur', 'Gérant', 'Montant FCFA', 'Commission FCFA'],
      ...preview.transactions.map((tx) => [
        formatDate(tx.created_at, 'dd/MM/yyyy HH:mm'),
        tx.type_lavage,
        tx.client?.nom_complet ?? 'Anonyme',
        tx.client?.immatriculation ?? '',
        tx.laveur?.nom_complet ?? '',
        tx.gerant?.nom_complet ?? '',
        tx.montant.toString(),
        tx.commission_laveur.toString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_${lavageNom}_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const lavageNom = lavages.find((l) => l.id === selectedLavage)?.nom;

  return (
    <div className="animate-fade-in">
      <Header title="Rapports & Exports" subtitle="Propriétaire" />

      <div className="p-6 space-y-5">
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-navy flex items-center gap-2">
            <Calendar size={16} /> Paramètres du rapport
          </h2>
          {loadingLavages ? <LoadingSpinner /> : (
            <div className="flex flex-wrap gap-4 items-end">
              {lavages.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">Lavage</label>
                  <select value={selectedLavage} onChange={(e) => setSelectedLavage(e.target.value)} className="input !py-2 !px-3 text-sm">
                    {lavages.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Du</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input !py-2 !px-3 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Au</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input !py-2 !px-3 text-sm" />
              </div>
              <button
                onClick={fetchData}
                disabled={generating || !selectedLavage}
                className="btn-primary !py-2 !px-5 !min-w-0 flex items-center gap-2 text-sm"
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                Générer
              </button>
            </div>
          )}
        </div>

        {preview && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Receipt, label: 'Transactions', value: preview.transactions.length.toString() },
                { icon: TrendingUp, label: 'CA total', value: formatMontant(preview.ca) },
                { icon: TrendingUp, label: 'Ticket moyen', value: preview.transactions.length > 0 ? formatMontant(Math.round(preview.ca / preview.transactions.length)) : '—' },
              ].map((s) => (
                <div key={s.label} className="card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <s.icon size={18} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-navy">{s.value}</div>
                    <div className="text-xs text-text-secondary">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 flex-wrap">
              <button onClick={() => window.print()} className="btn-primary !py-2 !px-5 !min-w-0 flex items-center gap-2 text-sm">
                <FileText size={14} /> Imprimer / PDF
              </button>
              <button onClick={exportCSV} className="btn-secondary !py-2 !px-5 !min-w-0 flex items-center gap-2 text-sm">
                <Download size={14} /> Exporter CSV
              </button>
            </div>

            <div className="card overflow-hidden print:shadow-none">
              <div className="px-5 py-4 border-b border-light-grey flex items-center justify-between">
                <h3 className="font-bold text-navy">
                  {lavageNom} — {formatDate(startDate, 'dd/MM/yyyy')} au {formatDate(endDate, 'dd/MM/yyyy')}
                </h3>
                <span className="text-sm text-text-secondary">{preview.transactions.length} transaction(s)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-variant border-b border-light-grey">
                      {['Date/Heure', 'Type', 'Client', 'Gérant', 'Laveur', 'Montant', 'Commission'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-grey">
                    {preview.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-surface-variant/40">
                        <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">{formatDate(tx.created_at, 'dd/MM HH:mm')}</td>
                        <td className="px-4 py-3"><span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-primary/10 text-primary">{tx.type_lavage}</span></td>
                        <td className="px-4 py-3 text-sm text-navy">
                          {tx.client?.nom_complet ?? <span className="text-text-light italic">Anonyme</span>}
                          {tx.client?.immatriculation && <div className="text-xs text-text-light">{tx.client.immatriculation}</div>}
                        </td>
                        <td className="px-4 py-3 text-sm text-navy">{tx.gerant?.nom_complet ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-navy">{tx.laveur?.nom_complet ?? '—'}</td>
                        <td className="px-4 py-3 font-bold text-navy text-sm">{tx.montant_formate ?? formatMontant(tx.montant)}</td>
                        <td className="px-4 py-3 text-sm text-warning">{tx.commission_laveur > 0 ? `−${tx.commission_formate}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gradient-primary text-white">
                      <td colSpan={5} className="px-4 py-3 font-bold text-sm">TOTAL</td>
                      <td className="px-4 py-3 font-black text-sm">{formatMontant(preview.ca)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}

        {!preview && !generating && (
          <div className="card p-12 text-center">
            <FileText size={48} className="mx-auto text-text-light mb-4" />
            <div className="text-navy font-semibold">Sélectionnez un lavage et une période</div>
            <div className="text-text-secondary text-sm mt-1">Export CSV + impression PDF disponibles</div>
          </div>
        )}
      </div>
    </div>
  );
}