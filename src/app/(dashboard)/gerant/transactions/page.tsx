'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { formatMontant, formatDate, todayISO, cn } from '@/lib/utils';
import type { Transaction, Client, Laveur } from '@/lib/types';
import { Plus, Receipt, Clock, ChevronLeft, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';

const TYPE_OPTIONS = ['Extérieur', 'Intérieur', 'Complet'];

export default function TransactionsPage() {
  const { user } = useAuth();
  const lavageId = user?.lavage_id ?? '';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [caTotal, setCaTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [laveurs, setLaveurs] = useState<Laveur[]>([]);
  const [form, setForm] = useState({
    type_lavage: 'Extérieur',
    montant: '',
    laveur_id: '',
    client_id: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    if (!lavageId) return;
    setLoading(true);
    try {
      const res = await api.get(endpoints.transactions(lavageId), {
        params: { start_date: startDate, end_date: endDate, page, per_page: 20 },
      });
      if (res.data?.success) {
        const d = res.data.data;
        const list = Array.isArray(d) ? d : (d?.data ?? []);
        setTransactions(list);
        setLastPage(d?.last_page ?? 1);
        setTotal(d?.total ?? list.length);
        setCaTotal(list.reduce((s: number, t: Transaction) => s + t.montant, 0));
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [lavageId, startDate, endDate, page]);

  useEffect(() => { load(); }, [load]);

  async function loadFormData() {
    if (!lavageId) return;
    const [cl, lv] = await Promise.all([
      api.get(endpoints.clients(lavageId)).catch(() => null),
      api.get(endpoints.laveurs(lavageId)).catch(() => null),
    ]);
    if (cl?.data?.success) {
      const d = cl.data.data;
      setClients(Array.isArray(d) ? d : (d?.data ?? []));
    }
    if (lv?.data?.success) {
      const d = lv.data.data;
      setLaveurs(Array.isArray(d) ? d : (d?.data ?? []));
    }
  }

  async function openModal() {
    setForm({ type_lavage: 'Extérieur', montant: '', laveur_id: '', client_id: '', notes: '' });
    setFormError('');
    await loadFormData();
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.montant || !form.laveur_id) { setFormError('Montant et laveur requis'); return; }
    setSubmitting(true);
    setFormError('');
    try {
      await api.post(endpoints.transactions(lavageId), {
        type_lavage: form.type_lavage,
        montant: Number(form.montant),
        laveur_id: form.laveur_id,
        client_id: form.client_id || undefined,
        notes: form.notes || undefined,
      });
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  }

  const typeColors: Record<string, string> = {
    'intérieur': 'bg-info/10 text-info',
    'interieur':  'bg-info/10 text-info',
    'extérieur':  'bg-green/10 text-green-dark',
    'exterieur':  'bg-green/10 text-green-dark',
    'complet':    'bg-primary/10 text-primary',
  };

  return (
    <div className="animate-fade-in">
      <Header title="Transactions" subtitle="Gérant" />

      <div className="p-6 space-y-5">
        {/* Filters + actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-text-secondary">Du</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="input !py-2 !px-3 text-sm w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-text-secondary">Au</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="input !py-2 !px-3 text-sm w-auto"
              />
            </div>
            <button onClick={load} className="btn-secondary !py-2 !px-4 !min-w-0 text-sm flex items-center gap-2">
              <RefreshCw size={14} />
              Actualiser
            </button>
          </div>

          <button onClick={openModal} className="btn-primary !py-2 !px-5 !min-w-0 flex items-center gap-2 text-sm">
            <Plus size={16} />
            Nouvelle transaction
          </button>
        </div>

        {/* CA Banner */}
        {!loading && transactions.length > 0 && (
          <div className="bg-gradient-primary rounded-2xl p-5 flex items-center justify-between text-white shadow-primary">
            <div>
              <div className="text-sm font-medium opacity-80">CA sur la période</div>
              <div className="text-3xl font-black mt-1">{formatMontant(caTotal)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium opacity-80">Transactions</div>
              <div className="text-3xl font-black mt-1">{total}</div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <LoadingSpinner />
          ) : transactions.length === 0 ? (
            <EmptyState icon={Receipt} title="Aucune transaction" description="Modifiez la période ou enregistrez une transaction" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-variant border-b border-light-grey">
                      {['Heure', 'Type', 'Client', 'Laveur', 'Montant', 'Commission'].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-grey">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-surface-variant/40 transition-colors">
                        <td className="px-5 py-3 text-sm text-text-secondary whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} />
                            {formatDate(tx.created_at, 'HH:mm')}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn(
                            'text-xs font-semibold px-2.5 py-1 rounded-lg',
                            typeColors[tx.type_lavage?.toLowerCase()] ?? 'bg-light-grey text-text-secondary'
                          )}>
                            {tx.type_lavage}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-navy">
                          {tx.client?.nom_complet ?? <span className="text-text-light italic">Anonyme</span>}
                          {tx.client?.immatriculation && (
                            <div className="text-xs text-text-light">{tx.client.immatriculation}</div>
                          )}
                        </td>
                        <td className="px-5 py-3 text-sm text-navy">
                          {tx.laveur?.nom_complet ?? '—'}
                        </td>
                        <td className="px-5 py-3 font-bold text-navy whitespace-nowrap">
                          {tx.montant_formate}
                        </td>
                        <td className="px-5 py-3 text-sm text-warning font-medium whitespace-nowrap">
                          {tx.commission_laveur > 0 ? `−${tx.commission_formate}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {lastPage > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-light-grey">
                  <span className="text-sm text-text-secondary">Page {page} / {lastPage}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn-secondary !py-1.5 !px-3 !min-w-0 disabled:opacity-40"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                      disabled={page === lastPage}
                      className="btn-secondary !py-1.5 !px-3 !min-w-0 disabled:opacity-40"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Nouvelle Transaction */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle transaction">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Type de lavage *</label>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type_lavage: t }))}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                    form.type_lavage === t
                      ? 'bg-gradient-primary text-white border-transparent shadow-primary'
                      : 'border-light-grey text-text-secondary hover:border-primary/40'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Montant (FCFA) *</label>
            <input
              type="number"
              min="0"
              value={form.montant}
              onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
              className="input"
              placeholder="5 000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Laveur *</label>
            <select
              value={form.laveur_id}
              onChange={(e) => setForm((f) => ({ ...f, laveur_id: e.target.value }))}
              className="input"
              required
            >
              <option value="">Sélectionner un laveur</option>
              {laveurs.filter((l) => l.is_active).map((l) => (
                <option key={l.id} value={l.id}>{l.nom_complet}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Client (optionnel)</label>
            <select
              value={form.client_id}
              onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
              className="input"
            >
              <option value="">Passage anonyme</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.nom_complet} — {c.immatriculation}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="input resize-none"
              rows={2}
              placeholder="Remarques…"
            />
          </div>

          {formError && (
            <div className="bg-error/8 border border-error/20 text-error text-sm rounded-xl px-4 py-3">
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
              Annuler
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Enregistrement…</> : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}