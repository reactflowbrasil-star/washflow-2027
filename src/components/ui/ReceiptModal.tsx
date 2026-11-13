'use client';

import React, { useEffect } from 'react';
import { Vehicle, ServiceItem, AppSettings, SelectedCafeItem } from '@/types';
import { PlateDisplay } from './PlateDisplay';
import { formatR$ } from '@/lib/storage';
import { generateWashCompletionMessage, openWhatsAppChat } from '@/lib/whatsapp';
import { Printer, X, Sparkles, MessageCircle, CheckCircle2, Crown, Coffee } from 'lucide-react';

interface ReceiptModalProps {
  vehicle: Vehicle;
  service: ServiceItem;
  staffName: string;
  isFree: boolean;
  freeReason?: string;
  isSubscriptionWash?: boolean;
  cafeItems?: SelectedCafeItem[];
  cafeTotal?: number;
  damageInspection?: {
    hasScratches?: boolean;
    hasDents?: boolean;
    brokenParts?: boolean;
    notes?: string;
  };
  settings: AppSettings;
  chargedPrice?: number;
  vehicleSize?: string;
  paymentMethod?: string;
  isDebt?: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  vehicle,
  service,
  staffName,
  isFree,
  freeReason,
  isSubscriptionWash,
  cafeItems,
  cafeTotal = 0,
  damageInspection,
  settings,
  chargedPrice,
  vehicleSize,
  paymentMethod = 'cash',
  isDebt = false,
  onClose,
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  const effectivePrice = chargedPrice !== undefined ? chargedPrice : service.price;

  const handleSendWhatsApp = () => {
    if (!vehicle.phone) {
      alert('este Veículo Telefone / Celular para Registrar não realizado!');
      return;
    }
    const message = generateWashCompletionMessage(
      vehicle,
      service,
      isFree,
      settings,
      effectivePrice,
      paymentMethod
    );
    openWhatsAppChat(vehicle.phone, message);
  };

  const receiptDate = new Date().toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl flex flex-col max-h-[92vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative text-slate-900 dark:text-white"
        dir="ltr"
      >
        {/* Modal Top Header (Fixed - Always Visible) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 no-print shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center">
              <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                Recibo Caixa (Thermal Receipt 80mm)
              </h3>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                dez para Impressão ou Enviar para Telefone / Celular Cliente
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Body (Content scrolls smoothly if screen is compact) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-100/60 dark:bg-slate-950/60 space-y-3">
          {/* Printable Ticket */}
          <div
            id="printable-receipt"
            className="bg-white text-slate-900 p-5 sm:p-6 rounded-2xl shadow-sm font-mono text-xs space-y-3.5 border-2 border-dashed border-slate-300 relative select-none max-w-sm mx-auto"
            dir="ltr"
          >
            {/* Header */}
            <div className="text-center space-y-1 border-b-2 border-dashed border-slate-300 pb-3">
              <h2 className="text-base sm:text-lg font-black text-slate-950 font-sans tracking-tight leading-snug break-words">
                {settings.carWashName}
              </h2>
              {settings.carWashSlogan && (
                <p className="text-[10px] text-slate-500 font-sans italic">{settings.carWashSlogan}</p>
              )}
              <p className="text-[11px] text-slate-600 font-sans">{settings.carWashAddress}</p>
              <p className="text-[11px] text-slate-600 font-sans">
                em: <span className="font-mono font-bold text-slate-800">{settings.carWashPhone}</span>
              </p>
              <p className="text-[10px] text-slate-500 pt-0.5 font-mono">Data: {receiptDate}</p>
            </div>

            {/* Vehicle Plate in receipt (or Carpet Header if carpet order) */}
            {vehicle.itemType === 'carpet' || vehicle.carpetSpecs ? (
              <div className="flex flex-col items-center justify-center p-2.5 bg-teal-50 border-2 border-dashed border-teal-400 rounded-xl my-1 text-teal-950">
                <span className="text-xs font-black flex items-center gap-1.5">
                  🧶 Lava-Rápido Tapete  Estofados
                </span>
                <span className="text-[10px] font-mono font-black mt-0.5 text-teal-800">
                   Recebimento Tapete: C-{vehicle.plate.number}
                </span>
              </div>
            ) : (
              <div className="flex justify-center py-1">
                <PlateDisplay plate={vehicle.plate} size="sm" />
              </div>
            )}

            {/* Vehicle / Carpet & Customer Specs */}
            {vehicle.itemType === 'carpet' || vehicle.carpetSpecs ? (
              <div className="space-y-1.5 text-[11px] border-b-2 border-dashed border-slate-300 pb-3 font-sans">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Tipo Serviço:</span>
                  <span className="font-bold text-slate-950">{vehicle.color || 'Lavagem de Tapetes'}</span>
                </div>
                {vehicle.carpetSpecs?.areaSquareMeters ? (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">por:</span>
                    <span className="font-bold text-slate-950 font-mono">
                      {vehicle.carpetSpecs.areaSquareMeters} m² (²)
                      {vehicle.carpetSpecs.length && vehicle.carpetSpecs.width ? ` (${vehicle.carpetSpecs.length} × ${vehicle.carpetSpecs.width})` : ''}
                    </span>
                  </div>
                ) : null}
                {vehicle.carpetSpecs?.piecesCount ? (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Número Tapete / :</span>
                    <span className="font-bold text-slate-950">{vehicle.carpetSpecs.piecesCount} unid.</span>
                  </div>
                ) : null}
                {vehicle.carpetSpecs?.ratePerSquareMeter ? (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Preço / Valor cada metros:</span>
                    <span className="font-bold text-slate-950 font-mono">{formatR$(vehicle.carpetSpecs.ratePerSquareMeter)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Cliente:</span>
                  <span className="font-bold text-slate-950">{vehicle.ownerName}</span>
                </div>
                {vehicle.phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Telefone / Celular:</span>
                    <span className="font-bold text-slate-950 font-mono">{vehicle.phone}</span>
                  </div>
                )}
                {vehicle.carpetSpecs?.readyDate && (
                  <div className="flex justify-between items-center bg-teal-50 text-teal-900 px-2 py-1 rounded-lg border border-teal-200 font-bold">
                    <span>Horário dez para Recebimento:</span>
                    <span className="font-mono">{vehicle.carpetSpecs.readyDate}</span>
                  </div>
                )}
                {settings.showStaffOnReceipt !== false && staffName && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Profissional por:</span>
                    <span className="font-bold text-slate-950">{staffName}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5 text-[11px] border-b-2 border-dashed border-slate-300 pb-3 font-sans">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Veículo:</span>
                  <span className="font-bold text-slate-950">{vehicle.carModel} ({vehicle.color})</span>
                </div>
                {vehicle.size && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Porte Veículo:</span>
                    <span className="font-bold text-slate-900">
                      {vehicle.size === 'suv'
                        ? ' (SUV / 4x4)'
                        : vehicle.size === 'truck'
                        ? 'Carga / '
                        : ' ()'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Proprietário:</span>
                  <span className="font-bold text-slate-950">{vehicle.ownerName}</span>
                </div>
                {vehicle.phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Telefone / Celular:</span>
                    <span className="font-bold text-slate-950 font-mono">{vehicle.phone}</span>
                  </div>
                )}
                {settings.showStaffOnReceipt !== false && staffName && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Profissional por:</span>
                    <span className="font-bold text-slate-950">{staffName}</span>
                  </div>
                )}
              </div>
            )}

            {/* Service & Price */}
            <div className="space-y-1.5 text-xs border-b-2 border-dashed border-slate-300 pb-3 font-sans">
              <div className="flex justify-between items-center font-bold text-slate-950 text-sm">
                <span>{service.name}</span>
                <span className="font-mono text-emerald-700 font-black">
                  {isSubscriptionWash ? 'VIP PASS (0 R$)' : isFree ? 'FREE (0 R$)' : formatR$(chargedPrice !== undefined ? (chargedPrice - (cafeTotal || 0)) : service.price)}
                </span>
              </div>

              {isSubscriptionWash && (
                <div className="text-center text-[10px] text-purple-900 font-black bg-purple-100 py-1.5 rounded-lg border border-purple-300 flex items-center justify-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>por VIP sem (Unlimited VIP Wash - 0 R$)</span>
                </div>
              )}

              {isFree && !isSubscriptionWash && (
                <div className="text-center text-[10px] text-emerald-800 font-bold bg-emerald-100 py-1.5 rounded-lg border border-emerald-300">
                  {freeReason === 'rain_warranty'
                    ? '🌧️ Garantia de chuva: retorno em 24h sem custo'
                    : '🎉 Parabéns: Lavagem 5 Cliente 100 Grátis!'}
                </div>
              )}

              {/* Cafe & Lounge Add-ons on Receipt */}
              {cafeItems && cafeItems.length > 0 && (
                <div className="pt-2 border-t border-slate-200/80 space-y-1">
                  <div className="flex justify-between items-center text-slate-800 font-bold text-[11px]">
                    <span className="flex items-center gap-1 text-amber-800">
                      <Coffee className="w-3 h-3 text-amber-600" />
                      <span>  Materiais (Lounge):</span>
                    </span>
                    <span className="font-mono text-amber-900 font-black">{formatR$(cafeTotal)}</span>
                  </div>
                  {cafeItems.map((ci) => (
                    <div key={ci.id} className="flex justify-between items-center text-[10px] text-slate-600 pr-3">
                      <span>• {ci.name} × {ci.quantity}</span>
                      <span className="font-mono">{formatR$(ci.price * ci.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-black text-slate-950 text-sm">
                <span>Total Geral Recibo / Comprovante:</span>
                <span className="font-mono text-emerald-700 text-base">{formatR$(effectivePrice)}</span>
              </div>

              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                <span className="text-slate-500">Método Pagamento:</span>
                <span className={`font-bold font-sans px-2 py-0.5 rounded text-[11px] ${
                  isDebt
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : paymentMethod === 'fastpay'
                    ? 'bg-amber-100 text-amber-800'
                    : paymentMethod === 'fib'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-50 text-emerald-800'
                }`}>
                  {isDebt
                    ? '⚠️ Fiado / Débito pendente (Salvo com sucesso para Depois)'
                    : paymentMethod === 'fastpay'
                    ? '📱 FastPay'
                    : paymentMethod === 'fib'
                    ? '🏦 FIB ()'
                    : '💵  (Dinheiro)'}
                </span>
              </div>
            </div>

            {/* Pre-Wash Damage Inspection Note on Receipt */}
            {damageInspection && (damageInspection.hasScratches || damageInspection.hasDents || damageInspection.brokenParts || damageInspection.notes) && (
              <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-[10px] space-y-1 font-sans text-amber-950">
                <span className="font-bold flex items-center gap-1 text-amber-900">
                  ⚠️ Vistoria em antes de Lavagem (que antes de):
                </span>
                <div className="flex flex-wrap gap-2 text-[10px] text-amber-900/90 font-medium pr-1">
                  {damageInspection.hasScratches && <span>•  para</span>}
                  {damageInspection.hasDents && <span>•  Antiga</span>}
                  {damageInspection.brokenParts && <span>•  Vidros/água</span>}
                </div>
                {damageInspection.notes && (
                  <p className="text-[10px] text-amber-900 italic font-mono pt-0.5">
                    Observações: {damageInspection.notes}
                  </p>
                )}
              </div>
            )}

            {/* Loyalty Status on Ticket */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1.5">
              <div className="text-[11px] font-bold text-slate-900 flex items-center justify-center gap-1 font-sans">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Fidelidade NFC ({settings.washesNeededForFree || 4} + 1 Grátis)</span>
              </div>
              {/* Visual Meter */}
              <div className="flex items-center justify-center gap-1 py-0.5">
                {Array.from({ length: settings.washesNeededForFree || 4 }).map((_, idx) => {
                  const isDone = idx < (vehicle.currentCycleWashes || 0);
                  return (
                    <span
                      key={idx}
                      className={`inline-block w-4 h-2.5 rounded-sm ${
                        isDone ? 'bg-emerald-600' : 'bg-slate-200 border border-slate-300'
                      }`}
                    />
                  );
                })}
                <span className="text-amber-500 font-bold text-[10px] mr-1">🎁 FREE</span>
              </div>
              <p className="text-[10px] text-slate-700 font-sans">
                em em: <strong className="text-blue-700 font-mono">{vehicle.currentCycleWashes}</strong> em {settings.washesNeededForFree || 4} Lavagem Concluído dois.
              </p>
              <p className="text-[9px] text-slate-500 font-mono">
                Total Geral acima / topo: {vehicle.totalWashes} 
              </p>
            </div>

            {/* Footer Note */}
            <div className="text-center text-[10px] text-slate-500 pt-1 font-sans space-y-0.5">
              <p className="font-bold text-slate-700">obrigado para acima / topounid.que para {settings.carWashName}!</p>
              <p className="text-[9px]">{settings.receiptFooterNote || ' Limpo e Inspecionado por até dezque.'}</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Footer (Fixed - ALWAYS Visible on Screen) */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 no-print shrink-0 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition text-xs shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir (Print)</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition text-xs shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
              title="Enviar Recibo / Comprovante   para "
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 active:scale-98 cursor-pointer"
          >
            <span>Fechar (Close)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
