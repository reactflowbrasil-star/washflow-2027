'use client';

import React, { useRef, useState } from 'react';
import {
  getSavedVehicles,
  getSavedExpenses,
  getSavedSetupItems,
  getSavedStaff,
  getSavedServices,
  getSavedSettings,
  getSavedInventory,
  getSavedRoadmap,
  getSavedCafeItems,
  getSavedZReports,
  saveVehicles,
  saveExpenses,
  saveSetupItems,
  saveStaff,
  saveServices,
  saveSettings,
  saveInventory,
  saveRoadmap,
  saveCafeItems,
  saveZReports,
  formatR$,
} from '@/lib/storage';
import { AppSettings } from '@/types';
import {
  X,
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Car,
  DollarSign,
  PackageCheck,
  FileText,
  RefreshCw,
} from 'lucide-react';

interface BackupManagerModalProps {
  settings: AppSettings;
  onClose: () => void;
  onDataRestored?: () => void;
  onNotify: (msg: string) => void;
}

export const BackupManagerModal: React.FC<BackupManagerModalProps> = ({
  settings,
  onClose,
  onDataRestored,
  onNotify,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Helper to trigger file download
  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // 1. Export Full System JSON Backup
  const handleExportFullJson = () => {
    const backupData = {
      system: 'Car Wash Management System',
      version: '3.0',
      exportedAt: new Date().toISOString(),
      carWashName: settings.carWashName,
      data: {
        vehicles: getSavedVehicles(),
        expenses: getSavedExpenses(),
        inventory: getSavedInventory(),
        setup: getSavedSetupItems(),
        staff: getSavedStaff(),
        services: getSavedServices(),
        settings: getSavedSettings(),
        roadmap: getSavedRoadmap(),
        cafeItems: getSavedCafeItems(),
        zreports: getSavedZReports(),
      },
    };

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `carwash-backup-${dateStr}.json`;
    downloadFile(JSON.stringify(backupData, null, 2), fileName, 'application/json');
    onNotify('📁  aplicativo Concluído  por sucesso .');
  };

  // 2. Import and Restore JSON Backup
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.data) {
          alert('este em  aplicativo  este sistema não há!');
          setIsRestoring(false);
          return;
        }

        const dateStr = parsed.exportedAt
          ? new Date(parsed.exportedAt).toLocaleDateString('ku')
          : 'antes de';
        const confirmed = window.confirm(
          `deseja tem certeza em Buscar aplicativo «${
            parsed.carWashName || ''
          }» que em Data ${dateStr} dez\n\neste  Todos até até Novo dezHorário por em.`
        );

        if (confirmed) {
          if (Array.isArray(parsed.data.vehicles)) saveVehicles(parsed.data.vehicles);
          if (Array.isArray(parsed.data.expenses)) saveExpenses(parsed.data.expenses);
          if (Array.isArray(parsed.data.inventory)) saveInventory(parsed.data.inventory);
          if (Array.isArray(parsed.data.setup)) saveSetupItems(parsed.data.setup);
          if (Array.isArray(parsed.data.staff)) saveStaff(parsed.data.staff);
          if (Array.isArray(parsed.data.services)) saveServices(parsed.data.services);
          if (parsed.data.settings) saveSettings(parsed.data.settings);
          if (Array.isArray(parsed.data.roadmap)) saveRoadmap(parsed.data.roadmap);
          if (Array.isArray(parsed.data.cafeItems)) saveCafeItems(parsed.data.cafeItems);
          if (Array.isArray(parsed.data.zreports)) saveZReports(parsed.data.zreports);

          onNotify('✅ aplicativo por sucesso   Todos por Novo.');
          if (onDataRestored) {
            onDataRestored();
          } else {
            setTimeout(() => window.location.reload(), 1000);
          }
          onClose();
        }
      } catch (err) {
        alert('Erroum em   aplicativo !');
      } finally {
        setIsRestoring(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
  };

  // 3. Export CSV: Washes History
  const handleExportWashesCSV = () => {
    const vehicles = getSavedVehicles();
    const rows: string[] = [];
    const BOM = '\uFEFF';

    vehicles.forEach((v) => {
      const plate =
        v.plate.type === 'unified'
          ? `${v.plate.provinceCode || ''} | ${v.plate.letter || ''} ${v.plate.number || ''}`
          : `${v.plate.oldCityName || ''} / ${v.plate.oldNumber || ''}`;

      (v.washHistory || []).forEach((w) => {
        const dateStr = w.date ? new Date(w.date).toLocaleDateString('ku') : '';
        rows.push(
          [
            `"${dateStr}"`,
            `"${w.serviceName || 'Lavagem'}"`,
            `"${v.carModel || ''} (${v.color || ''})"`,
            `"${plate}"`,
            `"${v.ownerName || ''}"`,
            `"${v.phone || ''}"`,
            w.price,
            `"${w.isFree ? 'Grátis (Free)' : 'Valor'}"`,
            `"${w.paymentMethod || 'cash'}"`,
            `"${w.paymentStatus === 'unpaid' ? 'Fiado / Débito pendente' : 'pago'}"`,
            `"${w.staffName || ''}"`,
            `"${w.discountReason || ''}"`,
          ].join(',')
        );
      });
    });

    const csvContent =
      BOM +
      [
        `"Histórico de Lavagem Veículos - ${settings.carWashName}"`,
        `"Data","Serviço","Modelo Veículo","Placa","Proprietário Veículo","em","Preço / Valor (R$)","Grátis","Método Pagamento","Status Valor","Profissional que","Desconto"`,
        ...rows,
      ].join('\r\n');

    downloadFile(
      csvContent,
      `washes-${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv;charset=utf-8;'
    );
    onNotify('📊   Lavagens (washes.csv) .');
  };

  // 4. Export CSV: Registered Vehicles & Loyalty
  const handleExportVehiclesCSV = () => {
    const vehicles = getSavedVehicles();
    const BOM = '\uFEFF';
    const rows = vehicles.map((v) => {
      const plate =
        v.plate.type === 'unified'
          ? `${v.plate.provinceCode || ''} | ${v.plate.letter || ''} ${v.plate.number || ''}`
          : `${v.plate.oldCityName || ''} / ${v.plate.oldNumber || ''}`;
      const lastVisit = v.lastVisitDate ? new Date(v.lastVisitDate).toLocaleDateString('ku') : '';
      const regDate = v.registeredDate ? new Date(v.registeredDate).toLocaleDateString('ku') : '';

      return [
        `"${v.ownerName}"`,
        `"${v.phone || ''}"`,
        `"${v.carModel}"`,
        `"${v.color}"`,
        `"${plate}"`,
        v.totalWashes,
        v.currentCycleWashes,
        v.freeWashesClaimed,
        `"${v.status === 'active' ? 'Ativo' : 'poracima / topo'}"`,
        `"${lastVisit}"`,
        `"${regDate}"`,
      ].join(',');
    });

    const csvContent =
      BOM +
      [
        `" Veículo Salvo com sucessocomo  Fidelidade - ${settings.carWashName}"`,
        `"Proprietário Veículo","Telefone / Celular","Modelo","Cor","Placa","Total Lavagem","Lavagem este em","Lavagem Grátis ","Status","após acima / topo","Data Salvar / Registrar"`,
        ...rows,
      ].join('\r\n');

    downloadFile(
      csvContent,
      `vehicles-${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv;charset=utf-8;'
    );
    onNotify('🚗   Veículo Salvo com sucessocomo .');
  };

  // 5. Export CSV: Expenses & Petty Cash
  const handleExportExpensesCSV = () => {
    const expenses = getSavedExpenses();
    const BOM = '\uFEFF';
    const rows = expenses.map((e) => {
      const dateStr = e.date ? new Date(e.date).toLocaleDateString('ku') : '';
      return [
        `"${dateStr}"`,
        `"${e.title}"`,
        `"${e.category}"`,
        e.amount,
        `"${e.isPettyCash ? 'por (Caixa / Cofre)' : ''}"`,
        `"${e.paidTo || ''}"`,
        `"${e.notes || ''}"`,
      ].join(',');
    });

    const csvContent =
      BOM +
      [
        `" Despesas   Caixa / Cofre - ${settings.carWashName}"`,
        `"Data","Nome Despesa","","Quantidade Valor (R$)","Despesa Caixa / Cofre (Petty Cash)","pago por ","Observações"`,
        ...rows,
      ].join('\r\n');

    downloadFile(
      csvContent,
      `expenses-${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv;charset=utf-8;'
    );
    onNotify('💸   Despesas .');
  };

  // 6. Export CSV: Inventory & Chemicals
  const handleExportInventoryCSV = () => {
    const inventory = getSavedInventory();
    const BOM = '\uFEFF';
    const rows = inventory.map((item) => {
      const totalVal = (item.quantity || 0) * (item.costPerUnit || 0);
      const lastRestock = item.lastRestocked
        ? new Date(item.lastRestocked).toLocaleDateString('ku')
        : '';
      return [
        `"${item.name}"`,
        `"${item.category}"`,
        item.quantity,
        `"${item.unit}"`,
        item.costPerUnit,
        totalVal,
        item.minAlertLevel,
        `"${lastRestock}"`,
        `"${item.notes || ''}"`,
      ].join(',');
    });

    const csvContent =
      BOM +
      [
        `" Depósito / Estoque  Produtos Estoque - ${settings.carWashName}"`,
        `"Nome Insumos / Produtos","","Quantidade pordez","que","Custo de que (R$)","Total por ","Nível de Alerta","após Abrir","Observações"`,
        ...rows,
      ].join('\r\n');

    downloadFile(
      csvContent,
      `inventory-${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv;charset=utf-8;'
    );
    onNotify('📦   Estoque & Insumos .');
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl relative text-slate-900 dark:text-white my-auto animate-in fade-in zoom-in-95 duration-150"
        dir="ltr"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-bold">
              <Database className="w-5 h-5 text-indigo-700 dark:text-indigo-300" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                 aplicativo  dez até
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                aplicativo Concluído   dez  para Excel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Full System Backup & Restore */}
        <div className="space-y-2">
          <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            aplicativo Concluído  (Full System JSON):
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleExportFullJson}
              className="p-3 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl flex flex-col items-start gap-1 text-right transition active:scale-98 cursor-pointer"
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-800 dark:text-indigo-300">
                <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span> aplicativo (Download JSON)</span>
              </div>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                 Todos Veículos Despesa Depósito / Estoque  Configurações em um 
              </span>
            </button>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
                id="modal-restore-backup"
              />
              <label
                htmlFor="modal-restore-backup"
                className="p-3 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/80 rounded-2xl flex flex-col items-start gap-1 text-right transition cursor-pointer active:scale-98 h-full"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800 dark:text-amber-300">
                  <Upload className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Buscar aplicativo (Restore)</span>
                </div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400">
                  Abrir  aplicativo antes de emacima / topo este 
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: 1-Click Excel / CSV Exports */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            dez  para   (Excel UTF-8 CSV):
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            em Letra um por Concluído  sem  emNome   dezdez.
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Washes */}
            <button
              onClick={handleExportWashesCSV}
              className="p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-700 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2 text-right transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Car className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-slate-900 dark:text-white block truncate text-[11px]">
                  Lavagens (Washes)
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 block truncate">washes.csv</span>
              </div>
            </button>

            {/* Vehicles */}
            <button
              onClick={handleExportVehiclesCSV}
              className="p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2 text-right transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-slate-900 dark:text-white block truncate text-[11px]">
                  Veículo  Fidelidade
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 block truncate">vehicles.csv</span>
              </div>
            </button>

            {/* Expenses */}
            <button
              onClick={handleExportExpensesCSV}
              className="p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-700 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2 text-right transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-slate-900 dark:text-white block truncate text-[11px]">
                  Despesa  Caixa / Cofre
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 block truncate">expenses.csv</span>
              </div>
            </button>

            {/* Inventory */}
            <button
              onClick={handleExportInventoryCSV}
              className="p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:border-purple-300 dark:hover:border-purple-700 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2 text-right transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                <PackageCheck className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-slate-900 dark:text-white block truncate text-[11px]">
                  Depósito / Estoque  Insumos / Produtos
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 block truncate">inventory.csv</span>
              </div>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
