import { Vehicle, ServiceItem, AppSettings } from '@/types';
import { formatR$, normalizeDigits } from './storage';

// Clean Iraqi phone numbers to international standard 964...
export function cleanIraqiPhoneNumber(phone: string): string {
  if (!phone) return '';
  // Normalize Kurdish/Arabic digits first
  const normalized = normalizeDigits(phone);
  // Remove spaces, dashes, parentheses, plus
  let cleaned = normalized.replace(/[\s\-\(\)\+]/g, '');

  // If starts with 07... (e.g. 07701234567) -> 9647701234567
  if (cleaned.startsWith('07')) {
    cleaned = '964' + cleaned.substring(1);
  } else if (cleaned.startsWith('7')) {
    cleaned = '964' + cleaned;
  }

  return cleaned;
}

// Helper to get dynamic customer portal base URL
export function getPortalBaseUrl(settings?: AppSettings): string {
  if (settings?.systemUrl && settings.systemUrl.trim().length > 0) {
    return settings.systemUrl.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}

// Generate Wash Completion Message
export function generateWashCompletionMessage(
  vehicle: Vehicle,
  service: ServiceItem,
  isFree: boolean,
  settings: AppSettings,
  chargedPrice?: number,
  paymentMethod?: string
): string {
  const plateText =
    vehicle.plate.type === 'unified'
      ? `${vehicle.plate.provinceCode} | ${vehicle.plate.letter} ${vehicle.plate.number} (${vehicle.plate.provinceName})`
      : `${vehicle.plate.oldCityName} / ${vehicle.plate.oldNumber}`;

  const targetWashes = settings.washesNeededForFree || 4;
  const current = vehicle.currentCycleWashes || 0;
  const filled = Math.min(Math.max(0, current), targetWashes);
  const empty = Math.max(0, targetWashes - filled);
  const visualMeter = '🟩'.repeat(filled) + '⬜'.repeat(empty);

  let loyaltyText = '';
  if (isFree) {
    loyaltyText = `🎉 *Parabéns! este Lavagem 100 Grátis  (FREE)*\n[${visualMeter}] ciclo de lavagens Novo para o Veículo dez .`;
  } else {
    const left = Math.max(0, targetWashes - current);
    loyaltyText =
      left === 0
        ? `✨ *Aviso / Alerta que:* [${visualMeter}]\nLavagem Faturado Grátis (FREE 🎁)!`
        : `🔹 Fidelidade o Veículo: [${visualMeter}] *${current}* em ${targetWashes}\n *${left}* Lavagem  Restante / Pendente para Lavagem Grátis!`;
  }

  const portalUrl = `${getPortalBaseUrl(settings)}/nfc/${vehicle.id}`;
  const actualPrice = chargedPrice !== undefined ? chargedPrice : service.price;

  let paymentLabel = ' (Dinheiro)';
  if (paymentMethod === 'fastpay') paymentLabel = 'FastPay 📱';
  else if (paymentMethod === 'fib') paymentLabel = 'FIB  🏦';
  else if (paymentMethod === 'debt') paymentLabel = 'Fiado / Débito pendente (Restante / Pendente) ⚠️';

  return `Olá prezado(a) ${vehicle.ownerName} 🌸

obrigado para acima / topo *${settings.carWashName}*! o Veículo   Pronto para Recebimento 🚗✨

📋 *Detalhes Recibo até:*
• Veículo: ${vehicle.carModel} (${vehicle.color})
• Placa: ${plateText}
• Serviço: ${service.name}
• Quantidade Valor: ${isFree ? '0 R$ (Grátis - Free)' : formatR$(actualPrice)}
• Método Pagamento: ${isFree ? '🎁 recompensa Fidelidade' : paymentLabel}

🎁 *   Fidelidade:*
${loyaltyText}
• Total Geral acima / topounid.: ${vehicle.totalWashes} 

🔗 *Visualização de cartão VIP  Histórico de Lavagem em Telefone / Celular:*
${portalUrl}

📞 : ${settings.carWashPhone}
📍 Nome: ${settings.carWashAddress}
Limpo e Inspecionado o Veículo  !`;
}

// Generate 15-day Inactivity Reminder Message
export function generateInactivityReminderMessage(
  vehicle: Vehicle,
  settings: AppSettings,
  daysPassed: number
): string {
  const plateText =
    vehicle.plate.type === 'unified'
      ? `${vehicle.plate.provinceCode} | ${vehicle.plate.letter} ${vehicle.plate.number}`
      : `${vehicle.plate.oldCityName} / ${vehicle.plate.oldNumber}`;

  const portalUrl = `${getPortalBaseUrl(settings)}/nfc/${vehicle.id}`;

  return `Olá  ${vehicle.ownerName} prezado(a) 🌸

Restante / Pendenteque em *${settings.carWashName}*  !  em *${daysPassed} dias* acima / topo dois 🚗

Veículo que (${vehicle.carModel} - ${plateText})  por Lavagem   !

🎁 *recompensaque   protegido:*
 *${vehicle.currentCycleWashes}* Lavagem   Registrar você pode em acima / topo Faturado pordez  por Lavagem Grátis!

🔗 *até o Veículo para Visualização de :*
${portalUrl}

acima / topo que por  em  dez ✨
📞 : ${settings.carWashPhone}
📍 Nome: ${settings.carWashAddress}`;
}

// Generate Car Ready for Pickup Message
export function generateCarReadyMessage(
  vehicle: Vehicle,
  settings: AppSettings,
  bayNumber?: number
): string {
  const plateText =
    vehicle.plate.type === 'unified'
      ? `${vehicle.plate.provinceCode} | ${vehicle.plate.letter} ${vehicle.plate.number}`
      : `${vehicle.plate.oldCityName} / ${vehicle.plate.oldNumber}`;

  return `Olá prezado(a) ${vehicle.ownerName || 'Cliente prezado(a)'} 🌸

Veículo que (${vehicle.carModel} - ${plateText}) em *${settings.carWashName}*${
    bayNumber ? ` em Box ${bayNumber}` : ''
  } Lavagem por sucesso Concluído      Pronto para Recebimento! 🚗✨

obrigado para confiança por  por até.
📞 : ${settings.carWashPhone}`;
}

// Open WhatsApp Web or App directly with prefilled text
export function openWhatsAppChat(phone: string, message: string): void {
  const cleaned = cleanIraqiPhoneNumber(phone);
  if (!cleaned) {
    alert('Telefone / Celular por  Registrar não realizado!');
    return;
  }
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${cleaned}?text=${encoded}`;
  window.open(url, '_blank');
}
