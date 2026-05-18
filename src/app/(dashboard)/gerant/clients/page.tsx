'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { formatMontant, formatDate, cn } from '@/lib/utils';
import type { Client, ClientDetail, ClientLoyalty, Laveur } from '@/lib/types';
import {
  Users, Search, Plus, Star, Loader2, Car, Receipt,
  Phone, Hash, MapPin, X, Gift, Trophy, Droplets, Calendar,
  ChevronRight, Sparkles,
} from 'lucide-react';

const TYPES = ['Voiture', 'Moto', 'Camion', 'Bus', 'Tricycle', 'Autre'];
const TYPE_OPTIONS = [
  'Lavage Simple', 'Lavage Complet', 'Lavage Premium',
  'Nettoyage Intérieur', 'Cirage', 'Polissage',
];

const tierConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  bronze:   { label: 'Bronze',   color: '#CD7F32', bg: '#CD7F3215', icon: '🥉' },
  silver:   { label: 'Argent',   color: '#9CA3AF', bg: '#9CA3AF15', icon: '🥈' },
  gold:     { label: 'Or',       color: '#F59E0B', bg: '#F59E0B15', icon: '🥇' },
  platinum: { label: 'Platine',  color: '#3B82F6', bg: '#3B82F615', icon: '💎' },
};

export default function ClientsPage() {
  const { user } = useAuth();
  const lavageId = user?.lavage_id ?? '';

  const [clients, setClients] = useState<Client[]>([]);
  const [loyaltyMap, setLoyaltyMap] = useState<Record<string, { points: number; tier: string }>>({});
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
  const [txForm, setTxForm] = useState({ type_lavage: 'Lavage Simple', montant: '', laveur_id: '', observation: '' });
  const [txSubmitting, setTxSubmitting] = useState(false);
  const [txError, setTxError] = useState('');

  // Client detail drawer
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [clientDetail, setClientDetail] = useState<ClientDetail | null>(null);
  const [clientLoyalty, setClientLoyalty] = useState<ClientLoyalty | null>(null);

  const load = useCallback(async () => {
    if (!lavageId) return;
    setLoading(true);
    try {
      const [clientsRes, loyaltyRes] = await Promise.allSettled([
        api.get(endpoints.clients(lavageId), { params: search ? { search } : {} }),
        api.get(endpoints.loyaltyLeaderboard(lavageId), { params: { limit: 200 } }),
      ]);

      if (clientsRes.status === 'fulfilled' && clientsRes.value.data?.success) {
        const d = clientsRes.value.data.data;
        setClients(Array.isArray(d) ? d : (d?.data ?? []));
      }

      if (loyaltyRes.status === 'fulfilled' && loyaltyRes.value.data?.success) {
        const leaderboard: Array<{ client: { id: string }; points_balance: number; tier: string }> =
          loyaltyRes.value.data.data ?? [];
        const map: Record<string, { points: number; tier: string }> = {};
        leaderboard.forEach((entry) => {
          if (entry.client?.id) {
            map[entry.client.id] = { points: entry.points_balance, tier: entry.tier };
          }
        });
        setLoyaltyMap(map);
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

  async function openClientDetail(client: Client) {
    setDetailOpen(true);
    setClientDetail(null);
    setClientLoyalty(null);
    setDetailLoading(true);
    try {
      const [detailRes, loyaltyRes] = await Promise.allSettled([
        api.get(endpoints.client(client.id)),
        api.get(endpoints.clientLoyalty(client.id)),
      ]);
      if (detailRes.status === 'fulfilled' && detailRes.value.data?.success) {
        setClientDetail(detailRes.value.data.data);
      }
      if (loyaltyRes.status === 'fulfilled' && loyaltyRes.value.data?.success) {
        setClientLoyalty(loyaltyRes.value.data.data);
      }
    } catch { /* ignore */ }
    finally { setDetailLoading(false); }
  }

  async function openTxModal(client: Client, e: React.MouseEvent) {
    e.stopPropagation();
    setTxClient(client);
    setTxForm({ type_lavage: 'Lavage Simple', montant: '', laveur_id: '', observation: '' });
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
    if (!txForm.laveur_id) { setTxError('Sélectionnez un laveur'); return; }
    setTxSubmitting(true);
    setTxError('');
    try {
      await api.post(endpoints.transactionCreate, {
        lavage_id: lavageId,
        type_lavage: txForm.type_lavage,
        montant: txForm.montant ? Number(txForm.montant) : undefined,
        laveur_id: txForm.laveur_id,
        client_id: txClient?.id,
        observation: txForm.observation || undefined,
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

  const tier = clientLoyalty?.tier ? tierConfig[clientLoyalty.tier] ?? tierConfig.bronze : null;

  return (
    <div className="animate-fade-in">
      <Header title="Clients" subtitle="Gérant" />

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl p-4 text-center bg-gradient-to-br from-navy/10 to-navy/5 border border-navy/15">
            <div className="text-2xl font-black text-navy">{clients.length}</div>
            <div className="text-xs font-medium text-navy/60 mt-1">Total clients</div>
          </div>
          <div className="rounded-2xl p-4 text-center bg-gradient-to-br from-green/15 to-green/5 border border-green/20">
            <div className="text-2xl font-black text-green-dark">{clients.filter((c) => c.nombre_visites > 0).length}</div>
            <div className="text-xs font-medium text-green-dark/70 mt-1">Avec visites</div>
          </div>
          <div className="rounded-2xl p-4 text-center bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20">
            <div className="text-2xl font-black text-primary">{clients.filter((c) => c.nombre_visites === 0).length}</div>
            <div className="text-xs font-medium text-primary/70 mt-1">Nouveaux</div>
          </div>
        </div>

        {/* Search + Add */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou immatriculation…" className="input pl-10" />
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
          {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
            <EmptyState icon={Users} title="Aucun client trouvé" />
          ) : (
            <div className="divide-y divide-light-grey">
              {filtered.map((client) => (
                <div
                  key={client.id}
                  onClick={() => openClientDetail(client)}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-primary/3 transition-colors group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-navy flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {client.nom_complet?.slice(0, 2).toUpperCase() || <Car size={16} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy">{client.nom_complet || 'Client anonyme'}</span>
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                        client.nombre_visites > 0 ? 'bg-green/10 text-green-dark' : 'bg-light-grey text-text-secondary')}>
                        {client.nombre_visites > 0 ? `${client.nombre_visites} visite(s)` : 'Nouveau'}
                      </span>
                    </div>
                    <div className="text-sm text-text-secondary mt-0.5 flex items-center gap-3 flex-wrap">
                      <span className="font-medium">{client.immatriculation}</span>
                      <span>{client.type_vehicule}</span>
                      {client.telephone && <span>{client.telephone}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {loyaltyMap[client.id] ? (
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-warning font-semibold text-sm">
                          <Star size={12} fill="currentColor" />
                          {loyaltyMap[client.id].points} pts
                        </div>
                        <div className="text-xs text-text-light capitalize">
                          {tierConfig[loyaltyMap[client.id].tier]?.icon ?? ''} {tierConfig[loyaltyMap[client.id].tier]?.label ?? loyaltyMap[client.id].tier}
                        </div>
                      </div>
                    ) : (
                      <div className="text-right">
                        <div className="text-xs text-text-light">0 pt</div>
                        <div className="text-xs text-text-light opacity-50">Aucun</div>
                      </div>
                    )}
                    <button
                      onClick={(e) => openTxModal(client, e)}
                      title="Créer une transaction"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs font-semibold opacity-0 group-hover:opacity-100"
                    >
                      <Receipt size={12} /> Tx
                    </button>
                    <ChevronRight size={15} className="text-text-light group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Drawer ── */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-navy/40 backdrop-blur-sm" onClick={() => setDetailOpen(false)} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">
            {/* Drawer header */}
            <div className="bg-gradient-to-r from-navy to-navy/80 px-6 py-5 flex items-center justify-between text-white flex-shrink-0">
              <div>
                <div className="font-bold text-lg">{clientDetail?.nom_complet ?? '…'}</div>
                <div className="text-white/70 text-sm mt-0.5">
                  {clientDetail?.immatriculation} · {clientDetail?.type_vehicule}
                </div>
              </div>
              <button onClick={() => setDetailOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
            ) : clientDetail ? (
              <div className="flex-1 overflow-y-auto">
                {/* KPI résumé */}
                <div className="grid grid-cols-3 gap-3 p-5">
                  <div className="rounded-xl p-3 text-center bg-gradient-to-br from-navy/10 to-navy/5 border border-navy/15">
                    <div className="text-xl font-black text-navy">{clientDetail.nombre_visites}</div>
                    <div className="text-xs text-navy/60 mt-0.5">Visites</div>
                  </div>
                  <div className="rounded-xl p-3 text-center bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20">
                    <div className="text-sm font-black text-primary leading-tight">
                      {formatMontant(clientDetail.total_depense)}
                    </div>
                    <div className="text-xs text-primary/70 mt-0.5">Dépensé</div>
                  </div>
                  <div className="rounded-xl p-3 text-center bg-gradient-to-br from-warning/15 to-warning/5 border border-warning/20">
                    <div className="text-xl font-black text-warning">{clientLoyalty?.points_balance ?? 0}</div>
                    <div className="text-xs text-warning/70 mt-0.5">Points</div>
                  </div>
                </div>

                {/* Infos personnelles */}
                <div className="px-5 pb-4 space-y-2">
                  <h3 className="text-xs font-bold text-text-light uppercase tracking-wider mb-3">Informations</h3>
                  {clientDetail.telephone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone size={14} className="text-text-light flex-shrink-0" />
                      <span className="text-navy">{clientDetail.telephone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Hash size={14} className="text-text-light flex-shrink-0" />
                    <span className="text-navy font-medium">{clientDetail.immatriculation}</span>
                  </div>
                  {clientDetail.vehicule_info && (
                    <div className="flex items-center gap-3 text-sm">
                      <Car size={14} className="text-text-light flex-shrink-0" />
                      <span className="text-navy">{clientDetail.vehicule_info}</span>
                    </div>
                  )}
                  {clientDetail.dernier_lavage && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar size={14} className="text-text-light flex-shrink-0" />
                      <span className="text-navy">Dernier passage : <span className="font-medium">{formatDate(clientDetail.dernier_lavage, 'dd/MM/yyyy')}</span></span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin size={14} className="text-text-light flex-shrink-0" />
                    <span className="text-text-secondary">Client depuis {formatDate(clientDetail.created_at, 'dd/MM/yyyy')}</span>
                  </div>
                </div>

                {/* Programme fidélité */}
                {clientLoyalty && (
                  <div className="mx-5 mb-4 rounded-2xl border overflow-hidden"
                    style={{ borderColor: tier?.color + '40' }}>
                    <div className="px-4 py-3 flex items-center gap-3"
                      style={{ background: tier?.bg }}>
                      <span className="text-xl">{tier?.icon ?? '🥉'}</span>
                      <div className="flex-1">
                        <div className="font-bold text-sm text-navy">
                          Niveau {tier?.label ?? clientLoyalty.tier}
                        </div>
                        <div className="text-xs text-text-secondary mt-0.5">
                          {clientLoyalty.total_points_earned} pts gagnés au total
                        </div>
                      </div>
                      <Sparkles size={15} style={{ color: tier?.color }} />
                    </div>
                    <div className="px-4 py-3 grid grid-cols-2 gap-3 bg-white">
                      <div className="text-center p-2 rounded-xl bg-warning/8 border border-warning/20">
                        <div className="text-lg font-black text-warning">{clientLoyalty.points_balance}</div>
                        <div className="text-xs text-warning/70">Points</div>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-green/10 border border-green/20">
                        <div className="text-lg font-black text-green-dark">{clientLoyalty.free_washes_available}</div>
                        <div className="text-xs text-green-dark/70">Lavages gratuits</div>
                      </div>
                      {clientLoyalty.washes_until_free !== undefined && clientLoyalty.washes_until_free > 0 && (
                        <div className="col-span-2 text-xs text-text-secondary text-center mt-1 flex items-center justify-center gap-1">
                          <Gift size={11} className="text-primary" />
                          <span>{clientLoyalty.washes_until_free} visite(s) avant un lavage gratuit</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Transactions récentes */}
                {clientDetail.transactions_recentes?.length > 0 && (
                  <div className="px-5 pb-5">
                    <h3 className="text-xs font-bold text-text-light uppercase tracking-wider mb-3">
                      Dernières transactions
                    </h3>
                    <div className="space-y-2">
                      {clientDetail.transactions_recentes.slice(0, 5).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-variant border border-light-grey">
                          <div>
                            <div className="text-xs font-semibold text-navy">{tx.type_lavage}</div>
                            <div className="text-xs text-text-light mt-0.5">{formatDate(tx.date, 'dd/MM/yyyy HH:mm')}</div>
                          </div>
                          <div className="font-bold text-navy text-sm">{formatMontant(tx.montant)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action */}
                <div className="px-5 pb-6">
                  <button
                    onClick={(e) => { setDetailOpen(false); openTxModal(clientDetail as unknown as Client, e); }}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    <Receipt size={16} /> Nouvelle transaction
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-text-light text-sm">
                Impossible de charger les données
              </div>
            )}
          </div>
        </div>
      )}

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
              <div className="font-semibold text-navy text-sm">{txClient.nom_complet || 'Client'}</div>
              <div className="text-xs text-text-secondary">{txClient.immatriculation} · {txClient.type_vehicule}</div>
            </div>
          </div>
        )}
        <form onSubmit={handleTxSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Type de service *</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map((t) => (
                <button key={t} type="button"
                  onClick={() => setTxForm((f) => ({ ...f, type_lavage: t }))}
                  className={cn('py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all text-left',
                    txForm.type_lavage === t ? 'bg-gradient-primary text-white border-transparent shadow-primary' : 'border-light-grey text-text-secondary hover:border-primary/40 hover:bg-primary/5'
                  )}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-1">
              Montant (FCFA)
              <span className="ml-2 text-xs font-normal text-text-light">optionnel</span>
            </label>
            <input type="number" min="0" value={txForm.montant}
              onChange={(e) => setTxForm((f) => ({ ...f, montant: e.target.value }))}
              className="input" placeholder="Laisser vide pour utiliser le tarif" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Laveur *</label>
            <select value={txForm.laveur_id}
              onChange={(e) => setTxForm((f) => ({ ...f, laveur_id: e.target.value }))}
              className="input" required>
              <option value="">Sélectionner un laveur</option>
              {laveurs.filter((l) => l.is_active).map((l) => (
                <option key={l.id} value={l.id}>{l.nom_complet}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Observation</label>
            <textarea value={txForm.observation}
              onChange={(e) => setTxForm((f) => ({ ...f, observation: e.target.value }))}
              className="input resize-none" rows={2} placeholder="Remarques…" />
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