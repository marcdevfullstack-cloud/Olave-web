'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Product, ProductCategory } from '@/lib/types';
import { ShoppingBag, Search, AlertTriangle } from 'lucide-react';

export default function BoutiquePage() {
  const { user } = useAuth();
  const lavageId = user?.lavage_id ?? '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

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
              <div key={product.id} className="card overflow-hidden hover:shadow-card-hover transition-shadow">
                {/* Image placeholder */}
                <div className="h-32 bg-gradient-to-br from-surface-variant to-light-grey flex items-center justify-center">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image_url} alt={product.nom} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag size={32} className="text-text-light" />
                  )}
                </div>

                <div className="p-3">
                  {product.category && (
                    <div
                      className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-1"
                      style={{ color: product.category.couleur, background: product.category.couleur + '20' }}
                    >
                      {product.category.nom}
                    </div>
                  )}
                  <div className="font-semibold text-navy text-sm truncate">{product.nom}</div>
                  <div className="text-primary font-bold mt-1">{product.prix_formate}</div>

                  <div className={cn(
                    'mt-2 text-xs font-semibold px-2 py-1 rounded-lg border inline-flex items-center gap-1',
                    stockColors[product.stock_status]
                  )}>
                    {product.stock_status === 'rupture' ? 'Rupture' : product.stock_status === 'faible' ? 'Stock faible' : 'En stock'}
                    <span className="opacity-70">({product.stock})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}