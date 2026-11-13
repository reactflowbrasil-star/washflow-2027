'use client';

import React, { useState, useMemo } from 'react';
import {
  ParkingRecord,
  ParkingRateType,
  LicensePlate,
  PlateType,
  PaymentMethod,
  ServiceItem,
  StaffMember,
  AppSettings,
  Vehicle,
} from '@/types';
import { PlateDisplay } from '@/components/ui/PlateDisplay';
import { formatR$, playPosSound } from '@/lib/storage';
import { OFFICIAL_PROVINCES, OLD_PLATE_CITIES, OLD_PLATE_CATEGORIES } from '@/constants/provinces';
import {
  Warehouse,
  Car,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  DollarSign,
  ArrowUpRight,
  LogOut,
  Sparkles,
  Droplets,
  Calendar,
  AlertCircle,
  X,
  CreditCard,
  Building2,
  TrendingUp,
  Tag,
  FileText,
  BadgePercent,
  Compass,
} from 'lucide-react';

interface GarageModuleProps {
  parkingRecords: ParkingRecord[];
  onUpdateParkingRecords: (records: ParkingRecord[]) => void;
  vehicles: Vehicle[];
  onUpdateVehicles?: (vehicles: Vehicle[]) => void;
  services: ServiceItem[];
  staff: StaffMember[];
  settings: AppSettings;
  onNotify: (msg: string) => void;
  onNavigateToCashier?: (bay?: number) => void;
}

export const GarageModule: React.FC<GarageModuleProps> = ({
  parkingRecords,
  onUpdateParkingRecords,
  vehicles,
  onUpdateVehicles,
  services,
  staff,
  settings,
  onNotify,
  onNavigateToCashier,
}) => {
  const capacity = settings.garageCapacity || 30;
  const dailyRate = settings.garageDailyRate || 1000;
  const monthlyRent = settings.monthlyRent || 600000;

  // Tabs & Filters
  const [activeFilter, setActiveFilter] = useState<'all' | 'parked' | 'empty' | 'washing' | 'history'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isWashTransferModalOpen, setIsWashTransferModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ParkingRecord | null>(null);
  const [selectedSlotForEntry, setSelectedSlotForEntry] = useState<number | null>(null);

  // -------------------------------------------------------------
  // Entry Form State
  // -------------------------------------------------------------
  const [plateType, setPlateType] = useState<PlateType>('unified');
  const [provinceCode, setProvinceCode] = useState('');
  const [plateLetter, setPlateLetter] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [oldCity, setOldCity] = useState('Campinas');
  const [oldCategory, setOldCategory] = useState('Particular');
  const [oldNumber, setOldNumber] = useState('');
  const [carModel, setCarModel] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [assignedSlot, setAssignedSlot] = useState<number>(1);
  const [rateType, setRateType] = useState<ParkingRateType>('daily');
  const [isPrepaid, setIsPrepaid] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  // Wash transfer state
  const [selectedWashBay, setSelectedWashBay] = useState<number>(1);
  const [selectedWashServiceId, setSelectedWashServiceId] = useState<string>(services[0]?.id || '');
  const [selectedWashStaffId, setSelectedWashStaffId] = useState<string>(staff[0]?.id || '');

  // -------------------------------------------------------------
  // Statistics Computations
  // -------------------------------------------------------------
  const activeParkedRecords = useMemo(
    () => parkingRecords.filter((p) => p.status === 'parked' || p.status === 'washing'),
    [parkingRecords]
  );

  const currentlyParkedCount = activeParkedRecords.filter((p) => p.status === 'parked').length;
  const currentlyWashingCount = activeParkedRecords.filter((p) => p.status === 'washing').length;
  const totalOccupied = activeParkedRecords.length;
  const availableSlotsCount = Math.max(0, capacity - totalOccupied);
  const occupancyRate = Math.round((totalOccupied / capacity) * 100);

  // Today's Garage revenue calculation
  const todayRevenue = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return parkingRecords
      .filter((p) => p.entryTime.slice(0, 10) === todayStr && p.paymentStatus === 'paid')
      .reduce((sum, p) => sum + (p.fee || 0), 0);
  }, [parkingRecords]);

  // Today's total admissions
  const todayAdmissionsCount = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return parkingRecords.filter((p) => p.entryTime.slice(0, 10) === todayStr).length;
  }, [parkingRecords]);

  // Daily target to cover 600,000 R$ rent alone (600,000 / 30 = 20,000 R$ = 20 cars @ 1000 R$)
  const dailyRentBreakEvenCars = Math.ceil(monthlyRent / 30 / dailyRate);
  const rentCoveragePercent = Math.min(100, Math.round((todayRevenue / (monthlyRent / 30)) * 100));

  // Map slots 1 to capacity with active record
  const slotMap = useMemo(() => {
    const map = new Map<number, ParkingRecord>();
    activeParkedRecords.forEach((r) => {
      map.set(r.slotNumber, r);
    });
    return map;
  }, [activeParkedRecords]);

  // Available free slots list
  const freeSlotNumbers = useMemo(() => {
    const free: number[] = [];
    for (let i = 1; i <= capacity; i++) {
      if (!slotMap.has(i)) free.push(i);
    }
    return free;
  }, [capacity, slotMap]);

  // Handle open entry modal
  const handleOpenEntryModal = (slot?: number) => {
    const targetSlot = slot ?? (freeSlotNumbers[0] || 1);
    setSelectedSlotForEntry(targetSlot);
    setAssignedSlot(targetSlot);
    setPlateNumber('');
    setOldNumber('');
    setProvinceCode('');
    setPlateLetter('');
    setCarModel('');
    setOwnerName('');
    setPhone('');
    setNotes('');
    setRateType('daily');
    setIsPrepaid(true);
    setPaymentMethod('cash');
    setIsEntryModalOpen(true);
  };

  // Handle submit entry
  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();

    const currentPlateNum = plateType === 'unified' ? plateNumber.trim() : oldNumber.trim();
    if (!currentPlateNum || (plateType === 'unified' && (!provinceCode || !plateLetter))) {
      alert('Preencha UF/cidade, letra e número da placa.');
      return;
    }

    const currentPlate: LicensePlate =
      plateType === 'unified'
        ? {
            type: 'unified',
            provinceCode,
            provinceName: OFFICIAL_PROVINCES.find((p) => p.code === provinceCode)?.nameKu || 'Mercosul',
            letter: plateLetter,
            number: currentPlateNum,
          }
        : {
            type: 'old',
            oldCityName: oldCity,
            oldCategory,
            number: currentPlateNum,
          };

    // Calculate fee based on rateType
    let fee = dailyRate;
    if (rateType === 'overnight') fee = settings.garageOvernightRate || 3000;
    if (rateType === 'monthly') fee = settings.garageMonthlyRate || 25000;

    const newTicketNum = `G-${100 + parkingRecords.length + 1}`;
    const newRecord: ParkingRecord = {
      id: `park-${Date.now()}`,
      ticketNumber: newTicketNum,
      plate: currentPlate,
      slotNumber: assignedSlot,
      entryTime: new Date().toISOString(),
      status: 'parked',
      rateType,
      fee,
      paymentStatus: isPrepaid ? 'paid' : 'unpaid',
      paymentMethod: isPrepaid ? paymentMethod : undefined,
      carModel: carModel.trim() || 'Veículo Estacionamento / Pátio',
      ownerName: ownerName.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const updated = [newRecord, ...parkingRecords];
    onUpdateParkingRecords(updated);
    playPosSound('cash');
    setIsEntryModalOpen(false);

    // Auto open print modal for 80mm entry ticket
    setSelectedRecord(newRecord);
    setIsPrintModalOpen(true);

    onNotify(`Veículo [${currentPlateNum}] em local / vaga #${assignedSlot} por sucesso  .`);
  };

  // Handle exit & pay
  const handleOpenExitModal = (record: ParkingRecord) => {
    setSelectedRecord(record);
    setIsExitModalOpen(true);
  };

  const handleConfirmExit = (paidMethod: PaymentMethod = 'cash') => {
    if (!selectedRecord) return;

    const now = new Date().toISOString();
    const updated = parkingRecords.map((r) => {
      if (r.id === selectedRecord.id) {
        return {
          ...r,
          status: 'exited' as const,
          exitTime: now,
          paymentStatus: 'paid' as const,
          paymentMethod: paidMethod,
        };
      }
      return r;
    });

    onUpdateParkingRecords(updated);
    playPosSound('cash');
    setIsExitModalOpen(false);
    onNotify(`Veículo [${selectedRecord.plate.number}] dez  Quantidade ${formatR$(selectedRecord.fee)} .`);
  };

  // Handle send to wash bay
  const handleOpenWashTransfer = (record: ParkingRecord) => {
    setSelectedRecord(record);
    setSelectedWashBay(1);
    setIsWashTransferModalOpen(true);
  };

  const handleConfirmWashTransfer = () => {
    if (!selectedRecord) return;

    // 1. Mark parking record as washing and link bay
    const updatedParking = parkingRecords.map((r) => {
      if (r.id === selectedRecord.id) {
        return {
          ...r,
          status: 'washing' as const,
          linkedWashBay: selectedWashBay,
        };
      }
      return r;
    });
    onUpdateParkingRecords(updatedParking);

    // 2. Add or update vehicle in wash bay
    if (onUpdateVehicles) {
      const selectedService = services.find((s) => s.id === selectedWashServiceId) || services[0];
      const selectedStaffMember = staff.find((st) => st.id === selectedWashStaffId) || staff[0];

      // Check if vehicle already exists in registry
      const existingIdx = (vehicles || []).findIndex(
        (v) =>
          v.plate.number === selectedRecord.plate.number &&
          (v.plate.type === 'unified'
            ? v.plate.letter === (selectedRecord.plate as any).letter
            : v.plate.oldCityName === (selectedRecord.plate as any).oldCityName)
      );

      let updatedVehicles: Vehicle[];
      if (existingIdx >= 0) {
        updatedVehicles = [...vehicles];
        updatedVehicles[existingIdx] = {
          ...updatedVehicles[existingIdx],
          currentBay: selectedWashBay,
          bayEntryTime: new Date().toISOString(),
          assignedWorkerId: selectedStaffMember?.id,
          assignedWorkerName: selectedStaffMember?.name,
          washStage: 'Espuma',
          status: 'active',
        };
      } else {
        const newVehicle: Vehicle = {
          id: `veh-${Date.now()}`,
          plate: selectedRecord.plate,
          ownerName: selectedRecord.ownerName || 'Cliente Estacionamento / Pátio',
          phone: selectedRecord.phone || '',
          carModel: selectedRecord.carModel || 'Veículo',
          color: 'Branco',
          size: 'sedan',
          nfcTagId: '',
          hasNfcSticker: false,
          registeredDate: new Date().toISOString(),
          lastVisitDate: new Date().toISOString(),
          totalWashes: 0,
          currentCycleWashes: 0,
          freeWashesClaimed: 0,
          currentBay: selectedWashBay,
          bayEntryTime: new Date().toISOString(),
          assignedWorkerId: selectedStaffMember?.id,
          assignedWorkerName: selectedStaffMember?.name,
          washStage: 'Espuma',
          washHistory: [],
          status: 'active',
        };
        updatedVehicles = [newVehicle, ...vehicles];
      }
      onUpdateVehicles(updatedVehicles);
    }

    playPosSound('beep');
    setIsWashTransferModalOpen(false);
    onNotify(`Veículo [${selectedRecord.plate.number}] em local / vaga #${selectedRecord.slotNumber} por sucesso  Box ${selectedWashBay} para Lavagem.`);

    // If caller provided tab navigation, suggest jumping to cashier
    if (onNavigateToCashier) {
      onNavigateToCashier(selectedWashBay);
    }
  };

  // Re-dock car back from wash to parked
  const handleReturnFromWash = (record: ParkingRecord) => {
    const updated = parkingRecords.map((r) => {
      if (r.id === record.id) {
        return {
          ...r,
          status: 'parked' as const,
          linkedWashBay: undefined,
        };
      }
      return r;
    });
    onUpdateParkingRecords(updated);
    onNotify(`Veículo [${record.plate.number}] em lava-rápido Concluído   Nome Estacionamento / Pátio.`);
  };

  // Filtering for slots/records
  const filteredRecords = useMemo(() => {
    let list = parkingRecords;
    if (activeFilter === 'parked') {
      list = list.filter((r) => r.status === 'parked');
    } else if (activeFilter === 'washing') {
      list = list.filter((r) => r.status === 'washing');
    } else if (activeFilter === 'history') {
      list = list.filter((r) => r.status === 'exited');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          (r.plate?.number || '').includes(q) ||
          r.ticketNumber.toLowerCase().includes(q) ||
          (r.carModel && r.carModel.toLowerCase().includes(q)) ||
          (r.ownerName && r.ownerName.toLowerCase().includes(q))
      );
    }
    return list;
  }, [parkingRecords, activeFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-20 select-none" dir="ltr">
      {/* ============================================================= */}
      {/* HEADER SECTION: FACILITY SPECS & TOP ACTIONS                  */}
      {/* ============================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-xs">
                <Warehouse className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  por por Estacionamento / Pátio   (Garage Management)
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 font-bold">
                    Ativo • {capacity} local / vaga
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                  <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    por local / vaga: 1,070 ²
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    Valor de Mensal local / vaga: {formatR$(monthlyRent)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                    <Tag className="w-3.5 h-3.5" />
                    Preço / Valor : {formatR$(dailyRate)} (para Todos diasque)
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleOpenEntryModal()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Salvar / Registrar Veículo Novo (Entry Ticket)</span>
            </button>

            <button
              onClick={() => {
                const reportWindow = window.open('', '_blank');
                if (reportWindow) {
                  reportWindow.document.write(`
                    <html dir="ltr">
                      <head><title> Estacionamento / Pátio - ${new Date().toLocaleDateString('ku')}</title>
                      <style>body{font-family:system-ui,sans-serif;padding:20px;text-align:center;} table{width:100%;border-collapse:collapse;margin-top:20px;} th,td{border:1px solid #ccc;padding:8px;text-align:right;} th{background:#f0f0f0;}</style>
                      </head>
                      <body>
                        <h2>${settings.carWashName} -  Rápido Estacionamento / Pátio</h2>
                        <p>Data: ${new Date().toLocaleString('ku')}</p>
                        <p>Veículo emNome Estacionamento / Pátio: ${currentlyParkedCount} • local / vaga poraté: ${availableSlotsCount} • Faturamento Hoje: ${formatR$(todayRevenue)}</p>
                        <script>window.print();</script>
                      </body>
                    </html>
                  `);
                  reportWindow.document.close();
                }
              }}
              className="px-3.5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Impressão Resumo Estacionamento / Pátio"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span> Rápido</span>
            </button>
          </div>
        </div>

        {/* ============================================================= */}
        {/* METRICS ROW (4 HIGH-CONTRAST STATS)                           */}
        {/* ============================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          {/* 1. Parked Cars */}
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Veículo emNome Estacionamento / Pátio</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                <Car className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-blue-900 dark:text-blue-100 font-mono">
                  {totalOccupied}
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">em 30 local / vaga ({occupancyRate}%)</span>
              </div>
              <div className="w-full bg-blue-200/60 dark:bg-blue-900/40 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, occupancyRate)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 2. Free Slots */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">local / vaga poraté (dez)</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-emerald-900 dark:text-emerald-100 font-mono">
                  {availableSlotsCount}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">local / vaga dez</span>
              </div>
              <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/80 mt-1">
                 Pronto para Recebimento Cliente
              </p>
            </div>
          </div>

          {/* 3. Today's Revenue */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Faturamento Estacionamento / Pátio Hoje</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-100 font-mono">
                  {formatR$(todayRevenue)}
                </span>
              </div>
              <p className="text-[11px] text-amber-600/90 dark:text-amber-400/80 mt-1">
                em {todayAdmissionsCount} Veículo  Hoje
              </p>
            </div>
          </div>

          {/* 4. Rent Coverage (Insight: 600k rent is 20k/day) */}
          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/50 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Abrir Valor de local / vaga</span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-purple-900 dark:text-purple-100 font-mono">
                  {rentCoveragePercent}%
                </span>
                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                  (Meta: {dailyRentBreakEvenCars} Veículo/dias)
                </span>
              </div>
              <p className="text-[10px] text-purple-600/90 dark:text-purple-400/80 mt-1 truncate">
                Valor de 1,070 ² = Diário 20,000 R$
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* FILTER & SEARCH TABS                                          */}
      {/* ============================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
             Geral (30 local / vaga)
          </button>
          <button
            onClick={() => setActiveFilter('parked')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeFilter === 'parked'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span></span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20">{currentlyParkedCount}</span>
          </button>
          <button
            onClick={() => setActiveFilter('washing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeFilter === 'washing'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>em lava-rápido 🚿</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20">{currentlyWashingCount}</span>
          </button>
          <button
            onClick={() => setActiveFilter('history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeFilter === 'history'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Histórico de dezcomo (Logs)
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por Número Placa Modelo ou Recibo / Comprovante..."
            className="w-full pl-3 pr-9 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* 30-SLOT LIVE VISUAL GRID ( dois Estacionamento / Pátio)                 */}
      {/* ============================================================= */}
      {activeFilter !== 'history' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
            <span> por local / vaga (30 Veículo):</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> poraté
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> 
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> em lava-rápido
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: capacity }, (_, i) => i + 1).map((slotNum) => {
              const record = slotMap.get(slotNum);
              const isOccupied = !!record;
              const isWashing = record?.status === 'washing';

              // If filter applied and does not match, hide or dim
              if (activeFilter === 'parked' && (!isOccupied || isWashing)) return null;
              if (activeFilter === 'washing' && !isWashing) return null;

              if (
                searchQuery &&
                isOccupied &&
                !(record.plate?.number || '').includes(searchQuery) &&
                !record.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !(record.carModel && record.carModel.toLowerCase().includes(searchQuery.toLowerCase()))
              ) {
                return null;
              }

              if (!isOccupied) {
                // VACANT SLOT (🟢 poraté)
                return (
                  <div
                    key={`slot-${slotNum}`}
                    onClick={() => handleOpenEntryModal(slotNum)}
                    className="group border-2 border-dashed border-emerald-300 dark:border-emerald-800/60 hover:border-emerald-500 dark:hover:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-3xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[160px] active:scale-98"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 font-mono">
                        #{slotNum < 10 ? `0${slotNum}` : slotNum}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold">
                        poraté
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center py-2 text-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                      <Car className="w-8 h-8 opacity-40 group-hover:opacity-80" />
                      <span className="text-xs font-bold mt-1 text-slate-700 dark:text-slate-300">
                        local / vaga dez
                      </span>
                      <span className="text-[10px] text-slate-400">1,000 R$ / dias</span>
                    </div>

                    <button
                      type="button"
                      className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span></span>
                    </button>
                  </div>
                );
              }

              // OCCUPIED OR WASHING SLOT
              const elapsedMinutes = Math.floor(
                (Date.now() - new Date(record.entryTime).getTime()) / (1000 * 60)
              );
              const elapsedHours = Math.floor(elapsedMinutes / 60);

              return (
                <div
                  key={`slot-${slotNum}`}
                  className={`border-2 rounded-3xl p-3.5 transition-all duration-200 flex flex-col justify-between min-h-[175px] shadow-sm ${
                    isWashing
                      ? 'border-purple-300 dark:border-purple-700 bg-purple-50/70 dark:bg-purple-950/30'
                      : 'border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  {/* Slot Header */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono flex items-center gap-1">
                      <span>#{slotNum < 10 ? `0${slotNum}` : slotNum}</span>
                      <span className="text-[10px] text-slate-400 font-sans">({record.ticketNumber})</span>
                    </span>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        isWashing
                          ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-300 animate-pulse'
                          : 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200'
                      }`}
                    >
                      {isWashing ? `Box ${record.linkedWashBay} 🚿` : ''}
                    </span>
                  </div>

                  {/* Vehicle Plate */}
                  <div className="py-2 flex flex-col items-center">
                    <div className="scale-90 origin-center">
                      <PlateDisplay plate={record.plate} size="sm" />
                    </div>

                    <div className="text-center mt-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block truncate max-w-[140px]">
                        {record.carModel || 'Veículo'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        {elapsedHours > 0
                          ? `${elapsedHours} Horário  ${elapsedMinutes % 60} Minutos`
                          : `${elapsedMinutes} Minutos empor`}
                      </span>
                    </div>
                  </div>

                  {/* Rate & Fee Info */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-mono">
                      {formatR$(record.fee)}
                    </span>
                    <span
                      className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                        record.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {record.paymentStatus === 'paid' ? 'pago ✅' : 'Horário saída ⏳'}
                    </span>
                  </div>

                  {/* Slot Actions */}
                  <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                    {/* Send to Wash or Return */}
                    {isWashing ? (
                      <button
                        onClick={() => handleReturnFromWash(record)}
                        className="py-1 px-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold flex items-center justify-center gap-0.5 cursor-pointer"
                        title="Buscar para  "
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Concluído</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenWashTransfer(record)}
                        className="py-1 px-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold flex items-center justify-center gap-0.5 cursor-pointer"
                        title="Enviar este Veículo para Box Lavagem"
                      >
                        <Droplets className="w-3 h-3 text-indigo-500" />
                        <span>lava-rápido 🚿</span>
                      </button>
                    )}

                    {/* Exit & Checkout */}
                    <button
                      onClick={() => handleOpenExitModal(record)}
                      className="py-1 px-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-bold flex items-center justify-center gap-0.5 cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>saída</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ============================================================= */
        /* EXITED LOGS / HISTORY TABLE                                   */
        /* ============================================================= */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Histórico de saída Veículos Estacionamento / Pátio
            </h3>
            <span className="text-xs text-slate-500">{filteredRecords.length} Registrar</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Número Recibo / Comprovante</th>
                  <th className="p-3">Placa</th>
                  <th className="p-3">Modelo</th>
                  <th className="p-3">local / vaga</th>
                  <th className="p-3">Horário </th>
                  <th className="p-3">Horário saída</th>
                  <th className="p-3">Quantidade Valor</th>
                  <th className="p-3">Método Pagamento</th>
                  <th className="p-3 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Nenhum Registrar saída .
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {r.ticketNumber}
                      </td>
                      <td className="p-3">
                        <span className="font-mono font-black text-slate-900 dark:text-white">
                          {r.plate.type === 'unified'
                            ? `${r.plate.provinceCode} ${r.plate.letter} ${r.plate.number}`
                            : `${r.plate.oldCityName} ${r.plate.number}`}
                        </span>
                      </td>
                      <td className="p-3">{r.carModel || '-'}</td>
                      <td className="p-3 font-mono">#{r.slotNumber}</td>
                      <td className="p-3 font-mono text-slate-500">
                        {new Date(r.entryTime).toLocaleTimeString('ku', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3 font-mono text-slate-500">
                        {r.exitTime
                          ? new Date(r.exitTime).toLocaleTimeString('ku', { hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatR$(r.fee)}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                          {r.paymentMethod === 'fib'
                            ? 'FIB'
                            : r.paymentMethod === 'fastpay'
                            ? 'FastPay'
                            : ' (Dinheiro)'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedRecord(r);
                            setIsPrintModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                          title="Impressão dois"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 1. ENTRY MODAL (Registro de Veículo em Estacionamento / Pátio)                         */}
      {/* ============================================================= */}
      {isEntryModalOpen && (
        <div
          dir="ltr"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
          onClick={() => setIsEntryModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl p-5 sm:p-6 space-y-4 my-auto animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Warehouse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Salvar / Registrar Veículo para  (Entry Ticket)
                  </h3>
                  <p className="text-[11px] text-slate-500">local / vaga Selecionado: #{assignedSlot}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEntryModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEntry} className="space-y-4">
              {/* Plate Type Toggle */}
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setPlateType('unified')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    plateType === 'unified'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Placa Nova Mercosul (Unified)
                </button>
                <button
                  type="button"
                  onClick={() => setPlateType('old')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    plateType === 'old'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Placa Antiga
                </button>
              </div>

              {/* License Plate Inputs */}
              {plateType === 'unified' ? (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Estado / Cidade</label>
                    <select
                      required
                      value={provinceCode}
                      onChange={(e) => setProvinceCode(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="" disabled>UF / cidade</option>
                      {OFFICIAL_PROVINCES.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.code} - {p.nameKu}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Letra</label>
                    <select
                      required
                      value={plateLetter}
                      onChange={(e) => setPlateLetter(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white font-mono"
                    >
                      <option value="" disabled>Letra</option>
                      {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Número *</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder=""
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Cidade</label>
                    <select
                      value={oldCity}
                      onChange={(e) => setOldCity(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    >
                      {OLD_PLATE_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Tipo</label>
                    <select
                      value={oldCategory}
                      onChange={(e) => setOldCategory(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    >
                      {OLD_PLATE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Número *</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={oldNumber}
                      onChange={(e) => setOldNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder=""
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Car Model & Slot Selector */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Modelo Veículo</label>
                  <input
                    type="text"
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    placeholder="Toyota Camry / Hilux..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">local / vaga  (Slot)</label>
                  <select
                    value={assignedSlot}
                    onChange={(e) => setAssignedSlot(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white font-mono"
                  >
                    {Array.from({ length: capacity }, (_, i) => i + 1).map((s) => {
                      const isFree = !slotMap.has(s) || s === selectedSlotForEntry;
                      return (
                        <option key={s} value={s} disabled={!isFree}>
                          local / vaga #{s} {isFree ? '(poraté)' : '()'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Rate & Fee Option */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block">Tipo Profissional  Aluguel / Comercial</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRateType('daily')}
                    className={`p-2.5 rounded-2xl border text-center transition cursor-pointer ${
                      rateType === 'daily'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="block text-xs font-black">Diário ()</span>
                    <span className="text-[11px] font-mono font-bold text-amber-600">1,000 R$</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRateType('overnight')}
                    className={`p-2.5 rounded-2xl border text-center transition cursor-pointer ${
                      rateType === 'overnight'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="block text-xs font-black"> ()</span>
                    <span className="text-[11px] font-mono font-bold text-amber-600">3,000 R$</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRateType('monthly')}
                    className={`p-2.5 rounded-2xl border text-center transition cursor-pointer ${
                      rateType === 'monthly'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="block text-xs font-black">Mensal</span>
                    <span className="text-[11px] font-mono font-bold text-amber-600">25,000 R$</span>
                  </button>
                </div>
              </div>

              {/* Payment timing & method */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Pagamento:</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="payTiming"
                        checked={isPrepaid}
                        onChange={() => setIsPrepaid(true)}
                        className="accent-amber-500"
                      />
                      <span>até  (pago)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="payTiming"
                        checked={!isPrepaid}
                        onChange={() => setIsPrepaid(false)}
                        className="accent-amber-500"
                      />
                      <span>Horário saída dez</span>
                    </label>
                  </div>
                </div>

                {isPrepaid && (
                  <div className="flex gap-1.5 pt-1">
                    {(['cash', 'fib', 'fastpay'] as PaymentMethod[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                          paymentMethod === m
                            ? 'bg-amber-500 text-slate-950 border-amber-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {m === 'cash' ? '💵 ' : m === 'fib' ? '📱 FIB' : '⚡ FastPay'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Salvar / Registrar  dez Recibo / Comprovante (Print)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 2. EXIT & CHECKOUT MODAL (Recibo saída)                      */}
      {/* ============================================================= */}
      {isExitModalOpen && selectedRecord && (
        <div
          dir="ltr"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setIsExitModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-5 sm:p-6 space-y-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    saída Veículo   Recibo / Comprovante
                  </h3>
                  <p className="text-[11px] text-slate-500">local / vaga #{selectedRecord.slotNumber} • {selectedRecord.ticketNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setIsExitModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-3">
              <div className="flex justify-center">
                <PlateDisplay plate={selectedRecord.plate} size="md" />
              </div>

              <div className="text-xs space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Modelo:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedRecord.carModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Horário :</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {new Date(selectedRecord.entryTime).toLocaleTimeString('ku', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quantidade Valor de Estacionamento / Pátio:</span>
                  <span className="font-mono font-black text-emerald-600 text-sm">
                    {formatR$(selectedRecord.fee)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                Método Recebimento Valor Aluguel / Comercial ({formatR$(selectedRecord.fee)}):
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleConfirmExit('cash')}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex flex-col items-center justify-center cursor-pointer shadow-xs"
                >
                  <span>💵  (Dinheiro)</span>
                </button>
                <button
                  onClick={() => handleConfirmExit('fib')}
                  className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex flex-col items-center justify-center cursor-pointer shadow-xs"
                >
                  <span>📱 FIB</span>
                </button>
                <button
                  onClick={() => handleConfirmExit('fastpay')}
                  className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex flex-col items-center justify-center cursor-pointer shadow-xs"
                >
                  <span>⚡ FastPay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 3. SEND TO WASH MODAL (Enviar Veículo para lava-rápido)                 */}
      {/* ============================================================= */}
      {isWashTransferModalOpen && selectedRecord && (
        <div
          dir="ltr"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setIsWashTransferModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-5 sm:p-6 space-y-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Enviar Veículo  para Box de Lavagem
                  </h3>
                  <p className="text-[11px] text-slate-500">  • em Horário Lavagem local / vagaque protegido</p>
                </div>
              </div>
              <button
                onClick={() => setIsWashTransferModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center py-1">
              <PlateDisplay plate={selectedRecord.plate} size="sm" />
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                  Box Lavagem (Bay):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedWashBay(b)}
                      className={`py-2 rounded-xl border text-xs font-black transition cursor-pointer ${
                        selectedWashBay === b
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Box {b}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Serviço Lavagem:
                </label>
                <select
                  value={selectedWashServiceId}
                  onChange={(e) => setSelectedWashServiceId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                >
                  {services
                    .filter((s) => s.category !== 'Lavagem Tapete' && s.category !== 'Lavagem Estofado / Sofá')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} - {formatR$(s.price)}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Profissional por:
                </label>
                <select
                  value={selectedWashStaffId}
                  onChange={(e) => setSelectedWashStaffId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                >
                  {staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleConfirmWashTransfer}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer"
              >
                <Droplets className="w-4 h-4" />
                <span>  Box {selectedWashBay}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsWashTransferModalOpen(false)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 4. PRINT MODAL (Recibo 80 Estacionamento / Pátio para Impressãoque )          */}
      {/* ============================================================= */}
      {isPrintModalOpen && selectedRecord && (
        <div
          dir="ltr"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
          onClick={() => setIsPrintModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full shadow-2xl p-5 space-y-4 my-auto animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 no-print">
              <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-amber-500" />
                Recibo Oficial Estacionamento / Pátio (80mm Receipt)
              </span>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Thermal Ticket Content */}
            <div
              id="printable-parking-ticket"
              className="bg-white text-slate-950 p-4 rounded-xl border-2 border-dashed border-slate-300 font-mono text-xs space-y-2.5 select-none"
            >
              <div className="text-center space-y-0.5 border-b-2 border-dashed border-slate-300 pb-2">
                <h2 className="text-base font-black font-sans">{settings.carWashName}</h2>
                <p className="text-[10px] text-slate-600 font-sans">por Estacionamento / Pátio   Veículo</p>
                <p className="text-[9px] text-slate-500 font-sans">em: {settings.carWashPhone}</p>
                <p className="text-[9px] text-slate-500 font-sans">por: 1,070 ² • Aluguel / Comercial: 600,000 R$</p>
              </div>

              <div className="flex justify-center py-1">
                <PlateDisplay plate={selectedRecord.plate} size="sm" />
              </div>

              <div className="text-center bg-slate-100 py-1.5 rounded-lg">
                <span className="text-[10px] text-slate-500 block">Número local / vaga (Slot)</span>
                <span className="text-2xl font-black font-mono">#{selectedRecord.slotNumber}</span>
              </div>

              <div className="space-y-1 text-[11px] font-sans border-b-2 border-dashed border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Número Recibo / Comprovante:</span>
                  <span className="font-mono font-bold">{selectedRecord.ticketNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Veículo:</span>
                  <span className="font-bold">{selectedRecord.carModel || 'Veículo'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Horário :</span>
                  <span className="font-mono">
                    {new Date(selectedRecord.entryTime).toLocaleString('ku', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Preço / Valor Profissional:</span>
                  <span className="font-mono font-bold text-slate-900">{formatR$(selectedRecord.fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Status Valor:</span>
                  <span className="font-bold">
                    {selectedRecord.paymentStatus === 'paid' ? 'pago (Dinheiro) ✅' : 'Horário saída ⏳'}
                  </span>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-500 font-sans space-y-0.5 pt-1">
                <p className="font-bold">Por favor em Horário saída este Recibo  Funcionário dez.</p>
                <p>Estacionamento / Pátio por não há em cada que por Nome Veículo.</p>
              </div>
            </div>

            {/* Print Buttons */}
            <div className="flex gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir (Print 80mm)</span>
              </button>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
