'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import api, { endpoints } from '@/lib/api';
import { todayISO, formatMontant, formatDate } from '@/lib/utils';
import type { Transaction } from '@/lib/types';
import { FileText, Download, Loader2, Receipt, TrendingUp, Calendar } from 'lucide-react';

export default function RapportsGerantPage() {
  const { user } = useAuth();
  const lavageId = user?.lavage_id ?? '';

  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<{ transactions: Transaction[]; ca: number; count: number } | null>(null);

  const fetchData = useCallback(async () => {
    if (!lavageId) return;
    setGenerating(true);
    try {
      const res = await api.get(endpoints.transactions(lavageId), {
        params: { start_date: startDate, end_date: endDate, per_page: 500 },
      });
      if (res.data?.success) {
        const d = res.data.data;
        const list: Transaction[] = Array.isArray(d) ? d : (d?.data ?? []);
        const ca = list.reduce((s, t) => s + t.montant, 0);
        setPreview({ transactions: list, ca, count: list.length });
      }
    } finally {
      setGenerating(false);
    }
  }, [lavageId, startDate, endDate]);

  function printReport() {
    window.print();
  }

  function exportCSV() {
    if (!preview) return;
    const rows = [
      ['Date', 'Type', 'Client', 'Immatriculation', 'Laveur', 'Montant FCFA', 'Commission FCFA'],
      ...preview.transactions.map((tx) => [
        formatDate(tx.created_at, 'dd/MM/yyyy HH:mm'),
        tx.type_lavage,
        tx.client?.nom_complet ?? 'Anonyme',
        tx.client?.immatriculation ?? '',
        tx.laveur?.nom_complet ?? '',
        tx.montant.toString(),
        tx.commission_laveur.toString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_olave_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="animate-fade-in">
      <Header title="Rapports & Exports" subtitle="Gérant" />

      <div className="p-6 space-y-5">
        {/* Filtres */}
        <div className="card p-5">
          <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
            <Calendar size={16} /> Période du rapport
          </h2>
          <div className="flex flex-wrap gap-4 items-end">
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
              disabled={generating}
              className="btn-primary !py-2 !px-5 !min-w-0 flex items-center gap-2 text-sm"
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              Générer
            </button>
          </div>
        </div>

        {preview && (
          <>
            {/* Résumé */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Receipt, label: 'Transactions', value: preview.count.toString(), color: 'text-primary' },
                { icon: TrendingUp, label: 'CA total', value: formatMontant(preview.ca), color: 'text-green-dark' },
                { icon: TrendingUp, label: 'Ticket moyen', value: preview.count > 0 ? formatMontant(Math.round(preview.ca / preview.count)) : '0 FCFA', color: 'text-warning' },
              ].map((s) => (
                <div key={s.label} className="card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <s.icon size={18} className={s.color} />
                  </div>
                  <div>
                    <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-text-secondary">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions export */}
            <div className="flex gap-3 flex-wrap">
              <button onClick={printReport} className="btn-primary !py-2 !px-5 !min-w-0 flex items-center gap-2 text-sm">
                <FileText size={14} /> Imprimer / PDF
              </button>
              <button onClick={exportCSV} className="btn-secondary !py-2 !px-5 !min-w-0 flex items-center gap-2 text-sm">
                <Download size={14} /> Exporter CSV
              </button>
            </div>

            {/* Table rapport */}
            <div className="card overflow-hidden print:shadow-none">
              <div className="px-5 py-4 border-b border-light-grey flex items-center justify-between">
                <h3 className="font-bold text-navy">
                  Rapport du {formatDate(startDate, 'dd/MM/yyyy')} au {formatDate(endDate, 'dd/MM/yyyy')}
                </h3>
                <span className="text-sm text-text-secondary">{preview.count} transaction(s)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-variant border-b border-light-grey">
                      {['Date/Heure', 'Type', 'Client', 'Laveur', 'Montant', 'Commission'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-grey">
                    {preview.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-surface-variant/40 transition-colors">
                        <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                          {formatDate(tx.created_at, 'dd/MM HH:mm')}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-primary/10 text-primary">
                            {tx.type_lavage}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-navy">
                          {tx.client?.nom_complet ?? <span className="text-text-light italic">Anonyme</span>}
                          {tx.client?.immatriculation && <div className="text-xs text-text-light">{tx.client.immatriculation}</div>}
                        </td>
                        <td className="px-4 py-3 text-sm text-navy">{tx.laveur?.nom_complet ?? '—'}</td>
                        <td className="px-4 py-3 font-bold text-navy text-sm">{tx.montant_formate ?? formatMontant(tx.montant)}</td>
                        <td className="px-4 py-3 text-sm text-warning">{tx.commission_laveur > 0 ? `−${tx.commission_formate}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gradient-primary text-white">
                      <td colSpan={4} className="px-4 py-3 font-bold text-sm">TOTAL</td>
                      <td className="px-4 py-3 font-black text-sm">{formatMontant(preview.ca)}</td>
                      <td className="px-4 py-3"></td>
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
            <div className="text-navy font-semibold">Sélectionnez une période et cliquez sur Générer</div>
            <div className="text-text-secondary text-sm mt-1">Le rapport inclut toutes les transactions avec export CSV et impression PDF</div>
          </div>
        )}
      </div>
    </div>
  );
}