'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Gerant, Lavage } from '@/lib/types';
import { Users, Plus, Loader2, Mail, Phone, Building2, Shield, UserCheck } from 'lucide-react';

export default function GerantsPage() {
  const { user } = useAuth();
  const [gerants, setGerants] = useState<Gerant[]>([]);
  const [lavages, setLavages] = useState<Lavage[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '',
    password: '', password_confirmation: '', lavage_id: '',
  });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [gRes, lRes] = await Promise.allSettled([
        api.get(endpoints.gerants),
        api.get(endpoints.lavages),
      ]);
      if (gRes.status === 'fulfilled' && gRes.value.data?.success) {
        const d = gRes.value.data.data;
        setGerants(Array.isArray(d) ? d : (d?.data ?? []));
      }
      if (lRes.status === 'fulfilled' && lRes.value.data?.success) {
        const d = lRes.value.data.data;
        setLavages(Array.isArray(d) ? d : (d?.data ?? []));
      }
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom || !form.prenom) { setFormError('Nom et prénom requis'); return; }
    const digits = form.telephone.replace(/\D/g, '');
    if (digits.length !== 10) { setFormError('Le téléphone doit contenir exactement 10 chiffres'); return; }
    if (!form.lavage_id) { setFormError('Veuillez sélectionner un lavage'); return; }
    if (!form.password || form.password.length < 6) { setFormError('Mot de passe : 6 caractères minimum'); return; }
    if (form.password !== form.password_confirmation) { setFormError('Les mots de passe ne correspondent pas'); return; }
    setSubmitting(true);
    setFormError('');
    try {
      // Correct endpoint : le propriétaire crée un gérant via /auth/register-gerant
      await api.post(endpoints.gerantRegister, {
        nom: form.nom,
        prenom: form.prenom,
        telephone: digits,
        email: form.email || undefined,
        password: form.password,
        password_confirmation: form.password_confirmation,
        lavage_id: form.lavage_id,
      });
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      const msg = errData?.errors ? Object.values(errData.errors).flat()[0] : errData?.message;
      setFormError(msg || 'Erreur lors de la création');
    } finally { setSubmitting(false); }
  }

  function openModal() {
    setForm({ nom:'', prenom:'', email:'', telephone:'', password:'', password_confirmation:'', lavage_id:'' });
    setFormError('');
    setModalOpen(true);
  }

  const activeCount = gerants.filter((g) => g.is_active).length;

  return (
    <div className="animate-fade-in">
      <Header title="Gérants" subtitle="Propriétaire" />

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl p-4 text-center bg-gradient-to-br from-navy/15 to-navy/5 border border-navy/20">
            <div className="text-2xl font-black text-navy">{gerants.length}</div>
            <div className="text-xs font-medium text-navy/60 mt-1">Total gérants</div>
          </div>
          <div className="rounded-2xl p-4 text-center bg-gradient-to-br from-green/15 to-green/5 border border-green/20">
            <div className="text-2xl font-black text-green-dark">{activeCount}</div>
            <div className="text-xs font-medium text-green-dark/70 mt-1">Actifs</div>
          </div>
          <div className="rounded-2xl p-4 text-center bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20">
            <div className="text-2xl font-black text-primary">{lavages.length}</div>
            <div className="text-xs font-medium text-primary/70 mt-1">Lavages</div>
          </div>
        </div>

        {/* Header action */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-navy">Liste des gérants</h2>
          <button onClick={openModal}
            className="btn-primary !py-2 !px-4 !min-w-0 flex items-center gap-2 text-sm">
            <Plus size={15} /> Nouveau gérant
          </button>
        </div>

        {/* List */}
        <div className="card overflow-hidden">
          {loading ? (
            <LoadingSpinner />
          ) : gerants.length === 0 ? (
            <EmptyState icon={Users} title="Aucun gérant" description="Créez votre premier gérant pour gérer vos lavages" />
          ) : (
            <div className="divide-y divide-light-grey">
              {gerants.map((g) => (
                <div key={g.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-variant/50 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-gradient-navy flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {((g.prenom?.[0] ?? '') + (g.nom?.[0] ?? '')).toUpperCase() || <UserCheck size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy">{g.prenom} {g.nom}</span>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1',
                        g.is_active ? 'bg-green/10 text-green-dark' : 'bg-light-grey text-text-secondary'
                      )}>
                        <Shield size={9} /> {g.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <div className="text-sm text-text-secondary mt-0.5 flex items-center gap-3 flex-wrap">
                      {g.email && (
                        <span className="flex items-center gap-1"><Mail size={10} /> {g.email}</span>
                      )}
                      {g.telephone && (
                        <span className="flex items-center gap-1"><Phone size={10} /> {g.telephone}</span>
                      )}
                      {g.lavage && (
                        <span className="flex items-center gap-1 bg-primary/8 text-primary px-2 py-0.5 rounded-lg text-xs font-semibold">
                          <Building2 size={10} /> {g.lavage.nom}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal création gérant */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau gérant">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Prénom *</label>
              <input type="text" value={form.prenom}
                onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                className="input" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Nom *</label>
              <input type="text" value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                className="input" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">
              Téléphone * <span className="text-xs font-normal text-text-light">(10 chiffres — sert d'identifiant de connexion)</span>
            </label>
            <input type="tel" value={form.telephone}
              onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
              className="input" placeholder="0X XX XX XX XX" required />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">
              Email <span className="text-xs font-normal text-text-light">(optionnel)</span>
            </label>
            <input type="email" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="input" placeholder="gerant@example.com" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Lavage assigné *</label>
            <select value={form.lavage_id}
              onChange={(e) => setForm((f) => ({ ...f, lavage_id: e.target.value }))}
              className="input" required>
              <option value="">Choisir un lavage…</option>
              {lavages.map((l) => (
                <option key={l.id} value={l.id}>{l.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Mot de passe *</label>
            <input type="password" value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="input" placeholder="6 caractères minimum" required minLength={6} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Confirmer le mot de passe *</label>
            <input type="password" value={form.password_confirmation}
              onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))}
              className="input" required />
          </div>

          {formError && (
            <div className="bg-error/8 border border-error/20 text-error text-sm rounded-xl px-4 py-3">
              {formError}
            </div>
          )}

          <div className="bg-info/8 border border-info/20 rounded-xl px-4 py-3 text-xs text-info">
            Le gérant se connecte avec son numéro de téléphone et son mot de passe.
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
              Annuler
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Création…</> : 'Créer le gérant'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}