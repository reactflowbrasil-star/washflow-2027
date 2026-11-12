'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TabKey } from '@/components/layout/Sidebar';
import { AuthUser } from '@/types';
import {
  Monitor,
  Car,
  LayoutDashboard,
  DollarSign,
  MoreHorizontal,
  Users,
  Wrench,
  Settings,
  BookOpen,
  Smartphone,
  LogOut,
  X,
  Sparkles,
  ChevronLeft,
  ShieldCheck,
  PackageCheck,
  Warehouse,
} from 'lucide-react';

interface MobileAppDockProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  activeCarsInBay: number;
  parkedCarsCount?: number;
  freeReadyCount: number;
  setupCount?: number;
  lowInventoryCount?: number;
  userRole?: 'admin' | 'cashier';
  carWashName?: string;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const MobileAppDock: React.FC<MobileAppDockProps> = ({
  activeTab,
  onTabChange,
  activeCarsInBay,
  parkedCarsCount = 0,
  freeReadyCount,
  setupCount = 0,
  lowInventoryCount = 0,
  userRole = 'admin',
  carWashName = 'lava-rápido Veículo',
  currentUser,
  onLogout,
}) => {
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  const primaryTabs: {
    id: TabKey;
    label: string;
    icon: any;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'cashier',
      label: 'Caixa',
      icon: Monitor,
      badge: activeCarsInBay > 0 ? activeCarsInBay : undefined,
      badgeColor: 'bg-blue-600 text-white animate-pulse',
    },
    {
      id: 'vehicles',
      label: 'Veículos',
      icon: Car,
      badge: freeReadyCount > 0 ? `${freeReadyCount} Grátis` : undefined,
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'analytics',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'expenses',
      label: 'Despesas',
      icon: DollarSign,
    },
  ];

  // Visible primary tabs (Both Admin and Cashier have direct access)
  const visibleTabs =
    userRole === 'cashier'
      ? primaryTabs.filter((t) => ['cashier', 'vehicles', 'expenses'].includes(t.id))
      : primaryTabs;

  const handleSelectTab = (tab: TabKey) => {
    onTabChange(tab);
    setIsMoreSheetOpen(false);
  };

  const isMoreActive = ['staff', 'setup', 'docs', 'settings', 'inventory'].includes(activeTab);

  return (
    <>
      {/* ============================================================= */}
      {/* NATIVE APP BOTTOM DOCK (FIXED AT SCREEN BOTTOM)               */}
      {/* ============================================================= */}
      <nav
        dir="ltr"
        aria-label="Menu Inferior Mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/90 dark:border-slate-800 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)] select-none"
        style={{
          paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
          paddingTop: '6px',
        }}
      >
        <div className={`grid w-full max-w-xl mx-auto items-stretch gap-1 px-2 ${visibleTabs.length === 3 ? "grid-cols-4" : "grid-cols-5"}`}>
          {visibleTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`relative min-w-0 w-full flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-black'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
                }`}
              >
                {/* Active indicator pill behind/above icon */}
                <div
                  className={`relative p-1.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 shadow-xs ring-1 ring-blue-500/20'
                      : 'bg-transparent'
                  }`}
                >
                  <Icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`} />

                  {/* Badge */}
                  {item.badge !== undefined && (
                    <span
                      className={`absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold shadow-xs ${
                        item.badgeColor || 'bg-blue-600 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className="w-full text-center text-[9px] leading-3 tracking-tight truncate">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* 5th Tab: "Mais (More / Menu)" - Native Bottom Sheet Trigger */}
          <button
            type="button"
            onClick={() => setIsMoreSheetOpen(true)}
            className={`relative min-w-0 w-full flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer ${
              isMoreActive || isMoreSheetOpen
                ? 'text-blue-600 dark:text-blue-400 font-black'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all duration-200 ${
                isMoreActive || isMoreSheetOpen
                  ? 'bg-blue-50 dark:bg-blue-950/60 shadow-xs ring-1 ring-blue-500/20'
                  : 'bg-transparent'
              }`}
            >
              <MoreHorizontal className="w-6 h-6" />
            </div>
            <span className="w-full text-center text-[9px] leading-3 tracking-tight">Mais</span>
          </button>
        </div>
      </nav>

      {/* ============================================================= */}
      {/* IOS-STYLE NATIVE BOTTOM SHEET (FOR "MORE / Mais")             */}
      {/* ============================================================= */}
      {isMoreSheetOpen && (
        <div
          dir="ltr"
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-fade-in"
          onClick={() => setIsMoreSheetOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-[32px] shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up"
            style={{
              paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/20">
                  {currentUser?.avatar || '👑'}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {currentUser?.name || carWashName}
                  </h3>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {userRole === 'admin' ? 'Administrador Geral (Admin)' : 'Operador de Caixa (Cashier)'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMoreSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center transition hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Secondary Modules Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Analytics Dashboard */}
              <button
                type="button"
                onClick={() => handleSelectTab('analytics')}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shadow-xs">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-black block">Dashboard e Métricas</span>
                  <span className="text-[10px] text-slate-400">Faturamento, lucro e metas</span>
                </div>
              </button>

              {/* Staff */}
              <button
                type="button"
                onClick={() => handleSelectTab('staff')}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  activeTab === 'staff'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-black block">Equipe e Lavadores</span>
                  <span className="text-[10px] text-slate-400">Jornada e comissões</span>
                </div>
              </button>

              {/* Setup CapEx */}
              <button
                type="button"
                onClick={() => handleSelectTab('setup')}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  activeTab === 'setup'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shadow-xs">
                  <Wrench className="w-4 h-4" />
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-black block">Equipamentos (CapEx)</span>
                  <span className="text-[10px] text-slate-400">{setupCount} máquinas cadastradas</span>
                </div>
              </button>

              {/* Inventory & Chemicals */}
              <button
                type="button"
                onClick={() => handleSelectTab('inventory')}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  activeTab === 'inventory'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shadow-xs">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-black block">Estoque & Produtos</span>
                  <span className="text-[10px] text-slate-400">
                    {lowInventoryCount > 0 ? `${lowInventoryCount} alertas de estoque` : 'Controle de insumos'}
                  </span>
                </div>
              </button>

              {/* Settings */}
              {userRole === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleSelectTab('settings')}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-700 dark:text-blue-300'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shadow-xs">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-xs font-black block">Configurações</span>
                    <span className="text-[10px] text-slate-400">Preços, filiais e regras</span>
                  </div>
                </button>
              )}

              {/* Docs */}
              <button
                type="button"
                onClick={() => handleSelectTab('docs')}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  activeTab === 'docs'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shadow-xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-black block">Manual & Diretrizes</span>
                  <span className="text-[10px] text-slate-400">Procedimentos de operação</span>
                </div>
              </button>

              {/* Install PWA Trigger */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('open-pwa-install'));
                  }
                }}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 text-left transition flex flex-col justify-between cursor-pointer active:scale-95"
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shadow-xs">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-black block">Instalar App</span>
                  <span className="text-[10px] text-blue-100">Adicionar à Tela Inicial 📱</span>
                </div>
              </button>
            </div>

            {/* Logout Row */}
            {onLogout && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreSheetOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold transition flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-900 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair do Sistema (Logout)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
