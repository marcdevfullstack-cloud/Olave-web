'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Product, ProductCategory, Lavage } from '@/lib/types';
import {
  ShoppingBag, Search, Plus, AlertTriangle, PackageOpen,
  Loader2, Package, Pencil, Trash2, RefreshCw, Tag,
} from 'lucide-react';

type FormMode = 'create' | 'edit';

const EMPTY_FORM = {
  nom: '',
  description: '',
  prix: '',
  stock: '',
  stock_min: '5',
  category_id: '',
  is_active: true,
};

export default function BoutiqueProprietairePage() {
  const [lavages, setLavages] = useState<Lavage[]>([]);
  const [selectedLavage, setSelectedLavage] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Product CRUD modal
  const [productModal, setProductModal] = useState<{ open: boolean; mode: FormMode; product?: Product }>({ open: false, mode: 'create' });
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Restock modal
  const [restockModal, setRestockModal] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockNote, setRestockNote] = useState('');
  const [restocking, setRestocking] = useState(false);

  // Category modal
  const [catModal, setCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ nom: '', couleur: '#3B82F6' });
  const [catSubmitting, setCatSubmitting] = useState(false);

  useEffect(() => {
    api.get(endpoints.lavages).then((res) => {
      if (res.data?.success) {
        const d = res.data.data;
        const list: Lavage[] = Array.isArray(d) ? d : (d?.data ?? []);
        setLavages(list);
        if (list.length > 0) setSelectedLavage(list[0].id);
      }
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!selectedLavage) return;
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        api.get(endpoints.products(selectedLavage)),
        api.get(endpoints.productCategories(selectedLavage)),
      ]);
      if (pRes.data?.success) {
        const d = pRes.data.data;
        setProducts(Array.isArray(d) ? d : (d?.data ?? []));
      }
      if (cRes.data?.success) {
        const d = cRes.data.data;
        setCategories(Array.isArray(d) ? d : (d?.data ?? []));
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [selectedLavage]);

  useEffect(() => { if (selectedLavage) load(); }, [load, selectedLavage]);

  // ── Product CRUD ────────────────────────────────────────────
  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError('');
    setProductModal({ open: true, mode: 'create' });
  }

  function openEdit(p: Product) {
    setForm({
      nom: p.nom,
      description: p.description ?? '',
      prix: p.prix.toString(),
      stock: p.stock.toString(),
      stock_min: p.stock_min.toString(),
      category_id: p.category?.id ?? '',
      is_active: p.is_active,
    });
    setFormError('');
    setProductModal({ open: true, mode: 'edit', product: p });
  }

  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom || !form.prix) { setFormError('Nom et prix requis'); return; }
    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        nom: form.nom,
        description: form.description || undefined,
        prix: Number(form.prix),
        stock: Number(form.stock) || 0,
        stock_min: Number(form.stock_min) || 5,
        category_id: form.category_id || undefined,
        is_active: form.is_active,
      };
      if (productModal.mode === 'create') {
        await api.post(endpoints.products(selectedLavage), payload);
      } else if (productModal.product) {
        await api.put(endpoints.product(productModal.product.id), payload);
      }
      setProductModal({ open: false, mode: 'create' });
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(endpoints.product(deleteTarget.id));
      setDeleteTarget(null);
      load();
    } catch { /* ignore */ }
    finally { setDeleting(false); }
  }

  // ── Restock ────────────────────────────────────────────────
  async function handleRestock(e: React.FormEvent) {
    e.preventDefault();
    if (!restockModal || !restockQty) return;
    setRestocking(true);
    try {
      await api.post(endpoints.productRestock(restockModal.id), {
        quantite: Number(restockQty),
        motif: restockNote || undefined,
      });
      setRestockModal(null);
      load();
    } catch { /* ignore */ }
    finally { setRestocking(false); }
  }

  // ── Category ────────────────────────────────────────────────
  async function handleCatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!catForm.nom) return;
    setCatSubmitting(true);
    try {
      await api.post(endpoints.productCategories(selectedLavage), catForm);
      setCatModal(false);
      setCatForm({ nom: '', couleur: '#3B82F6' });
      load();
    } catch { /* ignore */ }
    finally { setCatSubmitting(false); }
  }

  // ── Display ─────────────────────────────────────────────────
  const filtered = products.filter((p) => {
    const matchSearch = !search || p.nom.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || p.category?.id === selectedCategory;
    return matchSearch && matchCat;
  });

  const stockBorder = { normal: 'border-l-green', faible: 'border-l-warning', rupture: 'border-l-error' };
  const stockBadge = {
    normal:  'bg-green/10 text-green-dark',
    faible:  'bg-warning/10 text-warning',
    rupture: 'bg-error/10 text-error',
  };
  const ruptures = products.filter((p) => p.stock_status === 'rupture').length;
  const faibles  = products.filter((p) => p.stock_status === 'faible').length;

  return (
    <div className="animate-fade-in">
      <Header title="Boutique" subtitle="Propriétaire" />

      <div className="p-6 space-y-5">
        {/* Sélecteur lavage */}
        {lavages.length > 1 && (
          <select value={selectedLavage} onChange={(e) => setSelectedLavage(e.target.value)} className="input w-auto">
            {lavages.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
          </select>
        )}

        {/* Alertes stock */}
        {(ruptures > 0 || faibles > 0) && (
          <div className="bg-warning/8 border border-warning/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-warning flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-navy text-sm">Alertes de stock</div>
              <div className="text-sm text-text-secondary mt-1">
                {ruptures > 0 && <span className="text-error font-medium">{ruptures} en rupture</span>}
                {ruptures > 0 && faibles > 0 && ' • '}
                {faibles > 0 && <span className="text-warning font-medium">{faibles} en stock faible</span>}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Produits actifs', value: products.filter((p) => p.is_active).length, icon: Package },
            { label: 'Catégories',      value: categories.length,                            icon: Tag },
            { label: 'Stock faible',    value: faibles,                                      icon: AlertTriangle },
            { label: 'Ruptures',        value: ruptures,                                     icon: PackageOpen },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <div className="text-xl font-bold text-navy">{s.value}</div>
              <div className="text-xs text-text-secondary mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Barre actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-3 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit…" className="input pl-10" />
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <button onClick={() => setSelectedCategory('')} className={cn('px-3 py-2 rounded-xl text-sm font-medium border transition-all', !selectedCategory ? 'bg-gradient-primary text-white border-transparent' : 'border-light-grey text-text-secondary')}>
                Tous
              </button>
              {categories.map((c) => (
                <button key={c.id} onClick={() => setSelectedCategory(selectedCategory === c.id ? '' : c.id)}
                  className={cn('px-3 py-2 rounded-xl text-sm font-medium border transition-all', selectedCategory === c.id ? 'text-white border-transparent' : 'border-light-grey text-text-secondary')}
                  style={selectedCategory === c.id ? { background: c.couleur } : {}}>
                  {c.nom}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={load} className="btn-secondary !py-2 !px-3 !min-w-0" title="Actualiser">
              <RefreshCw size={14} />
            </button>
            <button onClick={() => { setCatForm({ nom: '', couleur: '#3B82F6' }); setCatModal(true); }} className="btn-secondary !py-2 !px-3 !min-w-0 flex items-center gap-1.5 text-sm">
              <Tag size={14} /> Catégorie
            </button>
            <button onClick={openCreate} className="btn-primary !py-2 !px-4 !min-w-0 flex items-center gap-2 text-sm">
              <Plus size={15} /> Produit
            </button>
          </div>
        </div>

        {/* Liste produits */}
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="Aucun produit" description="Créez votre premier produit" />
        ) : (
          <div className="card divide-y divide-light-grey overflow-hidden">
            {filtered.map((product) => (
              <div key={product.id} className={cn('flex items-center gap-4 px-5 py-4 border-l-4 hover:bg-surface-variant/50 transition-colors', stockBorder[product.stock_status])}>
                <div className="w-12 h-12 rounded-xl bg-surface-variant flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image_url} alt={product.nom} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag size={20} className="text-text-light" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-navy">{product.nom}</span>
                    {!product.is_active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-light-grey text-text-secondary">Inactif</span>
                    )}
                    {product.category && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: product.category.couleur, background: product.category.couleur + '20' }}>
                        {product.category.nom}
                      </span>
                    )}
                  </div>
                  {product.description && (
                    <div className="text-xs text-text-secondary mt-0.5 truncate max-w-xs">{product.description}</div>
                  )}
                  <div className="text-sm text-primary font-bold mt-0.5">{product.prix_formate}</div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className={cn('text-sm font-bold px-3 py-1 rounded-lg', stockBadge[product.stock_status])}>
                      {product.stock} unités
                    </div>
                    <button
                      onClick={() => { setRestockModal(product); setRestockQty(''); setRestockNote(''); }}
                      className="text-xs font-semibold text-primary hover:underline mt-1 block"
                    >
                      + Réappro
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => openEdit(product)}
                      className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                      title="Modifier"
                    >
                      <Pencil size={13} className="text-primary" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(product)}
                      className="w-8 h-8 rounded-lg bg-error/10 hover:bg-error/20 flex items-center justify-center transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={13} className="text-error" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal Créer/Modifier Produit ──────────────────────── */}
      <Modal
        open={productModal.open}
        onClose={() => setProductModal({ open: false, mode: 'create' })}
        title={productModal.mode === 'create' ? 'Nouveau produit' : `Modifier — ${productModal.product?.nom}`}
      >
        <form onSubmit={handleProductSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Nom du produit *</label>
            <input type="text" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} className="input" placeholder="Shampoing voiture…" required />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input resize-none" rows={2} placeholder="Description optionnelle…" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Prix (FCFA) *</label>
              <input type="number" min="0" value={form.prix} onChange={(e) => setForm((f) => ({ ...f, prix: e.target.value }))} className="input" placeholder="2 500" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Stock initial</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} className="input" placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Stock minimum (alerte)</label>
              <input type="number" min="0" value={form.stock_min} onChange={(e) => setForm((f) => ({ ...f, stock_min: e.target.value }))} className="input" placeholder="5" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Catégorie</label>
              <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} className="input">
                <option value="">Sans catégorie</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-navy cursor-pointer">Produit actif (visible en boutique)</label>
          </div>

          {formError && <div className="bg-error/8 border border-error/20 text-error text-sm rounded-xl px-4 py-3">{formError}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setProductModal({ open: false, mode: 'create' })} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Enregistrement…</> : productModal.mode === 'create' ? 'Créer' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Supprimer ───────────────────────────────────── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmer la suppression" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Voulez-vous vraiment supprimer <strong className="text-navy">{deleteTarget?.nom}</strong> ?
            Cette action est irréversible.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Annuler</button>
            <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-error text-white hover:opacity-90 flex items-center justify-center gap-2">
              {deleting ? <><Loader2 size={16} className="animate-spin" /> Suppression…</> : <><Trash2 size={15} /> Supprimer</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal Réapprovisionner ────────────────────────────── */}
      <Modal open={!!restockModal} onClose={() => setRestockModal(null)} title={`Réapprovisionner — ${restockModal?.nom}`} size="sm">
        <form onSubmit={handleRestock} className="space-y-4">
          <div className="bg-surface-variant rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-text-secondary">Stock actuel</span>
            <span className="font-bold text-navy">{restockModal?.stock} unités</span>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Quantité à ajouter *</label>
            <input type="number" min="1" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} className="input" placeholder="ex : 50" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Motif</label>
            <input type="text" value={restockNote} onChange={(e) => setRestockNote(e.target.value)} className="input" placeholder="Réapprovisionnement mensuel…" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setRestockModal(null)} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={restocking} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {restocking ? <><Loader2 size={16} className="animate-spin" /> En cours…</> : 'Confirmer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Nouvelle Catégorie ──────────────────────────── */}
      <Modal open={catModal} onClose={() => setCatModal(false)} title="Nouvelle catégorie" size="sm">
        <form onSubmit={handleCatSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Nom de la catégorie *</label>
            <input type="text" value={catForm.nom} onChange={(e) => setCatForm((f) => ({ ...f, nom: e.target.value }))} className="input" placeholder="Produits nettoyants…" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Couleur</label>
            <div className="flex items-center gap-3">
              <input type="color" value={catForm.couleur} onChange={(e) => setCatForm((f) => ({ ...f, couleur: e.target.value }))} className="w-12 h-10 rounded-lg border border-light-grey cursor-pointer" />
              <span className="text-sm font-medium px-3 py-1.5 rounded-lg text-white" style={{ background: catForm.couleur }}>{catForm.nom || 'Aperçu'}</span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setCatModal(false)} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={catSubmitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {catSubmitting ? <><Loader2 size={16} className="animate-spin" /> Création…</> : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}