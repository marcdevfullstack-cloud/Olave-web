'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, Phone } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(user.role === 'proprietaire' ? '/proprietaire' : '/gerant');
    }
  }, [isLoading, isAuthenticated, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!telephone || !password) return;
    setError('');
    setSubmitting(true);
    // Nettoie le numéro : supprime espaces, tirets, points
    const cleanTel = telephone.replace(/[\s\-\.]/g, '');
    try {
      await login(cleanTel, password);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      // Extraire le message depuis les erreurs de validation Laravel
      const validationMsg = data?.errors ? Object.values(data.errors).flat()[0] : undefined;
      setError(validationMsg ?? data?.message ?? 'Numéro ou mot de passe incorrect');
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-splash flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-splash flex">
      {/* Left — Branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 rounded-full bg-primary/10" />
        <div className="absolute bottom-[-100px] left-[-60px] w-96 h-96 rounded-full bg-green/8" />
        <div className="absolute top-1/3 left-[-40px] w-40 h-40 rounded-full bg-white/5" />

        <div className="relative z-10 text-center space-y-10">
          <div className="flex justify-center">
            <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-primary">
              <Image
                src="/logo.png"
                alt="Olave"
                width={112}
                height={112}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div>
            <h1 className="text-6xl font-black text-white tracking-tight">olave</h1>
            <p className="text-white/60 mt-3 text-lg font-medium tracking-wide">
              Lavage automobile intelligent
            </p>
          </div>

          <div className="space-y-3 max-w-xs mx-auto">
            {[
              'Suivi des transactions en temps réel',
              'Gestion des laveurs et commissions',
              'Programme de fidélité clients',
              'Statistiques et rapports détaillés',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-white/70">
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center mb-10">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 shadow-primary">
                <Image
                  src="/logo.png"
                  alt="Olave"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-4xl font-black text-white">olave</h1>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-navy">Connexion</h2>
              <p className="text-text-secondary mt-1 text-sm">
                Accédez à votre espace de gestion
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">
                  Numéro de téléphone
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
                  <input
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="input pl-11"
                    placeholder="0700000000"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pr-12"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-navy transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-error/8 border border-error/20 text-error text-sm rounded-xl px-4 py-3 animate-fade-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Connexion en cours…
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>

            <p className="text-center text-xs text-text-light mt-8 leading-relaxed">
              Plateforme réservée aux gérants et propriétaires.<br />
              Contactez votre administrateur pour accéder.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}