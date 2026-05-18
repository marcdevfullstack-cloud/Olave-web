'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { formatMontant, cn } from '@/lib/utils';
import type { Laveur, LaveurCommission } from '@/lib/types';
import { UserCheck, HandCoins, Plus, Pencil, Trash2, Power, Loader2, AlertTriangle, Users } from 'lucide-react';

type ModalMode = 'create' | 'edit';

export default function LaveursPage() {
  const { user } = useAuth();
  const lavageId = user?.lavage_id ?? '';

  const [laveurs, setLaveurs] = useState<Laveur[]>([]);
  const [commissions, setCommissions] = useState<LaveurCommission[]>([]);
  const [loading, setLoading] = useState(true);

  // CRUD modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editTarget, setEditTarget] = useState<Laveur | null>(null);
  const [form, setForm] = useState({ nom: '', prenom: '', telephone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!lavageId) return;
    setLoading(true);
    try {
      const [lvRes, commRes] = await Promise.all([
        api.get(endpoints.laveurs(lavageId)),
        api.get(endpoints.statsCommissions(lavageId)),
      ]);
      if (lvRes.data?.success) {
        const d = lvRes.data.data;
        setLaveurs(Array.isArray(d) ? d : (d?.data ?? []));
      }
      if (commRes.data?.success) setCommissions(commRes.data.data?.par_laveur ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [lavageId]);

  useEffect(() => { load(); }, [load]);

  function commissionFor(laveurId: string): LaveurCommission | undefined {
    return commissions.find((c) => c.laveur_id === laveurId);
  }

  function openCreate() {
    setModalMode('create');
    setEditTarget(null);
    setForm({ nom: '', prenom: '', telephone: '' });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(laveur: Laveur) {
    setModalMode('edit');
    setEditTarget(laveur);
    setForm({
      nom: laveur.nom ?? '',
      prenom: laveur.prenom ?? '',
      telephone: laveur.telephone ?? '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom.trim()) { setFormError('Le nom est requis'); return; }
    if (!form.prenom.trim()) { setFormError('Le prénom est requis'); return; }
    const digits = form.telephone.replace(/\D/g, '');
    if (digits.length !== 10) { setFormError('Le numéro de téléphone doit contenir exactement 10 chiffres'); return; }

    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        telephone: digits,
      };
      if (modalMode === 'create') {
        await api.post(endpoints.laveurs(lavageId), payload);
      } else if (editTarget) {
        await api.put(endpoints.laveur(editTarget.id), payload);
      }
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setFormError(e?.response?.data?.message ?? 'Erreur lors de l\'enregistrement');
    } finally { setSubmitting(false); }
  }

  async function handleToggle(laveur: Laveur) {
    try {
      await api.patch(endpoints.laveurToggle(laveur.id));
      load();
    } catch { /* ignore */ }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(endpoints.laveur(deleteId));
      setDeleteId(null);
      load();
    } catch { /* ignore */ }
    finally { setDeleting(false); }
  }

  const totalCommissions = commissions.reduce((s, c) => s + c.commission_a_payer, 0);
  const actifs = laveurs.filter((l) => l.is_active).length;

  return (
    <div className="animate-fade-in">
      <Header title="Laveurs" subtitle="Gérant" />

      <div className="p-6 space-y-5">
        {/* Stats colorées */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl p-4 bg-gradient-to-br from-navy/10 to-navy/5 border border-navy/15">
            <div className="flex items-center gap-2 mb-1">
              <Users size={15} className="text-navy" />
              <span className="text-xs font-semibold text-navy/70">Total</span>
            </div>
            <div className="text-2xl font-black text-navy">{laveurs.length}</div>
          </div>
          <div className="rounded-2xl p-4 bg-gradient-to-br from-green/15 to-green/5 border border-green/20">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck size={15} className="text-green-dark" />
              <span className="text-xs font-semibold text-green-dark/80">Actifs</span>
            </div>
            <div className="text-2xl font-black text-green-dark">{actifs}</div>
          </div>
          <div className="rounded-2xl p-4 bg-gradient-to-br from-surface-variant to-light-grey/50 border border-light-grey">
            <div className="flex items-center gap-2 mb-1">
              <Power size={15} className="text-text-secondary" />
              <span className="text-xs font-semibold text-text-secondary">Inactifs</span>
            </div>
            <div className="text-2xl font-black text-text-secondary">{laveurs.length - actifs}</div>
          </div>
          <div className="rounded-2xl p-4 bg-gradient-to-br from-warning/15 to-warning/5 border border-warning/20">
            <div className="flex items-center gap-2 mb-1">
              <HandCoins size={15} className="text-warning" />
              <span className="text-xs font-semibold text-warning/80">Commissions / jour</span>
            </div>
            <div className="text-lg font-black text-warning">{formatMontant(totalCommissions)}</div>
          </div>
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-navy text-base">
            Équipe <span className="text-text-secondary font-normal text-sm">({laveurs.length})</span>
          </h2>
          <button onClick={openCreate} className="btn-primary !py-2 !px-5 !min-w-0 flex items-center gap-2 text-sm">
            <Plus size={16} /> Ajouter un laveur
          </button>
        </div>

        {/* List */}
        <div className="card overflow-hidden">
          {loading ? (
            <LoadingSpinner />
          ) : laveurs.length === 0 ? (
            <EmptyState icon={UserCheck} title="Aucun laveur" description="Ajoutez votre premier laveur pour commencer" />
          ) : (
            <div className="divide-y divide-light-grey">
              {laveurs.map((laveur) => {
                const comm = commissionFor(laveur.id);
                return (
                  <div key={laveur.id} className="flex items-center gap-4 px-5 py-4 hover:bg-primary/3 transition-colors group">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm',
                      laveur.is_active ? 'bg-gradient-navy' : 'bg-light-grey'
                    )}>
                      {laveur.initiales}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-navy">{laveur.nom_complet}</span>
                        <span className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded-full',
                          laveur.is_active
                            ? 'bg-green/10 text-green-dark'
                            : 'bg-light-grey text-text-secondary'
                        )}>
                          {laveur.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      {laveur.telephone && (
                        <div className="text-sm text-text-secondary mt-0.5">{laveur.telephone}</div>
                      )}
                      <div className="text-xs text-text-light mt-0.5">
                        Commission : <span className="font-semibold text-primary">20%</span>
                      </div>
                    </div>

                    {comm ? (
                      <div className="text-right flex-shrink-0 mr-2">
                        <div className="flex items-center gap-1 text-warning font-bold text-sm justify-end">
                          <HandCoins size={14} />
                          {comm.commission_formate}
                        </div>
                        <div className="text-xs text-text-light">{comm.nombre_lavages} lavage(s)</div>
                        <div className="text-xs text-text-secondary">{formatMontant(comm.ca_genere)} générés</div>
                      </div>
                    ) : (
                      <div className="text-xs text-text-light mr-2">Aucune activité</div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => openEdit(laveur)} title="Modifier"
                        className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary text-text-light transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleToggle(laveur)}
                        title={laveur.is_active ? 'Désactiver' : 'Activer'}
                        className={cn('p-2 rounded-lg transition-colors',
                          laveur.is_active
                            ? 'hover:bg-warning/10 hover:text-warning text-text-light'
                            : 'hover:bg-green/10 hover:text-green-dark text-text-light'
                        )}>
                        <Power size={15} />
                      </button>
                      <button onClick={() => setDeleteId(laveur.id)} title="Supprimer"
                        className="p-2 rounded-lg hover:bg-error/10 hover:text-error text-text-light transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Créer / Modifier Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={modalMode === 'create' ? 'Ajouter un laveur' : 'Modifier le laveur'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Prénom *</label>
              <input type="text" value={form.prenom}
                onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                className="input" placeholder="Jean" required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Nom *</label>
              <input type="text" value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                className="input" placeholder="Koné" required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Téléphone * <span className="text-xs font-normal text-text-light">(10 chiffres)</span></label>
            <input type="tel" value={form.telephone}
              onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
              className="input" placeholder="0712345678" required
            />
          </div>
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-sm text-text-secondary">
            Commission appliquée automatiquement : <span className="font-bold text-primary">20%</span> par lavage
          </div>
          {formError && (
            <div className="bg-error/8 border border-error/20 text-error text-sm rounded-xl px-4 py-3">
              {formError}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Enregistrement…</> : (modalMode === 'create' ? 'Ajouter' : 'Enregistrer')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer le laveur">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-error/8 border border-error/20">
            <AlertTriangle size={18} className="text-error flex-shrink-0 mt-0.5" />
            <p className="text-sm text-navy">
              Cette action est <strong>irréversible</strong>. Les transactions associées seront conservées mais le laveur sera retiré de votre équipe.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Annuler</button>
            <button onClick={handleDelete} disabled={deleting}
              className="flex-1 py-3 rounded-xl bg-error text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity">
              {deleting ? <><Loader2 size={16} className="animate-spin" /> Suppression…</> : 'Supprimer définitivement'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}