import { DailyZReport, AppSettings } from '@/types';
import { formatR$ } from './storage';

/**
 * Send an HTML-formatted message to Telegram using Bot API
 */
export async function sendTelegramMessage(
  token: string,
  chatId: string,
  htmlText: string
): Promise<{ success: boolean; message?: string }> {
  if (!token || !chatId) {
    return { success: false, message: ' ou   Grátis (Fidelidade) não realizado.' };
  }

  try {
    const url = `https://api.telegram.org/bot${token.trim()}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: htmlText,
        parse_mode: 'HTML',
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return {
        success: false,
        message: data.description || 'Erro em Enviar  para ',
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Problema  por  ',
    };
  }
}

/**
 * Format a daily Z-report into a clean, luxury Kurdish Telegram notification
 */
export function formatDailyZReportTelegram(
  report: DailyZReport,
  settings: AppSettings
): string {
  const timestamp = new Date(report.closedAt || Date.now());
  const formattedTime = timestamp.toLocaleTimeString('ku', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const lines = [
    `📊 <b>Relatório Diário Z - ${settings.carWashName}</b>`,
    `📅 Data: <code>${report.date}</code> (Horário: ${formattedTime})`,
    `👤 Caixa / : <b>${report.closedBy || 'Caixa'}</b>`,
    `━━━━━━━━━━━━━━━━━━━`,
    `🚗 <b>Lavagem  Veículos:</b>`,
    `• Total Geral Veículo: <b>${report.totalCars}</b> unid.`,
    `• Lavagem Grátis (Free): <b>${report.freeWashesCount || 0}</b> unid.`,
    ``,
    `💰 <b>Receita / Faturamento  Método Recebimento:</b>`,
    `• Valor  (Cash): <b>${formatR$(report.cashTotal)}</b>`,
    `•   (FastPay): <b>${formatR$(report.fastpayTotal)}</b>`,
    `•  FIB: <b>${formatR$(report.fibTotal)}</b>`,
    `• Total Geral Receita / Faturamento: <b>${formatR$(report.totalRevenue)}</b>`,
    ``,
    `🏦 <b>   Fiado / Débito pendente:</b>`,
    `• Fiado / Débito pendente Nova Hoje: <b>${formatR$(report.newDebtTotal || report.debtTotal || 0)}</b>`,
    `• Fiado / Débito pendente  Hoje: <b>${formatR$(report.recoveredDebtTotal || 0)}</b>`,
    `•   : <b>${formatR$(report.actualCashCounted)}</b>`,
  ];

  if (report.discrepancy !== 0) {
    const diffText =
      report.discrepancy > 0
        ? `dez (+${formatR$(report.discrepancy)})`
        : ` (${formatR$(report.discrepancy)})`;
    lines.push(`⚠️ Diferença : <b>${diffText}</b>`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━`);
  lines.push(`💼 <b>recompensa Lavadores / Equipe:</b> <b>${formatR$(report.workerCommissionsTotal)}</b>`);

  if (report.notes) {
    lines.push(`📝 Observações: <i>${report.notes}</i>`);
  }

  lines.push(``);
  lines.push(`📍 <i>${settings.carWashAddress}</i>`);
  lines.push(`📱 sistema   lava-rápido`);

  return lines.join('\n');
}
