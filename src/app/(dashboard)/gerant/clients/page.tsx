'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Client, Laveur } from '@/lib/types';
import { Users, Search, Plus, Star, Loader2, Car, Receipt } from 'lucide-react';

const TYPES = ['Voiture', 'Moto', 'Camion', 'Bus', 'Tricycle', 'Autre'];
const TYPE_OPTIONS = ['Extérieur', 'Intérieur', 'Complet'];

export default function ClientsPage() {
  const { user } = useAuth();
  const lavageId = user?.lavage_id ?? '';

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add client modal
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    nom: '', prenom: '', telephone: '',
    type_vehicule: 'Voiture', immatriculation: '',
    marque_vehicule: '', couleur_vehicule: '',
  });

  // Transaction modal
  const [txOpen, setTxOpen] = useState(false);
  const [txClient, setTxClient] = useState<Client | null>(null);
  const [laveurs, setLaveurs] = useState<Laveur[]>([]);
  const [txForm, setTxForm] = useState({ type_lavage: 'Extérieur', montant: '', laveur_id: '', notes: '' });
  const [txSubmitting, setTxSubmitting] = useState(false);
  const [txError, setTxError] = useState('');

  const load = useCallback(async () => {
    if (!lavageId) return;
    setLoading(true);
    try {
      const res = await api.get(endpoints.clients(lavageId), {
        params: search ? { search } : {},
      });
      if (res.data?.success) {
        const d = res.data.data;
        setClients(Array.isArray(d) ? d : (d?.data ?? []));
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [lavageId, search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.immatriculation) { setFormError('L\'immatriculation est requise'); return; }
    setSubmitting(true);
    setFormError('');
    try {
      await api.post(endpoints.clients(lavageId), {
        ...form,
        nom: form.nom || undefined,
        prenom: form.prenom || undefined,
        telephone: form.telephone || undefined,
        marque_vehicule: form.marque_vehicule || undefined,
        couleur_vehicule: form.couleur_vehicule || undefined,
      });
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || 'Erreur lors de la création');
    } finally { setSubmitting(false); }
  }

  async function openTxModal(client: Client) {
    setTxClient(client);
    setTxForm({ type_lavage: 'Extérieur', montant: '', laveur_id: '', notes: '' });
    setTxError('');
    try {
      const res = await api.get(endpoints.laveurs(lavageId));
      if (res.data?.success) {
        const d = res.data.data;
        setLaveurs(Array.isArray(d) ? d : (d?.data ?? []));
      }
    } catch { /* ignore */ }
    setTxOpen(true);
  }

  async function handleTxSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!txForm.montant || !txForm.laveur_id) { setTxError('Montant et laveur requis'); return; }
    setTxSubmitting(true);
    setTxError('');
    try {
      await api.post(endpoints.transactionCreate, {
        lavage_id: lavageId,
        type_lavage: txForm.type_lavage,
        montant: Number(txForm.montant),
        laveur_id: txForm.laveur_id,
        client_id: txClient?.id,
        notes: txForm.notes || undefined,
      });
      setTxOpen(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setTxError(msg || 'Erreur lors de l\'enregistrement');
    } finally { setTxSubmitting(false); }
  }

  const filtered = clients.filter((c) =>
    !search ||
    c.nom_complet?.toLowerCase().includes(search.toLowerCase()) ||
    c.immatriculation?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <Header title="Clients" subtitle="Gérant" />

      <div className="p-6 space-y-5">
        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total clients', value: clients.length },
            { label: 'Avec visites', value: clients.filter((c) => c.nombre_visites > 0).length },
            { label: 'Nouveaux', value: clients.filter((c) => c.nombre_visites === 0).length },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <div className="text-2xl font-bold text-navy">{s.value}</div>
              <div className="text-xs text-text-secondary mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Add */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou immatriculation…"
              className="input pl-10"
            />
          </div>
          <button
            onClick={() => {
              setForm({ nom:'',prenom:'',telephone:'',type_vehicule:'Voiture',immatriculation:'',marque_vehicule:'',couleur_vehicule:'' });
              setFormError('');
              setModalOpen(true);
            }}
            className="btn-primary !py-2 !px-5 !min-w-0 flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>

        {/* List */}
        <div className="card overflow-hidden">
          {loading ? (
            <LoadingSpinner />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Users} title="Aucun client trouvé" />
          ) : (
            <div className="divide-y divide-light-grey">
              {filtered.map((client) => (
                <div key={client.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-variant/50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-navy flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {client.nom_complet?.slice(0, 2).toUpperCase() || <Car size={16} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy">{client.nom_complet || 'Client anonyme'}</span>
                      <span className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded-full',
                        client.nombre_visites > 0 ? 'bg-green/10 text-green-dark' : 'bg-light-grey text-text-secondary'
                      )}>
                        {client.nombre_visites > 0 ? `${client.nombre_visites} visite(s)` : 'Nouveau'}
                      </span>
                    </div>
                    <div className="text-sm text-text-secondary mt-0.5 flex items-center gap-3 flex-wrap">
                      <span className="font-medium">{client.immatriculation}</span>
                      <span>{client.type_vehicule}</span>
                      {client.telephone && <span>{client.telephone}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-warning font-semibold text-sm">
                        <Star size={12} fill="currentColor" />
                        {client.points_fidelite} pts
                      </div>
                      <div className="text-xs text-text-light mt-0.5">fidélité</div>
                    </div>
                    <button
                      onClick={() => openTxModal(client)}
                      title="Créer une transaction"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs font-semibold opacity-0 group-hover:opacity-100"
                    >
                      <Receipt size={13} />
                      Transaction
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Nouveau Client */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau client">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Prénom</label>
              <input type="text" value={form.prenom} onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))} className="input" placeholder="Optionnel" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Nom</label>
              <input type="text" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} className="input" placeholder="Optionnel" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Téléphone</label>
            <input type="tel" value={form.telephone} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} className="input" placeholder="0X XX XX XX XX" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Immatriculation *</label>
            <input type="text" value={form.immatriculation} onChange={(e) => setForm((f) => ({ ...f, immatriculation: e.target.value }))} className="input" placeholder="AB 123 CI" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Type de véhicule *</label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button key={t} type="button"
                  onClick={() => setForm((f) => ({ ...f, type_vehicule: t }))}
                  className={cn('px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                    form.type_vehicule === t ? 'bg-gradient-primary text-white border-transparent' : 'border-light-grey text-text-secondary hover:border-primary/40'
                  )}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Marque</label>
              <input type="text" value={form.marque_vehicule} onChange={(e) => setForm((f) => ({ ...f, marque_vehicule: e.target.value }))} className="input" placeholder="Toyota…" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Couleur</label>
              <input type="text" value={form.couleur_vehicule} onChange={(e) => setForm((f) => ({ ...f, couleur_vehicule: e.target.value }))} className="input" placeholder="Blanc…" />
            </div>
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

      {/* Modal Transaction */}
      <Modal open={txOpen} onClose={() => setTxOpen(false)} title="Nouvelle transaction">
        {txClient && (
          <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-surface-variant border border-light-grey">
            <div className="w-9 h-9 rounded-lg bg-gradient-navy flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {txClient.nom_complet?.slice(0, 2).toUpperCase() || <Car size={14} />}
            </div>
            <div>
              <div className="font-semibold text-navy text-sm">{txClient.nom_complet || 'Client anonyme'}</div>
              <div className="text-xs text-text-secondary">{txClient.immatriculation} · {txClient.type_vehicule}</div>
            </div>
          </div>
        )}
        <form onSubmit={handleTxSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Type de lavage *</label>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map((t) => (
                <button key={t} type="button"
                  onClick={() => setTxForm((f) => ({ ...f, type_lavage: t }))}
                  className={cn('flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                    txForm.type_lavage === t ? 'bg-gradient-primary text-white border-transparent shadow-primary' : 'border-light-grey text-text-secondary hover:border-primary/40'
                  )}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Montant (FCFA) *</label>
            <input
              type="number" min="0"
              value={txForm.montant}
              onChange={(e) => setTxForm((f) => ({ ...f, montant: e.target.value }))}
              className="input" placeholder="5 000" required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Laveur *</label>
            <select
              value={txForm.laveur_id}
              onChange={(e) => setTxForm((f) => ({ ...f, laveur_id: e.target.value }))}
              className="input" required
            >
              <option value="">Sélectionner un laveur</option>
              {laveurs.filter((l) => l.is_active).map((l) => (
                <option key={l.id} value={l.id}>{l.nom_complet}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Notes</label>
            <textarea
              value={txForm.notes}
              onChange={(e) => setTxForm((f) => ({ ...f, notes: e.target.value }))}
              className="input resize-none" rows={2} placeholder="Remarques…"
            />
          </div>
          {txError && <div className="bg-error/8 border border-error/20 text-error text-sm rounded-xl px-4 py-3">{txError}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setTxOpen(false)} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={txSubmitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {txSubmitting ? <><Loader2 size={16} className="animate-spin" /> Enregistrement…</> : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}