'use client';

import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare, Smartphone, CheckCircle2 } from 'lucide-react';

export const InstallPwaPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosModal, setShowIosModal] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            reg.update();
            console.log('[PWA] Service Worker registered and updated:', reg.scope);
          })
          .catch((err) => {
            console.log('[PWA] Service Worker registration failed:', err);
          });
      });
    }

    // 2. Check if already installed in standalone mode
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
      return isStandalone;
    };

    if (checkStandalone()) {
      return;
    }

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);

    // 4. Android / Chrome: Capture beforeinstallprompt (manual install only)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Automatic popup banner disabled completely per user request
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Listen for manual trigger (e.g. from Sidebar or Header button)
    const handleManualOpen = () => {
      if (isIosDevice) {
        setShowIosModal(true);
      } else if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            setIsInstalled(true);
          }
          setDeferredPrompt(null);
        });
      } else {
        // Fallback info modal
        setShowIosModal(true);
      }
    };

    window.addEventListener('open-pwa-install', handleManualOpen);

    // Listen for appinstalled
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install', handleManualOpen);
    };
  }, [deferredPrompt]);

  if (isInstalled) return null;

  return (
    <>
      {/* iOS Safari / Manual Installation Instructions Modal (Only shown on explicit manual click) */}
      {showIosModal && (
        <div
          dir="ltr"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Baixar / Download para Home Screen</h3>
                  <span className="text-xs text-blue-400 font-bold">para  como aplicativo Telefone / Celular</span>
                </div>
              </div>
              <button
                onClick={() => setShowIosModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p className="text-slate-200 font-medium">
                para  sistemaque como aplicativo   acima / topo  Telefone / Celularque este 3  por que:
              </p>

              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0">
                  1
                </div>
                <div>
                  <span className="font-bold text-white block">clique em  Share que:</span>
                  <span className="text-slate-400">
                    em   Safari clique em  Compartilhar (
                    <Share className="w-3.5 h-3.5 inline mx-1 text-blue-400" />
                    Share) que.
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0">
                  2
                </div>
                <div>
                  <span className="font-bold text-white block">Add to Home Screen abaixo / sob:</span>
                  <span className="text-slate-400">
                    que Quantidade   clique emacima / topo (
                    <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />
                    Add to Home Screen / Adicionar para  Principal) que.
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0">
                  3
                </div>
                <div>
                  <span className="font-bold text-white block">clique em Add (Adicionar) que:</span>
                  <span className="text-slate-400">
                    em  acima / topo   Add . Antiga aplicativoque dezque acima / topo  Principal!
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>depois de Baixar / Download Concluído Nome  dezCidade  por Porte Concluído  como aplicativo   dezHorário.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-blue-500/20"
            >
               ✓
            </button>
          </div>
        </div>
      )}
    </>
  );
};
