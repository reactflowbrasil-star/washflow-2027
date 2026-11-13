'use client';

import React from 'react';
import { LicensePlate } from '@/types';
import { OFFICIAL_PROVINCES } from '@/constants/provinces';

interface PlateDisplayProps {
  plate: LicensePlate;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCityBadge?: boolean;
  className?: string;
}

const UF_BY_CODE = new Map(OFFICIAL_PROVINCES.map((state) => [state.code, state]));

/**
 * Placa brasileira em dois padrões oficiais:
 *  - Mercosul: faixa azul com "BRASIL", bandeira e UF, caracteres ABC1D23
 *  - Cinza (antiga): fundo cinza, caracteres ABC-1234 e município de registro
 */
export const PlateDisplay: React.FC<PlateDisplayProps> = ({
  plate,
  size = 'md',
  showCityBadge = false,
  className = '',
}) => {
  const isMercosul = plate.type === 'mercosul';

  const state =
    UF_BY_CODE.get((plate.stateCode || 'SP').toUpperCase()) ||
    UF_BY_CODE.get('SP');

  const stateName = plate.stateName || state?.name || 'São Paulo';

  const sizes = {
    sm: {
      plate: 'h-8 min-w-[96px] rounded-[5px]',
      band: 'h-[30%] px-1',
      bandText: 'text-[6px] tracking-[0.14em]',
      stateText: 'text-[7px]',
      flag: 'w-2 h-1.5',
      chars: 'text-[13px] tracking-[0.06em] gap-[1px]',
      city: 'text-[6px]',
      badge: 'text-[10px] px-1.5 py-0.5',
    },
    md: {
      plate: 'h-11 min-w-[132px] rounded-[7px]',
      band: 'h-[30%] px-1.5',
      bandText: 'text-[8px] tracking-[0.16em]',
      stateText: 'text-[9px]',
      flag: 'w-3 h-2',
      chars: 'text-lg tracking-[0.08em] gap-[2px]',
      city: 'text-[7px]',
      badge: 'text-xs px-2 py-0.5',
    },
    lg: {
      plate: 'h-16 min-w-[192px] rounded-[10px]',
      band: 'h-[30%] px-2.5',
      bandText: 'text-[11px] tracking-[0.18em]',
      stateText: 'text-[12px]',
      flag: 'w-4 h-2.5',
      chars: 'text-2xl tracking-[0.1em] gap-[3px]',
      city: 'text-[9px]',
      badge: 'text-xs px-2.5 py-1',
    },
    xl: {
      plate: 'h-20 min-w-[248px] rounded-[12px]',
      band: 'h-[30%] px-3',
      bandText: 'text-[13px] tracking-[0.2em]',
      stateText: 'text-sm',
      flag: 'w-5 h-3',
      chars: 'text-3xl tracking-[0.12em] gap-[4px]',
      city: 'text-[10px]',
      badge: 'text-sm px-3 py-1',
    },
  }[size];

  const flag = (extra: string) => (
    <span
      className={`relative inline-flex items-center justify-center rounded-[1px] bg-[#009c3b] ${extra}`}
      aria-hidden="true"
    >
      <span className="absolute w-[62%] h-[62%] bg-[#ffdf00] rotate-45 rounded-[0.5px]" />
      <span className="relative w-[30%] h-[30%] rounded-full bg-[#002776]" />
    </span>
  );

  if (isMercosul) {
    const letters = (plate.letters || '').toUpperCase();
    const number = (plate.number || '').toUpperCase();

    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div
          data-plate="true"
          className={`license-plate inline-flex flex-col select-none overflow-hidden border border-slate-900/85 bg-white shadow-sm ${sizes.plate}`}
          dir="ltr"
        >
          {/* Faixa azul oficial Mercosul */}
          <div
            className={`flex w-full shrink-0 items-center justify-between bg-[#002776] text-white ${sizes.band}`}
            style={{ background: 'linear-gradient(180deg, #0a3aa8 0%, #002776 55%, #001d5c 100%)' }}
          >
            <span className="flex items-center gap-1">
              {flag(sizes.flag)}
              <span className={`font-black uppercase ${sizes.bandText}`} style={{ letterSpacing: '0.18em' }}>
                Brasil
              </span>
            </span>
            <span className={`font-black ${sizes.stateText}`}>{state?.code || 'SP'}</span>
          </div>

          {/* Caracteres ABC1D23 */}
          <div className="flex flex-1 items-center justify-center px-1">
            <span
              className={`flex items-baseline font-black text-slate-950 ${sizes.chars}`}
              style={{ fontFamily: "'FE-Font', 'JetBrains Mono', monospace" }}
            >
              <span>{letters || 'ABC'}</span>
              <span>{number || '1D23'}</span>
            </span>
          </div>
        </div>

        {showCityBadge && (
          <span
            className={`rounded-lg border border-slate-700 bg-slate-800 font-bold text-slate-300 ${sizes.badge}`}
          >
            {stateName}
          </span>
        )}
      </div>
    );
  }

  // ---------------- Placa cinza antiga (ABC-1234) ----------------
  const rawRegistration = (plate.oldNumber || `${plate.letters || ''}${plate.number || ''}` || 'ABC1234').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const registration = /^[A-Z]{3}\d{4}$/.test(rawRegistration)
    ? `${rawRegistration.slice(0, 3)}-${rawRegistration.slice(3)}`
    : rawRegistration;

  const categoryTone =
    plate.category === 'Comercial'
      ? 'bg-amber-300 text-slate-950'
      : plate.category === 'Oficial' || plate.category === 'Diplomática'
      ? 'bg-slate-900 text-white'
      : plate.category === 'Colecionador'
      ? 'bg-emerald-700 text-white'
      : 'bg-slate-700 text-white';

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        data-plate="true"
        className={`license-plate inline-flex select-none overflow-hidden rounded-md border border-slate-500/70 bg-[#dfe4ea] shadow-sm ${sizes.plate}`}
        dir="ltr"
        style={{ backgroundImage: 'linear-gradient(180deg, #eef1f5 0%, #d5dbe2 100%)' }}
      >
        {plate.category && (
          <span
            className={`flex h-full shrink-0 items-center border-r border-slate-500/40 px-1.5 text-[8px] font-black uppercase tracking-wide ${categoryTone}`}
          >
            {plate.category}
          </span>
        )}

        <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-2">
          <span
            className={`font-black leading-none text-slate-950 ${sizes.chars}`}
            style={{ fontFamily: "'FE-Font', 'JetBrains Mono', monospace" }}
          >
            {registration}
          </span>
          <span
            className={`mt-0.5 max-w-full truncate font-bold uppercase leading-none text-slate-600 ${sizes.city}`}
          >
            {plate.cityName || 'São Paulo'} · {state?.code || 'SP'}
          </span>
        </div>
      </div>

      {showCityBadge && (
        <span
          className={`rounded-lg border border-slate-700 bg-slate-800 font-bold text-slate-300 ${sizes.badge}`}
        >
          {plate.cityName || stateName}
        </span>
      )}
    </div>
  );
};
