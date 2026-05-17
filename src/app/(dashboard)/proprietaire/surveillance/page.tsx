'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Camera, AlertCircle, Shield, Eye, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CameraFeed {
  id: string;
  nom: string;
  zone: string;
  online: boolean;
  url?: string;
}

const DEMO_CAMERAS: CameraFeed[] = [
  { id: '1', nom: 'Entrée principale', zone: 'Accueil', online: true },
  { id: '2', nom: 'Zone lavage 1', zone: 'Opérations', online: true },
  { id: '3', nom: 'Zone lavage 2', zone: 'Opérations', online: false },
  { id: '4', nom: 'Caisse', zone: 'Finances', online: true },
];

export default function SurveillancePage() {
  const [selected, setSelected] = useState<CameraFeed | null>(null);

  return (
    <div className="animate-fade-in">
      <Header title="Surveillance IA" subtitle="Propriétaire" />

      <div className="p-6 space-y-5">
        {/* Banner feature clé */}
        <div className="bg-gradient-navy rounded-2xl p-5 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Surveillance IA en temps réel</h2>
              <p className="text-white/70 text-sm mt-1">
                Surveillez vos lavages à distance, détectez les anomalies et recevez des alertes instantanées.
                La fonctionnalité qui convainc le plus lors des démos Olave.
              </p>
            </div>
          </div>
        </div>

        {/* Stats caméras */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total caméras', value: DEMO_CAMERAS.length, color: 'text-navy' },
            { label: 'En ligne', value: DEMO_CAMERAS.filter((c) => c.online).length, color: 'text-green-dark' },
            { label: 'Hors ligne', value: DEMO_CAMERAS.filter((c) => !c.online).length, color: 'text-error' },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-text-secondary mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Grille caméras */}
        <div>
          <h2 className="font-bold text-navy mb-4 flex items-center gap-2">
            <Eye size={16} /> Flux caméras
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEMO_CAMERAS.map((cam) => (
              <button
                key={cam.id}
                onClick={() => setSelected(selected?.id === cam.id ? null : cam)}
                className={cn(
                  'card p-0 overflow-hidden text-left transition-all cursor-pointer',
                  selected?.id === cam.id ? 'ring-2 ring-primary' : 'hover:shadow-card-hover'
                )}
              >
                {/* Flux vidéo (placeholder) */}
                <div className="aspect-video bg-navy flex items-center justify-center relative">
                  {cam.online ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy-light opacity-80" />
                      <div className="relative text-center">
                        <Camera size={36} className="text-white/30 mx-auto mb-2" />
                        <span className="text-white/50 text-xs">Flux en direct</span>
                      </div>
                      {/* Indicateur live */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-error/90 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <WifiOff size={36} className="text-white/20 mx-auto mb-2" />
                      <span className="text-white/30 text-xs">Signal perdu</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1',
                      cam.online
                        ? 'bg-green/90 text-white'
                        : 'bg-error/80 text-white'
                    )}>
                      {cam.online ? <Wifi size={10} /> : <WifiOff size={10} />}
                      {cam.online ? 'En ligne' : 'Hors ligne'}
                    </span>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="font-semibold text-navy text-sm">{cam.nom}</div>
                  <div className="text-xs text-text-secondary mt-0.5">{cam.zone}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Alertes IA */}
        <div className="card p-5">
          <h3 className="font-bold text-navy mb-4 flex items-center gap-2">
            <AlertCircle size={16} /> Alertes récentes
          </h3>
          <div className="space-y-3">
            {[
              { msg: 'Affluence détectée — Zone lavage 1', time: 'Il y a 5 min', type: 'warning' },
              { msg: 'Système opérationnel — Toutes les caméras actives', time: 'Il y a 1h', type: 'ok' },
              { msg: 'Caméra Zone lavage 2 déconnectée', time: 'Il y a 2h', type: 'error' },
            ].map((a, i) => (
              <div key={i} className={cn(
                'flex items-start gap-3 p-3 rounded-xl text-sm',
                a.type === 'warning' ? 'bg-warning/10' :
                a.type === 'error' ? 'bg-error/8' : 'bg-green/8'
              )}>
                <AlertCircle size={14} className={cn(
                  'mt-0.5 flex-shrink-0',
                  a.type === 'warning' ? 'text-warning' :
                  a.type === 'error' ? 'text-error' : 'text-green-dark'
                )} />
                <div className="flex-1">
                  <div className={cn(
                    'font-medium',
                    a.type === 'warning' ? 'text-warning' :
                    a.type === 'error' ? 'text-error' : 'text-green-dark'
                  )}>{a.msg}</div>
                  <div className="text-text-secondary text-xs mt-0.5">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}