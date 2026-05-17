'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import api, { endpoints } from '@/lib/api';
import type { Plan, SubscriptionStatus } from '@/lib/types';
import { Check, Star, Crown, CreditCard, Clock, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AbonnementPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [subRes, plansRes] = await Promise.all([
        api.get(endpoints.subscription).catch(() => null),
        api.get(endpoints.plans).catch(() => null),
      ]);

      if (subRes?.data?.success) setStatus(subRes.data.data);
      if (plansRes?.data?.success) {
        const d = plansRes.data.data;
        setPlans(Array.isArray(d) ? d : []);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function requestUpgrade(plan: Plan) {
    if (!plan.id) return;
    setUpgrading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post(endpoints.subscriptionUpgrade, { plan_id: plan.id });
      if (res.data?.success) {
        setSuccessMsg(res.data.message ?? `Demande envoyée pour le plan ${plan.display_name}. Notre équipe vous contactera.`);
        load();
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorMsg(msg || 'Erreur lors de la demande. Réessayez plus tard.');
    } finally {
      setUpgrading(false);
    }
  }

  const currentPlanName = status?.plan?.name ?? 'gratuit';
  const isPending = status?.subscription?.status === 'pending';

  function usagePercent(used: number, max: number) {
    if (max === -1) return 0;
    return Math.min(100, Math.round((used / max) * 100));
  }

  const usageItems = status ? [
    { label: 'Lavages', used: (status.usage?.lavage?.current ?? 0), max: status.plan.max_lavages, unlimited: status.plan.has_unlimited_lavages },
    { label: 'Clients', used: (status.usage?.client?.current ?? 0), max: status.plan.max_clients, unlimited: status.plan.has_unlimited_clients },
    { label: 'Gérants', used: (status.usage?.gerant?.current ?? 0), max: status.plan.max_gerants, unlimited: status.plan.has_unlimited_gerants },
    { label: 'Laveurs', used: (status.usage?.laveur?.current ?? 0), max: status.plan.max_laveurs, unlimited: status.plan.has_unlimited_laveurs },
  ] : [];

  return (
    <div className="animate-fade-in">
      <Header title="Abonnement" subtitle="Propriétaire" />

      <div className="p-6 space-y-6">
        {loading ? <LoadingSpinner /> : (
          <>
            {/* Statut actuel */}
            {status && (
              <div className={cn(
                'rounded-2xl p-5 text-white flex items-start justify-between',
                currentPlanName === 'gratuit' ? 'bg-gradient-navy' : 'bg-gradient-primary shadow-primary'
              )}>
                <div>
                  <div className="text-sm font-medium opacity-70">Plan actuel</div>
                  <div className="text-2xl font-black mt-1">{status.plan.display_name}</div>
                  {status.subscription && (
                    <div className="text-sm opacity-70 mt-1 flex items-center gap-1.5">
                      <Clock size={12} />
                      {status.subscription.status === 'active'
                        ? `${status.subscription.days_remaining} jour(s) restant(s)`
                        : status.subscription.status === 'pending'
                        ? 'Demande en attente de validation'
                        : status.subscription.status}
                    </div>
                  )}
                  {!status.subscription && (
                    <div className="text-sm opacity-70 mt-1">Plan gratuit — actif</div>
                  )}
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
                  {currentPlanName === 'gratuit' ? <Star size={22} /> : <Crown size={22} />}
                </div>
              </div>
            )}

            {/* Alertes */}
            {isPending && (
              <div className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-3 flex items-start gap-3">
                <AlertCircle size={16} className="text-warning mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-warning text-sm">Demande en cours</div>
                  <div className="text-text-secondary text-sm mt-0.5">
                    Votre demande de passage au plan Standard est en attente de validation par notre équipe commerciale. Vous serez notifié par email.
                  </div>
                </div>
              </div>
            )}
            {successMsg && (
              <div className="bg-green/10 border border-green/30 text-green-dark text-sm rounded-xl px-4 py-3 font-medium flex items-start gap-2">
                <Check size={14} className="mt-0.5 flex-shrink-0" /> {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="bg-error/8 border border-error/20 text-error text-sm rounded-xl px-4 py-3 flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> {errorMsg}
              </div>
            )}

            {/* Utilisation actuelle */}
            {status && usageItems.length > 0 && (
              <div className="card p-5">
                <h3 className="font-bold text-navy mb-4 flex items-center justify-between">
                  Utilisation actuelle
                  <button onClick={load} className="text-text-secondary hover:text-navy transition-colors">
                    <RefreshCw size={14} />
                  </button>
                </h3>
                <div className="space-y-3">
                  {usageItems.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-navy font-medium">{item.label}</span>
                        <span className="text-text-secondary">
                          {item.unlimited ? (
                            <span className="text-green-dark font-semibold">Illimité</span>
                          ) : (
                            `${item.used} / ${item.max}`
                          )}
                        </span>
                      </div>
                      {!item.unlimited && (
                        <div className="h-2 bg-light-grey rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              usagePercent(item.used, item.max) >= 90 ? 'bg-error' :
                              usagePercent(item.used, item.max) >= 70 ? 'bg-warning' : 'bg-gradient-primary'
                            )}
                            style={{ width: `${usagePercent(item.used, item.max)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Accès caméra */}
                {status.camera_access && (
                  <div className="mt-4 pt-4 border-t border-light-grey">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-navy">Surveillance IA / Caméra</span>
                      <span className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded-full',
                        status.camera_access.is_active
                          ? 'bg-green/10 text-green-dark'
                          : 'bg-error/10 text-error'
                      )}>
                        {status.camera_access.is_active
                          ? status.camera_access.is_trial
                            ? `Essai — ${status.camera_access.days_remaining}j restant(s)`
                            : 'Actif'
                          : 'Inactif'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Plans */}
            <div>
              <h2 className="font-bold text-navy mb-4">Plans disponibles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((plan) => {
                  const isCurrentPlan = status?.plan?.id === plan.id;
                  const isFree = plan.is_free;

                  const featuresList = [
                    { label: 'Gestion clients & laveurs', included: true },
                    { label: 'Transactions illimitées', included: true },
                    { label: `${plan.max_lavages === -1 ? 'Lavages illimités' : `${plan.max_lavages} lavage(s)`}`, included: true },
                    { label: `${plan.max_gerants === -1 ? 'Gérants illimités' : `${plan.max_gerants} gérant(s)`}`, included: true },
                    { label: `${plan.max_clients === -1 ? 'Clients illimités' : `Jusqu\'à ${plan.max_clients} clients`}`, included: true },
                    { label: 'Rapports PDF & CSV', included: plan.features.pdf_reports },
                    { label: 'Statistiques avancées', included: plan.features.advanced_stats },
                    { label: 'Surveillance IA (caméra)', included: plan.camera_trial_days === 0 },
                    { label: isFree ? 'Caméra — 14j d\'essai' : null, included: isFree },
                    { label: 'Support dédié 24/7', included: plan.features.customer_support },
                  ].filter((f) => f.label !== null);

                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        'card p-5 border-2 relative transition-shadow hover:shadow-card-hover',
                        isCurrentPlan ? 'border-primary bg-primary/5' : 'border-light-grey',
                        !isFree && !isCurrentPlan && 'border-primary/30'
                      )}
                    >
                      {isCurrentPlan && (
                        <div className="absolute -top-3 right-4">
                          <span className="bg-green/90 text-white text-xs font-bold px-3 py-1 rounded-full">Plan actuel</span>
                        </div>
                      )}
                      {!isFree && !isCurrentPlan && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-gradient-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-primary">Recommandé</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          {isFree ? <Star size={18} className="text-primary" /> : <Crown size={18} className="text-primary" />}
                        </div>
                        <div>
                          <div className="font-bold text-navy">{plan.display_name}</div>
                          {plan.description && <div className="text-xs text-text-secondary">{plan.description}</div>}
                        </div>
                      </div>

                      <div className="mb-5">
                        <span className="text-3xl font-black text-navy">
                          {isFree ? '0' : '10 000'}
                        </span>
                        <span className="text-sm text-text-secondary ml-1">FCFA/mois</span>
                      </div>

                      <div className="space-y-2 mb-5">
                        {featuresList.map((f) => f.label && (
                          <div key={f.label} className={cn(
                            'flex items-center gap-2 text-sm',
                            f.included ? 'text-navy' : 'text-text-light line-through'
                          )}>
                            {f.included
                              ? <Check size={14} className="text-green-dark flex-shrink-0" />
                              : <div className="w-3.5 h-3.5 flex-shrink-0" />
                            }
                            {f.label}
                          </div>
                        ))}
                      </div>

                      {isCurrentPlan ? (
                        <div className="w-full py-2.5 rounded-xl text-center text-sm font-semibold bg-light-grey text-text-secondary">
                          Plan actuel
                        </div>
                      ) : isPending ? (
                        <div className="w-full py-2.5 rounded-xl text-center text-sm font-semibold bg-warning/10 text-warning flex items-center justify-center gap-2">
                          <Clock size={14} /> Demande en attente
                        </div>
                      ) : (
                        <button
                          onClick={() => requestUpgrade(plan)}
                          disabled={upgrading || isFree}
                          className={cn(
                            'w-full py-2.5 rounded-xl text-center text-sm font-semibold transition-opacity flex items-center justify-center gap-2',
                            isFree
                              ? 'bg-light-grey text-text-secondary cursor-not-allowed'
                              : 'bg-gradient-primary text-white shadow-primary hover:opacity-90'
                          )}
                        >
                          {upgrading ? (
                            <><Loader2 size={14} className="animate-spin" /> Envoi…</>
                          ) : (
                            <><CreditCard size={14} /> Passer au plan {plan.display_name}</>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info paiement */}
            <div className="card p-5 bg-surface-variant border border-light-grey">
              <h3 className="font-bold text-navy mb-2 flex items-center gap-2">
                <CreditCard size={15} /> Comment ça marche ?
              </h3>
              <ol className="text-sm text-text-secondary space-y-2 list-decimal list-inside">
                <li>Cliquez sur <strong className="text-navy">Passer au plan Standard</strong></li>
                <li>Notre équipe commerciale reçoit votre demande et vous contacte</li>
                <li>Paiement via Mobile Money (Orange Money, MTN, Wave) ou virement</li>
                <li>Votre plan est activé immédiatement après confirmation du paiement</li>
              </ol>
              <div className="mt-3 pt-3 border-t border-light-grey text-sm">
                Contact : <strong className="text-navy">support@olave.ci</strong> | WhatsApp disponible
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}