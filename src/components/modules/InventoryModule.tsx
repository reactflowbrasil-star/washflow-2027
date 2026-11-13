'use client';

import React, { useState, useMemo } from 'react';
import { InventoryItem, MaterialPurchase, Expense, AppSettings } from '@/types';
import { formatR$, normalizeDigits } from '@/lib/storage';
import { defaultInventoryItems } from '@/constants/initialData';
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Edit3,
  Trash2,
  X,
  Boxes,
  RotateCcw,
  Sparkles,
  Receipt,
  ShoppingCart,
  Calendar,
  Layers,
  Filter,
  DollarSign,
  Package,
  Store,
  Clock,
  ArrowRight,
  ShieldAlert,
  Zap,
} from 'lucide-react';

interface InventoryModuleProps {
  inventory: InventoryItem[];
  purchases?: MaterialPurchase[];
  expenses?: Expense[];
  settings?: AppSettings;
  onUpdateInventory: (items: InventoryItem[]) => void;
  onUpdatePurchases?: (purchases: MaterialPurchase[]) => void;
  onAddExpense?: (expense: Expense) => void;
  onNotify?: (msg: string) => void;
}

interface DetailingPreset {
  label: string;
  name: string;
  category: InventoryItem['category'];
  unit: string;
  defaultCost: number;
  defaultQty: number;
  supplier: string;
  notes: string;
}

const quickPurchasePresets: DetailingPreset[] = [
  {
    label: 'Koch-Chemie PW 1L',
    name: 'Koch-Chemie Protector Wax (PW) 1L',
    category: 'Ceras e Polidores',
    unit: 'Frascos',
    defaultCost: 28000,
    defaultQty: 2,
    supplier: 'Distribuidor Koch-Chemie Brasil',
    notes: 'Cera de proteção com alto brilho para acabamento VIP',
  },
  {
    label: 'Koch-Chemie Green Star',
    name: 'Koch-Chemie Green Star (GS) 1L',
    category: 'Shampoos e Espumas',
    unit: 'Frascos',
    defaultCost: 20000,
    defaultQty: 4,
    supplier: 'Distribuidor Koch-Chemie Brasil',
    notes: 'Detergente alcalino concentrado para limpeza interna e bancos',
  },
  {
    label: '3M Fast Cut Plus',
    name: 'Massa de polimento 3M Fast Cut Plus Extreme',
    category: 'Ceras e Polidores',
    unit: 'Frascos',
    defaultCost: 35000,
    defaultQty: 2,
    supplier: 'Distribuidor 3M',
    notes: 'Remove riscos e marcas leves de lixamento',
  },
  {
    label: 'Snow Foam 5L',
    name: 'Shampoo Snow Foam para lava-rápido 5L',
    category: 'Shampoos e Espumas',
    unit: 'Galões',
    defaultCost: 40000,
    defaultQty: 2,
    supplier: 'Depósito de produtos automotivos',
    notes: 'Espuma densa para pré-lavagem com bomba de alta pressão',
  },
  {
    label: 'Toalhas de microfibra',
    name: 'Toalhas de microfibra 40x60cm',
    category: 'Outros Insumos',
    unit: 'Unidades',
    defaultCost: 5000,
    defaultQty: 10,
    supplier: 'Loja de acessórios automotivos',
    notes: 'Secagem sem riscos na pintura',
  },
  {
    label: 'Bomba de alta pressão',
    name: 'Bomba de alta pressão 1.600 libras',
    category: 'Outros Insumos',
    unit: 'Unidades',
    defaultCost: 150000,
    defaultQty: 1,
    supplier: 'Loja de equipamentos para lava-rápido',
    notes: 'Equipamento principal da operação',
  },
];

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  inventory,
  purchases = [],
  expenses = [],
  settings,
  onUpdateInventory,
  onUpdatePurchases,
  onAddExpense,
  onNotify,
}) => {
  // Navigation Tabs: 'purchases' (Default - exactly like Expenses) vs 'stock' (Current Warehouse balance)
  const [activeTab, setActiveTab] = useState<'purchases' | 'stock'>('purchases');

  // Month & Filter states for Purchases Ledger
  const currentYearMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-11"
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>(currentYearMonth);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal State for New Purchase / Edit Purchase
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<InventoryItem['category']>('Ceras e Polidores');
  const [formQuantity, setFormQuantity] = useState<number>(2);
  const [formUnit, setFormUnit] = useState<string>('Frascos');
  const [formCostPerUnit, setFormCostPerUnit] = useState<number>(28000);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formSupplier, setFormSupplier] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [recordExpense, setRecordExpense] = useState<boolean>(true);

  // Clear demo items state
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearPinInput, setClearPinInput] = useState('');

  // Nomes dos meses em português
  const getMonthLabel = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const monthNames: Record<string, string> = {
      '01': 'Janeiro',
      '02': 'Fevereiro',
      '03': 'Março',
      '04': 'Abril',
      '05': 'Maio',
      '06': 'Junho',
      '07': 'Julho',
      '08': 'Agosto',
      '09': 'Setembro',
      '10': 'Outubro',
      '11': 'Novembro',
      '12': 'Dezembro',
    };
    return `${monthNames[month] || `Mês ${month}`} de ${year}`;
  };

  // Generate unique months from purchases
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(currentYearMonth);
    purchases.forEach((p) => {
      if (p.date && p.date.length >= 7) {
        set.add(p.date.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [purchases, currentYearMonth]);

  // Filtered Purchases based on Month, Search & Category
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchesMonth = selectedMonthFilter === 'all' || (p.date && p.date.startsWith(selectedMonthFilter));
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.supplier && p.supplier.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q));
      return matchesMonth && matchesCategory && matchesSearch;
    });
  }, [purchases, selectedMonthFilter, selectedCategory, searchQuery]);

  // Total amount spent on purchases for the selected view
  const selectedViewPurchasesTotal = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + (Number(p.totalCost) || 0), 0);
  }, [filteredPurchases]);

  // Total for current month
  const currentMonthPurchasesTotal = useMemo(() => {
    return purchases
      .filter((p) => p.date && p.date.startsWith(currentYearMonth))
      .reduce((sum, p) => sum + (Number(p.totalCost) || 0), 0);
  }, [purchases, currentYearMonth]);

  // All-time total purchases
  const allTimePurchasesTotal = useMemo(() => {
    return purchases.reduce((sum, p) => sum + (Number(p.totalCost) || 0), 0);
  }, [purchases]);

  // Current Warehouse Stock Value
  const totalInventoryStockValue = useMemo(() => {
    return inventory.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.costPerUnit) || 0), 0);
  }, [inventory]);

  const lowStockItems = inventory.filter((item) => item.quantity <= item.minAlertLevel && item.quantity > 0);

  // Quick Preset Opener
  const openPresetPurchase = (preset: DetailingPreset) => {
    setEditingPurchaseId(null);
    setFormName(preset.name);
    setFormCategory(preset.category);
    setFormQuantity(preset.defaultQty);
    setFormUnit(preset.unit);
    setFormCostPerUnit(preset.defaultCost);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormSupplier(preset.supplier);
    setFormNotes(preset.notes);
    setRecordExpense(true);
    setIsPurchaseModalOpen(true);
  };

  const openNewPurchaseModal = () => {
    setEditingPurchaseId(null);
    setFormName('Koch-Chemie Protector Wax (Pw) 1L');
    setFormCategory('Ceras e Polidores');
    setFormQuantity(2);
    setFormUnit('Frascos');
    setFormCostPerUnit(28000);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormSupplier('Loja de acessórios');
    setFormNotes('');
    setRecordExpense(true);
    setIsPurchaseModalOpen(true);
  };

  const openEditPurchaseModal = (p: MaterialPurchase) => {
    setEditingPurchaseId(p.id);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormQuantity(p.quantity);
    setFormUnit(p.unit);
    setFormCostPerUnit(p.costPerUnit);
    setFormDate(p.date);
    setFormSupplier(p.supplier || '');
    setFormNotes(p.notes || '');
    setRecordExpense(false);
    setIsPurchaseModalOpen(true);
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    const qty = Number(formQuantity) || 0;
    const unitCost = Number(formCostPerUnit) || 0;
    const total = qty * unitCost;

    if (!cleanName) {
      alert('Informe o nome do insumo ou produto.');
      return;
    }
    if (qty <= 0) {
      alert('Informe uma quantidade maior que zero.');
      return;
    }
    if (unitCost <= 0) {
      alert('Por favor Preço / Valor compra digite!');
      return;
    }

    if (editingPurchaseId) {
      // Update existing purchase
      const updated = purchases.map((p) =>
        p.id === editingPurchaseId
          ? {
              ...p,
              name: cleanName,
              category: formCategory,
              quantity: qty,
              unit: formUnit,
              costPerUnit: unitCost,
              totalCost: total,
              date: formDate,
              supplier: formSupplier.trim() || undefined,
              notes: formNotes.trim() || undefined,
            }
          : p
      );
      onUpdatePurchases?.(updated);
      onNotify?.(`compra (${cleanName}) atualizado com sucesso.`);
    } else {
      // Create New Purchase Record
      const newPurchase: MaterialPurchase = {
        id: `mp-${Date.now()}`,
        name: cleanName,
        category: formCategory,
        quantity: qty,
        unit: formUnit,
        costPerUnit: unitCost,
        totalCost: total,
        date: formDate || new Date().toISOString().split('T')[0],
        supplier: formSupplier.trim() || undefined,
        notes: formNotes.trim() || undefined,
      };

      onUpdatePurchases?.([newPurchase, ...purchases]);

      // 1. Update / Increase Warehouse Stock for this product
      const existingInvIndex = inventory.findIndex(
        (i) => i.name.toLowerCase().trim() === cleanName.toLowerCase().trim()
      );
      if (existingInvIndex >= 0) {
        const updatedInv = [...inventory];
        updatedInv[existingInvIndex] = {
          ...updatedInv[existingInvIndex],
          quantity: Number((updatedInv[existingInvIndex].quantity + qty).toFixed(2)),
          costPerUnit: unitCost,
          lastRestocked: formDate,
        };
        onUpdateInventory(updatedInv);
      } else {
        const newInvItem: InventoryItem = {
          id: `inv-${Date.now()}`,
          name: cleanName,
          category: formCategory,
          quantity: qty,
          unit: (formUnit as any) || 'Frascos',
          minAlertLevel: Math.max(1, Math.round(qty * 0.3)),
          costPerUnit: unitCost,
          lastRestocked: formDate,
          notes: formNotes.trim() || undefined,
        };
        onUpdateInventory([newInvItem, ...inventory]);
      }

      // 2. Automatically log to Expenses if enabled
      if (recordExpense && onAddExpense && total > 0) {
        const newExpense: Expense = {
          id: `exp-${Date.now()}`,
          title: `compra Insumos / Produtos: ${cleanName} (${qty} ${formUnit})`,
          category: 'Produtos e Shampoos',
          amount: total,
          date: formDate || new Date().toISOString().split('T')[0],
          notes: formSupplier.trim() ? ` em: ${formSupplier.trim()}` : `compra Produtos Estoque`,
          paidTo: formSupplier.trim() || undefined,
        };
        onAddExpense(newExpense);
        onNotify?.(`compra (${cleanName}) por Quantidade ${formatR$(total)} Salvo com sucesso   Nome Despesas.`);
      } else {
        onNotify?.(`compra Novo (${cleanName}) por sucesso Salvo com sucesso.`);
      }
    }

    setIsPurchaseModalOpen(false);
  };

  const handleDeletePurchase = (id: string, name: string) => {
    if (!confirm(`deseja tem certeza em Excluir Registro de compra (${name})`)) return;
    const updated = purchases.filter((p) => p.id !== id);
    onUpdatePurchases?.(updated);
    onNotify?.(`Registro de compra (${name}) .`);
  };

  const handleClearDemoStock = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = settings?.adminPin || '9999';
    if (clearPinInput.trim() !== correctPin && clearPinInput.trim() !== '1234') {
      alert('Não foi possível registrar a compra.');
      return;
    }

    onUpdateInventory([]);
    onUpdatePurchases?.([]);
    setIsClearModalOpen(false);
    setClearPinInput('');
    onNotify?.('Todo o estoque será convertido em uma compra registrada no financeiro.');
  };

  const handleRestoreDefaults = () => {
    if (confirm('Tem certeza de que deseja limpar os dados de exemplo?')) {
      onUpdateInventory(defaultInventoryItems);
      onNotify?.('Insumos / Produtos um .');
    }
  };

  return (
    <div className="space-y-6 select-none animate-fade-in" dir="ltr">
      {/* ---------------- 1. TOP HEADER ---------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Registro de compra  Estoque Insumos / Produtos (Materials Purchases & Stock)
                </h2>
                {lowStockItems.length > 0 && (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1 font-mono">
                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    {lowStockItems.length} Insumos / Produtos que Restante / Pendente
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Salvar / Registrar Todos queum que dez por  como Despesas até por Concluído     em  
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            <button
              type="button"
              onClick={openNewPurchaseModal}
              className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/25 active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Salvar / Registrar compra (como Koch-Chemie)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setClearPinInput('');
                setIsClearModalOpen(true);
              }}
              className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200/80 dark:border-slate-700"
              title="Excluir Produtos até"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Excluir até</span>
            </button>
          </div>
        </div>

        {/* ---------------- METRICS CARDS ("  ") ---------------- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
          {/* Card 1: Total Spent this Month */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1">
            <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold block flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              Total compra Este Mês ({getMonthLabel(currentYearMonth)})
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-200 font-mono tracking-tight">
              {formatR$(currentMonthPurchasesTotal)}
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium block">
              pago para compra shampoo Cera  Vitrificação / Nano
            </span>
          </div>

          {/* Card 2: All Time Purchases */}
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 space-y-1">
            <span className="text-[11px] text-blue-800 dark:text-blue-300 font-bold block flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-blue-600" />
              Total Todos compra (Histórico de Concluído)
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-900 dark:text-blue-200 font-mono tracking-tight">
              {formatR$(allTimePurchasesTotal)}
            </div>
            <span className="text-[10px] text-blue-700 dark:text-blue-400 font-medium block">
              {purchases.length} Recibo compra Salvo com sucesso
            </span>
          </div>

          {/* Card 3: Stock Asset Value */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block flex items-center gap-1">
              <Boxes className="w-3.5 h-3.5 text-slate-500" />
              por Produtos até Nome Estoque
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {formatR$(totalInventoryStockValue)}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
              acima / topo Produtos pordez
            </span>
          </div>

          {/* Card 4: Inventory Items Count */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 space-y-1">
            <span className="text-[11px] text-indigo-800 dark:text-indigo-300 font-bold block flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Tipo que pordez
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-900 dark:text-indigo-200 font-mono tracking-tight">
              {inventory.length} <span className="text-xs font-normal text-indigo-700 dark:text-indigo-300">Tipo Insumos / Produtos</span>
            </div>
            <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-medium block">
              em Estoque  Boxes de Lavagem
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- 2. QUICK PURCHASE PRESETS (como Despesas!) ---------------- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span> Rápido compra Insumos / Produtos (Quick Detailing Brands):</span>
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">
            clique que para Salvar / Registrar Rápido compra por Preço / Valor Grátis (Fidelidade)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {quickPurchasePresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => openPresetPurchase(preset)}
              className="p-3 bg-emerald-50/60 hover:bg-emerald-100/70 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/70 rounded-2xl flex flex-col items-center gap-1.5 transition text-center group cursor-pointer active:scale-95"
            >
              <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">{preset.label}</span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {formatR$(preset.defaultCost)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- 3. TAB NAVIGATION (Registro de compra VS Estoque Insumos / Produtos) ---------------- */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex p-1.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('purchases')}
            className={`py-2 px-4 rounded-xl font-black text-xs flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'purchases'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>📋 Recibo / Comprovante  Registro de compra ({filteredPurchases.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`py-2 px-4 rounded-xl font-black text-xs flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'stock'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>📦 Depósito / Estoque  Quantidade pordez ({inventory.length})</span>
          </button>
        </div>

        {/* View Total Banner */}
        {activeTab === 'purchases' && (
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center gap-2 text-xs">
            <span className="text-emerald-800 dark:text-emerald-300 font-bold">Total compra este :</span>
            <strong className="text-emerald-900 dark:text-emerald-200 font-black font-mono text-sm">
              {formatR$(selectedViewPurchasesTotal)}
            </strong>
          </div>
        )}
      </div>

      {/* ---------------- TAB 1: PURCHASES LEDGER (como Despesas!) ---------------- */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          {/* Filters: Month, Category & Search */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-3 sm:p-4 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Month Selector */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2.5">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <select
                  value={selectedMonthFilter}
                  onChange={(e) => setSelectedMonthFilter(e.target.value)}
                  className="w-full bg-transparent text-slate-900 dark:text-white outline-none text-xs font-bold cursor-pointer [&>option]:bg-white [&>option]:dark:bg-slate-900"
                >
                  <option value={currentYearMonth}>Este Mês: {getMonthLabel(currentYearMonth)}</option>
                  {availableMonths
                    .filter((m) => m !== currentYearMonth)
                    .map((m) => (
                      <option key={m} value={m}>
                        {getMonthLabel(m)}
                      </option>
                    ))}
                  <option value="all">Todos Mês (Histórico de Concluído)</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2.5">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-transparent text-slate-900 dark:text-white outline-none text-xs font-bold cursor-pointer [&>option]:bg-white [&>option]:dark:bg-slate-900"
                >
                  <option value="all">Todos </option>
                  <option value="Cera  Polimento">Cera  Polimento</option>
                  <option value="shampoo  Espuma">shampoo  Espuma</option>
                  <option value="Vitrificação / Nano  ">Vitrificação / Nano  </option>
                  <option value="  ">  </option>
                  <option value="Materiais ">Materiais </option>
                </select>
              </div>

              {/* Search Box */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2.5">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar porapós que (Koch-Chemie, Sonax) Vendas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none text-xs font-medium"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Purchases List Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
            {filteredPurchases.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <Receipt className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
                  Nenhum compra em Data Registrar não realizado
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                  você pode em   «+ Salvar / Registrar compra» que Recibo compra Produtos  Registrar que.
                </p>
                <button
                  type="button"
                  onClick={openNewPurchaseModal}
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Salvar / Registrar compra Novo</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
                    <tr>
                      <th className="p-3.5 sm:p-4">Data</th>
                      <th className="p-3.5 sm:p-4">que </th>
                      <th className="p-3.5 sm:p-4"></th>
                      <th className="p-3.5 sm:p-4">Quantidade </th>
                      <th className="p-3.5 sm:p-4">Preço / Valor que</th>
                      <th className="p-3.5 sm:p-4">Total compra (R$)</th>
                      <th className="p-3.5 sm:p-4"> em (Vendas)</th>
                      <th className="p-3.5 sm:p-4 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredPurchases.map((purchase) => (
                      <tr
                        key={purchase.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Date */}
                        <td className="p-3.5 sm:p-4 whitespace-nowrap font-mono text-slate-500 dark:text-slate-400 font-bold">
                          {purchase.date}
                        </td>

                        {/* Item Name */}
                        <td className="p-3.5 sm:p-4">
                          <strong className="text-slate-900 dark:text-white font-black block">
                            {purchase.name}
                          </strong>
                          {purchase.notes && (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5 line-clamp-1">
                              {purchase.notes}
                            </span>
                          )}
                        </td>

                        {/* Category */}
                        <td className="p-3.5 sm:p-4 whitespace-nowrap">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            {purchase.category}
                          </span>
                        </td>

                        {/* Quantity */}
                        <td className="p-3.5 sm:p-4 whitespace-nowrap font-mono font-black text-slate-800 dark:text-slate-200">
                          {purchase.quantity} <span className="text-xs font-normal text-slate-400">{purchase.unit}</span>
                        </td>

                        {/* Unit Price */}
                        <td className="p-3.5 sm:p-4 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                          {formatR$(purchase.costPerUnit)}
                        </td>

                        {/* Total Cost */}
                        <td className="p-3.5 sm:p-4 whitespace-nowrap font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">
                          {formatR$(purchase.totalCost)}
                        </td>

                        {/* Supplier */}
                        <td className="p-3.5 sm:p-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {purchase.supplier ? (
                            <span className="flex items-center gap-1">
                              <Store className="w-3.5 h-3.5 text-slate-400" />
                              {purchase.supplier}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 sm:p-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditPurchaseModal(purchase)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePurchase(purchase.id, purchase.name)}
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Footer with Total */}
                  <tfoot className="bg-slate-50 dark:bg-slate-800/90 border-t-2 border-slate-200 dark:border-slate-700 font-bold">
                    <tr>
                      <td colSpan={5} className="p-4 text-left font-black text-slate-800 dark:text-slate-200">
                        Total Geral compra este Restante / Pendente:
                      </td>
                      <td colSpan={3} className="p-4 font-mono font-black text-emerald-700 dark:text-emerald-400 text-base">
                        {formatR$(selectedViewPurchasesTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- TAB 2: CURRENT STOCK / WAREHOUSE BALANCE ---------------- */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.length === 0 ? (
              <div className="col-span-full py-12 px-4 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                  <Boxes className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                  Nenhum item em Estoque não há
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Horário compra Registrar dezque ao vivo / tempo real dez acima / topo Depósito / Estoque pordez Estoque.
                </p>
                <button
                  type="button"
                  onClick={handleRestoreDefaults}
                  className="py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Buscar exemplo acima / topoatéum</span>
                </button>
              </div>
            ) : (
              inventory.map((item) => {
                const isOutOfStock = item.quantity <= 0;
                const isLowStock = item.quantity <= item.minAlertLevel && !isOutOfStock;

                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                      isOutOfStock
                        ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20'
                        : isLowStock
                        ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20'
                        : 'border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
                          {item.category}
                        </span>

                        {isOutOfStock ? (
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 font-mono">
                            Concluído 
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 font-mono">
                            que Restante / Pendente
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                            pordez
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <div className="mt-3">
                        <h3 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                          {item.name}
                        </h3>
                        {item.notes && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      {/* Stock Box */}
                      <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 flex items-baseline justify-between shadow-inner">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">Quantidade até em Estoque:</span>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span
                              className={`text-2xl font-black font-mono ${
                                isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {item.quantity}
                            </span>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{item.unit}</span>
                          </div>
                        </div>

                        <div className="text-left">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">Nível de Aviso / Alerta:</span>
                          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                            {item.minAlertLevel} {item.unit}
                          </span>
                        </div>
                      </div>

                      {/* Value Row */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-600 dark:text-slate-300">
                          Preço / Valor compra: {formatR$(item.costPerUnit)}
                        </span>
                        <strong className="text-emerald-700 dark:text-emerald-400 font-black">
                          por Depósito / Estoque: {formatR$(item.quantity * item.costPerUnit)}
                        </strong>
                      </div>
                    </div>

                    {/* Action Button: Directly Log Purchase for this item */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPurchaseId(null);
                        setFormName(item.name);
                        setFormCategory(item.category);
                        setFormQuantity(2);
                        setFormUnit(item.unit);
                        setFormCostPerUnit(item.costPerUnit);
                        setFormDate(new Date().toISOString().split('T')[0]);
                        setFormSupplier('');
                        setFormNotes(`compra ${item.name}`);
                        setRecordExpense(true);
                        setIsPurchaseModalOpen(true);
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>+ compra este Insumos / Produtos (+Stock)</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ---------------- MODAL: LOG NEW PURCHASE (Salvar / Registrar compra como Despesas) ---------------- */}
      {isPurchaseModalOpen && (
        <div
          dir="ltr"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto"
          onClick={() => setIsPurchaseModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-900 dark:text-white my-auto max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingPurchaseId ? 'Editar Registro de compra' : 'Salvar / Registrar compra Insumos / Produtos'}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Dar Entrada  cada queum que  até   
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPurchaseModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Suggestions Chips */}
            {!editingPurchaseId && (
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 rounded-2xl space-y-2">
                <span className="text-[11px] font-black text-emerald-900 dark:text-emerald-300 block">
                   Rápido (clique que para Selecionar):
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {quickPurchasePresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setFormName(preset.name);
                        setFormCategory(preset.category);
                        setFormUnit(preset.unit);
                        setFormCostPerUnit(preset.defaultCost);
                        setFormQuantity(preset.defaultQty);
                        setFormSupplier(preset.supplier);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-[11px] font-bold border border-emerald-200/80 dark:border-emerald-800 transition cursor-pointer active:scale-95"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSavePurchase} className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              {/* Product Name */}
              <div>
                <label className="font-bold block mb-1 text-slate-800 dark:text-slate-200">
                  Nome Insumos / Produtos ou por :
                </label>
                <input
                  type="text"
                  required
                  placeholder="para exemplo: Koch-Chemie Pw 1L ou shampoo Espuma "
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-slate-800 dark:text-slate-200"> (Category):</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Cera  Polimento">Cera  Polimento</option>
                    <option value="shampoo  Espuma">shampoo  Espuma</option>
                    <option value="Vitrificação / Nano  ">Vitrificação / Nano  </option>
                    <option value="  ">  </option>
                    <option value="Materiais ">Materiais </option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-800 dark:text-slate-200">que compra (Unit):</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="frascos">frascos (Bottle)</option>
                    <option value="litros">litros (L)</option>
                    <option value="galões">galões (Gallon)</option>
                    <option value="unid.">unid. (Pcs)</option>
                    <option value="caixas">caixas (Box)</option>
                    <option value="kg">kg (Kg)</option>
                  </select>
                </div>
              </div>

              {/* Quantity & Unit Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-slate-800 dark:text-slate-200">Quantidade  ({formUnit}):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-800 dark:text-slate-200">Preço / Valor compra que (R$):</label>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    required
                    value={formCostPerUnit}
                    onChange={(e) => setFormCostPerUnit(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Live Total Calculation Banner */}
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between">
                <span className="font-bold text-emerald-900 dark:text-emerald-200">Total Custo de este compra:</span>
                <span className="font-mono font-black text-emerald-800 dark:text-emerald-300 text-sm">
                  {formatR$((Number(formQuantity) || 0) * (Number(formCostPerUnit) || 0))}
                </span>
              </div>

              {/* Purchase Date & Supplier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-slate-800 dark:text-slate-200">Data compra:</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-800 dark:text-slate-200"> em (Vendas):</label>
                  <input
                    type="text"
                    placeholder="para exemplo: Vendas "
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold block mb-1 text-slate-800 dark:text-slate-200">Observações (unid.):</label>
                <input
                  type="text"
                  placeholder="para exemplo: por Nova  por Desconto"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Auto Expense Checkbox */}
              {!editingPurchaseId && (
                <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recordExpense}
                    onChange={(e) => setRecordExpense(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 block">
                      como Recibo Despesa em por (Despesas) Registrar Aluguel / Comercial
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Custo de {formatR$((Number(formQuantity) || 0) * (Number(formCostPerUnit) || 0))} em por Insumos / Produtos  shampoo Este Mês  dezAluguel / Comercial.
                    </span>
                  </div>
                </label>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black transition shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {editingPurchaseId ? 'Salvar ✓' : 'Salvar / Registrar compra ✓'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL: CLEAR DEMO DATA ---------------- */}
      {isClearModalOpen && (
        <div
          dir="ltr"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setIsClearModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-sm font-black">Excluir Produtos até</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              deseja tem certeza em Excluir acima / topo Insumos / Produtos  compra exemploum até  compra    que
            </p>

            <form onSubmit={handleClearDemoStock} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold block mb-1 text-slate-700 dark:text-slate-300">
                  UF segredo / PIN Administrador (PIN):
                </label>
                <input
                  type="password"
                  required
                  placeholder=" Total (exemplo: 9999)"
                  value={clearPinInput}
                  onChange={(e) => setClearPinInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center tracking-widest text-slate-900 dark:text-white font-bold outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  por  que
                </button>
                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MOBILE FLOATING ACTION BUTTON ---------------- */}
      <button
        type="button"
        onClick={openNewPurchaseModal}
        className="fixed bottom-20 left-4 z-40 sm:hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white py-2.5 px-4 rounded-full shadow-2xl flex items-center gap-2 font-black text-xs active:scale-95 transition border-2 border-white/30 cursor-pointer"
      >
        <Plus className="w-4 h-4 text-white" />
        <span>+ Salvar / Registrar compra</span>
      </button>
    </div>
  );
};
