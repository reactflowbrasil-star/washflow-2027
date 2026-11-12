'use client';

import React, { useRef, useState } from 'react';
import { AppSettings, ServiceItem, VehicleSize, Branch } from '@/types';
import {
  getSavedSetupItems,
  saveSetupItems,
  getSavedExpenses,
  saveExpenses,
  getSavedServices,
  saveServices,
  getSavedVehicles,
  saveVehicles,
  getSavedStaff,
  saveStaff,
  getSavedSettings,
  saveSettings,
  getSavedRoadmap,
  saveRoadmap,
  getSavedInventory,
  saveInventory,
  formatR$,
  normalizeDigits,
  seedRealisticDemoData,
  resetToCleanProduction,
} from '@/lib/storage';
import { defaultSettings } from '@/constants/initialData';
import { BackupManagerModal } from '@/components/ui/BackupManagerModal';
import { sendTelegramMessage } from '@/lib/telegram';
import {
  Settings,
  Shield,
  Sparkles,
  Download,
  Upload,
  FileSpreadsheet,
  Globe,
  Database,
  CheckCircle2,
  AlertCircle,
  Building2,
  Droplets,
  Coins,
  Car,
  Plus,
  Trash2,
  Save,
  X,
  Clock,
  Printer,
  Phone,
  MapPin,
  RotateCcw,
  KeyRound,
  Percent,
  MessageSquare,
  Layers,
  Lock,
  Eye,
  Check,
  AlertTriangle,
  FileText,
  Sun,
  Moon,
  Palette,
  Laptop,
  DollarSign,
  Zap,
} from 'lucide-react';

interface SettingsModuleProps {
  settings: AppSettings;
  services?: ServiceItem[];
  branches?: Branch[];
  onUpdateBranches?: (branches: Branch[]) => void;
  onUpdateSettings: (settings: AppSettings) => void;
  onUpdateServices?: (services: ServiceItem[]) => void;
  onNotify: (msg: string) => void;
  onDataImported?: () => void;
  currentTheme?: 'light' | 'dark';
  onToggleTheme?: (theme?: 'light' | 'dark') => void;
  onNavigateTab?: (tab: string) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  settings,
  services = [],
  branches = [],
  onUpdateBranches,
  onUpdateSettings,
  onUpdateServices,
  onNotify,
  onDataImported,
  currentTheme = 'light',
  onToggleTheme,
  onNavigateTab,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active Tab in Settings
  const [activeTab, setActiveTab] = useState<
    'identity' | 'receipt' | 'bays' | 'rent_costs' | 'pricing' | 'loyalty' | 'backup' | 'appearance' | 'branches'
  >('identity');

  // Branch management local state
  const [localBranches, setLocalBranches] = useState<Branch[]>(branches);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [newBranchBays, setNewBranchBays] = useState(2);
  const [isAddingBranch, setIsAddingBranch] = useState(false);

  // Service Management State
  const [isAddingService, setIsAddingService] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<ServiceItem['category']>('Veículo');
  const [newServicePrice, setNewServicePrice] = useState<number>(10000);
  const [newServiceSedanPrice, setNewServiceSedanPrice] = useState<number>(10000);
  const [newServiceSuvPrice, setNewServiceSuvPrice] = useState<number>(15000);
  const [newServiceTruckPrice, setNewServiceTruckPrice] = useState<number>(20000);
  const [newServiceDuration, setNewServiceDuration] = useState<number>(30);
  const [newServiceDesc, setNewServiceDesc] = useState('');

  // Handle generic settings change
  const handleChange = (key: keyof AppSettings, value: any) => {
    let finalVal = value;
    if (
      typeof value === 'string' &&
      (key === 'monthlyRent' ||
        key === 'dailyUtilities' ||
        key === 'averageMaterialCostPerWash' ||
        key === 'washesNeededForFree' ||
        key === 'milestoneWashTarget' ||
        key === 'expiryDaysLimit' ||
        key === 'numberOfBays' ||
        key === 'dailyTargetCars' ||
        key === 'vipDiscountPercent')
    ) {
      finalVal = Number(normalizeDigits(value)) || 0;
    }
    const updated = { ...settings, [key]: finalVal };
    onUpdateSettings(updated);
  };

  // Service update handlers
  const handleServiceChange = (id: string, field: keyof ServiceItem, value: any) => {
    if (!onUpdateServices) return;
    let finalVal = value;
    if (field === 'price' || field === 'durationMinutes') {
      finalVal = Number(normalizeDigits(String(value))) || 0;
    }
    const updated = services.map((s) => (s.id === id ? { ...s, [field]: finalVal } : s));
    onUpdateServices(updated);
  };

  const handleServicePriceBySizeChange = (id: string, size: VehicleSize, value: number) => {
    if (!onUpdateServices) return;
    const updated = services.map((s) => {
      if (s.id === id) {
        const currentPrices = s.pricesBySize || { sedan: s.price, suv: s.price, truck: s.price };
        return {
          ...s,
          pricesBySize: {
            ...currentPrices,
            [size]: Number(normalizeDigits(String(value))) || 0,
          },
        };
      }
      return s;
    });
    onUpdateServices(updated);
  };

  const handleDeleteService = (id: string, name: string) => {
    if (!onUpdateServices) return;
    if (window.confirm(`deseja tem certeza em Excluir Serviço «${name}»`)) {
      const updated = services.filter((s) => s.id !== id);
      onUpdateServices(updated);
      onNotify(`Serviço «${name}» .`);
    }
  };

  const handleTestTelegram = async () => {
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      alert('Por favor acima / topoaté  (Bot Token)    (Chat ID) digite!');
      return;
    }
    const testMsg = `🤖 <b>atéAbrir para  - ${settings.carWashName}</b>\n\neste     entre sistema emque   100 por sucesso  dezHorário! ✨\n📅 Horário: ${new Date().toLocaleString('ku')}`;
    const res = await sendTelegramMessage(settings.telegramBotToken, settings.telegramChatId, testMsg);
    if (res.success) {
      alert('✅  até por sucesso para que !');
      onNotify('🤖  até para  .');
    } else {
      alert(`❌  : ${res.message}`);
    }
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateServices || !newServiceName.trim()) return;

    const baseP = Number(normalizeDigits(String(newServicePrice))) || 10000;
    const sedanP = Number(normalizeDigits(String(newServiceSedanPrice))) || baseP;
    const suvP = Number(normalizeDigits(String(newServiceSuvPrice))) || baseP + 5000;
    const truckP = Number(normalizeDigits(String(newServiceTruckPrice))) || baseP + 10000;
    const durationM = Number(normalizeDigits(String(newServiceDuration))) || 30;

    const newSrv: ServiceItem = {
      id: `srv-${Date.now()}`,
      name: newServiceName.trim(),
      category: newServiceCategory,
      unit:
        newServiceCategory === 'Lavagem Tapete'
          ? 'm² (²)'
          : newServiceCategory === 'Lavagem Estofado / Sofá'
          ? 'conjunto'
          : 'Veículo',
      price: baseP,
      pricesBySize:
        newServiceCategory === 'Veículo' || newServiceCategory === 'Polimento  Vitrificação / Nano cerâmica'
          ? {
              sedan: sedanP,
              suv: suvP,
              truck: truckP,
            }
          : undefined,
      description: newServiceDesc.trim() || 'Serviço Salvo com sucesso',
      durationMinutes: durationM,
    };

    onUpdateServices([...services, newSrv]);
    onNotify(`Serviço Novo «${newSrv.name}» adicionado com sucesso.`);

    setNewServiceName('');
    setNewServiceDesc('');
    setIsAddingService(false);
  };

  // 1. Export Complete Backup JSON
  const handleExportBackup = () => {
    const backupData = {
      system: 'Car Wash Management System',
      version: '2.5',
      exportedAt: new Date().toISOString(),
      carWashName: settings.carWashName,
      data: {
        setup: getSavedSetupItems(),
        expenses: getSavedExpenses(),
        services: getSavedServices(),
        vehicles: getSavedVehicles(),
        staff: getSavedStaff(),
        settings: getSavedSettings(),
        roadmap: getSavedRoadmap(),
        inventory: getSavedInventory(),
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('download', `carwash-backup-${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    onNotify('📁  aplicativo Concluído  (JSON) por sucesso .');
  };

  // 2. Import Backup JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.data) {
          alert('este em  aplicativo  este sistema não há!');
          return;
        }

        const confirmed = window.confirm(
          `deseja tem certeza em Buscar aplicativo «${parsed.carWashName || ''}» que em Data ${parsed.exportedAt || 'antes de'} dez\n\neste  Todos até até Novo dezHorário.`
        );

        if (confirmed) {
          if (Array.isArray(parsed.data.setup)) saveSetupItems(parsed.data.setup);
          if (Array.isArray(parsed.data.expenses)) saveExpenses(parsed.data.expenses);
          if (Array.isArray(parsed.data.services)) {
            saveServices(parsed.data.services);
            if (onUpdateServices) onUpdateServices(parsed.data.services);
          }
          if (Array.isArray(parsed.data.vehicles)) saveVehicles(parsed.data.vehicles);
          if (Array.isArray(parsed.data.staff)) saveStaff(parsed.data.staff);
          if (parsed.data.settings) {
            saveSettings(parsed.data.settings);
            onUpdateSettings(parsed.data.settings);
          }
          if (Array.isArray(parsed.data.roadmap)) saveRoadmap(parsed.data.roadmap);
          if (Array.isArray(parsed.data.inventory)) saveInventory(parsed.data.inventory);

          onNotify('✅ aplicativo por sucesso   Todos até Novo.');

          if (onDataImported) {
            onDataImported();
          } else {
            setTimeout(() => window.location.reload(), 1000);
          }
        }
      } catch {
        alert('Erroum em   aplicativo !');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
  };

  // 3. Export Financial Report to Excel/CSV with UTF-8 BOM
  const handleExportFinancialCSV = () => {
    const vehicles = getSavedVehicles();
    const expenses = getSavedExpenses();

    let totalRevenue = 0;
    let totalWashes = 0;
    const washRows: string[] = [];

    vehicles.forEach((v) => {
      const plate =
        v.plate.type === 'unified'
          ? `${v.plate.provinceCode || ''} | ${v.plate.letter || ''} ${v.plate.number || ''}`
          : `${v.plate.oldCityName || ''} / ${v.plate.oldNumber || ''}`;

      (v.washHistory || []).forEach((w) => {
        totalRevenue += w.price;
        totalWashes++;
        const dateStr = w.date ? new Date(w.date).toLocaleDateString('ku') : '';
        washRows.push(
          [
            `"${dateStr}"`,
            `"Faturamento Lavagem"`,
            `"${w.serviceName || 'Lavagem'}"`,
            `"${v.carModel || ''} (${v.color || ''})"`,
            `"${v.ownerName || ''}"`,
            `"${plate}"`,
            w.price,
            `"${w.isFree ? 'Grátis (Free)' : 'pago'}"`,
            `"${w.staffName || ''}"`,
          ].join(',')
        );
      });
    });

    const totalExpenseAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const expenseRows = expenses.map((e) => {
      const dateStr = e.date ? new Date(e.date).toLocaleDateString('ku') : '';
      return [
        `"${dateStr}"`,
        `"Despesa"`,
        `"${e.category}"`,
        `"${e.title}"`,
        `"-"`,
        `"-"`,
        `-${e.amount}`,
        `"Despesa lava-rápido"`,
        `"${e.notes || ''}"`,
      ].join(',');
    });

    const netProfit = totalRevenue - totalExpenseAmount;
    const BOM = '\uFEFF';
    const csvLines = [
      `"Relatório Geral   Histórico de Lavagem: ${settings.carWashName}"`,
      `"Data dez: ${new Date().toLocaleDateString('ku')}"`,
      `"Total Faturamento Lavagem: ${totalRevenue.toLocaleString()} R$ | Número Lavagens: ${totalWashes}"`,
      `"Total Geral Despesas: ${totalExpenseAmount.toLocaleString()} R$"`,
      `"Lucro  (Receita / Faturamento - Despesa): ${netProfit.toLocaleString()} R$"`,
      ``,
      `"Data","Tipo Registrar","Serviço / ","Veículo","Proprietário Veículo","Placa","Quantidade Valor (R$)","Status Pagamento","Profissional / Observações"`,
      ...washRows,
      ...expenseRows,
    ];

    const blob = new Blob([BOM + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `carwash-financial-report-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    onNotify('📊 Relatório  por  Excel / CSV por.');
  };

  // 4. Reset Settings to Default
  const handleResetSettings = () => {
    const masterPin = settings.adminPin || '9999';
    const enteredPin = prompt('⚠️ para Buscar Configurações para Status acima / topoaté Por favor UF segredo / PIN Administrador (Admin Master PIN) digite:');
    if (enteredPin === null) return;

    if (normalizeDigits(enteredPin.trim()) !== normalizeDigits(masterPin.trim())) {
      alert('❌ UF segredo / PIN Administrador Erro! que .');
      return;
    }

    if (window.confirm('deseja por Concluído tem certeza em Buscar Configurações para  acima / topoaté ')) {
      onUpdateSettings(defaultSettings);
      saveSettings(defaultSettings);
      onNotify('Configurações  para  .');
    }
  };

  // 5. Seed Realistic Demo Financial Data
  const handleSeedDemoData = () => {
    const masterPin = settings.adminPin || '9999';
    const enteredPin = prompt('⚠️ para Dar Entrada até exemplo Por favor UF segredo / PIN Administrador (Admin Master PIN) digite:');
    if (enteredPin === null) return;

    if (normalizeDigits(enteredPin.trim()) !== normalizeDigits(masterPin.trim())) {
      alert('❌ UF segredo / PIN Administrador Erro! que .');
      return;
    }

    if (window.confirm('deseja tem certeza em Dar Entrada até exemplo  Todos Veículo Histórico de Lavagem  Despesas Novo dezAluguel / Comercial para atéAbrir Lucro  Prejuízo.')) {
      seedRealisticDemoData();
      if (onDataImported) onDataImported();
      onNotify('📊 até exemplo  por sucesso .');
    }
  };

  // 6. Clean Production Reset (Abrir Concluído até  para Iniciar  lava-rápido )
  const handleCleanProductionReset = () => {
    const masterPin = settings.adminPin || '9999';
    const enteredPin = prompt('⚠️ para Abrir Concluído sistema para Iniciar  lava-rápido  Por favor UF segredo / PIN Administrador (Admin Master PIN) digite:');
    if (enteredPin === null) return;

    if (normalizeDigits(enteredPin.trim()) !== normalizeDigits(masterPin.trim())) {
      alert('❌ UF segredo / PIN Administrador Erro! que .');
      return;
    }

    if (window.confirm('deseja por Concluído tem certeza em Abrir Concluído Veículos Placa  Histórico de Lavagem  Vendas  Despesas este Concluído até atéAbrir dez  sistemaque por  para Iniciar dias que lava-rápido dez dezHorário.')) {
      resetToCleanProduction();
      if (onDataImported) onDataImported();
      onNotify('✨ sistemaque por sucesso    Pronto para por  em lava-rápido.');
    }
  };

  // Calculations for Overheads Insight
  const monthlyRent = Number(settings.monthlyRent) || 600000;
  const dailyRent = Math.round(monthlyRent / 30);
  const dailyUtilities = Number(settings.dailyUtilities) || 12000;
  const averageMaterialCost = Number(settings.averageMaterialCostPerWash) || 1500;
  const dailyFixedCosts = dailyRent + dailyUtilities;
  const avgWashPrice = 10000;
  const marginPerWash = Math.max(1000, avgWashPrice - averageMaterialCost);
  const breakEvenCarsPerDay = Math.ceil(dailyFixedCosts / marginPerWash);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in select-none" dir="ltr">
      {/* ---------------- TOP MASTER HEADER ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Antiga  Configuração Geralum sistema
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              por Concluído informaçõesum lava-rápido Recibo Impressão Boxes de Lavagem Fidelidade Preço / Valor   até.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => onNotify('✅ Todos Configurações por sucesso depois deque .')}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
        </div>
      </div>

      {/* ---------------- NAVIGATION TABS BAR ---------------- */}
      <div className="flex items-center gap-2 overflow-x-auto p-2 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        {[
          { id: 'identity', label: '1. informações   lava-rápido', icon: Sparkles, color: 'text-indigo-600' },
          { id: 'receipt', label: '2. Recibo Impressão  ', icon: Printer, color: 'text-sky-600' },
          { id: 'bays', label: '3. Boxes de Lavagem Lavagem  ', icon: Layers, color: 'text-cyan-600' },
          { id: 'rent_costs', label: '4. Aluguel / Comercial  Despesa ', icon: Building2, color: 'text-amber-600' },
          { id: 'pricing', label: `5. Editar Preço / Valor (${services.length})`, icon: Car, color: 'text-emerald-600' },
          { id: 'loyalty', label: '6. Fidelidade PIN  ', icon: Shield, color: 'text-purple-600' },
          { id: 'backup', label: '7. aplicativo  dez Excel', icon: Database, color: 'text-rose-600' },
          { id: 'appearance', label: '8. Método dezque (Theme)', icon: Palette, color: 'text-amber-500' },
          { id: 'branches', label: '9. por Filial (Unidade 1  2)', icon: Building2, color: 'text-indigo-600' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm border border-slate-200 dark:border-slate-600 ring-1 ring-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/60 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600 dark:text-blue-300' : tab.color}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* 1. IDENTITY & BRANDING (informações   emque)             */}
      {/* ============================================================== */}
      {activeTab === 'identity' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs text-xs text-slate-900 dark:text-white">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">informações Oficial   local / vaga (Brand & Identity)</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                este informaçõesou em acima / topo os recibos    até Cliente  dez.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-bold block text-xs">Nome Oficial emque (Car Wash Name):</label>
              <input
                type="text"
                value={settings.carWashName}
                onChange={(e) => handleChange('carWashName', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-bold block text-xs"> ou  (Slogan):</label>
              <input
                type="text"
                placeholder="exemplo: Limpo e Inspecionado o Veículo confiança "
                value={settings.carWashSlogan || ''}
                onChange={(e) => handleChange('carWashSlogan', e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-bold block text-xs flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Número em / :
              </label>
              <input
                type="text"
                value={settings.carWashPhone}
                onChange={(e) => handleChange('carWashPhone', e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-bold block text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Horário  Diário (Business Hours):
              </label>
              <input
                type="text"
                placeholder="08:00 AM - 10:00 PM"
                value={settings.businessHours || '08:00 AM - 10:00 PM'}
                onChange={(e) => handleChange('businessHours', e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-xs"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-bold block text-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Nome  emque:
              </label>
              <input
                type="text"
                value={settings.carWashAddress}
                onChange={(e) => handleChange('carWashAddress', e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-xs"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-bold block text-xs flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Link  ou até Cliente (System Web URL):
              </label>
              <input
                type="text"
                placeholder="como: https://royalcarwash.com ( poraté sem por Link Totalque dez)"
                value={settings.systemUrl || ''}
                onChange={(e) => handleChange('systemUrl', e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                este Link ao vivo / tempo real vai para Nome   para Cliente até em Telefone / Celular Status o Veículo .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. RECEIPT & PRINTER SETTINGS (Recibo Impressão  )            */}
      {/* ============================================================== */}
      {activeTab === 'receipt' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs text-xs text-slate-900 dark:text-white">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Configuração Recibo Impressão   (POS Thermal Receipt)</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Grátis (Fidelidade) Porte  Observaçõesum   Método Impressão o recibo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Options */}
            <div className="space-y-4">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1 text-xs">Porte    (Thermal Paper):</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '80mm', label: '80mm (até Caixa)' },
                    { id: '58mm', label: '58mm ()' },
                  ].map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => handleChange('receiptPrinterSize', size.id)}
                      className={`p-3 rounded-xl border font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                        (settings.receiptPrinterSize || '80mm') === size.id
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Printer className="w-4 h-4" />
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-bold block text-xs">
                  Observações   Totalaté Recibo / Comprovante (Footer Guarantee Note):
                </label>
                <textarea
                  rows={3}
                  value={settings.receiptFooterNote || ''}
                  onChange={(e) => handleChange('receiptFooterNote', e.target.value)}
                  placeholder="como: obrigado para acima / topounid.que! prazo de garantia 24 Horário em Horário dia de chuva por  Recibo / Comprovante."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 leading-relaxed"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-700 dark:text-slate-300 font-medium"> Nome Profissional emacima / topo Recibo / Comprovante:</span>
                  <input
                    type="checkbox"
                    checked={settings.showStaffOnReceipt !== false}
                    onChange={(e) => handleChange('showStaffOnReceipt', e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Imprimir  Recibo / Comprovante (Auto-Print on Pay):</span>
                  <input
                    type="checkbox"
                    checked={settings.autoPrintReceipt !== false}
                    onChange={(e) => handleChange('autoPrintReceipt', e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Live Mini Preview of Ticket (Keeps white paper card for authentic receipt display) */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl space-y-3">
              <span className="text-slate-700 dark:text-slate-300 font-bold block text-[11px] flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                antes deVisualização de Método Recibo / Comprovante emacima / topo  (Live Preview):
              </span>

              <div className="bg-white text-slate-900 p-4 rounded-xl font-mono text-[11px] space-y-2 border-2 border-dashed border-slate-300 max-w-[260px] mx-auto text-center shadow-md">
                <div className="border-b border-dashed border-slate-300 pb-2">
                  <h4 className="font-black text-xs font-sans">{settings.carWashName}</h4>
                  {settings.carWashSlogan && (
                    <p className="text-[9px] text-slate-500 italic font-sans">{settings.carWashSlogan}</p>
                  )}
                  <p className="text-[9px] text-slate-600 font-sans">{settings.carWashAddress}</p>
                  <p className="text-[9px] text-slate-600 font-mono">{settings.carWashPhone}</p>
                </div>

                <div className="py-1 border-b border-dashed border-slate-300 text-slate-800 font-sans text-right space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>Veículo:</span>
                    <span className="font-bold">Toyota Camry</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Serviço:</span>
                    <span className="font-bold text-emerald-700">Lavagem Concluído</span>
                  </div>
                  {settings.showStaffOnReceipt !== false && (
                    <div className="flex justify-between">
                      <span>Profissional:</span>
                      <span className="font-bold">Profissional </span>
                    </div>
                  )}
                </div>

                <div className="pt-1 text-[9px] text-slate-500 font-sans leading-tight">
                  <p className="font-bold text-slate-700">obrigado para acima / topounid.que!</p>
                  <p>{settings.receiptFooterNote || ' Limpo e Inspecionado por até dezque.'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. BAYS & OPERATIONS CAPACITY (Boxes de Lavagem Lavagem  )          */}
      {/* ============================================================== */}
      {activeTab === 'bays' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs text-xs text-slate-900 dark:text-white">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-200 dark:border-cyan-800">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Boxes de Lavagem Lavagem  Meta Diário (Bays & Capacity)</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Grátis (Fidelidade) Número Box Ativo  ou em  Caixa  em.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
              <label className="text-slate-700 dark:text-slate-300 font-bold block">Número Box Ativo (Active Bays):</label>
              <select
                value={settings.numberOfBays || 3}
                onChange={(e) => handleChange('numberOfBays', Number(e.target.value) || 3)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-blue-500"
              >
                <option value={1}>1 Box Lavagem</option>
                <option value={2}>2 Box Lavagem</option>
                <option value={3}>3 Box Lavagem (até)</option>
                <option value={4}>4 Box Lavagem</option>
                <option value={5}>5 Box Lavagem</option>
                <option value={6}>6 Box Lavagem</option>
              </select>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                em  Caixa    este Número em Box por ao vivo / tempo real pordez dez.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
              <label className="text-slate-700 dark:text-slate-300 font-bold block">Meta Lavagem Veículo Diário (Daily Target):</label>
              <input
                type="number"
                value={settings.dailyTargetCars || 35}
                onChange={(e) => handleChange('dailyTargetCars', Number(e.target.value) || 35)}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Dashboard  este Meta portraz para  acima / topoque que.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. RENT & OVERHEAD COSTS (conjunto  Aluguel / Comercial  Despesas)     */}
      {/* ============================================================== */}
      {activeTab === 'rent_costs' && (
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-6 space-y-6 shadow-xs text-xs relative overflow-hidden text-slate-900 dark:text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  conjunto  Aluguel / Comercial   (Baseline Rent & Overhead Estimates)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    conjunto acima / topoaté para     acima / topoque (Break-Even) Diário.
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-mono text-left">
              <span className="text-[9px] block text-amber-700 dark:text-amber-400 font-sans font-bold">Custo de  cada dias:</span>
              <strong className="text-sm font-black">{formatR$(dailyFixedCosts)}</strong>
            </div>
          </div>

          {/* Guidance Banner for Dynamic Monthly Fluctuations */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-950 dark:text-blue-200 font-bold">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-sm font-black">este Preço / Valor ou   Despesa Mensal em  Registrar dezAluguel / Comercial</span>
              </div>
              <p className="text-[11px] text-blue-800 dark:text-blue-300/90 leading-relaxed max-w-2xl">
                este Preço / Valor     <strong>«dez   acima / topoaté (Baseline)»</strong> para  emque  Necessário Diário  Veículo  até Prejuízo Horário antes de saída os recibos.
                <br />
                por <strong>Despesa   Todos Mês</strong> (como: por ou  Aluguel / Comercial Recibo eletricidade  Valor geradordez  compra atéque água) Mensal em por <strong>«Despesas (Expenses)»</strong> Registrar dezAluguel / Comercial  Dashboard porconforme Mês  ou dez.
              </p>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('expenses')}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shrink-0 transition flex items-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer text-xs"
              >
                <DollarSign className="w-4 h-4" />
                 para por Despesas
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Monthly Rent */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
              <label className="text-slate-700 dark:text-slate-300 block font-bold text-xs flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Valor de Mensal local / vaga -  (R$):
              </label>
              <input
                type="number"
                step="50000"
                value={settings.monthlyRent ?? 600000}
                onChange={(e) => handleChange('monthlyRent', Number(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
              />
              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Custo de Diário (por 1,070 ²):</span>
                <span className="text-amber-700 dark:text-amber-400 font-mono font-bold">{formatR$(dailyRent)}</span>
              </div>
            </div>

            {/* Daily Energy & Utilities */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
              <label className="text-slate-700 dark:text-slate-300 block font-bold text-xs flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Custo de Diário água  eletricidade  geradordez (dez):
              </label>
              <input
                type="number"
                step="1000"
                value={settings.dailyUtilities ?? 12000}
                onChange={(e) => handleChange('dailyUtilities', Number(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:border-blue-500"
              />
              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>dez Mensal:</span>
                <span className="text-blue-700 dark:text-blue-400 font-mono font-bold">{formatR$(dailyUtilities * 30)}</span>
              </div>
            </div>

            {/* Consumables Cost per Car */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
              <label className="text-slate-700 dark:text-slate-300 block font-bold text-xs flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Custo de Insumos / Produtos  shampoo para cada Veículoum:
              </label>
              <input
                type="number"
                step="250"
                value={settings.averageMaterialCostPerWash ?? 1500}
                onChange={(e) => handleChange('averageMaterialCostPerWash', Number(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
              />
              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Custo de Insumos / Produtos para 20 Veículo:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">{formatR$(averageMaterialCost * 20)}</span>
              </div>
            </div>
          </div>

          {/* Smart Financial Insight Card */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong> acima / topoque  (Break-Even):</strong> Necessário Diário por que{' '}
                <strong className="text-slate-900 dark:text-white text-xs font-bold">{breakEvenCarsPerDay} Veículo</strong>  para Azul Concluído Valor de local / vaga  água  eletricidade antes de  Lucro  dezHorário.
              </span>
            </div>
          </div>

          {/* Garage & Parking Settings */}
          <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                Configurações por Estacionamento / Pátio   (Garage Settings)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Capacity */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                   Estacionamento / Pátio (Número local / vaga):
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={settings.garageCapacity ?? 30}
                  onChange={(e) => handleChange('garageCapacity', Number(e.target.value) || 30)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                />
              </div>

              {/* Daily Rate */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                  Preço / Valor Profissional (Diário):
                </label>
                <input
                  type="number"
                  step="250"
                  value={settings.garageDailyRate ?? 1000}
                  onChange={(e) => handleChange('garageDailyRate', Number(e.target.value) || 1000)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                />
              </div>

              {/* Overnight Rate */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                  Preço / Valor Profissional ():
                </label>
                <input
                  type="number"
                  step="500"
                  value={settings.garageOvernightRate ?? 3000}
                  onChange={(e) => handleChange('garageOvernightRate', Number(e.target.value) || 3000)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                />
              </div>

              {/* Monthly Rate */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                  Preço / Valor por Mensal:
                </label>
                <input
                  type="number"
                  step="1000"
                  value={settings.garageMonthlyRate ?? 25000}
                  onChange={(e) => handleChange('garageMonthlyRate', Number(e.target.value) || 25000)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. SERVICES & PRICING MANAGEMENT (Editar Preço / Valor)            */}
      {/* ============================================================== */}
      {activeTab === 'pricing' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs text-xs text-slate-900 dark:text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Editar Preço / Valor Lavagem Veículo  Serviçoum ({services.length} Serviço)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Alterar Preço / Valor Lavagem porconforme Porte Veículo (  )  Horário .
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAddingService(!isAddingService)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 text-xs shadow-xs"
            >
              <Plus className="w-4 h-4" />
              {isAddingService ? 'Fechar ' : 'Adicionar Serviço Novo'}
            </button>
          </div>

          {/* Form: Add New Service */}
          {isAddingService && (
            <form onSubmit={handleAddService} className="p-5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Adicionar Serviço Novo
                </h4>
                <button type="button" onClick={() => setIsAddingService(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold block text-[11px]">Nome Serviço:</label>
                  <input
                    type="text"
                    required
                    placeholder="como: Lavagem VIP  Espuma"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold block text-[11px]"> / Tipo:</label>
                  <select
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  >
                    <option value="Veículo">Lavagem Veículo</option>
                    <option value="Polimento  Vitrificação / Nano cerâmica">Polimento  Vitrificação / Nano cerâmica</option>
                    <option value="Lavagem Tapete">Lavagem Tapete</option>
                    <option value="Lavagem Estofado / Sofá">Lavagem Estofado / Sofá</option>
                    <option value="Serviço ">Serviço </option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold block text-[11px]">Restante / Pendente Lavagem (Minutos):</label>
                  <input
                    type="number"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(Number(e.target.value) || 30)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              {/* Sized Pricing inputs */}
              {newServiceCategory === 'Veículo' || newServiceCategory === 'Polimento  Vitrificação / Nano cerâmica' ? (
                <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold block">Preço / Valor porconforme Porte Veículo (R$):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5"> ():</label>
                      <input
                        type="number"
                        step="1000"
                        value={newServiceSedanPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setNewServiceSedanPrice(val);
                          setNewServicePrice(val);
                        }}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5"> (SUV / 4x4):</label>
                      <input
                        type="number"
                        step="1000"
                        value={newServiceSuvPrice}
                        onChange={(e) => setNewServiceSuvPrice(Number(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Carga / :</label>
                      <input
                        type="number"
                        step="1000"
                        value={newServiceTruckPrice}
                        onChange={(e) => setNewServiceTruckPrice(Number(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold block text-[11px]">Preço / Valor  (R$):</label>
                  <input
                    type="number"
                    step="500"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold block text-[11px]">  Resumo Serviço:</label>
                <input
                  type="text"
                  placeholder="como: Espuma Vitrificação / Nano Chassi  Pneus / Rodas   para..."
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-xs shadow-xs"
              >
                Salvar / Registrar Serviço
              </button>
            </form>
          )}

          {/* List of Existing Services with Live Editing */}
          <div className="space-y-3">
            {services.map((srv) => {
              const hasSizes = !!srv.pricesBySize;
              return (
                <div
                  key={srv.id}
                  className="p-4 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-3 hover:border-slate-300 dark:hover:border-slate-600 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold">
                        {srv.category || 'Veículo'}
                      </span>
                      <input
                        type="text"
                        value={srv.name}
                        onChange={(e) => handleServiceChange(srv.id, 'name', e.target.value)}
                        className="bg-transparent text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:bg-white dark:focus:bg-slate-900 px-2 py-0.5 rounded border border-transparent focus:border-slate-300 dark:focus:border-slate-600"
                      />
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <input
                          type="number"
                          value={srv.durationMinutes || 30}
                          onChange={(e) => handleServiceChange(srv.id, 'durationMinutes', Number(e.target.value) || 30)}
                          className="w-12 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-center text-slate-900 dark:text-white font-mono text-xs"
                        />
                        <span>Minutos</span>
                      </div>

                      <button
                        onClick={() => handleDeleteService(srv.id, srv.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                        title="Excluir este Serviço"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Pricing Inputs */}
                  {hasSizes ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Veículo Ano (Sedan):</label>
                        <input
                          type="number"
                          step="1000"
                          value={srv.pricesBySize?.sedan ?? srv.price}
                          onChange={(e) => handleServicePriceBySizeChange(srv.id, 'sedan', Number(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Veículo por (SUV):</label>
                        <input
                          type="number"
                          step="1000"
                          value={srv.pricesBySize?.suv ?? srv.price + 5000}
                          onChange={(e) => handleServicePriceBySizeChange(srv.id, 'suv', Number(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5"> / Carga:</label>
                        <input
                          type="number"
                          step="1000"
                          value={srv.pricesBySize?.truck ?? srv.price + 10000}
                          onChange={(e) => handleServicePriceBySizeChange(srv.id, 'truck', Number(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Preço / Valor Serviço:</span>
                      <input
                        type="number"
                        step="500"
                        value={srv.price}
                        onChange={(e) => handleServiceChange(srv.id, 'price', Number(e.target.value) || 0)}
                        className="px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">R$ / {srv.unit || 'Veículo'}</span>
                    </div>
                  )}

                  <div>
                    <input
                      type="text"
                      placeholder=" ..."
                      value={srv.description || ''}
                      onChange={(e) => handleServiceChange(srv.id, 'description', e.target.value)}
                      className="w-full text-[11px] text-slate-600 dark:text-slate-300 bg-transparent border-b border-transparent focus:border-slate-300 dark:focus:border-slate-600 focus:outline-none py-1"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. LOYALTY, REWARDS, PIN & WHATSAPP (Fidelidade  )         */}
      {/* ============================================================== */}
      {activeTab === 'loyalty' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs text-xs text-slate-900 dark:text-white">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Regras Fidelidade recompensa   (Loyalty & Security)</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                 Lavagem Grátis Prazo de Validade   Totaldez segredo / PINum.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Staff PIN */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2">
              <label className="text-slate-700 dark:text-slate-300 font-bold block flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                UF segredo / PIN Caixa  até (Staff PIN):
              </label>
              <input
                type="text"
                maxLength={6}
                value={settings.staffPin}
                onChange={(e) => handleChange('staffPin', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 tracking-widest text-center"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                por em Horário  Tag / Adesivo NFC em até.
              </p>
            </div>

            {/* Admin PIN */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2">
              <label className="text-slate-700 dark:text-slate-300 font-bold block flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-500" />
                UF segredo / PIN Administrador (Admin Master PIN):
              </label>
              <input
                type="text"
                maxLength={6}
                value={settings.adminPin || '9999'}
                onChange={(e) => handleChange('adminPin', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-mono text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 tracking-widest text-center"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                para  em Editar Preço / Valor Lavagem  Configuração .
              </p>
            </div>

            {/* Expiry Days */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2">
              <label className="text-slate-700 dark:text-slate-300 font-bold block"> poracima / topo Fidelidade (dias):</label>
              <input
                type="number"
                value={settings.expiryDaysLimit}
                onChange={(e) => handleChange('expiryDaysLimit', Number(e.target.value) || 15)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                 Cliente  em Número dias acima / topo Horário Lavagem quequecomo poracima / topodez.
              </p>
            </div>

            {/* Washes for Free */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2">
              <label className="text-slate-700 dark:text-slate-300 font-bold block">Lavagem  para Lavagem Grátis:</label>
              <input
                type="number"
                value={settings.washesNeededForFree}
                onChange={(e) => handleChange('washesNeededForFree', Number(e.target.value) || 4)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                 4 : em 5 Lavagem Valor  (4+1 Grátis).
              </p>
            </div>

            {/* VIP Discount */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2">
              <label className="text-slate-700 dark:text-slate-300 font-bold block flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Desconto Particular por Cliente pordez (VIP Discount %):
              </label>
              <input
                type="number"
                value={settings.vipDiscountPercent || 10}
                onChange={(e) => handleChange('vipDiscountPercent', Number(e.target.value) || 0)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Desconto por   para    em 10  Lavado.
              </p>
            </div>

            {/* WhatsApp Integration Toggle */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl flex flex-col justify-between">
              <label className="text-slate-700 dark:text-slate-300 font-bold block flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Enviar Notificações via WhatsApp em Horário Concluído:
              </label>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 dark:text-slate-400 text-xs"> por  </span>
                <input
                  type="checkbox"
                  checked={settings.enableWhatsAppNotification !== false}
                  onChange={(e) => handleChange('enableWhatsAppNotification', e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Happy Hour Off-Peak Discounts Settings */}
            <div className="col-span-1 sm:col-span-2 p-5 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    ⚡
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      oferta / promoção Horário Dourado / Horário que acima / topounid. (Happy Hour / Off-Peak Discount)
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Desconto  em Horário um (para exemplo antes de ) para  Cliente  Abrir Boxes de Lavagem
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.happyHourEnabled || false}
                    onChange={(e) => handleChange('happyHourEnabled', e.target.checked)}
                    className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              {settings.happyHourEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-amber-200/60 dark:border-amber-800/40 animate-in fade-in">
                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Horário Início:</label>
                    <input
                      type="time"
                      value={settings.happyHourStart || '09:00'}
                      onChange={(e) => handleChange('happyHourStart', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Horário Totalaté:</label>
                    <input
                      type="time"
                      value={settings.happyHourEnd || '12:00'}
                      onChange={(e) => handleChange('happyHourEnd', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1"> Desconto (%):</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={settings.happyHourDiscountPercent || 15}
                        onChange={(e) => handleChange('happyHourDiscountPercent', Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Google Maps Review Booster & Owner Phone */}
            <div className="col-span-1 sm:col-span-2 p-5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold">
                  ⭐️
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    porAbrir Nome em Google Maps  Telefone / Celular Proprietário
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Cliente em Horário Lavagem  dez 5  dez acima / topo Google Maps emque
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1"> Google Maps emque:</label>
                  <input
                    type="url"
                    value={settings.googleMapsReviewUrl || ''}
                    onChange={(e) => handleChange('googleMapsReviewUrl', e.target.value)}
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                     que Cliente por clique vai para acima / topo   5 .
                  </p>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Telefone / Celular Particular Proprietário (para Relatório Z do Caixa-Report):</label>
                  <input
                    type="tel"
                    value={settings.ownerPhone || ''}
                    onChange={(e) => handleChange('ownerPhone', e.target.value)}
                    placeholder="0770 000 0000"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Resumo  Caixa / Cofre ao vivo / tempo real por  para este Número dez.
                  </p>
                </div>
              </div>
            </div>

            {/* VIP Unlimited Subscription Plans Pricing */}
            <div className="col-span-1 sm:col-span-2 p-5 bg-gradient-to-br from-purple-50 to-indigo-50/50 dark:from-purple-950/30 dark:to-indigo-950/20 border border-purple-200/80 dark:border-purple-800/60 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  👑
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    Preço / Valor  Assinatura VIP VIP Mensal (Unlimited Wash Subscriptions)
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Grátis (Fidelidade) Preço / Valor Vendas cartão Assinatura VIP Mensal  
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Preço / Valor  1 Mês (R$):</label>
                  <input
                    type="number"
                    value={settings.vipMonthlyPlanPrice || 50000}
                    onChange={(e) => handleChange('vipMonthlyPlanPrice', Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Preço / Valor  3 Mês ( - R$):</label>
                  <input
                    type="number"
                    value={settings.vipQuarterlyPlanPrice || 130000}
                    onChange={(e) => handleChange('vipQuarterlyPlanPrice', Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Telegram Bot Automated Owner Notification */}
            <div className="col-span-1 sm:col-span-2 p-5 bg-gradient-to-br from-sky-50 to-blue-50/50 dark:from-sky-950/30 dark:to-blue-950/20 border border-sky-200/80 dark:border-sky-800/60 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    🤖
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      para  para Enviar Relatório Diário Z (Telegram Auto-Report)
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Todos  em Horário Fechar  Relatório  ao vivo / tempo real vai para  Proprietário lava-rápido
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Ativo para:</span>
                  <input
                    type="checkbox"
                    checked={settings.telegramBotEnabled || false}
                    onChange={(e) => handleChange('telegramBotEnabled', e.target.checked)}
                    className="w-5 h-5 accent-sky-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              {settings.telegramBotEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                       para (Bot Token em @BotFather):
                    </label>
                    <input
                      type="text"
                      value={settings.telegramBotToken || ''}
                      onChange={(e) => handleChange('telegramBotToken', e.target.value)}
                      placeholder="123456789:ABCdefGHIjk-lmn..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                       para  em @BotFather receber.
                    </p>
                  </div>

                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                        (Chat ID ou que):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={settings.telegramChatId || ''}
                        onChange={(e) => handleChange('telegramChatId', e.target.value)}
                        placeholder="123456789 ou @channel_id"
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={handleTestTelegram}
                        className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        atéAbrir
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                        que em @userinfobot receber.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. BACKUP, RESTORE & DATA EXPORT (aplicativo  dez)       */}
      {/* ============================================================== */}
      {activeTab === 'backup' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs text-xs text-slate-900 dark:text-white">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white"> até aplicativo  dez (Backup & Data Protection)</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">para  Nenhum Horário Histórico de emque  em Horário  ou compra Total Novo.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowBackupModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition"
            >
              <Database className="w-4 h-4" />
              <span>dez - Excel  aplicativo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export JSON */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-3 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-xs block flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  1.   Concluído aplicativo (JSON):
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Todos Veículos Histórico de Lavagem Lavadores / Equipe  Despesa  Configurações em um  protegido dez.
                </p>
              </div>
              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
              >
                <Download className="w-4 h-4" />
                 aplicativo Concluído (JSON)
              </button>
            </div>

            {/* Import JSON */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-3 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-xs block flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  2. Buscar aplicativo em  (Restore):
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                   Total  ou    aplicativoque abaixo / sob até Todos até como ou .
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
              >
                <Upload className="w-4 h-4" />
                Buscar aplicativo em 
              </button>
            </div>
          </div>

          {/* Financial Excel / CSV Export */}
          <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                dez Relatório  para Excel / CSV
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Relatório Geral   em Todos Lavagens Receita / Faturamento  Despesas para    por  .
              </p>
            </div>
            <button
              onClick={handleExportFinancialCSV}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-xs"
            >
              <Download className="w-4 h-4" />
                Excel
            </button>
          </div>

          {/* Fresh Production Reset Card */}
          <div className="p-5 bg-gradient-to-r from-emerald-50/90 to-teal-50/90 dark:from-emerald-950/40 dark:to-teal-950/40 border-2 border-emerald-300 dark:border-emerald-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-bold text-emerald-950 dark:text-emerald-200 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Abrir  dez para lava-rápido  (Fresh Production Reset)
              </span>
              <p className="text-[11px] text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed">
                Excluir Concluído Veículos Placa  Histórico de Lavagem atéAbrir  Despesas. este sistemaque dezHorário Status Branco (Clean Slate) para  emque dez por Salvar / Registrar Cliente  Faturamento   Horário porsem  Preço / Valor  Serviçoum .
              </p>
            </div>
            <button
              onClick={handleCleanProductionReset}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-sm cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Abrir para lava-rápido 
            </button>
          </div>

          {/* Demo Data Seeder */}
          <div className="p-5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/90 dark:border-blue-800/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-bold text-blue-950 dark:text-blue-200 text-xs flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Dar Entrada até exemplo   Veículos (Demo Financial Data)
              </span>
              <p className="text-[11px] text-blue-900/80 dark:text-blue-300/80 leading-relaxed">
                Carregar / Upload   em 16 Veículo (São Paulo Campinas Santos que) Despesas Lavadores / Equipe  Lavagem 7 dias dois para  ao vivo / tempo real Lucro  Prejuízo.
              </p>
            </div>
            <button
              onClick={handleSeedDemoData}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Dar Entrada até exemplo
            </button>
          </div>

          {/* Factory Reset Danger Zone */}
          <div className="p-4 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <div>
                <span className="font-bold text-rose-900 dark:text-rose-200 block">Buscar Configurações para  acima / topoaté:</span>
                <span className="text-[10px] text-rose-700/80 dark:text-rose-300/70">este por  Configurações dez   Veículos .</span>
              </div>
            </div>
            <button
              onClick={handleResetSettings}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
               acima / topoaté
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. APPEARANCE & THEME (Método dezque   )              */}
      {/* ============================================================== */}
      {activeTab === 'appearance' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs text-xs text-slate-900 dark:text-white">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Método dezque    (Theme & Appearance)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Selecionar Status  (Light) ou até (Dark Mode) porconforme Horário   .
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Light Mode Card */}
            <div
              onClick={() => {
                if (onToggleTheme) onToggleTheme('light');
                handleChange('themeMode', 'light');
              }}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                currentTheme === 'light'
                  ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-500/20'
                  : 'border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                    <Sun className="w-6 h-6" />
                  </div>
                  {currentTheme === 'light' ? (
                    <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                      Ativo
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400">Ativo</span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">☀️ Status  (Light Mode)</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        com Cor Branco    para  em dias em Box antes de lava-rápido.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                  currentTheme === 'light'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Sun className="w-4 h-4" />
                {currentTheme === 'light' ? 'Status Selecionado' : 'Alterar para Status '}
              </button>
            </div>

            {/* Dark Mode Card */}
            <div
              onClick={() => {
                if (onToggleTheme) onToggleTheme('dark');
                handleChange('themeMode', 'dark');
              }}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                currentTheme === 'dark'
                  ? 'border-indigo-500 bg-slate-900 dark:bg-slate-800 text-white shadow-md ring-2 ring-indigo-500/30'
                  : 'border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-900/60 text-indigo-400 flex items-center justify-center shadow-xs border border-indigo-700/40">
                    <Moon className="w-6 h-6" />
                  </div>
                  {currentTheme === 'dark' ? (
                    <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                      Ativo
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400">Ativo</span>
                  )}
                </div>

                <div>
                  <h4 className={`font-bold text-sm ${currentTheme === 'dark' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    🌙 Status até (Dark Mode)
                  </h4>
                  <p className={`text-[11px] mt-1 leading-relaxed ${currentTheme === 'dark' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>
                        para  queAbrir Detalhes   dois  em   Salvar  .
                  </p>
                </div>
              </div>

              <button
                type="button"
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                  currentTheme === 'dark'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600'
                }`}
              >
                <Moon className="w-4 h-4" />
                {currentTheme === 'dark' ? 'Status Selecionado' : 'Alterar para Status até'}
              </button>
            </div>
          </div>

          {/* Quick Info Alert */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
            <span>
              <strong>Observações:</strong> você pode em cada local / vaga  por clique emacima / topo  /Mês (☀️/🌙) em acima / topo que ao vivo / tempo real Statusque  sem   Horário sem Nome este Configuração.
            </span>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. BRANCHES MANAGEMENT (por Filial: Unidade 1  Unidade 2)      */}
      {/* ============================================================== */}
      {activeTab === 'branches' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs text-xs text-slate-900 dark:text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  sistema  Unidade (Multi-Branch Management)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  por Filial lava-rápido dez em Cidadeque por até um  Recibo 
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingBranch(!isAddingBranch)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingBranch ? 'Fechar ' : 'Adicionar Filial Novo'}</span>
            </button>
          </div>

          {/* New Branch Form */}
          {isAddingBranch && (
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800/80 space-y-3 animate-fade-in">
              <h4 className="font-black text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Salvar / Registrar Unidade Novo para </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome Filial:</label>
                  <input
                    type="text"
                    placeholder="exemplo: Unidade 3 (Goiás)"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">UF :</label>
                  <input
                    type="text"
                    placeholder="exemplo: B3"
                    value={newBranchCode}
                    onChange={(e) => setNewBranchCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Número Boxes de Lavagem:</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={newBranchBays}
                    onChange={(e) => setNewBranchBays(Math.max(1, Math.min(6, Number(e.target.value) || 2)))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-xs text-center"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Telefone / Celular:</label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={newBranchPhone}
                    onChange={(e) => setNewBranchPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome Filial:</label>
                <input
                  type="text"
                  placeholder="São Paulo - ..."
                  value={newBranchAddress}
                  onChange={(e) => setNewBranchAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingBranch(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newBranchName.trim()) {
                      onNotify('Por favor Nome Filial digite.');
                      return;
                    }
                    const newBranch: Branch = {
                      id: `branch-${Date.now()}`,
                      name: newBranchName.trim(),
                      code: newBranchCode.trim() || `B${localBranches.length + 1}`,
                      address: newBranchAddress.trim() || settings.carWashAddress,
                      phone: newBranchPhone.trim() || settings.carWashPhone,
                      numberOfBays: newBranchBays,
                      isMain: false,
                    };
                    const updated = [...localBranches, newBranch];
                    setLocalBranches(updated);
                    if (onUpdateBranches) onUpdateBranches(updated);
                    setIsAddingBranch(false);
                    setNewBranchName('');
                    setNewBranchCode('');
                    setNewBranchAddress('');
                    setNewBranchPhone('');
                    onNotify(`🎉 Unidade «${newBranch.name}» adicionado com sucesso!`);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Salvar / Registrar Filial
                </button>
              </div>
            </div>
          )}

          {/* Current Branches List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localBranches.map((branch, index) => (
              <div
                key={branch.id}
                className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                  branch.isMain
                    ? 'bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-xs">
                      {branch.code || `B${index + 1}`}
                    </span>
                    <strong className="text-sm font-black text-slate-900 dark:text-white">
                      {branch.name}
                    </strong>
                    {branch.isMain && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-300">
                        Unidade Principal
                      </span>
                    )}
                  </div>

                  {localBranches.length > 1 && !branch.isMain && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = localBranches.filter((b) => b.id !== branch.id);
                        setLocalBranches(updated);
                        if (onUpdateBranches) onUpdateBranches(updated);
                        onNotify(`Unidade «${branch.name}» .`);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition"
                      title="Excluir este Filial"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">Nome Filial:</label>
                    <input
                      type="text"
                      value={branch.name}
                      onChange={(e) => {
                        const updated = localBranches.map((b) =>
                          b.id === branch.id ? { ...b, name: e.target.value } : b
                        );
                        setLocalBranches(updated);
                      }}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">Boxes de Lavagem Lavagem:</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={branch.numberOfBays}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(6, Number(e.target.value) || 2));
                        const updated = localBranches.map((b) =>
                          b.id === branch.id ? { ...b, numberOfBays: val } : b
                        );
                        setLocalBranches(updated);
                      }}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 font-bold font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">Telefone / Celular Filial:</label>
                    <input
                      type="text"
                      value={branch.phone}
                      onChange={(e) => {
                        const updated = localBranches.map((b) =>
                          b.id === branch.id ? { ...b, phone: e.target.value } : b
                        );
                        setLocalBranches(updated);
                      }}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">Profissional por:</label>
                    <input
                      type="text"
                      placeholder="Nome Profissional..."
                      value={branch.managerName || ''}
                      onChange={(e) => {
                        const updated = localBranches.map((b) =>
                          b.id === branch.id ? { ...b, managerName: e.target.value } : b
                        );
                        setLocalBranches(updated);
                      }}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">Nome Recibo Impressão:</label>
                  <input
                    type="text"
                    value={branch.address}
                    onChange={(e) => {
                      const updated = localBranches.map((b) =>
                        b.id === branch.id ? { ...b, address: e.target.value } : b
                      );
                      setLocalBranches(updated);
                    }}
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 font-medium"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {!branch.isMain && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = localBranches.map((b) => ({
                          ...b,
                          isMain: b.id === branch.id,
                        }));
                        setLocalBranches(updated);
                        if (onUpdateBranches) onUpdateBranches(updated);
                        onNotify(`«${branch.name}» como Unidade Principal Grátis (Fidelidade).`);
                      }}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                    >
                      Grátis (Fidelidade) como Unidade Principal
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateBranches) onUpdateBranches(localBranches);
                      onNotify(`um «${branch.name}» depois deque .`);
                    }}
                    className="mr-auto px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backup & Data Hub Modal */}
      {showBackupModal && (
        <BackupManagerModal
          settings={settings}
          onClose={() => setShowBackupModal(false)}
          onDataRestored={onDataImported}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};
