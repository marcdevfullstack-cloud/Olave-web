'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, Phone, User, Mail, Lock, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showPwdConfirm, setShowPwdConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/proprietaire');
    }
  }, [isLoading, isAuthenticated, router]);

  function setField(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptTerms) { setError('Veuillez accepter les conditions d\'utilisation'); return; }
    if (form.password !== form.password_confirmation) { setError('Les mots de passe ne correspondent pas'); return; }
    if (form.password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères'); return; }
    if (form.telephone.replace(/\D/g, '').length !== 10) { setError('Le numéro doit contenir 10 chiffres'); return; }

    setError('');
    setSubmitting(true);
    try {
      await register({
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        password: form.password,
        password_confirmation: form.password_confirmation,
        email: form.email || undefined,
      });
      router.replace('/proprietaire');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      const validationMsg = data?.errors ? Object.values(data.errors).flat()[0] : undefined;
      setError(validationMsg ?? data?.message ?? 'Erreur lors de la création du compte');
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-splash flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 rounded-full bg-primary/10" />
        <div className="absolute bottom-[-100px] left-[-60px] w-96 h-96 rounded-full bg-green/8" />

        <div className="relative z-10 text-center space-y-10">
          <div className="flex justify-center">
            <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-primary">
              <Image src="/logo.png" alt="Olave" width={112} height={112} className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <h1 className="text-6xl font-black text-white tracking-tight">olave</h1>
            <p className="text-white/60 mt-3 text-lg font-medium">Lavage automobile intelligent</p>
          </div>
          <div className="space-y-3 max-w-xs mx-auto">
            {[
              'Inscription 100% gratuite',
              'Gérez plusieurs lavages depuis un seul compte',
              'Programme de fidélité clients intégré',
              'Surveillance IA et statistiques en temps réel',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-white/70">
                <CheckCircle size={14} className="text-primary flex-shrink-0" />
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in py-6">
          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center mb-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-3 shadow-primary">
                <Image src="/logo.png" alt="Olave" width={64} height={64} className="w-full h-full object-cover" />
              </div>
              <h1 className="text-3xl font-black text-white">olave</h1>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-navy">Créer un compte</h2>
              <p className="text-text-secondary mt-1 text-sm">Inscription Propriétaire — gratuit</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nom + Prénom */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">Nom *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
                    <input type="text" value={form.nom} onChange={setField('nom')} className="input pl-9 !py-2.5 text-sm" placeholder="KOUASSI" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">Prénom *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
                    <input type="text" value={form.prenom} onChange={setField('prenom')} className="input pl-9 !py-2.5 text-sm" placeholder="Jean" required />
                  </div>
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">Téléphone * (10 chiffres)</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
                  <input type="tel" value={form.telephone} onChange={setField('telephone')} className="input pl-9 !py-2.5 text-sm" placeholder="0700000000" required />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">Email (optionnel)</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
                  <input type="email" value={form.email} onChange={setField('email')} className="input pl-9 !py-2.5 text-sm" placeholder="exemple@email.com" />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">Mot de passe * (min. 6 caractères)</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={setField('password')}
                    className="input pl-9 pr-10 !py-2.5 text-sm"
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-navy">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirmation */}
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">Confirmer le mot de passe *</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
                  <input
                    type={showPwdConfirm ? 'text' : 'password'}
                    value={form.password_confirmation}
                    onChange={setField('password_confirmation')}
                    className="input pl-9 pr-10 !py-2.5 text-sm"
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowPwdConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-navy">
                    {showPwdConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* CGU */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded accent-primary cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-text-secondary cursor-pointer leading-relaxed">
                  J&apos;accepte les conditions d&apos;utilisation de la plateforme Olave
                </label>
              </div>

              {error && (
                <div className="bg-error/8 border border-error/20 text-error text-sm rounded-xl px-4 py-3 animate-fade-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-1"
              >
                {submitting ? (
                  <><Loader2 size={18} className="animate-spin" /> Création du compte…</>
                ) : (
                  'Créer mon compte'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-sm text-text-secondary">Déjà un compte ?{' '}</span>
              <Link href="/" className="text-sm font-semibold text-primary hover:underline">
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}