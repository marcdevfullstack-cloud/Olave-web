'use client';

import Header from '@/components/layout/Header';
import { Headphones, MessageCircle, Mail, Phone, Clock, Crown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const CANAUX = [
  {
    icon: MessageCircle,
    titre: 'WhatsApp',
    desc: 'Réponse en moins de 15 minutes',
    contact: '07 11 62 31 97',
    href: 'https://wa.me/2250711623197',
    action: 'Ouvrir WhatsApp',
    color: 'bg-green/10 text-green-dark border-green/20',
    iconColor: 'text-green-dark',
    plan: 'tous',
  },
  {
    icon: Mail,
    titre: 'Email',
    desc: 'Réponse sous 24h ouvrées',
    contact: 'marcdevfullstack@gmail.com',
    href: 'mailto:marcdevfullstack@gmail.com',
    action: 'Envoyer un email',
    color: 'bg-primary/10 text-primary border-primary/20',
    iconColor: 'text-primary',
    plan: 'tous',
  },
  {
    icon: Phone,
    titre: 'Téléphone dédié',
    desc: 'Disponible 24h/24, 7j/7',
    contact: '07 11 62 31 97',
    href: 'tel:+2250711623197',
    action: 'Appeler maintenant',
    color: 'bg-warning/10 text-warning border-warning/20',
    iconColor: 'text-warning',
    plan: 'standard',
  },
];

const FAQS = [
  { q: 'Comment ajouter un gérant ?', r: 'Allez dans Propriétaire → Gérants → Nouveau gérant. Entrez les informations et assignez un lavage.' },
  { q: 'Comment enregistrer une transaction ?', r: 'Dans le tableau de bord gérant, cliquez sur "Nouvelle transaction", sélectionnez le type de lavage, le montant, le laveur et optionnellement le client.' },
  { q: 'Comment fonctionne la fidélité ?', r: 'Chaque lavage enregistré pour un client crédite automatiquement des points. Configurez les règles dans Propriétaire → Fidélité.' },
  { q: 'Comment accéder à la surveillance caméra ?', r: 'La surveillance est disponible sur le plan Standard (accès complet) ou en essai 14 jours sur le plan Gratuit.' },
  { q: 'Comment exporter mes données ?', r: 'Dans la section Rapports, sélectionnez la période et cliquez sur "Exporter CSV" ou "Imprimer / PDF".' },
  { q: 'Comment payer les commissions des laveurs ?', r: 'Dans Propriétaire → Salaires, vous verrez les commissions calculées automatiquement par laveur. Cliquez sur "Payer" pour enregistrer le paiement.' },
];

export default function SupportPage() {
  return (
    <div className="animate-fade-in">
      <Header title="Support 24/7" subtitle="Propriétaire" />

      <div className="p-6 space-y-6">
        {/* Hero */}
        <div className="bg-gradient-navy rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Headphones size={22} />
            </div>
            <div>
              <h2 className="font-bold text-lg">Support Olave</h2>
              <p className="text-white/70 text-sm mt-1">
                Notre équipe est disponible pour vous aider à tirer le maximum de votre plateforme Olave.
                Le support dédié 24/7 est inclus dans le plan Standard.
              </p>
            </div>
          </div>
        </div>

        {/* Canaux de contact */}
        <div>
          <h2 className="font-bold text-navy mb-4">Nous contacter</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CANAUX.map((canal) => (
              <div
                key={canal.titre}
                className={cn('card p-5 border', canal.color)}
              >
                {canal.plan === 'standard' && (
                  <div className="flex items-center gap-1 text-xs font-bold text-primary mb-3">
                    <Crown size={11} /> Plan Standard
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                    <canal.icon size={18} className={canal.iconColor} />
                  </div>
                  <div>
                    <div className="font-bold text-navy">{canal.titre}</div>
                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                      <Clock size={10} /> {canal.desc}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-navy mb-3">{canal.contact}</div>
                <a
                  href={canal.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2 rounded-xl text-sm font-semibold bg-white border border-light-grey hover:shadow-card transition-shadow text-navy text-center"
                >
                  {canal.action}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Horaires */}
        <div className="card p-5">
          <h3 className="font-bold text-navy mb-4 flex items-center gap-2">
            <Clock size={15} /> Disponibilité du support
          </h3>
          <div className="space-y-3">
            {[
              { plan: 'Gratuit', icon: Star, dispo: 'Email uniquement — Réponse sous 24h', color: 'text-text-secondary' },
              { plan: 'Standard', icon: Crown, dispo: '24h/24, 7j/7 — WhatsApp, Email, Téléphone', color: 'text-primary' },
            ].map((row) => (
              <div key={row.plan} className="flex items-center gap-3 py-2 border-b border-light-grey last:border-0">
                <row.icon size={16} className={row.color} />
                <div className="font-semibold text-navy text-sm w-20">{row.plan}</div>
                <div className="text-sm text-text-secondary">{row.dispo}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Info contact rapide */}
        <div className="card p-4 bg-surface-variant border border-light-grey text-sm text-text-secondary">
          Email :{' '}
          <a href="mailto:marcdevfullstack@gmail.com" className="text-primary font-semibold hover:underline">marcdevfullstack@gmail.com</a>
          {' '}|{' '}
          <a href="https://wa.me/2250711623197" target="_blank" rel="noopener noreferrer" className="text-green-dark font-semibold hover:underline">WhatsApp 07 11 62 31 97</a>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="font-bold text-navy mb-4">Questions fréquentes</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <details key={i} className="card p-4 group">
                <summary className="font-semibold text-navy text-sm cursor-pointer list-none flex items-center justify-between gap-2">
                  {faq.q}
                  <span className="text-text-secondary text-lg leading-none group-open:rotate-45 transition-transform select-none">+</span>
                </summary>
                <div className="mt-3 pt-3 border-t border-light-grey text-sm text-text-secondary">
                  {faq.r}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}