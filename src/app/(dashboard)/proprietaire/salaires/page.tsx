'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { formatMontant, todayISO, cn } from '@/lib/utils';
import { DollarSign, Plus, Loader2, TrendingUp, UserCheck } from 'lucide-react';

interface LaveurCommission {
  laveur_id: string;
  nom_complet: string;
  nombre_lavages: number;
  ca_genere: number;
  commission_a_payer: number;
  commission_formate: string;
}

interface Lavage { id: string; nom: string }

export default function SalairesPage() {
  const { user } = useAuth();
  const [lavages, setLavages] = useState<Lavage[]>([]);
  const [selectedLavage, setSelectedLavage] = useState('');
  const [commissions, setCommissions] = useState<LaveurCommission[]>([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLaveur, setSelectedLaveur] = useState<LaveurCommission | null>(null);
  const [montant, setMontant] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadLavages = useCallback(async () => {
    const res = await api.get(endpoints.lavages).catch(() => null);
    if (res?.data?.success) {
      const d = res.data.data;
      const list: Lavage[] = Array.isArray(d) ? d : (d?.data ?? []);
      setLavages(list);
      if (list.length > 0) setSelectedLavage(list[0].id);
    }
  }, []);

  useEffect(() => { loadLavages(); }, [loadLavages]);

  const loadCommissions = useCallback(async () => {
    if (!selectedLavage) return;
    setLoading(true);
    try {
      const res = await api.get(endpoints.statsCommissions(selectedLavage));
      if (res.data?.success) {
        const d = res.data.data;
        setCommissions(d?.par_laveur ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedLavage]);

  useEffect(() => { loadCommissions(); }, [loadCommissions]);

  function openPay(l: LaveurCommission) {
    setSelectedLaveur(l);
    setMontant(l.commission_a_payer.toString());
    setNotes('');
    setFormError('');
    setModalOpen(true);
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLaveur || !montant) return;
    setPaying(selectedLaveur.laveur_id);
    setFormError('');
    try {
      await api.post(endpoints.salaires(selectedLavage), {
        laveur_id: selectedLaveur.laveur_id,
        montant: Number(montant),
        date_paiement: todayISO(),
        notes: notes || undefined,
      });
      setSuccessMsg(`Salaire de ${formatMontant(Number(montant))} payé à ${selectedLaveur.nom_complet}`);
      setModalOpen(false);
      loadCommissions();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || 'Erreur lors du paiement');
    } finally {
      setPaying(null);
    }
  }

  const totalCommissions = commissions.reduce((s, c) => s + c.commission_a_payer, 0);

  return (
    <div className="animate-fade-in">
      <Header title="Salaires & Commissions" subtitle="Propriétaire" />

      <div className="p-6 space-y-5">
        {successMsg && (
          <div className="bg-green/10 border border-green/30 text-green-dark text-sm rounded-xl px-4 py-3 font-medium">
            {successMsg}
          </div>
        )}

        {/* Sélecteur lavage */}
        {lavages.length > 1 && (
          <div className="card p-4">
            <label className="block text-sm font-semibold text-navy mb-2">Lavage</label>
            <select
              value={selectedLavage}
              onChange={(e) => setSelectedLavage(e.target.value)}
              className="input"
            >
              {lavages.map((l) => (
                <option key={l.id} value={l.id}>{l.nom}</option>
              ))}
            </select>
          </div>
        )}

        {/* Total à payer */}
        <div className="bg-gradient-primary rounded-2xl p-5 flex items-center justify-between text-white shadow-primary">
          <div>
            <div className="text-sm font-medium opacity-80">Commissions à payer (aujourd&apos;hui)</div>
            <div className="text-3xl font-black mt-1">{formatMontant(totalCommissions)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium opacity-80">Laveurs</div>
            <div className="text-3xl font-black mt-1">{commissions.length}</div>
          </div>
        </div>

        {/* Liste commissions */}
        <div className="card overflow-hidden">
          {loading ? (
            <LoadingSpinner />
          ) : commissions.length === 0 ? (
            <EmptyState icon={DollarSign} title="Aucune commission" description="Aucun laveur avec des commissions en attente" />
          ) : (
            <div className="divide-y divide-light-grey">
              {commissions.map((c) => (
                <div key={c.laveur_id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-variant/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center flex-shrink-0">
                    <UserCheck size={18} className="text-green-dark" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-navy">{c.nom_complet}</div>
                    <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <TrendingUp size={10} /> CA : {formatMontant(c.ca_genere)}
                      </span>
                      <span>{c.nombre_lavages} lavage(s)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-bold text-navy">{c.commission_formate}</div>
                      <div className="text-xs text-text-secondary">à payer</div>
                    </div>
                    <button
                      onClick={() => openPay(c)}
                      className="btn-primary !py-1.5 !px-3 !min-w-0 text-sm flex items-center gap-1.5"
                    >
                      <Plus size={13} /> Payer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Payer ${selectedLaveur?.nom_complet}`}>
        <form onSubmit={handlePay} className="space-y-4">
          <div className="bg-surface-variant rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-text-secondary">Commission calculée</span>
            <span className="font-bold text-navy">{selectedLaveur ? formatMontant(selectedLaveur.commission_a_payer) : ''}</span>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Montant à payer (FCFA) *</label>
            <input
              type="number"
              min="0"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input resize-none"
              rows={2}
              placeholder="Remarques sur ce paiement…"
            />
          </div>
          {formError && <div className="bg-error/8 border border-error/20 text-error text-sm rounded-xl px-4 py-3">{formError}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={!!paying} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {paying ? <><Loader2 size={16} className="animate-spin" /> Paiement…</> : <><DollarSign size={16} /> Confirmer</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}