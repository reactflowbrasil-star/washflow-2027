'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { formatR$, normalizeDigits, calculateDaysSince, getSavedInventory, getSavedSettings, isDateToday } from '@/lib/storage';
import { openWhatsAppChat, generateInactivityReminderMessage } from '@/lib/whatsapp';
import { Vehicle, AuthUser, ParkingRecord, Branch } from '@/types';
import { PlateDisplay } from '@/components/ui/PlateDisplay';
import {
  DollarSign,
  Clock,
  Car,
  Menu,
  Search,
  Bell,
  X,
  Sparkles,
  AlertTriangle,
  Gift,
  CheckCheck,
  MessageCircle,
  ExternalLink,
  Layers,
  ChevronLeft,
  ChevronDown,
  Check,
  LogOut,
  Smartphone,
  Building2,
  RefreshCw,
} from 'lucide-react';

interface TopHeaderProps {
  totalRevenue: number;
  activeCarsInBay: number;
  staffPin?: string;
  onToggleMobileMenu?: () => void;
  carWashName?: string;
  vehicles?: Vehicle[];
  parkingRecords?: ParkingRecord[];
  onOpenSettings?: () => void;
  onSelectVehicle?: (vehicle: Vehicle) => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  currentTheme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  branches?: Branch[];
  activeBranchId?: string;
  onSwitchBranch?: (branchId: string) => void;
  isSyncing?: boolean;
}

interface NotificationItem {
  id: string;
  type: 'loyalty' | 'stock' | 'queue' | 'inactivity';
  title: string;
  description: string;
  timeText: string;
  badge: string;
  badgeColor: string;
  vehicle?: Vehicle;
  onWhatsApp?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  totalRevenue,
  activeCarsInBay,
  onToggleMobileMenu,
  vehicles = [],
  parkingRecords = [],
  onSelectVehicle,
  currentUser,
  onLogout,
  currentTheme = 'light',
  onToggleTheme,
  branches = [],
  activeBranchId,
  onSwitchBranch,
  isSyncing = false,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Notification Modal state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([]);
  const [notifTab, setNotifTab] = useState<'all' | 'loyalty' | 'stock'>('all');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen]);

  // Compute live notifications from system data
  const settings = getSavedSettings();
  const inventory = typeof window !== 'undefined' ? getSavedInventory() : [];

  // Calculate today's revenue (for cashier role privacy - including washes + garage parking)
  const todayRevenue = useMemo(() => {
    const washToday = vehicles.reduce((acc, v) => {
      const vehicleToday = (v.washHistory || [])
        .filter((w) => isDateToday(w.date))
        .reduce((sum, w) => sum + (w.price || 0), 0);
      return acc + vehicleToday;
    }, 0);

    const garageToday = (parkingRecords || [])
      .filter((p) => p.paymentStatus === 'paid' && isDateToday(p.entryTime))
      .reduce((sum, p) => sum + (Number(p.fee) || 0), 0);

    return washToday + garageToday;
  }, [vehicles, parkingRecords]);

  // Calculate today's completed washes count
  const todayWashesCount = useMemo(() => {
    return vehicles.reduce((acc, v) => {
      const vehicleTodayCount = (v.washHistory || []).filter((w) => isDateToday(w.date)).length;
      return acc + vehicleTodayCount;
    }, 0);
  }, [vehicles]);

  const rawNotifications: NotificationItem[] = [];

  // 1. Loyalty Free Wash Ready Alerts (4 washes completed)
  vehicles.forEach((v) => {
    if (v.currentCycleWashes >= 4) {
      rawNotifications.push({
        id: `loyalty-${v.id}`,
        type: 'loyalty',
        title: `🎉 Lavagem Grátis (FREE) disponível!`,
        description: `Cliente ${v.ownerName} (${v.carModel}) 4 Lavagem em em Concluído dois  Lavagem Faturamento Grátis.`,
        timeText: 'Fidelidade NFC',
        badge: 'Grátis R$ 0',
        badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
        vehicle: v,
        onWhatsApp: () => {
          if (!v.phone) {
            alert('este veículos Telefone / Celular para Registrar não realizado!');
            return;
          }
          const msg = `Olá prezado(a) ${v.ownerName} 🌸\nobrigado para fidelidade do cliente em ${settings.carWashName}!  4 Lavagem Concluído dois  Lavagem Faturado 100 Grátis (FREE) 🎉🚗✨ seja bem-vindo(a) em cada Horário!`;
          openWhatsAppChat(v.phone, msg);
        },
      });
    }
  });

  // 2. Inactive Customers Reminder (15+ days since last visit)
  vehicles.forEach((v) => {
    const daysSince = calculateDaysSince(v.lastVisitDate);
    if (daysSince >= 15 && v.phone) {
      rawNotifications.push({
        id: `inact-${v.id}`,
        type: 'inactivity',
        title: `⏰ Cliente sem retorno há ${daysSince} dias`,
        description: `${v.ownerName} (${v.carModel}) - Necessário  Lembrete Fidelidade para .`,
        timeText: `Há ${daysSince} dias`,
        badge: 'Lembrete',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        vehicle: v,
        onWhatsApp: () => {
          const msg = generateInactivityReminderMessage(v, settings, daysSince);
          openWhatsAppChat(v.phone, msg);
        },
      });
    }
  });

  // 3. Low Inventory Stock Alerts
  inventory.forEach((item) => {
    if (item.quantity <= item.minAlertLevel) {
      rawNotifications.push({
        id: `stock-${item.id}`,
        type: 'stock',
        title: `⚠️ Aviso / Alerta Estoque: ${item.name}`,
        description: `Quantidade Atual  ${item.quantity} ${item.unit} (que em Nível de Aviso / Alerta ${item.minAlertLevel} ${item.unit}).  por compra.`,
        timeText: 'Depósito',
        badge: 'Estoque baixo',
        badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
      });
    }
  });

  // 4. Vehicles Waiting in Queue
  const queueCars = vehicles.filter((v) => !v.currentBay && v.status === 'active');
  if (queueCars.length > 0) {
    rawNotifications.push({
      id: `queue-status`,
      type: 'queue',
      title: `🚗 Veículos na Fila de Espera`,
      description: `No momento há ${queueCars.length} veículos aguardando lavagem.`,
      timeText: 'Fila',
      badge: `${queueCars.length} veículos`,
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    });
  }

  // Filter out dismissed
  const activeNotifications = rawNotifications.filter(
    (n) => !dismissedNotifIds.includes(n.id)
  );

  const filteredNotifications = activeNotifications.filter((n) => {
    if (notifTab === 'loyalty') return n.type === 'loyalty' || n.type === 'inactivity';
    if (notifTab === 'stock') return n.type === 'stock';
    return true;
  });

  const unreadCount = activeNotifications.length;

  const handleDismissAll = () => {
    setDismissedNotifIds(rawNotifications.map((n) => n.id));
  };

  const handleDismissSingle = (id: string) => {
    setDismissedNotifIds((prev) => [...prev, id]);
  };

  // Filter matching vehicles for quick search dropdown
  const cleanQ = normalizeDigits(searchQuery.trim().toLowerCase());
  const rawQ = searchQuery.trim().toLowerCase();

  const matchedVehicles = rawQ
    ? vehicles
        .filter((v) => {
          const matchesOwner = v.ownerName.toLowerCase().includes(rawQ);
          const matchesPhone = normalizeDigits(v.phone || '').includes(cleanQ);
          const matchesModel = v.carModel.toLowerCase().includes(rawQ);
          const matchesPlateNumber =
            v.plate.type === 'mercosul'
              ? normalizeDigits(v.plate.number || '').includes(cleanQ) ||
                (v.plate.letters || '').toLowerCase().includes(rawQ) ||
                (v.plate.stateName || '').includes(rawQ)
              : normalizeDigits(v.plate.oldNumber || '').includes(cleanQ) ||
                (v.plate.cityName || '').includes(rawQ);
          return matchesOwner || matchesPhone || matchesModel || matchesPlateNumber;
        })
        .slice(0, 5)
    : [];

  return (
    <header
      className="app-header header-safe-top h-12 sm:h-[54px] border-b border-slate-200/80 dark:border-slate-800 px-2.5 sm:px-4 flex items-center justify-between select-none sticky top-0 z-30 text-slate-800 dark:text-slate-100 w-full max-w-full overflow-hidden"
    >
      {/* Right side: Mobile Hamburger, Brand Name, Mobile Search Button, Live Desktop Search Bar & Clock */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 sm:px-3 sm:py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/25 ring-1 ring-white/15 shrink-0 cursor-pointer hover:opacity-95 active:scale-95 transition"
            title="Menu Principal"
          >
            <Menu className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold hidden sm:inline">Menu</span>
          </button>
        )}

        {/* Mobile Facility Title */}
        <span className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[105px] sm:max-w-[160px] font-sans block sm:hidden">
          {settings.carWashName || 'Lava-Rápido Água Cristalina'}
        </span>

        {/* Compact Clock (Desktop) */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200" suppressHydrationWarning>
            {currentTime || '...'}
          </span>
        </div>
      </div>

      {/* Left side: Live Badges, Interactive Notification Bell */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Network Status Badge (Hidden on mobile < sm to avoid nav bloat) */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-xl border text-xs font-bold transition shrink-0 shadow-xs cursor-default ${
            isOnline
              ? 'bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60'
              : 'bg-amber-50/80 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60 ring-1 ring-amber-400/30 animate-pulse'
          }`}
          title={
            isOnline
              ? '🟢 Conectado ao Servidor (Online)'
              : '🟠 Modo Offline: Sem conexão à internet. Os dados estão salvos localmente e serão sincronizados automaticamente.'
          }
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="text-[11px] font-mono hidden md:inline">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* ======================================================== */}
        {/* INTERACTIVE NOTIFICATION BELL WITH FLOATING CENTER       */}
        {/* ======================================================== */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className={`relative p-1.5 sm:p-2 rounded-xl transition shadow-xs flex items-center justify-center shrink-0 cursor-pointer ${
              isNotificationOpen
                ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30'
                : 'bg-white/70 dark:bg-slate-800/70 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200/70 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800'
            }`}
            title="Central de Notificações"
          >
            <Bell className="w-4 h-4" />
            {isMounted && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#8B5CF6] text-white font-mono font-bold text-[9px] flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Floating Notification Center Dropdown */}
          {isNotificationOpen && (
            <div
              className="absolute right-0 mt-3 w-80 sm:w-96 max-w-[calc(100vw-24px)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 z-50 animate-fadeIn space-y-3 text-slate-800 dark:text-slate-100"
              dir="ltr"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Central de Notificações</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400">
                      {unreadCount > 0 ? `${unreadCount} notificações importantes requerem atenção` : 'Tudo em ordem e operando normalmente'}
                    </p>
                  </div>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleDismissAll}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-xl transition flex items-center gap-1"
                    title="Limpar todas as notificações"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Limpar Todas
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold border border-transparent dark:border-slate-700">
                <button
                  onClick={() => setNotifTab('all')}
                  className={`flex-1 py-1 rounded-lg transition text-[11px] ${
                    notifTab === 'all'
                      ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Todas ({activeNotifications.length})
                </button>
                <button
                  onClick={() => setNotifTab('loyalty')}
                  className={`flex-1 py-1 rounded-lg transition text-[11px] ${
                    notifTab === 'loyalty'
                      ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Fidelidade ({activeNotifications.filter((n) => n.type === 'loyalty' || n.type === 'inactivity').length})
                </button>
                <button
                  onClick={() => setNotifTab('stock')}
                  className={`flex-1 py-1 rounded-lg transition text-[11px] ${
                    notifTab === 'stock'
                      ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Estoque ({activeNotifications.filter((n) => n.type === 'stock').length})
                </button>
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto space-y-2.5 pr-0.5">
                {filteredNotifications.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-800/60">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Nenhuma notificação nova ✨</p>
                    <p className="text-[10px] text-slate-400">O sistema está operando perfeitamente.</p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 hover:bg-slate-100/90 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700 transition space-y-2 group relative"
                    >
                      {/* Top row: badge + dismiss */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${notif.badgeColor}`}
                        >
                          {notif.badge}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {notif.timeText}
                          </span>
                          <button
                            onClick={() => handleDismissSingle(notif.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
                            title="Remover"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                          {notif.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                          {notif.description}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        {notif.onWhatsApp && (
                          <button
                            onClick={notif.onWhatsApp}
                            className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Enviar WhatsApp
                          </button>
                        )}
                        {notif.vehicle && onSelectVehicle && (
                          <button
                            onClick={() => {
                              onSelectVehicle(notif.vehicle!);
                              setIsNotificationOpen(false);
                            }}
                            className="py-1.5 px-3 bg-white dark:bg-purple-950/40 hover:bg-purple-50 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1"
                          >
                            Ver Veículo
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar / User & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 pr-1 sm:pr-2 border-l border-slate-200 dark:border-slate-700 whitespace-nowrap shrink-0">
          <div
            className={`w-8 h-8 rounded-xl ${
              currentUser?.role === 'admin'
                ? 'bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-500'
                : 'bg-gradient-to-tr from-sky-500 to-cyan-500'
            } text-white flex items-center justify-center text-[10px] sm:text-xs font-black shadow-md shadow-indigo-500/20 ring-1 ring-white/25 shrink-0`}
          >
            {currentUser?.avatar || (currentUser?.role === 'admin' ? '👑' : 'CW')}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              {currentUser?.name || (currentUser?.role === 'admin' ? 'Administrador' : 'Caixa')}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {currentUser?.role === 'admin' ? 'Administrador (Admin)' : 'Caixa (Cashier)'}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Expandable Search Bar Overlay */}
      {isMobileSearchOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 shadow-xl p-3 z-40 animate-fadeIn" dir="ltr">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Buscar por placa, cliente, modelo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white outline-none w-full text-xs font-bold"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setIsMobileSearchOpen(false);
                setSearchQuery('');
              }}
              className="px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl shrink-0"
            >
              Fechar
            </button>
          </div>

          {/* Mobile Search Results */}
          {rawQ.length > 0 && (
            <div className="mt-2.5 max-h-60 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800">
              {matchedVehicles.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  Nenhum veículo encontrado com este nome ou placa!
                </div>
              ) : (
                matchedVehicles.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      if (onSelectVehicle) onSelectVehicle(v);
                      setSearchQuery('');
                      setIsMobileSearchOpen(false);
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{v.ownerName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {v.carModel} • {v.color}
                      </div>
                    </div>
                    <PlateDisplay plate={v.plate} size="sm" />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
