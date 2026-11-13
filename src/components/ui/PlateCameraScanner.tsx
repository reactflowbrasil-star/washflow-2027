'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, LoaderCircle, X } from 'lucide-react';
import { PlateType } from '@/types';

export type PlateScanResult =
  | { type: 'mercosul'; letters?: string; number?: string }
  | { type: 'old'; oldNumber: string; letters?: string };

interface PlateCameraScannerProps {
  currentType: PlateType;
  onRead: (result: PlateScanResult) => void;
}

type OcrWorker = {
  recognize: (image: HTMLCanvasElement) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<unknown>;
};

const tesseractCdn = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.esm.min.js';
const corePath = 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0';
const langPath = 'https://tessdata.projectnaptha.com/4.0.0';

function parsePlate(text: string, currentType: PlateType): PlateScanResult | null {
  const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Padrão Mercosul: ABC1D23
  const mercosul = cleaned.match(/([A-Z]{3})(\d[A-Z]\d{2})/);
  if (mercosul) {
    return { type: 'mercosul', letters: mercosul[1], number: mercosul[2] };
  }

  // Padrão cinza antigo: ABC1234
  const legacy = cleaned.match(/([A-Z]{3})(\d{4})/);
  if (legacy) return { type: 'old', oldNumber: legacy[2], letters: legacy[1] };

  const digits = cleaned.replace(/[A-Z]/g, '');
  if (currentType === 'old' && digits.length >= 4) {
    return { type: 'old', oldNumber: digits.slice(-4) };
  }
  if (digits.length >= 4) {
    return { type: 'mercosul', number: digits.slice(-4) };
  }
  return null;
}

async function loadOcrWorker(): Promise<OcrWorker> {
  const module = await import(/* webpackIgnore: true */ tesseractCdn) as {
    createWorker: (
      language: string,
      oem: number,
      options: Record<string, unknown>,
    ) => Promise<OcrWorker>;
  };
  return module.createWorker('eng', 1, {
    workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js',
    corePath,
    langPath,
    logger: () => undefined,
  });
}

export const PlateCameraScanner: React.FC<PlateCameraScannerProps> = ({ currentType, onRead }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('Enquadre a placa e toque em Capturar');
  const [isBusy, setIsBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<OcrWorker | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const close = useCallback(() => {
    stopCamera();
    setIsOpen(false);
    setIsBusy(false);
  }, [stopCamera]);

  useEffect(() => () => {
    stopCamera();
    void workerRef.current?.terminate();
  }, [stopCamera]);

  const startCamera = async () => {
    setStatus('Solicitando acesso à câmera…');
    try {
      const media = await navigator.mediaDevices?.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (!media) throw new Error('Câmera indisponível');
      streamRef.current = media;
      setIsOpen(true);
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = media;
          void videoRef.current.play().catch(() => undefined);
        }
      }, 50);
      setStatus('Enquadre a placa e toque em Capturar');
    } catch {
      setStatus('Não foi possível abrir a câmera. Verifique a permissão ou escolha uma foto.');
      setIsOpen(true);
    }
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth) {
      setStatus('A câmera ainda está iniciando. Tente novamente.');
      return;
    }
    setIsBusy(true);
    setStatus('Lendo a placa no dispositivo…');
    const canvas = document.createElement('canvas');
    const cropWidth = Math.round(video.videoWidth * 0.86);
    const cropHeight = Math.round(video.videoHeight * 0.42);
    canvas.width = cropWidth * 2;
    canvas.height = cropHeight * 2;
    const context = canvas.getContext('2d');
    if (!context) {
      setIsBusy(false);
      setStatus('Não foi possível processar a imagem.');
      return;
    }
    context.filter = 'grayscale(1) contrast(1.5)';
    context.drawImage(
      video,
      Math.round((video.videoWidth - cropWidth) / 2),
      Math.round((video.videoHeight - cropHeight) / 2),
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    try {
      const worker = workerRef.current || await loadOcrWorker();
      workerRef.current = worker;
      const result = await worker.recognize(canvas);
      const parsed = parsePlate(result.data.text, currentType);
      if (!parsed) {
        setStatus('Não identifiquei a placa. Aproxime, melhore a luz e tente novamente.');
        return;
      }
      onRead(parsed);
      close();
    } catch {
      setStatus('Falha ao carregar o leitor. Confira sua conexão e tente outra vez.');
    } finally {
      setIsBusy(false);
    }
  };

  const selectPhoto = () => fileRef.current?.click();

  const scanPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setIsBusy(true);
    setStatus('Lendo a imagem no dispositivo…');
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext('2d')?.drawImage(image, 0, 0);
      try {
        const worker = workerRef.current || await loadOcrWorker();
        workerRef.current = worker;
        const result = await worker.recognize(canvas);
        const parsed = parsePlate(result.data.text, currentType);
        if (parsed) {
          onRead(parsed);
          close();
        } else {
          setStatus('Não identifiquei a placa. Tente outra foto.');
        }
      } catch {
        setStatus('Falha ao carregar o leitor. Confira sua conexão e tente outra vez.');
      } finally {
        URL.revokeObjectURL(objectUrl);
        setIsBusy(false);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setIsBusy(false);
      setStatus('Não foi possível abrir essa imagem.');
    };
    image.src = objectUrl;
  };

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={scanPhoto} />
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          void startCamera();
        }}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300"
        aria-label="Ler placa do veículo pela câmera"
      >
        <Camera className="h-4 w-4" />
        Ler placa
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Leitura inteligente da placa">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl">
            <div className="flex items-center justify-between p-4">
              <div>
                <h2 className="font-black">Leitura inteligente da placa</h2>
                <p className="text-xs text-slate-300">A imagem é processada neste dispositivo.</p>
              </div>
              <button type="button" onClick={close} className="rounded-xl p-2 text-slate-300 hover:bg-white/10" aria-label="Fechar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
              <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-x-[8%] top-1/2 h-[30%] -translate-y-1/2 rounded-xl border-2 border-emerald-400 shadow-[0_0_0_999px_rgba(0,0,0,0.2)]" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-3 text-center text-xs">{status}</div>
            </div>
            <div className="flex gap-2 p-4">
              <button type="button" disabled={isBusy || !streamRef.current} onClick={() => void capture()} className="flex-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold disabled:opacity-50">
                {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                Capturar placa
              </button>
              <button type="button" disabled={isBusy} onClick={selectPhoto} className="min-h-11 rounded-xl border border-slate-700 px-4 text-sm font-bold disabled:opacity-50">Foto</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
