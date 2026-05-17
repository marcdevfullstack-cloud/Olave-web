'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Users, Plus, Loader2, Mail, Phone, Building2, Shield } from 'lucide-react';

interface Gerant {
  id: string;
  nom: string;
  prenom: string;
  nom_complet?: string;
  email: string;
  telephone?: string;
  lavage?: { id: string; nom: string };
  role: string;
}

interface Lavage {
  id: string;
  nom: string;
}

export default function GerantsPage() {
  const { user } = useAuth();
  const [gerants, setGerants] = useState<Gerant[]>([]);
  const [lavages, setLavages] = useState<Lavage[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '', password: '', lavage_id: '',
  });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [gRes, lRes] = await Promise.all([
        api.get(endpoints.gerants).catch(() => null),
        api.get(endpoints.lavages).catch(() => null),
      ]);
      if (gRes?.data?.success) {
        const d = gRes.data.data;
        setGerants(Array.isArray(d) ? d : (d?.data ?? []));
      }
      if (lRes?.data?.success) {
        const d = lRes.data.data;
        setLavages(Array.isArray(d) ? d : (d?.data ?? []));
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password) { setFormError('Email et mot de passe requis'); return; }
    setSubmitting(true);
    setFormError('');
    try {
      await api.post('/auth/register', {
        ...form,
        role: 'gerant',
        lavage_id: form.lavage_id || undefined,
      });
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  }

  function openModal() {
    setForm({ nom: '', prenom: '', email: '', telephone: '', password: '', lavage_id: '' });
    setFormError('');
    setModalOpen(true);
  }

  return (
    <div className="animate-fade-in">
      <Header title="Gérants" subtitle="Propriétaire" />

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-navy">{gerants.length}</div>
            <div className="text-xs text-text-secondary mt-1">Total gérants</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-primary">{lavages.length}</div>
            <div className="text-xs text-text-secondary mt-1">Lavages gérés</div>
          </div>
        </div>

        {/* Header action */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-navy">Liste des gérants</h2>
          <button onClick={openModal} className="btn-primary !py-2 !px-4 !min-w-0 flex items-center gap-2 text-sm">
            <Plus size={15} /> Nouveau gérant
          </button>
        </div>

        {/* List */}
        <div className="card overflow-hidden">
          {loading ? (
            <LoadingSpinner />
          ) : gerants.length === 0 ? (
            <EmptyState icon={Users} title="Aucun gérant" description="Créez votre premier gérant" />
          ) : (
            <div className="divide-y divide-light-grey">
              {gerants.map((g) => (
                <div key={g.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-variant/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-navy flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {(g.prenom?.[0] ?? '') + (g.nom?.[0] ?? '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-navy">{g.prenom} {g.nom}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold flex items-center gap-1">
                        <Shield size={9} /> Gérant
                      </span>
                    </div>
                    <div className="text-sm text-text-secondary mt-0.5 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1"><Mail size={10} /> {g.email}</span>
                      {g.telephone && <span className="flex items-center gap-1"><Phone size={10} /> {g.telephone}</span>}
                      {g.lavage && <span className="flex items-center gap-1"><Building2 size={10} /> {g.lavage.nom}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau gérant">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Prénom *</label>
              <input type="text" value={form.prenom} onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Nom *</label>
              <input type="text" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} className="input" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Téléphone</label>
            <input type="tel" value={form.telephone} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} className="input" placeholder="0X XX XX XX XX" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Mot de passe *</label>
            <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Lavage assigné</label>
            <select value={form.lavage_id} onChange={(e) => setForm((f) => ({ ...f, lavage_id: e.target.value }))} className="input">
              <option value="">Aucun (à assigner plus tard)</option>
              {lavages.map((l) => (
                <option key={l.id} value={l.id}>{l.nom}</option>
              ))}
            </select>
          </div>
          {formError && <div className="bg-error/8 border border-error/20 text-error text-sm rounded-xl px-4 py-3">{formError}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Création…</> : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}