'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { formatMontant, formatDate, todayISO, cn } from '@/lib/utils';
import type { Transaction, Client, Laveur } from '@/lib/types';
import { Plus, Receipt, Clock, ChevronLeft, ChevronRight, RefreshCw, Loader2, TrendingUp, Banknote, Hash } from 'lucide-react';

const TYPE_OPTIONS = [
  'Lavage Simple',
  'Lavage Complet',
  'Lavage Premium',
  'Nettoyage Intérieur',
  'Cirage',
  'Polissage',
];

const typeColors: Record<string, string> = {
  'lavage simple':        'bg-green/10 text-green-dark border-green/20',
  'lavage complet':       'bg-info/10 text-info border-info/20',
  'lavage premium':       'bg-primary/10 text-primary border-primary/20',
  'nettoyage intérieur':  'bg-navy/10 text-navy border-navy/20',
  'cirage':               'bg-warning/10 text-warning border-warning/20',
  'polissage':            'bg-error/10 text-error border-error/20',
};

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
    type_lavage: 'Lavage Simple',
    montant: '',
    laveur_id: '',
    client_id: '',
    observation: '',
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
    setForm({ type_lavage: 'Lavage Simple', montant: '', laveur_id: '', client_id: '', observation: '' });
    setFormError('');
    await loadFormData();
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.laveur_id) { setFormError('Sélectionnez un laveur'); return; }
    setSubmitting(true);
    setFormError('');
    try {
      await api.post(endpoints.transactionCreate, {
        lavage_id: lavageId,
        type_lavage: form.type_lavage,
        montant: form.montant ? Number(form.montant) : undefined,
        laveur_id: form.laveur_id,
        client_id: form.client_id || undefined,
        observation: form.observation || undefined,
      });
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg = e?.response?.data?.message ?? 'Erreur lors de l\'enregistrement';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <Header title="Transactions" subtitle="Gérant" />

      <div className="p-6 space-y-5">
        {/* Filters + actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-text-secondary">Du</label>
              <input type="date" value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="input !py-2 !px-3 text-sm w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-text-secondary">Au</label>
              <input type="date" value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="input !py-2 !px-3 text-sm w-auto"
              />
            </div>
            <button onClick={load} className="btn-secondary !py-2 !px-4 !min-w-0 text-sm flex items-center gap-2">
              <RefreshCw size={14} /> Actualiser
            </button>
          </div>
          <button onClick={openModal} className="btn-primary !py-2 !px-5 !min-w-0 flex items-center gap-2 text-sm">
            <Plus size={16} /> Nouvelle transaction
          </button>
        </div>

        {/* Stats cards */}
        {!loading && (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl p-4 bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Banknote size={16} className="text-primary" />
                <span className="text-xs font-semibold text-primary/80">CA période</span>
              </div>
              <div className="text-xl font-black text-primary">{formatMontant(caTotal)}</div>
            </div>
            <div className="rounded-2xl p-4 bg-gradient-to-br from-navy/10 to-navy/5 border border-navy/15">
              <div className="flex items-center gap-2 mb-2">
                <Hash size={16} className="text-navy" />
                <span className="text-xs font-semibold text-navy/70">Transactions</span>
              </div>
              <div className="text-xl font-black text-navy">{total}</div>
            </div>
            <div className="rounded-2xl p-4 bg-gradient-to-br from-green/15 to-green/5 border border-green/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-green-dark" />
                <span className="text-xs font-semibold text-green-dark/80">Ticket moyen</span>
              </div>
              <div className="text-xl font-black text-green-dark">
                {total > 0 ? formatMontant(Math.round(caTotal / total)) : '—'}
              </div>
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
                    <tr className="bg-gradient-to-r from-navy/5 to-transparent border-b border-light-grey">
                      {['Heure', 'Type', 'Client', 'Laveur', 'Montant', 'Commission'].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-grey">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-primary/3 transition-colors">
                        <td className="px-5 py-3.5 text-sm text-text-secondary whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} />
                            {formatDate(tx.created_at, 'HH:mm')}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn(
                            'text-xs font-semibold px-2.5 py-1 rounded-lg border',
                            typeColors[tx.type_lavage?.toLowerCase()] ?? 'bg-light-grey text-text-secondary border-light-grey'
                          )}>
                            {tx.type_lavage}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-navy">
                          {tx.client?.nom_complet ?? <span className="text-text-light italic">Anonyme</span>}
                          {tx.client?.immatriculation && (
                            <div className="text-xs text-text-light">{tx.client.immatriculation}</div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-navy">
                          {tx.laveur?.nom_complet ?? '—'}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-navy whitespace-nowrap">
                          {tx.montant_formate}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-warning font-medium whitespace-nowrap">
                          {tx.commission_laveur > 0 ? `−${tx.commission_formate}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {lastPage > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-light-grey bg-surface-variant/30">
                  <span className="text-sm text-text-secondary">Page {page} / {lastPage}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                      className="btn-secondary !py-1.5 !px-3 !min-w-0 disabled:opacity-40">
                      <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page === lastPage}
                      className="btn-secondary !py-1.5 !px-3 !min-w-0 disabled:opacity-40">
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
            <label className="block text-sm font-semibold text-navy mb-2">Type de service *</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map((t) => (
                <button key={t} type="button"
                  onClick={() => setForm((f) => ({ ...f, type_lavage: t }))}
                  className={cn(
                    'py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all text-left',
                    form.type_lavage === t
                      ? 'bg-gradient-primary text-white border-transparent shadow-primary'
                      : 'border-light-grey text-text-secondary hover:border-primary/40 hover:bg-primary/5'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1">
              Montant (FCFA)
              <span className="ml-2 text-xs font-normal text-text-light">optionnel — le tarif configuré sera utilisé</span>
            </label>
            <input type="number" min="0" value={form.montant}
              onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
              className="input" placeholder="Laisser vide pour utiliser le tarif"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Laveur *</label>
            <select value={form.laveur_id}
              onChange={(e) => setForm((f) => ({ ...f, laveur_id: e.target.value }))}
              className="input" required
            >
              <option value="">Sélectionner un laveur</option>
              {laveurs.filter((l) => l.is_active).map((l) => (
                <option key={l.id} value={l.id}>{l.nom_complet}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Client (optionnel)</label>
            <select value={form.client_id}
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
            <label className="block text-sm font-semibold text-navy mb-2">Observation</label>
            <textarea value={form.observation}
              onChange={(e) => setForm((f) => ({ ...f, observation: e.target.value }))}
              className="input resize-none" rows={2} placeholder="Remarques…"
            />
          </div>

          {formError && (
            <div className="bg-error/8 border border-error/20 text-error text-sm rounded-xl px-4 py-3">
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Enregistrement…</> : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}