'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { formatMontant, cn } from '@/lib/utils';
import type { Product, ProductCategory, Client } from '@/lib/types';
import { ShoppingBag, Search, AlertTriangle, ShoppingCart, Loader2, CheckCircle2, Minus, Plus } from 'lucide-react';

export default function BoutiquePage() {
  const { user } = useAuth();
  const lavageId = user?.lavage_id ?? '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Vente modal
  const [venteProduct, setVenteProduct] = useState<Product | null>(null);
  const [venteClients, setVenteClients] = useState<Client[]>([]);
  const [venteForm, setVenteForm] = useState({ quantite: 1, client_id: '' });
  const [venteSubmitting, setVenteSubmitting] = useState(false);
  const [venteError, setVenteError] = useState('');
  const [venteSuccess, setVenteSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!lavageId) return;
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        api.get(endpoints.products(lavageId)),
        api.get(endpoints.productCategories(lavageId)),
      ]);
      if (pRes.data?.success) setProducts(pRes.data.data ?? []);
      if (cRes.data?.success) setCategories(cRes.data.data ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [lavageId]);

  useEffect(() => { load(); }, [load]);

  async function openVente(product: Product) {
    setVenteProduct(product);
    setVenteForm({ quantite: 1, client_id: '' });
    setVenteError('');
    setVenteSuccess(false);
    try {
      const res = await api.get(endpoints.clients(lavageId));
      if (res.data?.success) {
        const d = res.data.data;
        setVenteClients(Array.isArray(d) ? d : (d?.data ?? []));
      }
    } catch { /* ignore */ }
  }

  async function handleVenteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!venteProduct) return;
    if (venteForm.quantite < 1) { setVenteError('Quantité invalide'); return; }
    if (venteProduct.stock_status === 'rupture') { setVenteError('Produit en rupture de stock'); return; }
    setVenteSubmitting(true);
    setVenteError('');
    try {
      await api.post(endpoints.ventes(lavageId), {
        items: [{ product_id: venteProduct.id, quantite: venteForm.quantite }],
        client_id: venteForm.client_id || undefined,
      });
      setVenteSuccess(true);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setVenteError(msg || 'Erreur lors de la vente');
    } finally { setVenteSubmitting(false); }
  }

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.nom.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || p.category?.id === selectedCategory;
    return matchSearch && matchCat;
  });

  const stockColors = {
    normal:  'bg-green/10 text-green-dark border-green/20',
    faible:  'bg-warning/10 text-warning border-warning/20',
    rupture: 'bg-error/10 text-error border-error/20',
  };

  const montantTotal = venteProduct ? venteProduct.prix * venteForm.quantite : 0;

  return (
    <div className="animate-fade-in">
      <Header title="Boutique" subtitle="Gérant" />

      <div className="p-6 space-y-5">
        {/* Alertes stock */}
        {products.some((p) => p.stock_status !== 'normal') && (
          <div className="bg-warning/8 border border-warning/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-warning flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-navy text-sm">Alertes stock</div>
              <div className="text-sm text-text-secondary mt-1">
                {products.filter((p) => p.stock_status === 'rupture').length} en rupture •{' '}
                {products.filter((p) => p.stock_status === 'faible').length} en stock faible
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit…"
              className="input pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('')}
              className={cn('px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                !selectedCategory ? 'bg-gradient-primary text-white border-transparent' : 'border-light-grey text-text-secondary hover:border-primary/40'
              )}
            >
              Tous
            </button>
            {categories.map((c) => (
              <button key={c.id}
                onClick={() => setSelectedCategory(selectedCategory === c.id ? '' : c.id)}
                className={cn('px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                  selectedCategory === c.id ? 'text-white border-transparent' : 'border-light-grey text-text-secondary hover:border-primary/40'
                )}
                style={selectedCategory === c.id ? { background: c.couleur } : {}}
              >
                {c.nom}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="Aucun produit" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((product) => (
              <div key={product.id} className="card overflow-hidden hover:shadow-card-hover transition-all group flex flex-col">
                {/* Image */}
                <div className="h-32 bg-gradient-to-br from-surface-variant to-light-grey flex items-center justify-center relative overflow-hidden">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image_url} alt={product.nom} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag size={32} className="text-text-light" />
                  )}
                  {product.stock_status === 'rupture' && (
                    <div className="absolute inset-0 bg-navy/60 flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-error px-2 py-1 rounded-lg">Rupture</span>
                    </div>
                  )}
                </div>

                <div className="p-3 flex flex-col flex-1">
                  {product.category && (
                    <div
                      className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-1 self-start"
                      style={{ color: product.category.couleur, background: product.category.couleur + '20' }}
                    >
                      {product.category.nom}
                    </div>
                  )}
                  <div className="font-semibold text-navy text-sm truncate">{product.nom}</div>
                  <div className="text-primary font-bold mt-1">{product.prix_formate}</div>

                  <div className={cn(
                    'mt-2 text-xs font-semibold px-2 py-1 rounded-lg border inline-flex items-center gap-1 self-start',
                    stockColors[product.stock_status]
                  )}>
                    {product.stock_status === 'rupture' ? 'Rupture' : product.stock_status === 'faible' ? 'Stock faible' : 'En stock'}
                    <span className="opacity-70">({product.stock})</span>
                  </div>

                  <div className="mt-auto pt-3">
                    <button
                      onClick={() => openVente(product)}
                      disabled={product.stock_status === 'rupture' || !product.is_active}
                      className={cn(
                        'w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
                        product.stock_status === 'rupture' || !product.is_active
                          ? 'bg-light-grey text-text-light cursor-not-allowed'
                          : 'bg-gradient-primary text-white hover:opacity-90 shadow-sm hover:shadow-primary'
                      )}
                    >
                      <ShoppingCart size={13} />
                      Vendre
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vente Modal */}
      <Modal
        open={!!venteProduct}
        onClose={() => { setVenteProduct(null); setVenteSuccess(false); }}
        title="Enregistrer une vente"
      >
        {venteSuccess ? (
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green/10 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-green-dark" />
            </div>
            <div>
              <div className="font-bold text-navy text-lg">Vente enregistrée !</div>
              <div className="text-sm text-text-secondary mt-1">
                {venteForm.quantite}x {venteProduct?.nom} · {formatMontant(montantTotal)}
              </div>
            </div>
            <button
              onClick={() => { setVenteProduct(null); setVenteSuccess(false); }}
              className="btn-primary !min-w-0 !px-8"
            >
              Fermer
            </button>
          </div>
        ) : venteProduct && (
          <form onSubmit={handleVenteSubmit} className="space-y-5">
            {/* Product info */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-variant border border-light-grey">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                {venteProduct.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={venteProduct.image_url} alt={venteProduct.nom} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <ShoppingBag size={22} className="text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-navy">{venteProduct.nom}</div>
                <div className="text-primary font-bold text-sm">{venteProduct.prix_formate} / unité</div>
              </div>
              <div className={cn('text-xs font-semibold px-2 py-1 rounded-lg border', stockColors[venteProduct.stock_status])}>
                Stock: {venteProduct.stock}
              </div>
            </div>

            {/* Quantité */}
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Quantité *</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setVenteForm((f) => ({ ...f, quantite: Math.max(1, f.quantite - 1) }))}
                  className="w-10 h-10 rounded-xl border border-light-grey flex items-center justify-center hover:bg-surface-variant transition-colors"
                >
                  <Minus size={16} className="text-text-secondary" />
                </button>
                <input
                  type="number" min="1" max={venteProduct.stock}
                  value={venteForm.quantite}
                  onChange={(e) => setVenteForm((f) => ({ ...f, quantite: Math.max(1, Number(e.target.value)) }))}
                  className="input text-center !w-24 font-bold text-lg"
                />
                <button
                  type="button"
                  onClick={() => setVenteForm((f) => ({ ...f, quantite: Math.min(venteProduct.stock, f.quantite + 1) }))}
                  className="w-10 h-10 rounded-xl border border-light-grey flex items-center justify-center hover:bg-surface-variant transition-colors"
                >
                  <Plus size={16} className="text-text-secondary" />
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
              <span className="text-sm font-semibold text-navy">Montant total</span>
              <span className="text-xl font-black text-primary">{formatMontant(montantTotal)}</span>
            </div>

            {/* Client optionnel */}
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Client (optionnel)</label>
              <select
                value={venteForm.client_id}
                onChange={(e) => setVenteForm((f) => ({ ...f, client_id: e.target.value }))}
                className="input"
              >
                <option value="">Vente anonyme</option>
                {venteClients.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom_complet} — {c.immatriculation}</option>
                ))}
              </select>
            </div>

            {venteError && (
              <div className="bg-error/8 border border-error/20 text-error text-sm rounded-xl px-4 py-3">
                {venteError}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setVenteProduct(null)} className="btn-secondary flex-1">
                Annuler
              </button>
              <button
                type="submit"
                disabled={venteSubmitting}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {venteSubmitting
                  ? <><Loader2 size={16} className="animate-spin" /> Enregistrement…</>
                  : <><ShoppingCart size={16} /> Confirmer la vente</>}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}