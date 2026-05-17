'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import { formatMontant, cn } from '@/lib/utils';
import type { Laveur, LaveurCommission } from '@/lib/types';
import { UserCheck, HandCoins } from 'lucide-react';

export default function LaveursPage() {
  const { user } = useAuth();
  const lavageId = user?.lavage_id ?? '';

  const [laveurs, setLaveurs] = useState<Laveur[]>([]);
  const [commissions, setCommissions] = useState<LaveurCommission[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!lavageId) return;
    setLoading(true);
    try {
      const [lvRes, commRes] = await Promise.all([
        api.get(endpoints.laveurs(lavageId)),
        api.get(endpoints.statsCommissions(lavageId)),
      ]);
      if (lvRes.data?.success) setLaveurs(lvRes.data.data ?? []);
      if (commRes.data?.success) setCommissions(commRes.data.data?.par_laveur ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [lavageId]);

  useEffect(() => { load(); }, [load]);

  function commissionFor(laveurId: string): LaveurCommission | undefined {
    return commissions.find((c) => c.laveur_id === laveurId);
  }

  return (
    <div className="animate-fade-in">
      <Header title="Laveurs" subtitle="Gérant" />

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-navy">{laveurs.filter((l) => l.is_active).length}</div>
            <div className="text-xs text-text-secondary mt-1">Laveurs actifs</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-warning">
              {formatMontant(commissions.reduce((s, c) => s + c.commission_a_payer, 0))}
            </div>
            <div className="text-xs text-text-secondary mt-1">Commissions du jour</div>
          </div>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <LoadingSpinner />
          ) : laveurs.length === 0 ? (
            <EmptyState icon={UserCheck} title="Aucun laveur" />
          ) : (
            <div className="divide-y divide-light-grey">
              {laveurs.map((laveur) => {
                const comm = commissionFor(laveur.id);
                return (
                  <div key={laveur.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-variant/50 transition-colors">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0',
                      laveur.is_active ? 'bg-gradient-navy' : 'bg-light-grey'
                    )}>
                      {laveur.initiales}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-navy">{laveur.nom_complet}</span>
                        <span className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded-full',
                          laveur.is_active ? 'bg-green/10 text-green-dark' : 'bg-light-grey text-text-secondary'
                        )}>
                          {laveur.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      {laveur.telephone && (
                        <div className="text-sm text-text-secondary mt-0.5">{laveur.telephone}</div>
                      )}
                      <div className="text-xs text-text-light mt-0.5">
                        Commission : {laveur.taux_commission}%
                      </div>
                    </div>

                    {comm ? (
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 text-warning font-bold text-sm">
                          <HandCoins size={14} />
                          {comm.commission_formate}
                        </div>
                        <div className="text-xs text-text-light">{comm.nombre_lavages} lavage(s)</div>
                        <div className="text-xs text-text-secondary">{formatMontant(comm.ca_genere)} générés</div>
                      </div>
                    ) : (
                      <div className="text-xs text-text-light">Aucune activité</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}