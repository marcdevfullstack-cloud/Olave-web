'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { formatMontant, formatDate, todayISO, cn } from '@/lib/utils';
import type { Lavage, Salaire } from '@/lib/types';
import { DollarSign, Plus, Loader2, TrendingUp, UserCheck, History, Users } from 'lucide-react';

interface LaveurCommission {
  laveur_id: string;
  nom_complet: string;
  nombre_lavages: number;
  ca_genere: number;
  commission_a_payer: number;
  commission_formate: string;
}

type Tab = 'commissions' | 'historique';

function getPeriode() {
  return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export default function SalairesPage() {
  const { user } = useAuth();
  const [lavages, setLavages] = useState<Lavage[]>([]);
  const [selectedLavage, setSelectedLavage] = useState('');
  const [tab, setTab] = useState<Tab>('commissions');

  // Commissions
  const [commissions, setCommissions] = useState<LaveurCommission[]>([]);
  const [loadingComm, setLoadingComm] = useState(false);

  // Historique
  const [salairesHistory, setSalairesHistory] = useState<Salaire[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modal paiement
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLaveur, setSelectedLaveur] = useState<LaveurCommission | null>(null);
  const [paying, setPaying] = useState(false);
  const [montant, setMontant] = useState('');
  const [periode, setPeriode] = useState(getPeriode());
  const [observation, setObservation] = useState('');
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
    setLoadingComm(true);
    try {
      const res = await api.get(endpoints.statsCommissions(selectedLavage));
      if (res.data?.success) {
        setCommissions(res.data.data?.par_laveur ?? []);
      }
    } finally { setLoadingComm(false); }
  }, [selectedLavage]);

  const loadHistory = useCallback(async () => {
    if (!selectedLavage) return;
    setLoadingHistory(true);
    try {
      const res = await api.get(endpoints.salaires(selectedLavage), { params: { per_page: 50 } });
      if (res.data?.success) {
        const d = res.data.data;
        setSalairesHistory(Array.isArray(d) ? d : (d?.data ?? []));
      }
    } finally { setLoadingHistory(false); }
  }, [selectedLavage]);

  useEffect(() => {
    if (selectedLavage) {
      loadCommissions();
      loadHistory();
    }
  }, [selectedLavage, loadCommissions, loadHistory]);

  function openPay(laveur: LaveurCommission) {
    setSelectedLaveur(laveur);
    setMontant(laveur.commission_a_payer.toString());
    setPeriode(getPeriode());
    setObservation('');
    setFormError('');
    setModalOpen(true);
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLaveur || !montant) return;
    if (!periode.trim()) { setFormError('La période est requise (ex: mai 2026)'); return; }
    setPaying(true);
    setFormError('');
    try {
      // Payload correct : employe_id + employe_type + lavage_id + montant + date_paiement + periode
      await api.post(endpoints.salaireCreate, {
        employe_id: Number(selectedLaveur.laveur_id),
        employe_type: 'laveur',
        lavage_id: selectedLavage,
        montant: Number(montant),
        date_paiement: todayISO(),
        periode: periode.trim(),
        observation: observation || undefined,
      });
      setSuccessMsg(`Commission de ${formatMontant(Number(montant))} payée à ${selectedLaveur.nom_complet}`);
      setModalOpen(false);
      loadCommissions();
      loadHistory();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      const msg = errData?.errors ? Object.values(errData.errors).flat()[0] : errData?.message;
      setFormError(msg || 'Erreur lors du paiement');
    } finally { setPaying(false); }
  }

  const totalCommissions = commissions.reduce((s, c) => s + c.commission_a_payer, 0);
  const totalPaye = salairesHistory.reduce((s, h) => s + h.montant, 0);

  return (
    <div className="animate-fade-in">
      <Header title="Salaires & Commissions" subtitle="Propriétaire" />

      <div className="p-6 space-y-5">
        {successMsg && (
          <div className="bg-green/10 border border-green/30 text-green-dark text-sm rounded-xl px-4 py-3 font-medium">
            ✓ {successMsg}
          </div>
        )}

        {/* Sélecteur lavage */}
        {lavages.length > 1 && (
          <div className="card p-4">
            <label className="block text-sm font-semibold text-navy mb-2">Lavage</label>
            <select value={selectedLavage} onChange={(e) => setSelectedLavage(e.target.value)} className="input">
              {lavages.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
            </select>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl p-5 bg-gradient-primary text-white shadow-primary">
            <div className="text-sm font-medium opacity-80">Commissions aujourd'hui</div>
            <div className="text-3xl font-black mt-1">{formatMontant(totalCommissions)}</div>
            <div className="text-xs opacity-70 mt-1">{commissions.length} laveur(s)</div>
          </div>
          <div className="rounded-2xl p-5 bg-gradient-to-br from-navy/15 to-navy/5 border border-navy/20">
            <div className="text-sm font-medium text-navy/70">Total payé (hist.)</div>
            <div className="text-3xl font-black text-navy mt-1">{formatMontant(totalPaye)}</div>
            <div className="text-xs text-navy/50 mt-1">{salairesHistory.length} paiement(s)</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-variant p-1 rounded-xl w-fit">
          {([
            { key: 'commissions', label: 'Commissions du jour', icon: TrendingUp },
            { key: 'historique', label: 'Historique', icon: History },
          ] as { key: Tab; label: string; icon: typeof TrendingUp }[]).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                tab === t.key ? 'bg-white text-navy shadow-card' : 'text-text-secondary hover:text-navy'
              )}>
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Commissions */}
        {tab === 'commissions' && (
          <div className="card overflow-hidden">
            {loadingComm ? <LoadingSpinner /> : commissions.length === 0 ? (
              <EmptyState icon={DollarSign} title="Aucune commission aujourd'hui" description="Les commissions apparaissent dès qu'un lavage est enregistré" />
            ) : (
              <div className="divide-y divide-light-grey">
                {commissions.map((c) => (
                  <div key={c.laveur_id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-variant/50 transition-colors">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green/20 to-green/10 flex items-center justify-center flex-shrink-0">
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
                        <div className="text-xs text-text-secondary">20% à payer</div>
                      </div>
                      <button onClick={() => openPay(c)}
                        className="btn-primary !py-1.5 !px-3 !min-w-0 text-sm flex items-center gap-1.5">
                        <DollarSign size={13} /> Payer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Historique */}
        {tab === 'historique' && (
          <div className="card overflow-hidden">
            {loadingHistory ? <LoadingSpinner /> : salairesHistory.length === 0 ? (
              <EmptyState icon={History} title="Aucun paiement enregistré" description="Les paiements de commissions apparaîtront ici" />
            ) : (
              <div className="divide-y divide-light-grey">
                {salairesHistory.map((s) => (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-variant/50 transition-colors">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      s.employe.type === 'gerant' ? 'bg-navy/10' : 'bg-green/10'
                    )}>
                      <Users size={16} className={s.employe.type === 'gerant' ? 'text-navy' : 'text-green-dark'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-navy">{s.employe.nom_complet}</div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        {s.periode} · {formatDate(s.date_paiement, 'dd/MM/yyyy')}
                        {s.observation && ` · ${s.observation}`}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-navy">{s.montant_formate ?? formatMontant(s.montant)}</div>
                      <div className={cn('text-xs px-2 py-0.5 rounded-full font-semibold',
                        s.employe.type === 'gerant' ? 'bg-navy/10 text-navy' : 'bg-green/10 text-green-dark')}>
                        {s.employe.type === 'gerant' ? 'Gérant' : 'Laveur'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal paiement */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Payer ${selectedLaveur?.nom_complet}`}>
        <form onSubmit={handlePay} className="space-y-4">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-navy font-medium">Commission calculée (20%)</span>
            <span className="font-black text-primary text-lg">
              {selectedLaveur ? formatMontant(selectedLaveur.commission_a_payer) : '—'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Montant à payer (FCFA) *</label>
            <input type="number" min="0" value={montant}
              onChange={(e) => setMontant(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Période *</label>
            <input type="text" value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="input" placeholder="ex: mai 2026" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Observation</label>
            <textarea value={observation} onChange={(e) => setObservation(e.target.value)}
              className="input resize-none" rows={2} placeholder="Remarques optionnelles…" />
          </div>
          {formError && (
            <div className="bg-error/8 border border-error/20 text-error text-sm rounded-xl px-4 py-3">
              {formError}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={paying} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {paying ? <><Loader2 size={16} className="animate-spin" /> Paiement…</> : <><DollarSign size={16} /> Confirmer</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}