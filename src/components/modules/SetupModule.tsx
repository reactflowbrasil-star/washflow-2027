'use client';

import React, { useState, useEffect } from 'react';
import { SetupItem, InventoryItem, AppSettings } from '@/types';
import { formatR$, getSavedInventory, saveInventory, normalizeDigits } from '@/lib/storage';
import {
  Wrench,
  Plus,
  Trash2,
  Calendar,
  ShieldCheck,
  Package,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';

interface SetupModuleProps {
  setupItems: SetupItem[];
  settings?: AppSettings;
  onUpdateSetupItems: (items: SetupItem[]) => void;
  onNotify: (msg: string) => void;
}

export const SetupModule: React.FC<SetupModuleProps> = ({
  setupItems,
  settings,
  onUpdateSetupItems,
  onNotify,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'capex' | 'inventory'>('capex');

  // Setup Items (CapEx) Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SetupItem['category']>('');
  const [cost, setCost] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Inventory Items State
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [invName, setInvName] = useState('');
  const [invCategory, setInvCategory] = useState<InventoryItem['category']>('shampoo  Espuma');
  const [invQuantity, setInvQuantity] = useState('10');
  const [invUnit, setInvUnit] = useState<InventoryItem['unit']>('litros');
  const [invMinAlert, setInvMinAlert] = useState('5');
  const [invCost, setInvCost] = useState('5000');
  const [invNotes, setInvNotes] = useState('');

  useEffect(() => {
    setInventoryItems(getSavedInventory());
  }, []);

  const handleUpdateInventory = (items: InventoryItem[]) => {
    setInventoryItems(items);
    saveInventory(items);
  };

  // Adjust stock quantity (+/-)
  const handleAdjustStock = (id: string, delta: number) => {
    const updated = inventoryItems.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty <= item.minAlertLevel) {
          onNotify(`⚠️ Aviso / Alerta: Produtos «${item.name}» que em Depósito / Estoque (${newQty} ${item.unit} Restante / Pendente)!`);
        } else {
          onNotify(`Quantidade Insumos / Produtos Novo: ${newQty} ${item.unit}`);
        }
        return { ...item, quantity: newQty };
      }
      return item;
    });
    handleUpdateInventory(updated);
  };

  const handleAddInventoryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invName) return;

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: invName,
      category: invCategory,
      quantity: Number(normalizeDigits(invQuantity)) || 0,
      unit: invUnit,
      minAlertLevel: Number(normalizeDigits(invMinAlert)) || 5,
      costPerUnit: Number(normalizeDigits(invCost)) || 0,
      lastRestocked: new Date().toISOString().split('T')[0],
      notes: invNotes,
    };

    const updated = [newItem, ...inventoryItems];
    handleUpdateInventory(updated);
    setShowAddInventoryModal(false);
    onNotify('Produtos Novo para Depósito / Estoque .');

    setInvName('');
    setInvNotes('');
  };

  const handleDeleteInventoryItem = (id: string) => {
    if (confirm('tem certeza em Excluir este Insumos / Produtos em Depósito / Estoque')) {
      const updated = inventoryItems.filter((i) => i.id !== id);
      handleUpdateInventory(updated);
      onNotify('Insumos / Produtosque em Depósito / Estoque .');
    }
  };

  // Total Capital Invested in Equipment/Setup
  const totalCapEx = setupItems.reduce((sum, item) => sum + item.cost * item.quantity, 0);

  // Low stock items count
  const lowStockCount = inventoryItems.filter((i) => i.quantity <= i.minAlertLevel).length;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const parsedCost = Number(normalizeDigits(cost)) || 0;
    const parsedQty = Number(normalizeDigits(quantity)) || 1;

    if (!cleanName) {
      alert('Por favor Nome queque digite!');
      return;
    }

    if (parsedCost <= 0) {
      alert('Por favor Custo de queque por  digite (dezsem em 0  sem)!');
      return;
    }

    const newItem: SetupItem = {
      id: `setup-${Date.now()}`,
      name: cleanName,
      category,
      cost: parsedCost,
      quantity: parsedQty > 0 ? parsedQty : 1,
      unit: 'unid.',
      purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
      notes: notes.trim(),
    };

    const updated = [newItem, ...setupItems];
    onUpdateSetupItems(updated);
    setShowAddModal(false);
    onNotify('que Novo para  acima / topo lava-rápido .');

    setName('');
    setCost('');
    setNotes('');
  };

  const handleDeleteItem = (id: string) => {
    const masterPin = settings?.adminPin || '9999';
    const enteredPin = prompt('⚠️ para Excluir este que Por favor UF segredo / PIN Administrador (Admin PIN) digite:');
    if (enteredPin === null) return;

    if (normalizeDigits(enteredPin.trim()) !== normalizeDigits(masterPin.trim())) {
      alert('❌ UF segredo / PIN Administrador Erro! Excluir queque .');
      return;
    }

    if (confirm('tem certeza em Excluir este que em  acima / topo (CaPEx)')) {
      const updated = setupItems.filter((i) => i.id !== id);
      onUpdateSetupItems(updated);
      onNotify('queque em  acima / topo .');
    }
  };

  return (
    <div className="space-y-6" dir="ltr">
      {/* Module Title & Tab Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              que acima / topo  Depósito / Estoque Insumos / Produtos
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                como (CapEx)  Depósito / Estoque Insumos / Produtos  shampoo com Aviso / Alerta que.
            </p>
          </div>
        </div>

        {/* Sub-Tabs: CapEx vs Inventory */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('capex')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'capex'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
              acima / topo (CapEx)
          </button>

          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer relative ${
              activeSubTab === 'inventory'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            Depósito / Estoque Insumos / Produtos  shampoo
            {lowStockCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow-xs">
                {lowStockCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: CAPEX EQUIPMENT (acima / topo acima / topoaté)                 */}
      {/* ========================================================= */}
      {activeSubTab === 'capex' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium"> Todos  reservatório / tanque  queem como</span>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Adicionar que 
            </button>
          </div>

          {/* Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-1.5 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-bold">Total Geral acima / topo  que (CapEx)</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">{formatR$(totalCapEx)}</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">
                este Quantidade Valor  para compra   que  reservatório / tanque  
              </span>
            </div>

            <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-1.5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-bold">Total que Salvo com sucessocomo</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">{setupItems.length} Quantidade</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Todos Quantidade por  Registrar </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 text-xs font-bold">
                  <tr>
                    <th className="p-4">Nome que / </th>
                    <th className="p-4"></th>
                    <th className="p-4">Número (unid.)</th>
                    <th className="p-4">Preço / Valor que</th>
                    <th className="p-4">Total </th>
                    <th className="p-4">Data compra</th>
                    <th className="p-4">Observações</th>
                    <th className="p-4 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {setupItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="p-4 font-extrabold text-slate-900 dark:text-white">{item.name}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-mono">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-mono">{formatR$(item.cost)}</td>
                      <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatR$(item.cost * item.quantity)}
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 font-mono">{item.purchaseDate}</td>
                      <td className="p-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs">{item.notes || '-'}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: INVENTORY & STOCK ALERT (Depósito / Estoque dez quecomo)  */}
      {/* ========================================================= */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
               Quantidade shampoo Espuma Cera Vitrificação / Nano   bomba de alta pressão em Depósito / Estoque
            </span>
            <button
              onClick={() => setShowAddInventoryModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-emerald-500/20 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Adicionar Produtos Novo para Depósito / Estoque
            </button>
          </div>

          {/* Low Stock Warning Banner if any item is low */}
          {lowStockCount > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-3xl flex items-center gap-3 text-amber-900 dark:text-amber-200 text-xs shadow-xs">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 animate-bounce" />
              <div>
                <p className="font-extrabold text-sm text-amber-950 dark:text-amber-100">Aviso / Alerta que Insumos / Produtos em Depósito / Estoque!</p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                  Número {lowStockCount} Tipo Insumos / Produtos em Depósito / Estoque que em Estoque Mínimo de Alerta (Min Alert Level) Por favor antes de Concluído .
                </p>
              </div>
            </div>
          )}

          {/* Inventory Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventoryItems.map((item) => {
              const isLow = item.quantity <= item.minAlertLevel;

              return (
                <div
                  key={item.id}
                  className={`rounded-3xl p-5 sm:p-6 border shadow-xs relative overflow-hidden space-y-4 transition-all group ${
                    isLow
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/80 shadow-amber-500/5'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                        {item.category}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1.5">{item.name}</h4>
                    </div>

                    {isLow ? (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500 text-white font-bold flex items-center gap-1 shadow-xs">
                        <AlertTriangle className="w-3 h-3" />
                        que Restante / Pendente!
                      </span>
                    ) : (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold">
                        pordez ✓
                      </span>
                    )}
                  </div>

                  {/* Stock Quantity Highlight */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">Quantidade até Depósito / Estoque:</span>
                      <span className={`text-xl font-black font-mono tracking-tight ${isLow ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {item.quantity} {item.unit}
                      </span>
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold"> Aviso / Alerta:</span>
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        {item.minAlertLevel} {item.unit}
                      </span>
                    </div>
                  </div>

                  {/* Quick Adjust Buttons */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-bold">Editar Rápido Quantidade:</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        onClick={() => handleAdjustStock(item.id, 5)}
                        className="py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 dark:hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white dark:hover:text-white border border-blue-200/60 dark:border-blue-800/60 rounded-xl text-xs font-bold transition text-center font-mono cursor-pointer"
                      >
                        +5
                      </button>
                      <button
                        onClick={() => handleAdjustStock(item.id, 1)}
                        className="py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 dark:hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white dark:hover:text-white border border-blue-200/60 dark:border-blue-800/60 rounded-xl text-xs font-bold transition text-center font-mono cursor-pointer"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleAdjustStock(item.id, -1)}
                        className="py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 dark:hover:bg-rose-600 text-rose-700 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200/60 dark:border-rose-800/60 rounded-xl text-xs font-bold transition text-center font-mono cursor-pointer"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => handleAdjustStock(item.id, -5)}
                        className="py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 dark:hover:bg-rose-600 text-rose-700 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200/60 dark:border-rose-800/60 rounded-xl text-xs font-bold transition text-center font-mono cursor-pointer"
                      >
                        -5
                      </button>
                    </div>
                  </div>

                  {/* Footer details */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Preço / Valor que: <strong className="text-slate-900 dark:text-white font-mono font-bold">{formatR$(item.costPerUnit)}</strong></span>
                    <button
                      onClick={() => handleDeleteInventoryItem(item.id)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Add Setup Item */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white">
            <h3 className="font-black text-lg text-slate-900 dark:text-white">Salvar / Registrar que  (CapEx)</h3>

            <form onSubmit={handleAddItem} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">Nome que / :</label>
                <input
                  type="text"
                  required
                  placeholder="como: bomba de alta pressão para 200  Espuma Totalacima / topo..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value=""></option>
                    <option value="que  Materiais">que  Materiais</option>
                    <option value="Construção  reservatório / tanque">Construção  reservatório / tanque</option>
                    <option value="eletricidade  iluminação">eletricidade  iluminação</option>
                    <option value="  Total">  Total</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">Número (unid.):</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">Preço / Valor compra (para cada unid.um por R$):</label>
                  <input
                    type="number"
                    required
                    placeholder="exemplo: 1200000"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">Data compra:</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">Observações:</label>
                <input
                  type="text"
                  placeholder="que local / vaga compra ..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Inventory Item */}
      {showAddInventoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white">
            <h3 className="font-black text-lg text-slate-900 dark:text-white">Adicionar Produtos Novo para Depósito / Estoque</h3>

            <form onSubmit={handleAddInventoryItem} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">Nome Insumos / Produtos:</label>
                <input
                  type="text"
                  required
                  placeholder="como: shampoo Espuma  Cera   bomba de alta pressão..."
                  value={invName}
                  onChange={(e) => setInvName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">:</label>
                  <select
                    value={invCategory}
                    onChange={(e) => setInvCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="shampoo  Espuma">shampoo  Espuma</option>
                    <option value="Cera  Polimento">Cera  Polimento</option>
                    <option value="Vitrificação / Nano  ">Vitrificação / Nano  </option>
                    <option value="  ">  </option>
                    <option value="Materiais ">Materiais </option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">que :</label>
                  <select
                    value={invUnit}
                    onChange={(e) => setInvUnit(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="litros">litros</option>
                    <option value="unid.">unid.</option>
                    <option value="kg">kg</option>
                    <option value="caixas">caixas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">Quantidade pordez:</label>
                  <input
                    type="number"
                    min="0"
                    value={invQuantity}
                    onChange={(e) => setInvQuantity(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">Nível de Aviso / Alerta:</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="exemplo: 5"
                    value={invMinAlert}
                    onChange={(e) => setInvMinAlert(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">Custo de que (R$):</label>
                  <input
                    type="number"
                    value={invCost}
                    onChange={(e) => setInvCost(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">Observações:</label>
                <input
                  type="text"
                  placeholder="que Total  por..."
                  value={invNotes}
                  onChange={(e) => setInvNotes(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl transition shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Salvar em Depósito / Estoque
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddInventoryModal(false)}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
