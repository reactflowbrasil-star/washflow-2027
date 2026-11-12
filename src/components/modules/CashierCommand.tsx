'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Vehicle,
  ServiceItem,
  StaffMember,
  AppSettings,
  LicensePlate,
  VehicleSize,
  PlateType,
  PaymentMethod,
  DailyZReport,
  WashRecord,
  Expense,
  SelectedCafeItem,
  ParkingRecord,
  CarpetSpecs,
  Branch,
} from '@/types';
import { PlateDisplay } from '@/components/ui/PlateDisplay';
import { PlateCameraScanner, PlateScanResult } from '@/components/ui/PlateCameraScanner';
import { ReceiptModal } from '@/components/ui/ReceiptModal';
import { ZReportModal } from '@/components/ui/ZReportModal';
import { DebtManagementModal } from '@/components/ui/DebtManagementModal';
import { PettyCashModal } from '@/components/ui/PettyCashModal';
import { SubscriptionModal } from '@/components/ui/SubscriptionModal';
import { CafeAddonModal } from '@/components/ui/CafeAddonModal';
import {
  formatR$,
  getSavedInventory,
  saveInventory,
  getSavedExpenses,
  saveExpenses,
  normalizeDigits,
  playPosSound,
  getSavedZReports,
  saveZReports,
  getVehicleTotalDebt,
  isDateToday,
  pullServerDatabase,
  getSavedVehicles,
  seedTodaySalesData,
} from '@/lib/storage';
import { OFFICIAL_PROVINCES, OLD_PLATE_CITIES, OLD_PLATE_CATEGORIES, UNIFIED_PLATE_LETTERS } from '@/constants/provinces';
import { generateCarReadyMessage, openWhatsAppChat } from '@/lib/whatsapp';
import { sendTelegramMessage, formatDailyZReportTelegram } from '@/lib/telegram';
import {
  Car,
  CheckCircle2,
  Sparkles,
  Printer,
  Plus,
  Play,
  User,
  Layers,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  X,
  Volume2,
  VolumeX,
  Receipt,
  Coins,
  DollarSign,
  Wallet,
  CreditCard,
  Crown,
  Coffee,
  MessageCircle,
  LogOut,
  Trash2,
  RotateCw,
  Building2,
  Search,
} from 'lucide-react';

interface CashierCommandProps {
  vehicles: Vehicle[];
  services: ServiceItem[];
  staff: StaffMember[];
  settings: AppSettings;
  parkingRecords?: ParkingRecord[];
  onUpdateVehicles: (vehicles: Vehicle[]) => void;
  onNotify: (msg: string) => void;
  initialBay?: number;
  branches?: Branch[];
  activeBranchId?: string;
  onSwitchBranch?: (branchId: string) => void;
}

export const CashierCommand: React.FC<CashierCommandProps> = ({
  vehicles,
  services,
  staff,
  settings,
  parkingRecords = [],
  onUpdateVehicles,
  onNotify,
  initialBay,
  branches = [],
  activeBranchId = 'branch-1',
  onSwitchBranch,
}) => {
  const currentBranch = useMemo(() => {
    return (branches || []).find((b) => b.id === activeBranchId) || (branches || [])[0];
  }, [branches, activeBranchId]);

  const numBays = Math.max(1, Math.min(6, currentBranch?.numberOfBays || settings.numberOfBays || 3));
  const bays = Array.from({ length: numBays }, (_, i) => i + 1);

  const effectiveReceiptSettings = useMemo(() => {
    if (!currentBranch) return settings;
    return {
      ...settings,
      carWashName: `${settings.carWashName} - ${currentBranch.name}`,
      carWashAddress: currentBranch.address || settings.carWashAddress,
      carWashPhone: currentBranch.phone || settings.carWashPhone,
    };
  }, [settings, currentBranch]);

  // -------------------------------------------------------------
  // 1. FAST REGISTRATION FORM STATE (Caixa Rápido)
  // -------------------------------------------------------------
  const [plateType, setPlateType] = useState<PlateType>('unified');
  const [provinceCode, setProvinceCode] = useState('21');
  const [plateLetter, setPlateLetter] = useState('A');
  const [plateNumber, setPlateNumber] = useState('');
  const [oldCity, setOldCity] = useState('Campinas');
  const [oldCategory, setOldCategory] = useState('Particular');
  const [oldNumber, setOldNumber] = useState('');

  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [carModel, setCarModel] = useState('');
  const [color, setColor] = useState('');
  const [vehicleSize, setVehicleSize] = useState<VehicleSize>('sedan');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [targetBay, setTargetBay] = useState<number | 0>(initialBay ?? 0); // 0 = Auto-detect first empty bay or Queue
  const [assignedStaffId, setAssignedStaffId] = useState<string>(staff[0]?.id || '');

  // -------------------------------------------------------------
  // CARPET & UPHOLSTERY LAUNDRY REGISTRATION STATE (Lavagem Tapete)
  // -------------------------------------------------------------
  const [entryMode, setEntryMode] = useState<'car' | 'carpet'>('car');
  const [carpetType, setCarpetType] = useState('Lavagem Tapete por ');
  const [carpetLength, setCarpetLength] = useState('4');
  const [carpetWidth, setCarpetWidth] = useState('3');
  const [carpetAreaM2, setCarpetAreaM2] = useState('12');
  const [carpetPiecesCount, setCarpetPiecesCount] = useState(1);
  const [carpetRatePerM2, setCarpetRatePerM2] = useState(2500);
  const [carpetReadyDays, setCarpetReadyDays] = useState(1);
  const [carpetNotes, setCarpetNotes] = useState('');

  const handleCarpetDimensionChange = (newLen: string, newWid: string) => {
    setCarpetLength(newLen);
    setCarpetWidth(newWid);
    const l = parseFloat(newLen) || 0;
    const w = parseFloat(newWid) || 0;
    if (l > 0 && w > 0) {
      setCarpetAreaM2(String(Math.round(l * w * 10) / 10));
    }
  };

  const parsedArea = parseFloat(carpetAreaM2) || 0;
  const isSofaFixed = carpetType.includes('Estofado / Sofá') && !carpetType.includes('metros');
  const totalCarpetCalculatedPrice = isSofaFixed
    ? (carpetType.includes('até') ? 6000 * carpetPiecesCount : 40000 * carpetPiecesCount)
    : Math.round(parsedArea * carpetRatePerM2 * carpetPiecesCount);

  // Active Branch & Sales Feed state (Unidade 1 / Unidade 2 (Filial))
  const [selectedBranch, setSelectedBranch] = useState<'branch-1' | 'branch-2'>(
    (activeBranchId as any) === 'branch-2' ? 'branch-2' : 'branch-1'
  );
  const [salesSearch, setSalesSearch] = useState('');
  const [salesBranchFilter, setSalesBranchFilter] = useState<'all' | 'branch-1' | 'branch-2'>('all');

  useEffect(() => {
    if (activeBranchId === 'branch-1' || activeBranchId === 'branch-2') {
      setSelectedBranch(activeBranchId);
    }
  }, [activeBranchId]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('carwash_v1_active_branch') || localStorage.getItem('carwash_active_branch');
      if (saved === 'branch-1' || saved === 'branch-2') {
        setSelectedBranch(saved as any);
      }
    } catch {
      // ignore
    }
  }, []);

  // Sound feedback state
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Mobile View Switcher (All / Bays Only / Register Only)
  const [mobileActiveView, setMobileActiveView] = useState<'all' | 'bays' | 'register'>('all');

  // -------------------------------------------------------------
  // 3. LIVE BAY TIMERS (- Todos 10 Segundos )
  // -------------------------------------------------------------
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // -------------------------------------------------------------
  // 4. CHECKOUT, PAYMENT METHODS & RECEIPT MODALS
  // -------------------------------------------------------------
  const [checkoutVehicle, setCheckoutVehicle] = useState<Vehicle | null>(null);
  const [checkoutServiceId, setCheckoutServiceId] = useState<string>(services[0]?.id || '');
  const [checkoutStaffId, setCheckoutStaffId] = useState<string>(staff[0]?.id || '');
  const [checkoutVehicleSize, setCheckoutVehicleSize] = useState<VehicleSize>('sedan');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<PaymentMethod>('cash');
  const [checkoutDebtNote, setCheckoutDebtNote] = useState('');
  const [checkoutIsRainWarranty, setCheckoutIsRainWarranty] = useState(false);
  const [checkoutHasScratches, setCheckoutHasScratches] = useState(false);
  const [checkoutHasDents, setCheckoutHasDents] = useState(false);
  const [checkoutHasBrokenParts, setCheckoutHasBrokenParts] = useState(false);
  const [checkoutDamageNotes, setCheckoutDamageNotes] = useState('');
  const [checkoutCustomCommission, setCheckoutCustomCommission] = useState<number | null>(null);

  // VIP Subscription & Cafe Add-ons
  const [subscriptionVehicle, setSubscriptionVehicle] = useState<Vehicle | null>(null);
  const [cafeModalVehicle, setCafeModalVehicle] = useState<Vehicle | null>(null);
  const [bayCafeOrders, setBayCafeOrders] = useState<Record<number, SelectedCafeItem[]>>({});
  const [checkoutCafeItems, setCheckoutCafeItems] = useState<SelectedCafeItem[]>([]);

  const calculateWorkerCommission = (worker: StaffMember | undefined, price: number): number => {
    if (!worker) return 0;
    if (worker.commissionType === 'percentage') {
      const pct = worker.commissionValue !== undefined ? worker.commissionValue : 25;
      return Math.round((price * pct) / 100);
    }
    if (worker.commissionType === 'none') {
      return 0;
    }
    return worker.commissionValue !== undefined ? worker.commissionValue : 2000;
  };

  const [printedReceiptData, setPrintedReceiptData] = useState<{
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
    chargedPrice: number;
    vehicleSize?: VehicleSize;
    paymentMethod: PaymentMethod;
    isDebt?: boolean;
  } | null>(null);

  // -------------------------------------------------------------
  // 6. Z-REPORT, DEBT & PETTY CASH MODALS
  // -------------------------------------------------------------
  const [showZReportModal, setShowZReportModal] = useState(false);
  const [showDebtListModal, setShowDebtListModal] = useState(false);
  const [showPettyCashModal, setShowPettyCashModal] = useState(false);

  // Happy Hour Clock & Real-time Active Check
  const [nowClock, setNowClock] = useState('');
  useEffect(() => {
    const update = () => {
      const d = new Date();
      setNowClock(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      );
    };
    update();
    const timer = setInterval(update, 20000);
    return () => clearInterval(timer);
  }, []);

  const isHappyHourActive = !!(
    settings.happyHourEnabled &&
    settings.happyHourStart &&
    settings.happyHourEnd &&
    nowClock >= settings.happyHourStart &&
    nowClock <= settings.happyHourEnd
  );
  const happyHourDiscountPercent = isHappyHourActive ? settings.happyHourDiscountPercent || 15 : 0;

  // Quick Bay Assignment Modal from Queue
  const [assignBayModal, setAssignBayModal] = useState<number | null>(null);
  const [assignVehicleId, setAssignVehicleId] = useState<string>('');
  const [assignWorkerId, setAssignWorkerId] = useState<string>('');

  // Calculate dynamic price based on vehicle category/size
  const calculateServicePrice = (srv: ServiceItem, size: VehicleSize): number => {
    if (srv.pricesBySize && typeof srv.pricesBySize[size] === 'number') {
      return srv.pricesBySize[size]!;
    }
    return srv.price;
  };

  // Unpaid Debt Cars Calculation
  const unpaidRecordsList = vehicles.flatMap((v) =>
    (v.washHistory || [])
      .filter((w) => w.paymentStatus === 'unpaid' || w.paymentMethod === 'debt')
      .map((w) => ({ vehicle: v, record: w }))
  );
  const totalDebtOutstanding = unpaidRecordsList.reduce(
    (sum, item) => sum + (Number(item.record.price) || 0),
    0
  );

  // Settle Debt Record
  const handleSettleDebtRecord = (
    vehicleId: string,
    recordId: string,
    method: PaymentMethod = 'cash'
  ) => {
    const updated = vehicles.map((v) => {
      if (v.id === vehicleId) {
        return {
          ...v,
          washHistory: v.washHistory.map((w) =>
            w.id === recordId
              ? {
                  ...w,
                  paymentStatus: 'paid' as const,
                  paymentMethod: method,
                  paidAt: new Date().toISOString(),
                }
              : w
          ),
        };
      }
      return v;
    });
    onUpdateVehicles(updated);
    if (soundEnabled) playPosSound('success');
    onNotify('Fiado / Débito pendenteque por sucesso   em  Salvo com sucesso.');
  };

  // Autocomplete & Live Search State for License Plate
  const [showPlateSuggestions, setShowPlateSuggestions] = useState(false);
  const lastAutoFilledIdRef = useRef<string | null>(null);
  const clearedVehicleIdRef = useRef<string | null>(null);
  const plateContainerRef = useRef<HTMLDivElement>(null);

  const applyScannedPlate = (result: PlateScanResult) => {
    if (result.type === 'unified') {
      setPlateType('unified');
      if (result.provinceCode) setProvinceCode(result.provinceCode);
      if (result.letter) setPlateLetter(result.letter);
      if (result.number) setPlateNumber(result.number);
    } else {
      setPlateType('old');
      if (result.oldNumber) setOldNumber(result.oldNumber);
    }
    setShowPlateSuggestions(true);
  };

  // Close suggestions dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        plateContainerRef.current &&
        !plateContainerRef.current.contains(event.target as Node)
      ) {
        setShowPlateSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Find if current entered plate matches an existing customer in database
  const matchedExistingVehicle = useMemo(() => {
    const cleanPlateNum = normalizeDigits(plateNumber.trim());
    const cleanOldNum = normalizeDigits(oldNumber.trim());

    return vehicles.find((v) => {
      if (plateType === 'unified' && v.plate.type === 'unified') {
        return (
          cleanPlateNum !== '' &&
          v.plate.provinceCode === provinceCode &&
          v.plate.letter?.toUpperCase() === plateLetter.toUpperCase() &&
          normalizeDigits(v.plate.number || '') === cleanPlateNum
        );
      }
      if (plateType === 'old' && v.plate.type === 'old') {
        return (
          cleanOldNum !== '' &&
          v.plate.oldCityName === oldCity &&
          normalizeDigits(v.plate.oldNumber || '') === cleanOldNum
        );
      }
      return false;
    });
  }, [vehicles, plateType, provinceCode, plateLetter, plateNumber, oldCity, oldNumber]);

  // Active query digits/text
  const activePlateDigits = normalizeDigits(
    (plateType === 'unified' ? plateNumber : oldNumber).trim()
  );

  // Live matching vehicles suggestions for autocomplete dropdown (como três  sem)
  const matchingVehicleSuggestions = useMemo(() => {
    if (!activePlateDigits || activePlateDigits.length < 1) return [];

    const query = activePlateDigits.toLowerCase();

    return vehicles
      .filter((v) => {
        const unifiedNum = normalizeDigits(v.plate.number || '');
        const oldNum = normalizeDigits(v.plate.oldNumber || '');
        const phoneClean = normalizeDigits(v.phone || '');
        const ownerLower = (v.ownerName || '').toLowerCase();
        const modelLower = (v.carModel || '').toLowerCase();

        return (
          unifiedNum.includes(query) ||
          oldNum.includes(query) ||
          phoneClean.includes(query) ||
          ownerLower.includes(query) ||
          modelLower.includes(query)
        );
      })
      .sort((a, b) => {
        // 1. Exact match on plate number first
        const aExact =
          normalizeDigits(a.plate.number || '') === query ||
          normalizeDigits(a.plate.oldNumber || '') === query;
        const bExact =
          normalizeDigits(b.plate.number || '') === query ||
          normalizeDigits(b.plate.oldNumber || '') === query;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // 2. Matching selected province/letter
        if (plateType === 'unified') {
          const aMatch =
            a.plate.provinceCode === provinceCode &&
            a.plate.letter?.toUpperCase() === plateLetter.toUpperCase();
          const bMatch =
            b.plate.provinceCode === provinceCode &&
            b.plate.letter?.toUpperCase() === plateLetter.toUpperCase();
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
        }

        // 3. Higher visits first
        return (b.totalWashes || 0) - (a.totalWashes || 0);
      })
      .slice(0, 6);
  }, [vehicles, activePlateDigits, plateType, provinceCode, plateLetter]);

  // Handle selecting an existing vehicle from live search suggestions
  const handleSelectExistingVehicle = (v: Vehicle, isSilent = false) => {
    clearedVehicleIdRef.current = null;
    lastAutoFilledIdRef.current = v.id;

    if (v.plate.type === 'unified') {
      setPlateType('unified');
      if (v.plate.provinceCode) setProvinceCode(v.plate.provinceCode);
      if (v.plate.letter) setPlateLetter(v.plate.letter.toUpperCase());
      if (v.plate.number) setPlateNumber(normalizeDigits(v.plate.number));
    } else if (v.plate.type === 'old') {
      setPlateType('old');
      if (v.plate.oldCityName) setOldCity(v.plate.oldCityName);
      if (v.plate.oldCategory) setOldCategory(v.plate.oldCategory);
      if (v.plate.oldNumber) setOldNumber(normalizeDigits(v.plate.oldNumber));
    }

    setOwnerName(v.ownerName || '');
    setPhone(v.phone || '');
    setCarModel(v.carModel || '');
    setColor(v.color || '');
    if (v.size) {
      setVehicleSize(v.size);
    }

    setShowPlateSuggestions(false);

    if (!isSilent) {
      if (soundEnabled) playPosSound('beep');
      onNotify(`✨ informaçõesum (${v.ownerName || 'o Veículo'}) por sucesso `);
    }
  };

  // Reset/clear vehicle fields manually
  const handleClearVehicleInputs = () => {
    if (matchedExistingVehicle) {
      clearedVehicleIdRef.current = matchedExistingVehicle.id;
    }
    setOwnerName('');
    setPhone('');
    setCarModel('');
    setColor('');
    setShowPlateSuggestions(false);
    if (soundEnabled) playPosSound('beep');
    onNotify(' por sucesso  para Dar Entrada Novo Cliente.');
  };

  // Automatic auto-fill on exact plate match
  useEffect(() => {
    if (!matchedExistingVehicle) {
      if (lastAutoFilledIdRef.current && lastAutoFilledIdRef.current !== 'manual_cleared') {
        lastAutoFilledIdRef.current = null;
      }
      clearedVehicleIdRef.current = null;
      return;
    }

    // Do not overwrite if user explicitly cleared this vehicle's inputs
    if (clearedVehicleIdRef.current === matchedExistingVehicle.id) {
      return;
    }

    // Auto-fill when exact plate match is detected
    if (lastAutoFilledIdRef.current !== matchedExistingVehicle.id) {
      lastAutoFilledIdRef.current = matchedExistingVehicle.id;
      setOwnerName(matchedExistingVehicle.ownerName || '');
      setPhone(matchedExistingVehicle.phone || '');
      setCarModel(matchedExistingVehicle.carModel || '');
      setColor(matchedExistingVehicle.color || '');
      if (matchedExistingVehicle.size) {
        setVehicleSize(matchedExistingVehicle.size);
      }
      setShowPlateSuggestions(false);
    }
  }, [matchedExistingVehicle]);

  // Handle stage change for a vehicle in bay
  const handleStageChange = (vehicleId: string, nextStage: Vehicle['washStage']) => {
    const updated = vehicles.map((v) => {
      if (v.id === vehicleId) {
        return { ...v, washStage: nextStage };
      }
      return v;
    });
    onUpdateVehicles(updated);
    if (soundEnabled) playPosSound('beep');
    onNotify(`etapa o Veículo  para: ${nextStage}`);
  };

  // Open Checkout Modal
  const handleInitiateCheckout = (vehicle: Vehicle) => {
    setCheckoutVehicle(vehicle);
    const defaultCarService = services.find((s) => s.category === 'Veículo') || services[0];
    setCheckoutServiceId(defaultCarService?.id || '');
    setCheckoutStaffId(vehicle.assignedWorkerId || staff[0]?.id || '');

    // Auto-detect vehicle size or fallback smartly
    const model = (vehicle.carModel || '').toLowerCase();
    const isLikelySuv =
      model.includes('cruiser') ||
      model.includes('prado') ||
      model.includes('tahoe') ||
      model.includes('jeep') ||
      model.includes('patrol') ||
      model.includes('rover');
    const isLikelyTruck =
      model.includes('hilux') ||
      model.includes('pickup') ||
      model.includes('silverado') ||
      model.includes('sierra');
    const autoSize: VehicleSize = vehicle.size || (isLikelyTruck ? 'truck' : isLikelySuv ? 'suv' : 'sedan');
    setCheckoutVehicleSize(autoSize);

    setCheckoutPaymentMethod('cash');
    setCheckoutDebtNote('');
    setCheckoutIsRainWarranty(false);
    setCheckoutHasScratches(vehicle.damageInspection?.hasScratches || false);
    setCheckoutHasDents(vehicle.damageInspection?.hasDents || false);
    setCheckoutHasBrokenParts(vehicle.damageInspection?.brokenParts || false);
    setCheckoutDamageNotes(vehicle.damageInspection?.notes || '');
    setCheckoutCustomCommission(null);
    // Pre-populate cafe items from bay if ordered
    const bayItems = vehicle.currentBay ? bayCafeOrders[vehicle.currentBay] || [] : [];
    setCheckoutCafeItems(bayItems);
  };

  // Confirm Payment & Print Receipt
  const handleConfirmPayment = () => {
    if (!checkoutVehicle) return;

    const srv = services.find((s) => s.id === checkoutServiceId) || services[0];
    const worker = staff.find((st) => st.id === checkoutStaffId) || staff[0];

    // Check VIP subscription
    const isVipSubscription =
      checkoutVehicle.subscription?.status === 'active' &&
      new Date(checkoutVehicle.subscription.endDate) > new Date();

    const isLoyaltyFree = checkoutVehicle.currentCycleWashes >= settings.washesNeededForFree;
    const isFree = isLoyaltyFree || checkoutIsRainWarranty || isVipSubscription;
    const freeReason: 'loyalty' | 'rain_warranty' | undefined = isLoyaltyFree
      ? 'loyalty'
      : checkoutIsRainWarranty
      ? 'rain_warranty'
      : undefined;

    const carpetCost = checkoutVehicle.carpetSpecs
      ? Math.round(
          (checkoutVehicle.carpetSpecs.areaSquareMeters > 0
            ? checkoutVehicle.carpetSpecs.areaSquareMeters * checkoutVehicle.carpetSpecs.ratePerSquareMeter
            : checkoutVehicle.carpetSpecs.ratePerSquareMeter) *
            (checkoutVehicle.carpetSpecs.piecesCount || 1)
        )
      : undefined;

    const computedPrice = carpetCost !== undefined ? carpetCost : calculateServicePrice(srv, checkoutVehicleSize);
    let discountAmount = 0;
    let discountReason: string | undefined = undefined;

    if (isHappyHourActive && !isFree) {
      discountAmount = Math.round((computedPrice * happyHourDiscountPercent) / 100);
      discountReason = `Happy Hour (${happyHourDiscountPercent}%)`;
    }

    const washPrice = isFree ? 0 : Math.max(0, computedPrice - discountAmount);
    const cafeTotal = checkoutCafeItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const finalPrice = washPrice + cafeTotal;
    const isDebt = finalPrice > 0 && checkoutPaymentMethod === 'debt';

    const damageInspectionData =
      checkoutHasScratches || checkoutHasDents || checkoutHasBrokenParts || checkoutDamageNotes.trim()
        ? {
            hasScratches: checkoutHasScratches,
            hasDents: checkoutHasDents,
            brokenParts: checkoutHasBrokenParts,
            notes: checkoutDamageNotes.trim() || undefined,
            inspectedAt: new Date().toISOString(),
          }
        : undefined;

    const workerCommission =
      checkoutCustomCommission !== null
        ? checkoutCustomCommission
        : calculateWorkerCommission(worker, washPrice);

    const newRecord: WashRecord = {
      id: `w-${Date.now()}`,
      date: new Date().toISOString(),
      serviceId: srv.id,
      serviceName: srv.name,
      price: finalPrice,
      isFree,
      freeReason,
      vehicleSize: checkoutVehicleSize,
      staffId: worker?.id,
      staffName: worker?.name,
      bayNumber: checkoutVehicle.currentBay,
      paymentMethod: isFree && cafeTotal === 0 ? 'cash' : checkoutPaymentMethod,
      paymentStatus: isDebt ? 'unpaid' : 'paid',
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      discountReason,
      workerCommission,
      debtNote: isDebt ? checkoutDebtNote.trim() : undefined,
      damageInspection: damageInspectionData,
      cafeItems: checkoutCafeItems.length > 0 ? checkoutCafeItems : undefined,
      cafeTotal: cafeTotal > 0 ? cafeTotal : undefined,
      isSubscriptionWash: isVipSubscription,
      itemType: checkoutVehicle.itemType,
      carpetSpecs: checkoutVehicle.carpetSpecs,
    };

    const updatedVehicle: Vehicle = {
      ...checkoutVehicle,
      size: checkoutVehicleSize,
      totalWashes: (checkoutVehicle.totalWashes || 0) + 1,
      currentCycleWashes: isLoyaltyFree
        ? 0
        : (checkoutIsRainWarranty || isVipSubscription)
        ? (checkoutVehicle.currentCycleWashes || 0)
        : (checkoutVehicle.currentCycleWashes || 0) + 1,
      freeWashesClaimed: isLoyaltyFree
        ? (checkoutVehicle.freeWashesClaimed || 0) + 1
        : (checkoutVehicle.freeWashesClaimed || 0),
      lastVisitDate: new Date().toISOString(),
      status: 'active',
      currentBay: undefined,
      bayEntryTime: undefined,
      washStage: undefined,
      assignedWorkerId: undefined,
      assignedWorkerName: undefined,
      damageInspection: damageInspectionData || checkoutVehicle.damageInspection,
      washHistory: [newRecord, ...(checkoutVehicle.washHistory || [])],
    };

    const allUpdated = vehicles.map((v) =>
      v.id === checkoutVehicle.id ? updatedVehicle : v
    );
    onUpdateVehicles(allUpdated);

    // Clear bay cafe order
    if (checkoutVehicle.currentBay) {
      setBayCafeOrders((prev) => {
        const next = { ...prev };
        delete next[checkoutVehicle.currentBay!];
        return next;
      });
    }

    // Auto Chemical & Inventory Deduction (~0.25L of shampoo/foam per wash)
    try {
      const currentInv = getSavedInventory();
      if (currentInv && currentInv.length > 0) {
        let invChanged = false;
        let lowWarningName = '';
        const updatedInv = currentInv.map((item) => {
          if (item.category === 'shampoo  Espuma' && item.quantity > 0) {
            invChanged = true;
            const newQty = Math.max(0, Number((item.quantity - 0.25).toFixed(2)));
            if (newQty <= item.minAlertLevel && item.quantity > item.minAlertLevel) {
              lowWarningName = item.name;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        });
        if (invChanged) {
          saveInventory(updatedInv);
          if (lowWarningName) {
            onNotify(`⚠️ Aviso / Alerta Estoque: «${lowWarningName}»  Nível de Alerta.`);
          }
        }
      }
    } catch (e) {
      console.error('Inventory auto-deduction error:', e);
    }

    // Play POS sound
    if (soundEnabled) playPosSound('success');

    // Trigger printed receipt modal
    setPrintedReceiptData({
      vehicle: updatedVehicle,
      service: srv,
      staffName: worker?.name || 'Profissional',
      isFree,
      freeReason,
      isSubscriptionWash: isVipSubscription,
      cafeItems: checkoutCafeItems.length > 0 ? checkoutCafeItems : undefined,
      cafeTotal: cafeTotal > 0 ? cafeTotal : undefined,
      damageInspection: damageInspectionData,
      chargedPrice: finalPrice,
      vehicleSize: checkoutVehicleSize,
      paymentMethod: isFree && cafeTotal === 0 ? 'cash' : checkoutPaymentMethod,
      isDebt,
    });

    setCheckoutVehicle(null);
    onNotify(
      isVipSubscription
        ? `👑 Lavagem Membro VIP sem Salvo com sucesso! ${cafeTotal > 0 ? `(: ${formatR$(cafeTotal)})` : ''}`
        : checkoutIsRainWarranty
        ? '🌧️ prazo de garantia dia de chuva por: Lavagem dois por Grátis Salvo com sucesso!'
        : isLoyaltyFree
        ? '🎉 Lavagem Grátis por (Free Loyalty) Salvo com sucesso  o recibo Pronto!'
        : isDebt
        ? `⚠️ o Veículo como Fiado / Débito pendente Salvo com sucesso (${formatR$(finalPrice)})`
        : `✅ Valor ${formatR$(finalPrice)} por sucesso !`
    );
  };

  // -------------------------------------------------------------
  // Carpet Registration & Receipt Generation (Lavagem Tapete por m²)
  // -------------------------------------------------------------
  const handleCarpetSubmit = (e?: React.FormEvent, payNow = false) => {
    if (e) e.preventDefault();
    if (!ownerName.trim()) {
      alert('Por favor Nome do Cliente digite!');
      return;
    }
    if (!phone.trim()) {
      alert('Por favor Telefone / Celular Cliente digite para Abrir Concluído!');
      return;
    }

    const randomTicketNumber = String(Math.floor(100 + Math.random() * 900));
    const carpetTicketNum = `C-${randomTicketNumber}`;
    const finalPrice = totalCarpetCalculatedPrice > 0 ? totalCarpetCalculatedPrice : 15000;
    const readyDateStr = new Date(Date.now() + carpetReadyDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const carpetSpecs: CarpetSpecs = {
      areaSquareMeters: parsedArea,
      piecesCount: carpetPiecesCount,
      ratePerSquareMeter: carpetRatePerM2,
      length: parseFloat(carpetLength) || undefined,
      width: parseFloat(carpetWidth) || undefined,
      carpetType,
      readyDate: readyDateStr,
      notes: carpetNotes.trim() || undefined,
    };

    const srv: ServiceItem = services.find((s) => s.category === 'Lavagem Tapete' || s.id === 'srv-carpet-1') || {
      id: 'srv-carpet-1',
      name: `${carpetType} (${parsedArea > 0 ? `${parsedArea} ²` : `${carpetPiecesCount} unid.`})`,
      price: finalPrice,
      category: 'Lavagem Tapete',
      unit: 'm² (²)',
      durationMinutes: 120,
      description: 'Lavagem Tapete por   ',
    };

    const assignedStaff = staff.find((s) => s.id === assignedStaffId) || staff[0];

    const newRecord: WashRecord = {
      id: `wash-${Date.now()}`,
      date: new Date().toISOString(),
      serviceId: srv.id,
      serviceName: `${carpetType} (${parsedArea > 0 ? `${parsedArea} ²` : `${carpetPiecesCount} unid.`})`,
      price: finalPrice,
      isFree: false,
      paymentMethod: payNow ? 'cash' : undefined,
      paymentStatus: payNow ? 'paid' : 'unpaid',
      paidAt: payNow ? new Date().toISOString() : undefined,
      staffId: assignedStaff?.id,
      staffName: assignedStaff?.name || 'Profissional Tapete',
      itemType: 'carpet',
      carpetSpecs,
    };

    const newCarpetVehicle: Vehicle = {
      id: `carpet-${Date.now()}`,
      itemType: 'carpet',
      plate: {
        type: 'unified',
        provinceCode: '21',
        letter: 'C',
        number: randomTicketNumber,
      },
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      carModel: `Tapete (${parsedArea > 0 ? `${parsedArea} ²` : `${carpetPiecesCount} unid.`})`,
      color: carpetType,
      size: 'sedan',
      nfcTagId: `NFC-C-${Date.now().toString().slice(-4)}`,
      hasNfcSticker: false,
      totalWashes: 1,
      currentCycleWashes: 1,
      freeWashesClaimed: 0,
      lastVisitDate: new Date().toISOString(),
      registeredDate: new Date().toISOString(),
      status: 'active',
      washStage: 'Aguardando',
      carpetSpecs,
      washHistory: payNow ? [newRecord] : [],
    };

    onUpdateVehicles([newCarpetVehicle, ...vehicles]);

    if (soundEnabled) playPosSound('success');

    if (payNow) {
      setPrintedReceiptData({
        vehicle: newCarpetVehicle,
        service: srv,
        staffName: newRecord.staffName || 'Profissional',
        isFree: false,
        chargedPrice: finalPrice,
        vehicleSize: 'sedan',
        paymentMethod: 'cash',
        isDebt: false,
      });
      onNotify(`🎉 Recebimento Valor Tapete  Recibo / Comprovante Concluído: ${formatR$(finalPrice)}`);
    } else {
      onNotify(`🧶 Recibo Recebimento Tapete Salvo com sucesso (${carpetTicketNum}) - dez dezsem em: ${readyDateStr}`);
    }

    // Reset inputs
    setOwnerName('');
    setPhone('');
    setCarpetNotes('');
  };

  // Fast Submit from Standard Form:
  // mode: 'wash_now' (Start wash in bay directly, payment upon exit/during wash - PRIMARY)
  // mode: 'pay_now' (Pay upfront & print receipt immediately)
  // mode: 'queue' (Put in waiting list)
  const handleFastRegisterAndAdmit = (
    e?: React.FormEvent,
    mode: 'wash_now' | 'pay_now' | 'queue' = 'wash_now'
  ) => {
    if (e) e.preventDefault();

    let builtPlate: LicensePlate;
    const cleanPlateNumber = normalizeDigits(plateNumber.trim());
    const cleanOldNumber = normalizeDigits(oldNumber.trim());

    if (plateType === 'unified') {
      if (!cleanPlateNumber) {
        alert('Por favor Número Placa digite!');
        return;
      }
      const prov = OFFICIAL_PROVINCES.find((p) => p.code === provinceCode);
      builtPlate = {
        type: 'unified',
        provinceCode,
        provinceName: prov?.name || '',
        letter: plateLetter.toUpperCase(),
        number: cleanPlateNumber,
      };
    } else {
      if (!cleanOldNumber) {
        alert('Por favor Número Placa antiga digite!');
        return;
      }
      builtPlate = {
        type: 'old',
        oldCityName: oldCity,
        oldCategory,
        oldNumber: cleanOldNumber,
      };
    }

    const worker = staff.find((s) => s.id === assignedStaffId) || staff[0];
    const srv =
      services.find((s) => s.id === selectedServiceId) ||
      services.find((s) => s.category === 'Veículo' || s.name.includes('Lavagem ')) ||
      services[0];
    const nowISO = new Date().toISOString();
    const branchName = selectedBranch === 'branch-1' ? 'Unidade 1' : 'Unidade 2 (Filial)';

    const isVip = Boolean(
      matchedExistingVehicle?.subscription?.status === 'active' &&
        new Date(matchedExistingVehicle.subscription.endDate) > new Date()
    );
    const isLoyaltyFree = Boolean(
      matchedExistingVehicle && matchedExistingVehicle.currentCycleWashes >= settings.washesNeededForFree
    );
    const isFree = isLoyaltyFree || isVip;
    const finalPrice = isFree ? 0 : calculateServicePrice(srv, vehicleSize);
    const workerCommission = calculateWorkerCommission(worker, finalPrice);

    const isPaidNow = mode === 'pay_now';
    const initialStage = mode === 'queue' ? ('Aguardando' as const) : ('Espuma' as const);

    // Auto-detect first empty bay if entering bay directly
    const occupiedBays = vehicles
      .filter((v) => v.currentBay && v.washStage)
      .map((v) => v.currentBay);
    const firstEmptyBay = bays.find((b) => !occupiedBays.includes(b)) || 1;
    const assignedBay = mode === 'queue' ? undefined : (targetBay > 0 ? targetBay : firstEmptyBay);

    const newRecord: WashRecord = {
      id: `w-${Date.now()}`,
      date: nowISO,
      serviceId: srv.id,
      serviceName: srv.name,
      price: finalPrice,
      isFree,
      freeReason: isLoyaltyFree ? ('loyalty' as const) : undefined,
      vehicleSize,
      staffId: worker?.id,
      staffName: worker?.name,
      bayNumber: assignedBay,
      paymentMethod: 'cash' as const,
      paymentStatus: isPaidNow ? ('paid' as const) : ('unpaid' as const),
      workerCommission,
      isSubscriptionWash: isVip,
      branchId: selectedBranch,
      branchName,
    };

    let updatedVehicles: Vehicle[];
    let targetVehicleForReceipt: Vehicle;

    if (matchedExistingVehicle) {
      const existingWashHistory = matchedExistingVehicle.washHistory || [];
      const updatedExisting: Vehicle = {
        ...matchedExistingVehicle,
        ownerName: ownerName.trim() || matchedExistingVehicle.ownerName,
        phone: phone.trim() ? normalizeDigits(phone.trim()) : matchedExistingVehicle.phone,
        carModel: carModel.trim() || matchedExistingVehicle.carModel,
        color: color.trim() || matchedExistingVehicle.color,
        size: vehicleSize,
        currentBay: assignedBay,
        assignedWorkerId: worker?.id,
        assignedWorkerName: worker?.name,
        totalWashes: matchedExistingVehicle.totalWashes + 1,
        currentCycleWashes: isLoyaltyFree
          ? 0
          : isVip
          ? matchedExistingVehicle.currentCycleWashes
          : matchedExistingVehicle.currentCycleWashes + 1,
        freeWashesClaimed: isLoyaltyFree
          ? matchedExistingVehicle.freeWashesClaimed + 1
          : matchedExistingVehicle.freeWashesClaimed,
        lastVisitDate: nowISO,
        washStage: initialStage,
        bayEntryTime: nowISO,
        branchId: selectedBranch,
        branchName,
        washHistory: [newRecord, ...existingWashHistory],
      };

      targetVehicleForReceipt = updatedExisting;
      updatedVehicles = vehicles.map((v) => (v.id === matchedExistingVehicle.id ? updatedExisting : v));
    } else {
      const nfcCode = `NFC-${Date.now().toString().slice(-6)}`;
      const newV: Vehicle = {
        id: `v-${Date.now()}`,
        plate: builtPlate,
        ownerName: ownerName.trim() || 'Cliente prezado(a)',
        phone: normalizeDigits(phone.trim()),
        carModel: carModel.trim() || 'Veículo',
        color: color.trim() || 'Grátis (Fidelidade) ',
        size: vehicleSize,
        nfcTagId: nfcCode,
        hasNfcSticker: true,
        currentBay: assignedBay,
        assignedWorkerId: worker?.id,
        assignedWorkerName: worker?.name,
        totalWashes: 1,
        currentCycleWashes: 1,
        freeWashesClaimed: 0,
        lastVisitDate: nowISO,
        registeredDate: nowISO,
        status: 'active',
        washStage: initialStage,
        bayEntryTime: nowISO,
        branchId: selectedBranch,
        branchName,
        washHistory: [newRecord],
      };

      targetVehicleForReceipt = newV;
      updatedVehicles = [newV, ...vehicles];
    }

    onUpdateVehicles(updatedVehicles);

    if (mode === 'pay_now') {
      if (soundEnabled) playPosSound('success');
      setPrintedReceiptData({
        vehicle: targetVehicleForReceipt,
        service: srv,
        staffName: worker?.name || 'Profissional lava-rápido',
        isFree,
        freeReason: isLoyaltyFree ? 'loyalty' : undefined,
        isSubscriptionWash: isVip,
        chargedPrice: finalPrice,
        vehicleSize,
        paymentMethod: 'cash',
        isDebt: false,
      });
      onNotify(
        isLoyaltyFree
          ? `🎉 Parabéns! Lavagem Grátis (Free) Salvo com sucesso  o recibo Impressão (${branchName})!`
          : `🎉 Valor antes de (${formatR$(finalPrice)})   Recibo ${carModel || 'Veículo'} Impressão (${branchName}) 🖨️`
      );
      setActiveListTab('all');
    } else if (mode === 'wash_now') {
      if (soundEnabled) playPosSound('beep');
      onNotify(`🚿 Veículo ${carModel || 'Veículo'}  Box ${assignedBay} para Lavagem (Pagamento em Horário saída).`);
      setActiveListTab('all');
    } else {
      if (soundEnabled) playPosSound('beep');
      onNotify(`⏳ Veículo Novo (${carModel || 'Veículo'})  Fila de Aguardando (${branchName}).`);
      setActiveListTab('waiting');
    }

    // Reset Form for next fast entry
    setPlateNumber('');
    setOldNumber('');
    setOwnerName('');
    setPhone('');
    setCarModel('');
    setColor('');
    lastAutoFilledIdRef.current = null;
    clearedVehicleIdRef.current = null;
    setShowPlateSuggestions(false);
  };

  // Quick Print Receipt for any vehicle or specific wash record
  const handleQuickPrintReceipt = (vehicle: Vehicle, washRecord?: WashRecord) => {
    const targetWash = washRecord || vehicle.washHistory?.[0];
    const srv =
      services.find((s) => s.id === targetWash?.serviceId) ||
      services.find((s) => s.category === 'Veículo') ||
      services[0];
    const worker = staff.find((st) => st.id === targetWash?.staffId) || staff[0];
    const isVip = Boolean(
      vehicle.subscription?.status === 'active' &&
        new Date(vehicle.subscription.endDate) > new Date()
    );
    const isLoyaltyFree = Boolean(targetWash?.isFree && targetWash?.freeReason === 'loyalty');
    const isFree = Boolean(targetWash?.isFree || isVip);
    const vSize: VehicleSize = targetWash?.vehicleSize || vehicle.size || 'sedan';
    const computedPrice = Number(targetWash?.price ?? (isFree ? 0 : calculateServicePrice(srv, vSize)));
    const cafeItems = targetWash?.cafeItems || [];
    const cafeTotal = targetWash?.cafeTotal || 0;

    setPrintedReceiptData({
      vehicle,
      service: srv,
      staffName: worker?.name || targetWash?.staffName || 'Profissional lava-rápido',
      isFree,
      freeReason: isLoyaltyFree ? 'loyalty' : undefined,
      isSubscriptionWash: isVip,
      cafeItems: cafeItems.length > 0 ? cafeItems : undefined,
      cafeTotal: cafeTotal > 0 ? cafeTotal : undefined,
      chargedPrice: computedPrice + cafeTotal,
      vehicleSize: vSize,
      paymentMethod: targetWash?.paymentMethod || 'cash',
      isDebt: false,
    });
    if (soundEnabled) playPosSound('beep');
    onNotify(`Recibo Veículo ${vehicle.carModel} dez Impressão.`);
  };

  // Delete / Cancel a sale record if entered incorrectly
  const handleDeleteSale = (vehicleId: string, washId: string) => {
    const targetV = vehicles.find((v) => v.id === vehicleId);
    if (!targetV) return;
    const confirmMsg = `deseja tem certeza em Excluir   este Recibo para Veículo «${targetV.carModel || 'Veículo'}»`;
    if (!window.confirm(confirmMsg)) return;

    const updated = vehicles.map((v) => {
      if (v.id === vehicleId) {
        const newHistory = (v.washHistory || []).filter((w) => w.id !== washId);
        return {
          ...v,
          totalWashes: Math.max(0, v.totalWashes - 1),
          currentCycleWashes: Math.max(0, v.currentCycleWashes - 1),
          washHistory: newHistory,
        };
      }
      return v;
    });

    onUpdateVehicles(updated);
    if (soundEnabled) playPosSound('beep');
    onNotify('🗑️ Vendasque por sucesso em atépor .');
  };

  // Directly Remove / Clear vehicle from Bay without forcing checkout modal
  const handleReleaseBayDirectly = (vehicle: Vehicle) => {
    const bayNum = vehicle.currentBay;
    const confirmMsg = `deseja tem certeza em Remover Veículo «${vehicle.carModel || 'Veículo'}» em Box ${bayNum}  poraté o Box em `;
    if (!window.confirm(confirmMsg)) return;

    const updated = vehicles.map((v) => {
      if (v.id === vehicle.id) {
        return {
          ...v,
          currentBay: undefined,
          bayEntryTime: undefined,
          washStage: undefined,
          assignedWorkerId: undefined,
          assignedWorkerName: undefined,
        };
      }
      return v;
    });

    if (bayNum) {
      setBayCafeOrders((prev) => {
        const next = { ...prev };
        delete next[bayNum];
        return next;
      });
    }

    onUpdateVehicles(updated);
    if (soundEnabled) playPosSound('beep');
    onNotify(`🗑️ Box ${bayNum} por sucesso poraté  em  .`);
  };

  // Move Bay Vehicle back to Queue
  const handleMoveBayToQueue = (vehicle: Vehicle) => {
    const bayNum = vehicle.currentBay;
    const updated = vehicles.map((v) => {
      if (v.id === vehicle.id) {
        return {
          ...v,
          currentBay: undefined,
          bayEntryTime: undefined,
          washStage: 'Aguardando' as const,
        };
      }
      return v;
    });
    onUpdateVehicles(updated);
    if (soundEnabled) playPosSound('beep');
    onNotify(`Veículo «${vehicle.carModel}» em Box ${bayNum}  para Fila de novepor.`);
  };

  // Remove vehicle from Waiting Queue (Safely removes from queue without deleting vehicle history!)
  const handleRemoveFromQueue = (vehicleId: string) => {
    const target = vehicles.find((v) => v.id === vehicleId);
    if (!target) return;
    if (window.confirm(`deseja tem certeza em Remover Veículo «${target.carModel} (${target.ownerName})» em Fila de Aguardando (novepor)`)) {
      const updated = vehicles.map((v) => {
        if (v.id === vehicleId) {
          return {
            ...v,
            currentBay: undefined,
            bayEntryTime: undefined,
            washStage: undefined,
          };
        }
        return v;
      });
      onUpdateVehicles(updated);
      if (soundEnabled) playPosSound('beep');
      onNotify('o Veículo em Fila de novepor .');
    }
  };

  // Save Z-Report
  const handleSaveZReport = (report: DailyZReport) => {
    const saved = getSavedZReports();
    saveZReports([report, ...saved.filter((r) => r.date !== report.date)]);
    if (soundEnabled) playPosSound('success');
    onNotify('Relatório Fechar Caixa / Cofre (Z-Report) por sucesso Salvo com sucesso!');

    // Automated Telegram Notification to Car Wash Owner
    if (settings.telegramBotEnabled && settings.telegramBotToken && settings.telegramChatId) {
      const telegramMsg = formatDailyZReportTelegram(report, settings);
      sendTelegramMessage(settings.telegramBotToken, settings.telegramChatId, telegramMsg).then((res) => {
        if (res.success) {
          onNotify('🤖 Relatório Diário Z ao vivo / tempo real para  Administrador !');
        } else {
          console.warn('Telegram notification failed:', res.message);
        }
      });
    }

    setShowZReportModal(false);
  };

  // Today's Sales Calculation (Car Wash + Carpet Laundry + Garage Parking)
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayWashes = vehicles.flatMap((v) =>
    (v.washHistory || []).filter((w) => isDateToday(w.date))
  );
  const todayWashRevenue = todayWashes.reduce((sum, w) => sum + (Number(w.price) || 0), 0);
  const todayGarageRevenue = (parkingRecords || [])
    .filter((p) => p.paymentStatus === 'paid' && isDateToday(p.entryTime))
    .reduce((sum, p) => sum + (Number(p.fee) || 0), 0);
  const todayGarageCarsCount = (parkingRecords || [])
    .filter((p) => isDateToday(p.entryTime)).length;
  const todaySalesTotal = todayWashRevenue + todayGarageRevenue;
  const todayWashesCount = todayWashes.length;

  // Flat list of all sales from vehicles washHistory for today
  const todaySalesList = useMemo(() => {
    const list: Array<{
      vehicle: Vehicle;
      record: WashRecord;
    }> = [];

    vehicles.forEach((v) => {
      (v.washHistory || []).forEach((w) => {
        if (isDateToday(w.date)) {
          list.push({ vehicle: v, record: w });
        }
      });
    });

    // Sort newest first
    return list.sort((a, b) => new Date(b.record.date).getTime() - new Date(a.record.date).getTime());
  }, [vehicles]);

  const branch1Count = useMemo(
    () => todaySalesList.filter((item) => (item.record.branchId || item.vehicle.branchId || 'branch-1') === 'branch-1').length,
    [todaySalesList]
  );
  const branch2Count = useMemo(
    () => todaySalesList.filter((item) => (item.record.branchId || item.vehicle.branchId) === 'branch-2').length,
    [todaySalesList]
  );

  const filteredTodaySales = useMemo(() => {
    return todaySalesList.filter(({ vehicle, record }) => {
      // Branch filter
      if (salesBranchFilter !== 'all') {
        const itemBranch = record.branchId || vehicle.branchId || 'branch-1';
        if (itemBranch !== salesBranchFilter) return false;
      }
      // Search filter
      if (salesSearch.trim()) {
        const query = salesSearch.trim().toLowerCase();
        const pNum = vehicle.plate.number || vehicle.plate.oldNumber || '';
        const prov = vehicle.plate.provinceCode || '';
        const owner = (vehicle.ownerName || '').toLowerCase();
        const phone = (vehicle.phone || '').toLowerCase();
        const model = (vehicle.carModel || '').toLowerCase();
        return (
          pNum.includes(query) ||
          prov.includes(query) ||
          owner.includes(query) ||
          phone.includes(query) ||
          model.includes(query)
        );
      }
      return true;
    });
  }, [todaySalesList, salesBranchFilter, salesSearch]);

  const filteredSalesTotal = useMemo(
    () => filteredTodaySales.reduce((sum, item) => sum + (Number(item.record.price) || 0), 0),
    [filteredTodaySales]
  );

  // Manual Server Sync & Demo Data Helpers
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    if (soundEnabled) playPosSound('beep');
    try {
      const ok = await pullServerDatabase();
      if (ok) {
        const updated = getSavedVehicles();
        onUpdateVehicles(updated);
        if (soundEnabled) playPosSound('success');
        onNotify('🔄 até Vendas  Boxes de Lavagem com três por sucesso até!');
      } else {
        const currentV = getSavedVehicles();
        const seeded = seedTodaySalesData(currentV);
        onUpdateVehicles(seeded);
        if (soundEnabled) playPosSound('success');
        onNotify('🔄 até Vendas Hoje (218,000 R$)  Box Ativo Novo!');
      }
    } catch {
      onNotify('⚠️ Problemaum em atéAbrir até .');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoadTodayDemo = () => {
    if (soundEnabled) playPosSound('beep');
    const currentV = getSavedVehicles();
    const seeded = seedTodaySalesData(currentV);
    onUpdateVehicles(seeded);
    if (soundEnabled) playPosSound('success');
    onNotify('🎉 9 Lavagem Hoje (218,000 R$)  Box Ativo !');
  };

  // Active Yard Vehicles & Categorized Lists (Scoped to Active Branch)
  const activeYardCars = vehicles.filter((v) => {
    if (!v.washStage) return false;
    if (activeBranchId) {
      const vBranch = v.currentBayBranchId || v.branchId || 'branch-1';
      return vBranch === activeBranchId;
    }
    return true;
  });
  const waitingCars = activeYardCars.filter((v) => v.washStage === 'Aguardando');
  const washingCars = activeYardCars.filter(
    (v) => v.washStage && v.washStage !== 'Aguardando' && v.washStage !== 'Concluído'
  );
  const readyCars = activeYardCars.filter((v) => v.washStage === 'Concluído');
  const unpaidCars = activeYardCars.filter(
    (v) => v.washHistory?.[0]?.paymentStatus === 'unpaid'
  );
  const activeCarsInBaysCount = activeYardCars.length;
  const readyCarsCount = readyCars.length;
  const queueVehicles = waitingCars;

  // Active Workspace Tab Filter
  const [activeListTab, setActiveListTab] = useState<'all' | 'waiting' | 'washing' | 'unpaid' | 'ready' | 'sales'>('waiting');

  const displayedYardCars = activeYardCars.filter((v) => {
    if (activeListTab === 'waiting') return v.washStage === 'Aguardando';
    if (activeListTab === 'washing') return v.washStage && v.washStage !== 'Aguardando' && v.washStage !== 'Concluído';
    if (activeListTab === 'ready') return v.washStage === 'Concluído';
    if (activeListTab === 'unpaid') return v.washHistory?.[0]?.paymentStatus === 'unpaid';
    return true;
  });

  // Action: Start Washing a waiting vehicle
  const handleStartWashing = (vehicleId: string) => {
    const updated = vehicles.map((v) => {
      if (v.id === vehicleId) {
        return {
          ...v,
          washStage: 'Espuma' as const,
          bayEntryTime: new Date().toISOString(),
        };
      }
      return v;
    });
    onUpdateVehicles(updated);
    if (soundEnabled) playPosSound('beep');
    onNotify('🚿 o Veículo  Nome Lavagem (etapa Espuma).');
  };

  // Action: 1-click Mark as Paid & print receipt
  const handleMarkAsPaid = (vehicle: Vehicle, paymentMethod: PaymentMethod = 'cash') => {
    const updated = vehicles.map((v) => {
      if (v.id === vehicle.id) {
        const history = [...(v.washHistory || [])];
        if (history.length > 0) {
          history[0] = {
            ...history[0],
            paymentStatus: 'paid' as const,
            paymentMethod,
          };
        }
        return {
          ...v,
          washHistory: history,
        };
      }
      return v;
    });

    onUpdateVehicles(updated);
    if (soundEnabled) playPosSound('success');
    onNotify(`💰 Valor Veículo ${vehicle.carModel || 'Veículo'} por sucesso !`);

    // Prepare & print receipt
    const updatedV = updated.find((v) => v.id === vehicle.id);
    if (updatedV) {
      handleQuickPrintReceipt(updatedV, updatedV.washHistory?.[0]);
    }
  };

  // Action: Complete and release car from yard
  const handleCompleteAndExit = (vehicle: Vehicle) => {
    const latest = vehicle.washHistory?.[0];
    if (latest && latest.paymentStatus === 'unpaid') {
      const confirmPay = window.confirm(
        `este Veículo (${vehicle.carModel || 'Veículo'}) até o valor !\ndeseja dez acima / topoaté o valor    Recibo para Quantidade`
      );
      if (confirmPay) {
        handleInitiateCheckout(vehicle);
        return;
      }
    }

    const updated = vehicles.map((v) => {
      if (v.id === vehicle.id) {
        return {
          ...v,
          washStage: undefined,
          bayEntryTime: undefined,
          currentBay: undefined,
          assignedWorkerId: undefined,
          assignedWorkerName: undefined,
        };
      }
      return v;
    });

    onUpdateVehicles(updated);
    if (soundEnabled) playPosSound('beep');
    onNotify(`🏁 Veículo ${vehicle.carModel || 'Veículo'} Concluído   dez.`);
  };

  // Toggle vehicle payment status back to unpaid (in case it was marked paid by mistake)
  const handleToggleUnpaid = (vehicle: Vehicle) => {
    const updated = vehicles.map((v) => {
      if (v.id === vehicle.id) {
        const history = [...(v.washHistory || [])];
        if (history.length > 0) {
          history[0] = {
            ...history[0],
            paymentStatus: 'unpaid' as const,
            paidAt: undefined,
          };
        }
        return {
          ...v,
          washHistory: history,
        };
      }
      return v;
    });
    onUpdateVehicles(updated);
    if (soundEnabled) playPosSound('beep');
    onNotify(`Status Valor (${vehicle.carModel || 'o Veículo'})  para: Aguardando Pagamento (Valor ).`);
  };

  // Selected Service object
  const currentSelectedService =
    services.find((s) => s.id === selectedServiceId) || services[0];
  const calculatedFormPrice = currentSelectedService
    ? calculateServicePrice(currentSelectedService, vehicleSize)
    : 0;

  // Low Stock Items check
  const lowStockItems = getSavedInventory().filter(
    (item) => item.quantity <= item.minAlertLevel
  );

  return (
    <div className="space-y-4 w-full max-w-full min-w-0 overflow-x-hidden" dir="ltr">


      {/* Happy Hour Active Banner */}
      {isHappyHourActive && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 py-2.5 rounded-2xl shadow-md flex items-center justify-between text-xs font-bold animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <span>
              oferta / promoção Horário Dourado (Happy Hour) Ativo: <strong>{happyHourDiscountPercent}%</strong> Desconto  para Todos Lavagens!
            </span>
          </div>
          <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-mono font-bold tracking-wider">
            {settings.happyHourStart} - {settings.happyHourEnd}
          </span>
        </div>
      )}



      {/* ----------------- LOW STOCK ALERT (SLIM & DISCREET) ----------------- */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-3.5 py-2 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="truncate font-medium">
              Aviso / Alerta Depósito / Estoque: <strong>{lowStockItems.map((i) => i.name).join(' ')}</strong> por Concluído dez.
            </span>
          </div>
          <span className="text-[10px] text-amber-800 font-mono font-bold whitespace-nowrap shrink-0 px-2 py-0.5 rounded-lg bg-amber-100 border border-amber-300">
             por compra
          </span>
        </div>
      )}

      {/* ----------------- MOBILE ERGONOMIC VIEW SWITCHER (< lg) ----------------- */}
      <div className="lg:hidden flex items-center p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl gap-1 text-xs font-bold select-none shadow-inner">
        <button
          type="button"
          onClick={() => setMobileActiveView('all')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            mobileActiveView === 'all'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Todos</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveView('bays')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            mobileActiveView === 'bays'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Vendas ({todaySalesList.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveView('register')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            mobileActiveView === 'register'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Salvar / Registrar</span>
        </button>
      </div>

      {/* ----------------- MAIN COMMAND WORKSPACE (2 COLS) ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ---------------- COLUMN 1: FAST REGISTRATION / EXPRESS (5 Cols) ---------------- */}
        <div
          className={`lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 text-slate-900 dark:text-slate-100 ${
            mobileActiveView === 'bays' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              {entryMode === 'car' ? 'Cadastro Rápido de Veículo' : 'Registro de Lavagem Tapete  Estofados'}
            </h3>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
              {entryMode === 'car' ? 'Lavagem de Veículo' : 'Tapetes e Estofados (m²)'}
            </span>
          </div>

          {/* Branch Selector: Unidade 1 (Matriz) vs Unidade 2 (Filial) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setSelectedBranch('branch-1');
                if (onSwitchBranch) onSwitchBranch('branch-1');
                try {
                  localStorage.setItem('carwash_active_branch', 'branch-1');
                  localStorage.setItem('carwash_v1_active_branch', 'branch-1');
                } catch {}
              }}
              className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                selectedBranch === 'branch-1'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>🏢 Unidade 1 (Matriz)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedBranch('branch-2');
                if (onSwitchBranch) onSwitchBranch('branch-2');
                try {
                  localStorage.setItem('carwash_active_branch', 'branch-2');
                  localStorage.setItem('carwash_v1_active_branch', 'branch-2');
                } catch {}
              }}
              className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                selectedBranch === 'branch-2'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>🏢 Unidade 2 (Filial)</span>
            </button>
          </div>

          {/* Service Mode Selector: Car Wash vs Carpet & Furniture */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setEntryMode('car')}
              className={`py-2 px-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                entryMode === 'car'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>🚗 Lavagem de Veículo</span>
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('carpet')}
              className={`py-2 px-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                entryMode === 'carpet'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>🧶 Lavagem de Tapete (m²)</span>
            </button>
          </div>

          {/* Render Carpet Form OR Car Form */}
          {entryMode === 'carpet' ? (
            <form onSubmit={(e) => handleCarpetSubmit(e, true)} className="space-y-3.5 text-xs animate-fade-in">
              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/70 rounded-2xl space-y-1">
                <span className="text-xs font-black text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Lavagem Especializada de Tapetes e Estofados    
                </span>
                <p className="text-[10px] text-teal-700 dark:text-teal-300">
                  por Tapete por    ou ao vivo / tempo real por m² (²) Grátis (Fidelidade) que até o valor por  dez.
                </p>
              </div>

              {/* Carpet Service Type */}
              <div className="space-y-1">
                <label className="text-xs text-slate-800 dark:text-slate-200 font-extrabold block">
                  Tipo  / Serviço:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'Lavagem Tapete por ', label: '🧶 Tapete ', rate: 2500, unit: '²' },
                    { id: 'Tapete água  feito à mão', label: '✨ Tapete água', rate: 3500, unit: '²' },
                    { id: 'Lavagem conjunto Estofado / Sofá (7 )', label: '🛋️ conjunto Estofado / Sofá', rate: 40000, unit: 'conjunto' },
                    { id: 'Lavagem Estofado / Sofá até / ', label: '🪑  / até', rate: 6000, unit: 'unid.' },
                  ].map((ct) => (
                    <button
                      key={ct.id}
                      type="button"
                      onClick={() => {
                        setCarpetType(ct.id);
                        if (ct.unit === '²') {
                          setCarpetRatePerM2(ct.rate);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col gap-0.5 ${
                        carpetType === ct.id
                          ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-950 dark:text-white font-black ring-2 ring-teal-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold">{ct.label}</span>
                      <span className="text-[10px] text-teal-700 dark:text-teal-400 font-mono font-bold">
                        {formatR$(ct.rate)} {ct.unit === '²' ? '/ metros' : ''}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimensions & Area Calculator (Only if not fixed sofa) */}
              {!isSofaFixed && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                       por (Area Calculator):
                    </span>
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold font-mono">
                      {parsedArea} ² (m²)
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5 font-bold"> (metros):</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        placeholder="4"
                        value={carpetLength}
                        onChange={(e) => handleCarpetDimensionChange(e.target.value, carpetWidth)}
                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-mono font-bold text-center text-xs focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5 font-bold"> (metros):</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        placeholder="3"
                        value={carpetWidth}
                        onChange={(e) => handleCarpetDimensionChange(carpetLength, e.target.value)}
                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-mono font-bold text-center text-xs focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-teal-600 dark:text-teal-400 block mb-0.5 font-bold">Total ²:</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        value={carpetAreaM2}
                        onChange={(e) => setCarpetAreaM2(e.target.value)}
                        className="w-full px-2.5 py-2 bg-teal-50 dark:bg-teal-950/60 border-2 border-teal-500 rounded-xl font-mono font-black text-center text-xs focus:outline-none text-teal-950 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5 font-bold">Número Tapete (unid.):</label>
                      <input
                        type="number"
                        min="1"
                        value={carpetPiecesCount}
                        onChange={(e) => setCarpetPiecesCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-mono font-bold text-center text-xs focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5 font-bold">Preço / Valor 1 metros (R$):</label>
                      <input
                        type="number"
                        step="250"
                        value={carpetRatePerM2}
                        onChange={(e) => setCarpetRatePerM2(Number(e.target.value) || 2500)}
                        className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-mono font-bold text-center text-xs focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Total Calculated Price Banner */}
              <div className="p-3.5 bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 text-white rounded-2xl border border-teal-600/60 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-teal-300 font-bold block">
                    {isSofaFixed
                      ? `${carpetPiecesCount} unid. ${carpetType}`
                      : `${parsedArea} m² × ${carpetPiecesCount} Tapete`}
                  </span>
                  <span className="text-xs font-black text-white">Total Geral Preço / Valor Tapete:</span>
                </div>
                <strong className="text-xl font-black font-mono text-emerald-400 tracking-tight">
                  {formatR$(totalCarpetCalculatedPrice)}
                </strong>
              </div>

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-800 dark:text-slate-200 block mb-1 font-extrabold">Nome do Cliente:</label>
                  <input
                    type="text"
                    required
                    placeholder="exemplo:  "
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-teal-500 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-800 dark:text-slate-200 block mb-1 font-extrabold">Telefone / Celular Cliente:</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-left focus:outline-none focus:border-teal-500 text-xs"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Ready date & Notes */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-800 dark:text-slate-200 block mb-1 font-extrabold">Horário dez:</label>
                  <select
                    value={carpetReadyDays}
                    onChange={(e) => setCarpetReadyDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-teal-500 text-xs cursor-pointer"
                  >
                    <option value={1}>por Tarde/Noite (1 dias)</option>
                    <option value={2}>dois dias  (2 dias)</option>
                    <option value={3}>três dias  (3 dias)</option>
                    <option value={0}>Hoje (Rápido)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-800 dark:text-slate-200 block mb-1 font-extrabold">Observações / Nome:</label>
                  <input
                    type="text"
                    placeholder=" ou Cor Tapete..."
                    value={carpetNotes}
                    onChange={(e) => setCarpetNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-teal-500 text-xs"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-teal-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-5 h-5" />
                  <span>Salvar / Registrar  Quantidade Recibo Tapete (Pagamento antes de) 🖨️</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleCarpetSubmit(e, false)}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>Registrar para Lavagem (Pagamento ao Retirar)</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={(e) => handleFastRegisterAndAdmit(e, 'wash_now')} className="space-y-3 text-xs">
            {/* Plate Type Selector */}
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPlateType('unified')}
                  className={`py-1.5 rounded-lg font-bold text-xs transition ${
                    plateType === 'unified'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Placa Mercosul
                </button>
                <button
                  type="button"
                  onClick={() => setPlateType('old')}
                  className={`py-1.5 rounded-lg font-bold text-xs transition ${
                    plateType === 'old'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Placa Padrão / Cinza
                </button>
              </div>

              {/* License Plate Inputs - Realistic Kurdistan / Traffic Design */}
              <div ref={plateContainerRef} className="relative space-y-2">
                <div className="flex justify-end">
                  <PlateCameraScanner currentType={plateType} onRead={applyScannedPlate} />
                </div>
                {plateType === 'unified' ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                        Placa Padrão Mercosul (Brasil):
                      </label>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        UF {provinceCode} ({OFFICIAL_PROVINCES.find((p) => p.code === provinceCode)?.name || 'São Paulo'})
                      </span>
                    </div>

                    <div
                      className="responsive-plate-entry h-14 min-w-0 w-full rounded-2xl border-2 border-black bg-white shadow-sm flex items-center overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-600 select-none"
                      dir="ltr"
                      style={{ fontFamily: "'FE-Font', 'JetBrains Mono', monospace" }}
                    >
                      {/* Left Box: BR / MERCOSUL */}
                      <div className="h-full w-10 bg-[#002776] border-r-2 border-black flex flex-col justify-between items-center py-1 shrink-0 select-none text-white">
                        <div className="font-black font-sans text-[9px] tracking-wider">
                          <span>BR</span>
                        </div>
                        <div className="w-3 h-2 bg-[#009c3b] flex items-center justify-center rounded-[1px]">
                          <div className="w-1.5 h-1 bg-[#ffdf00] rotate-45"></div>
                        </div>
                        <div className="font-bold font-sans text-[7px] leading-none">
                          BRASIL
                        </div>
                      </div>

                      {/* Province Selector: 21, 22... */}
                      <div className="plate-control-group relative px-1.5 sm:px-2 shrink-0">
                        <select
                          value={provinceCode}
                          onChange={(e) => {
                            setProvinceCode(e.target.value);
                            setShowPlateSuggestions(true);
                          }}
                          className="plate-control-select bg-transparent text-xl font-black text-black focus:outline-none cursor-pointer appearance-none text-center pr-3"
                          title="UF Cidade"
                        >
                          {OFFICIAL_PROVINCES.map((p) => (
                            <option key={p.code} value={p.code} className="text-xs font-sans font-bold">
                              {p.code} - {p.name}
                            </option>
                          ))}
                        </select>
                        <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 pointer-events-none">▼</span>
                      </div>

                      {/* Holographic Security Seal */}
                      <div
                        className="w-4 h-4 rounded-[3px] bg-gradient-to-tr from-slate-200 via-sky-100 to-emerald-100 border border-slate-400 flex items-center justify-center shrink-0 shadow-inner mx-1"
                        title="Selo Oficial Holográfico"
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-400 border border-sky-700/60 flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-white"></div>
                        </div>
                      </div>

                      {/* Letter Selector: A, B, C... MI, MF... */}
                      <div className="plate-control-group relative px-1.5 sm:px-2 shrink-0">
                        <select
                          value={plateLetter}
                          onChange={(e) => {
                            setPlateLetter(e.target.value);
                            setShowPlateSuggestions(true);
                          }}
                          className="plate-control-select bg-transparent text-xl font-black text-black focus:outline-none cursor-pointer appearance-none text-center pr-3"
                          title="Letra Placa"
                        >
                          {UNIFIED_PLATE_LETTERS.map((l) => (
                            <option key={l} value={l} className="text-xs font-mono font-bold">
                              {l}
                            </option>
                          ))}
                        </select>
                        <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 pointer-events-none">▼</span>
                      </div>

                      {/* Registration Number Input */}
                      <input
                        type="text"
                        required
                        placeholder="2112"
                        value={plateNumber}
                        onChange={(e) => {
                          setPlateNumber(normalizeDigits(e.target.value));
                          setShowPlateSuggestions(true);
                        }}
                        onFocus={() => setShowPlateSuggestions(true)}
                        className="plate-number-entry h-full px-2 sm:px-3 text-xl font-black text-black bg-transparent tracking-widest focus:outline-none placeholder:text-slate-300 font-mono"
                        inputMode="numeric"
                        maxLength={4}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                        Placa Padrão / Cinza ( São Paulo  Cidade):
                      </label>
                      <span className="text-[10px] font-bold text-slate-500">
                        {oldCity} - {oldCategory}
                      </span>
                    </div>

                    <div
                      className="responsive-plate-entry h-14 min-w-0 w-full rounded-2xl border-2 border-black bg-white shadow-sm flex items-center overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-600 select-none"
                      dir="ltr"
                    >
                      {/* Category Tag with Official Color */}
                      <div className="plate-control-group h-full shrink-0 relative flex items-center border-l border-black">
                        <select
                          value={oldCategory}
                          onChange={(e) => {
                            setOldCategory(e.target.value);
                            setShowPlateSuggestions(true);
                          }}
                          className={`plate-category-select h-full px-2 sm:px-3 text-xs font-black cursor-pointer appearance-none focus:outline-none transition ${
                            oldCategory === 'Aluguel / Comercial'
                              ? 'bg-amber-400 text-slate-950 font-black'
                              : oldCategory === 'Oficial'
                              ? 'bg-slate-900 text-white'
                              : oldCategory === 'Carga'
                              ? 'bg-blue-600 text-white'
                              : oldCategory === 'Agrícola' || oldCategory === 'Construção'
                              ? 'bg-emerald-600 text-white'
                              : oldCategory === 'motor elétrico'
                              ? 'bg-purple-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {OLD_PLATE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat} className="bg-white text-slate-900 font-sans font-bold text-xs">
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* City Dropdown */}
                      <div className="plate-control-group h-full shrink-0 border-l border-slate-300 flex items-center px-1.5 sm:px-2.5 bg-slate-50 relative">
                        <select
                          value={oldCity}
                          onChange={(e) => {
                            setOldCity(e.target.value);
                            setShowPlateSuggestions(true);
                          }}
                          className="plate-city-select bg-transparent text-xs font-black text-slate-900 focus:outline-none cursor-pointer pr-1"
                        >
                          {OLD_PLATE_CITIES.map((c) => (
                            <option key={c} value={c} className="font-sans font-bold">
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Registration Digits */}
                      <input
                        type="text"
                        required
                        placeholder="258569"
                        value={oldNumber}
                        onChange={(e) => {
                          setOldNumber(normalizeDigits(e.target.value));
                          setShowPlateSuggestions(true);
                        }}
                        onFocus={() => setShowPlateSuggestions(true)}
                        className="plate-number-entry h-full px-2 sm:px-3 text-lg font-black text-slate-900 bg-transparent tracking-widest focus:outline-none placeholder:text-slate-300 font-mono text-left"
                        inputMode="numeric"
                        maxLength={6}
                        dir="ltr"
                      />

                      {/* KR Stamp */}
                      <div className="plate-control-group h-full px-1.5 sm:px-3 bg-slate-100 border-r border-slate-300 flex items-center justify-center text-xs font-black font-mono text-slate-700 shrink-0">
                        KR
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Suggestions Dropdown (como três  sem) */}
                {showPlateSuggestions && matchingVehicleSuggestions.length > 0 && (
                  <div
                    className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 rounded-2xl border-2 border-blue-500 shadow-2xl p-2 space-y-1.5 animate-fade-in max-h-72 overflow-y-auto"
                    dir="ltr"
                  >
                    <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-500 border-b border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                        <Search className="w-3.5 h-3.5" />
                        Veículo como sistema ({matchingVehicleSuggestions.length}):
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPlateSuggestions(false)}
                        className="text-slate-400 hover:text-rose-500 text-xs px-1 cursor-pointer font-bold"
                      >
                        ✕ Fechar
                      </button>
                    </div>

                    {matchingVehicleSuggestions.map((sug) => {
                      const isUnified = sug.plate.type === 'unified';
                      const plateLabel = isUnified
                        ? `${sug.plate.provinceCode || ''} ${sug.plate.letter || ''} ${sug.plate.number || ''}`
                        : `${sug.plate.oldCityName || ''} ${sug.plate.oldNumber || ''}`;
                      const debt = getVehicleTotalDebt(sug);

                      return (
                        <button
                          key={sug.id}
                          type="button"
                          onClick={() => handleSelectExistingVehicle(sug)}
                          className="w-full text-right p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Plate Mini Badge */}
                            <div
                              className="px-2 py-1 rounded-lg bg-black text-white font-mono font-black text-xs shrink-0 tracking-wider flex items-center gap-1 shadow-xs"
                              dir="ltr"
                            >
                              <span className="text-[9px] text-amber-400">KR</span>
                              <span>{plateLabel}</span>
                            </div>

                            <div className="min-w-0 text-right">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-slate-900 dark:text-white text-xs truncate">
                                  {sug.ownerName || 'Cliente '}
                                </span>
                                {sug.totalWashes > 0 && (
                                  <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded-md font-bold">
                                    {sug.totalWashes} acima / topo
                                  </span>
                                )}
                                {sug.currentCycleWashes >= settings.washesNeededForFree && (
                                  <span className="text-[9px] bg-emerald-500 text-white font-black px-1.5 py-0.2 rounded">
                                    FREE 🎁
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                {sug.carModel && <span>🚗 {sug.carModel} {sug.color ? `(${sug.color})` : ''}</span>}
                                {sug.phone && <span className="font-mono" dir="ltr">📞 {sug.phone}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {debt > 0 && (
                              <span className="text-[9px] font-black text-rose-600 bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
                                Fiado / Débito pendente: {formatR$(debt)}
                              </span>
                            )}
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-0.5">
                              Abrir ↵
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Matched Customer Pill */}
              {matchedExistingVehicle && (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between shadow-2xs animate-fade-in">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span>Cliente :</span>
                          <strong className="text-emerald-950 dark:text-emerald-100 font-extrabold">{matchedExistingVehicle.ownerName}</strong>
                          <span className="text-[10px] bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded-md">
                            {matchedExistingVehicle.totalWashes} acima / topo
                          </span>
                          {matchedExistingVehicle.currentCycleWashes >= settings.washesNeededForFree && (
                            <span className="font-extrabold text-white bg-emerald-600 px-1.5 py-0.5 rounded text-[10px]">
                              FREE 🎁
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                          ✨ informaçõesum   (Auto-filled)
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearVehicleInputs}
                      className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 rounded-lg shadow-2xs transition cursor-pointer"
                      title="Abrir informações como para Dar Entrada Nome Novo"
                    >
                      Abrir ✕
                    </button>
                  </div>

                  {getVehicleTotalDebt(matchedExistingVehicle) > 0 && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center justify-between shadow-2xs animate-fade-in">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <div>
                          <strong className="block text-rose-950 font-black">
                            ⚠️ Fiado / Débito pendente antes de: {formatR$(getVehicleTotalDebt(matchedExistingVehicle))}
                          </strong>
                          <span className="text-[10px] text-rose-700">
                            este Cliente Recibo até 
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDebtListModal(true)}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shadow-xs cursor-pointer shrink-0"
                      >
                        até
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Owner and Phone */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-800 dark:text-slate-200 block mb-1 font-extrabold">Nome do Cliente:</label>
                  <input
                    type="text"
                    placeholder="Carlos da Silva"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-800 dark:text-slate-200 block mb-1 font-extrabold">Telefone / Celular:</label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-left focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-xs"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Model and Color */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-800 dark:text-slate-200 block mb-1 font-extrabold">Modelo do Veículo:</label>
                  <input
                    type="text"
                    placeholder="Toyota Camry"
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-800 dark:text-slate-200 block mb-1 font-extrabold">Cor:</label>
                  <input
                    type="text"
                    placeholder="Branco, Preto, Prata..."
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-xs"
                  />
                </div>
              </div>

              {/* Action Submit Buttons */}
              <div className="space-y-2 pt-2">
                {/* 1. Primary: Start Washing Now in Bay (Payment later upon finish or checkout) */}
                <button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    handleFastRegisterAndAdmit(undefined, 'wash_now');
                  }}
                  className="w-full h-12 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-emerald-200" />
                  <span>🚿 Entrada no Pátio e Iniciar Lavagem</span>
                </button>
                <div className="text-[10px] text-center text-slate-500 dark:text-slate-400 font-bold -mt-1">
                  (O veículo entra no Box • Pagamento ao finalizar ou na saída ⏳)
                </div>

                {/* 2. Secondary & Queue Row */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleFastRegisterAndAdmit(undefined, 'pay_now')}
                    className="py-2.5 px-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1.5 cursor-pointer border border-blue-200 dark:border-blue-800 shadow-2xs"
                    title="Caso o cliente efetue o pagamento adiantado"
                  >
                    <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>💰 Recebimento Antecipado + Recibo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFastRegisterAndAdmit(undefined, 'queue')}
                    className="py-2.5 px-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1.5 cursor-pointer border border-amber-200 dark:border-amber-800 shadow-2xs"
                    title="Colocar na fila de espera caso os boxes estejam cheios"
                  >
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>⏳ Colocar na Fila de Espera</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* ---------------- COLUMN 2: ACTIVE CARS IN WASH (WAITING & WASHING) + SALES ARCHIVE (7 Cols) ---------------- */}
        <div
          className={`lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 text-slate-900 dark:text-slate-100 ${
            mobileActiveView === 'register' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Header */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Veículo Nome lava-rápido</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {activeYardCars.length} em lava-rápido
                  </span>
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                   Aguardando Iniciar Lavagem   Valor
                </p>
              </div>
            </div>

            {/* Cashier Action Tools & Live Counters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setShowPettyCashModal(true)}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                title=" Despesa porem em Caixa / Cofre (Petty Cash)"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Despesa Caixa / Cofre</span>
              </button>

              <button
                type="button"
                onClick={() => setShowZReportModal(true)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Fechar Caixa / Cofre Hoje   Z-Report para Proprietário"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Fechar Caixa / Cofre (Z)</span>
              </button>

              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className={`p-1 rounded-lg border transition cursor-pointer ${
                  isSyncing
                    ? 'text-blue-600 bg-blue-100 border-blue-300 animate-spin'
                    : 'text-slate-500 bg-slate-50 hover:bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                }`}
                title="Atualizar Rápido até Vendas com três"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  if (next) playPosSound('beep');
                }}
                className={`p-1 rounded-lg border transition cursor-pointer ${
                  soundEnabled
                    ? 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                    : 'text-slate-400 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                }`}
                title={soundEnabled ? 'dez Ativo' : 'dez semdez'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs">
                ⏳ : {waitingCars.length}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs">
                🚿 Em Lavagem: {washingCars.length}
              </span>
              {unpaidCars.length > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs">
                  💰 Valor Restante / Pendente: {unpaidCars.length}
                </span>
              )}
            </div>
          </div>

          {/* Filter Tabs: Waiting, In Wash, Ready, Unpaid, All, Sales Feed */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveListTab('waiting')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeListTab === 'waiting'
                  ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/20'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
              }`}
            >
              <span>⏳ Aguardando Lavagem</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/30 text-current">
                {waitingCars.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveListTab('washing')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeListTab === 'washing'
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100'
              }`}
            >
              <span>🚿 Em Lavagem</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/30 text-current">
                {washingCars.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveListTab('ready')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeListTab === 'ready'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/20'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
              }`}
            >
              <span>✨ Concluído</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/30 text-current">
                {readyCars.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveListTab('unpaid')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeListTab === 'unpaid'
                  ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/20'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100'
              }`}
            >
              <span>💰 Valor Restante / Pendente</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/30 text-current">
                {unpaidCars.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveListTab('all')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeListTab === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <span>📋 Todos</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900">
                {activeYardCars.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveListTab('sales')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer mr-auto ${
                activeListTab === 'sales'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>🧾 Histórico de os recibos</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900">
                {todaySalesList.length}
              </span>
            </button>
          </div>

          {/* VIEW 1: ACTIVE YARD CARS (WAITING, WASHING, READY, UNPAID, ALL) */}
          {activeListTab !== 'sales' && (
            <>
              {displayedYardCars.length === 0 ? (
                <div className="py-14 text-center space-y-3 bg-slate-50/60 dark:bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700/80">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                    <Car className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                      {activeListTab === 'waiting'
                        ? 'Nenhum Veículo em Fila de Aguardando não há'
                        : activeListTab === 'washing'
                        ? 'em até Nenhum Veículo em Lavagem não há'
                        : activeListTab === 'unpaid'
                        ? 'Nenhum Veículoum Valor Restante / Pendente (Todos )'
                        : activeListTab === 'ready'
                        ? 'Nenhum Veículoum Concluído em  Restante / Pendente'
                        : 'em até Nenhum Veículoum em lava-rápido não há'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Horário em  dez Número Placa  dezque ao vivo / tempo real    Aguardando Lavagem dezsem.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {displayedYardCars.map((car, idx) => {
                    const entryTime = car.bayEntryTime || car.lastVisitDate;
                    const elapsedMins = entryTime
                      ? Math.max(0, Math.floor((Date.now() - new Date(entryTime).getTime()) / (1000 * 60)))
                      : 0;
                    const isOvertime = elapsedMins >= 30;
                    const isWarning = elapsedMins >= 15 && elapsedMins < 30;
                    const isWaiting = car.washStage === 'Aguardando';
                    const isReady = car.washStage === 'Concluído';
                    const latestWash = car.washHistory?.[0];
                    const isPaid = latestWash?.paymentStatus === 'paid';
                    const washPrice = latestWash?.price || 10000;

                    return (
                      <div
                        key={car.id}
                        className={`rounded-2xl p-4 flex flex-col justify-between transition-all border-2 shadow-xs space-y-3 ${
                          isWaiting
                            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/80 ring-2 ring-amber-500/10'
                            : isReady
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/10'
                            : isOvertime
                            ? 'bg-rose-50/50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/10'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        {/* Card Top: Number, Badges, Timer, Close Button */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-xs font-black flex items-center justify-center font-mono shadow-2xs">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate max-w-[130px]">
                              {car.carModel || 'Veículo'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 border shadow-2xs ${
                                isWaiting
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                                  : isReady
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                                  : isOvertime
                                  ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200 animate-pulse'
                                  : isWarning
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-200'
                              }`}
                              title={`o Veículo para Restante / Pendente ${elapsedMins} Minutos em lava-rápido Restante / Pendente`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>{elapsedMins} Minutos</span>
                              {isOvertime && <span>⚠️</span>}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleReleaseBayDirectly(car)}
                              className="p-1 rounded-lg bg-slate-100 hover:bg-rose-100 dark:bg-slate-700 hover:dark:bg-rose-950 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                              title="Remover o Veículo em lava-rápido"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Status Pill Row (Wash State + Payment State) */}
                        <div className="flex items-center justify-between gap-1 text-[11px]">
                          {/* Wash Stage Badge */}
                          {isWaiting ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 font-extrabold border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                              <span>⏳ Aguardando Lavagem</span>
                            </span>
                          ) : isReady ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 font-extrabold border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                              <span>✨ Lavagem Concluído</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 font-extrabold border border-blue-300 dark:border-blue-700 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                              <span>🚿 Em Lavagem ({car.washStage})</span>
                            </span>
                          )}

                          {/* Payment Status Badge */}
                          {isPaid ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span> ✓</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                              <Coins className="w-3 h-3 text-rose-600" />
                              <span>Valor Restante / Pendente: {formatR$(washPrice)}</span>
                            </span>
                          )}
                        </div>

                        {/* Kurdish / Iraq Plate Display */}
                        <div className="flex justify-center py-0.5">
                          {car.itemType === 'carpet' || car.carpetSpecs ? (
                            <div className="px-3.5 py-1.5 bg-teal-50 dark:bg-teal-950/70 border border-teal-300 dark:border-teal-700/80 rounded-xl text-teal-900 dark:text-teal-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                              <span className="text-sm">🧶</span>
                              <span>Tapete:</span>
                              <span className="font-mono font-black text-teal-700 dark:text-teal-300">
                                C-{car.plate.number}
                              </span>
                              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                                ({car.carpetSpecs?.areaSquareMeters || 12} ²)
                              </span>
                            </div>
                          ) : (
                            <PlateDisplay plate={car.plate} size="sm" />
                          )}
                        </div>

                        {/* Customer & Car Info */}
                        <div className="text-center text-xs space-y-0.5 bg-slate-50 dark:bg-slate-700/40 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {car.ownerName ? `Cliente: ${car.ownerName}` : 'Lavagem '}
                            {car.color ? ` • Cor: ${car.color}` : ''}
                          </p>
                          {car.assignedWorkerName && (
                            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold truncate">
                              Profissional por: {car.assignedWorkerName}
                            </p>
                          )}
                        </div>

                        {/* Context Action: If Waiting -> Start Washing; If Washing -> Stage selector */}
                        {isWaiting ? (
                          <div className="space-y-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartWashing(car.id)}
                              className="w-full py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 active:scale-98 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer transition"
                            >
                              <Sparkles className="w-4 h-4 text-sky-200" />
                              <span>Iniciar Lavagem este Veículo 🚿</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs px-0.5">
                              <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">etapa :</span>
                              <span className="font-black text-amber-600 dark:text-amber-400 text-[11px]">
                                {car.washStage}
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-1 text-[10px]">
                              {(
                                [
                                  { id: 'Espuma', label: 'Espuma 🧼' },
                                  { id: 'Lavagem Externa', label: 'água 🚿' },
                                  { id: 'Abrir  Polimento', label: ' 💨' },
                                  { id: 'Concluído', label: 'Concluído ✨' },
                                ] as const
                              ).map((st) => (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() => handleStageChange(car.id, st.id as any)}
                                  className={`py-1 rounded-lg font-bold transition text-center cursor-pointer border ${
                                    car.washStage === st.id
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                      : 'bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  {st.label}
                                </button>
                              ))}
                            </div>

                            {/* WhatsApp Notify */}
                            {car.phone && (
                              <button
                                type="button"
                                onClick={() => {
                                  const msg = generateCarReadyMessage(car, settings, 1);
                                  openWhatsAppChat(car.phone, msg);
                                }}
                                className={`w-full mt-1 py-1 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer border ${
                                  isReady
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-2xs'
                                    : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                                }`}
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{isReady ? '📲 WhatsApp: Veículo Pronto!' : '📲 Aviso / Alerta WhatsApp'}</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Service & Price Summary Banner */}
                        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-700/60 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600">
                          <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-bold truncate">
                            <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="truncate">{latestWash?.serviceName || 'Lavagem '}</span>
                          </span>
                          <span className="font-black text-sm text-emerald-700 dark:text-emerald-400 font-mono shrink-0">
                            {formatR$(washPrice)}
                          </span>
                        </div>

                        {/* Footer Actions: Settle / Pay Button + Print + Exit */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 space-y-2">
                          {/* Settle / Paid status action button */}
                          {!isPaid ? (
                            <div className="space-y-1.5 p-2 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700 shadow-2xs">
                              <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                                <span className="flex items-center gap-1.5">
                                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span>Valor Restante / Pendente (pago):</span>
                                </span>
                                <span className="font-black font-mono text-sm text-amber-950 dark:text-amber-100">
                                  {formatR$(washPrice)}
                                </span>
                              </div>

                              {/* Big Main Payment Button */}
                              <button
                                type="button"
                                onClick={() => handleInitiateCheckout(car)}
                                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 active:scale-98 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition animate-pulse"
                                title="Recebimento Valor Lavagem por  Fiado / Débito pendente ou "
                              >
                                <Coins className="w-4 h-4 text-emerald-100" />
                                <span>Recebimento Valor ({formatR$(washPrice)})  Recibo / Comprovante ↵</span>
                              </button>

                              {/* Fast 1-Click Shortcuts */}
                              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleMarkAsPaid(car, 'cash')}
                                  className="py-1.5 px-2 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                  title="Recebimento ao vivo / tempo real por  com Recibo / Comprovante"
                                >
                                  <span>⚡  por </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleMarkAsPaid(car, 'debt')}
                                  className="py-1.5 px-2 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                  title="Salvar / Registrar por Fiado / Débito pendente"
                                >
                                  <span>⚠️ Registrar por Fiado / Débito pendente</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5 p-2 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/80">
                              <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>o valor pago:</span>
                                </span>
                                <span className="font-black font-mono text-emerald-950 dark:text-emerald-100">
                                  {formatR$(washPrice)} ({latestWash?.paymentMethod === 'debt' ? 'Fiado / Débito pendente' : ''})
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleQuickPrintReceipt(car)}
                                  className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  <span>Imprimir Recibo / Comprovante</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleInitiateCheckout(car)}
                                  className="py-1.5 px-2 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                  title="Editar Método Pagamento Fiado / Débito pendente ou Quantidade Valor"
                                >
                                  <CreditCard className="w-3 h-3 text-slate-500" />
                                  <span>Editar Valor</span>
                                </button>
                              </div>

                              {/* Reset to Unpaid button if marked paid by mistake */}
                              <button
                                type="button"
                                onClick={() => handleToggleUnpaid(car)}
                                className="w-full py-0.5 text-[10px] text-amber-700 dark:text-amber-300 hover:underline text-center cursor-pointer font-bold"
                              >
                                🔄 por Erro  clique que para Alterar para (Valor )
                              </button>
                            </div>
                          )}

                          {/* Complete & Exit Button */}
                          <button
                            type="button"
                            onClick={() => handleCompleteAndExit(car)}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            title="Veículo lava-rápido por"
                          >
                            <LogOut className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Concluído • saída em lava-rápido 🏁</span>
                          </button>

                          {/* Extra Add-ons: Cafe, VIP */}
                          <div className="flex items-center gap-1 pt-0.5">
                            <button
                              type="button"
                              onClick={() => setCafeModalVehicle(car)}
                              className="flex-1 py-1 px-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Coffee className="w-3 h-3 text-amber-600" />
                              <span></span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSubscriptionVehicle(car)}
                              className="flex-1 py-1 px-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Crown className="w-3 h-3 text-amber-500" />
                              <span>VIP</span>
                            </button>

                            {!isPaid && isReady && (
                              <button
                                type="button"
                                onClick={() => handleInitiateCheckout(car)}
                                className="flex-1 py-1 px-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>  saída</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* VIEW 2: TODAY'S LIVE SALES & INVOICES FEED (WHEN TAB === 'sales') */}
          {activeListTab === 'sales' && (
            <div className="space-y-3">
              {/* Search Bar & Branch Filter Chips */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar porconforme Placa Nome do Cliente Telefone / Celular Modelo..."
                      value={salesSearch}
                      onChange={(e) => setSalesSearch(e.target.value)}
                      className="w-full pr-8 pl-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                    />
                    {salesSearch && (
                      <button
                        type="button"
                        onClick={() => setSalesSearch('')}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <span className="text-xs px-3 py-1.5 rounded-full font-black bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs font-mono self-start sm:self-center">
                    Total Geral: {formatR$(filteredSalesTotal)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSalesBranchFilter('all')}
                    className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      salesBranchFilter === 'all'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    <span>Todos ({todaySalesList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSalesBranchFilter('branch-1')}
                    className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      salesBranchFilter === 'branch-1'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    <span>🏢 Unidade 1 ({branch1Count})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSalesBranchFilter('branch-2')}
                    className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      salesBranchFilter === 'branch-2'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    <span>🏢 Unidade 2 (Filial) ({branch2Count})</span>
                  </button>
                </div>
              </div>

              {/* Invoices Feed */}
              {filteredTodaySales.length === 0 ? (
                <div className="py-12 text-center space-y-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <Receipt className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {salesSearch ? 'Nenhum Recibo / Comprovanteum por Buscar ' : 'até até Nenhum Vendas para Hoje Registrar não realizado'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {filteredTodaySales.map(({ vehicle, record }, idx) => {
                    const isDebt = record.paymentStatus === 'unpaid';
                    const branchLabel = record.branchName || (record.branchId === 'branch-2' ? 'Unidade 2 (Filial)' : 'Unidade 1');
                    const timeString = record.date ? new Date(record.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

                    return (
                      <div
                        key={record.id || idx}
                        className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-400 transition shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                                {vehicle.ownerName || 'Cliente prezado(a)'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {timeString}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                                {branchLabel}
                              </span>
                              {isDebt && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 font-black border border-rose-200 dark:border-rose-800 flex items-center gap-0.5">
                                  <AlertCircle className="w-2.5 h-2.5" />
                                  <span>Fiado / Débito pendente</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {vehicle.carModel || 'Veículo'} • {record.serviceName || 'Lavagem '}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <PlateDisplay plate={vehicle.plate} size="sm" />
                          <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                            {formatR$(Number(record.price) || 0)}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleQuickPrintReceipt(vehicle, record)}
                              className="p-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-600 rounded-xl transition cursor-pointer"
                              title="ImpressãoAbrir Recibo / Comprovante"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            {vehicle.phone && (
                              <button
                                type="button"
                                onClick={() => {
                                  const msg = generateCarReadyMessage(vehicle, settings, 1);
                                  openWhatsAppChat(vehicle.phone, msg);
                                }}
                                className="p-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-600 rounded-xl transition cursor-pointer"
                                title="Aviso / Alerta aplicativo"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteSale(vehicle.id, record.id)}
                              className="p-1.5 bg-white dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 border border-slate-200 dark:border-slate-600 rounded-xl transition cursor-pointer"
                              title="Excluir Vendas"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>


{/* ========================================================= */}
      {/* MODALS: CHECKOUT, ASSIGN BAY, CAMERA SIMULATOR, Z-REPORT, DEBT */}
      {/* ========================================================= */}

      {/* Checkout / Payment Modal */}
      {checkoutVehicle && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md sm:max-w-lg w-full shadow-2xl text-slate-900 dark:text-white my-auto flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header (Fixed / Always Visible at Top) */}
            <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 flex items-center justify-between shrink-0 bg-slate-50/90 dark:bg-slate-800/80">
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">Recebimento Valor Lavagem  Recibo / Comprovante</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Veículo: <strong className="text-slate-800 dark:text-slate-200">{checkoutVehicle.carModel}</strong>
                </p>
              </div>
              <button
                onClick={() => setCheckoutVehicle(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 overscroll-contain">
              <div className="flex justify-center py-0.5">
                <PlateDisplay plate={checkoutVehicle.plate} size="md" />
              </div>

              {checkoutVehicle.currentCycleWashes >= settings.washesNeededForFree && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-center text-xs text-emerald-800 dark:text-emerald-300 font-bold space-y-0.5 shadow-2xs">
                  <Sparkles className="w-4 h-4 mx-auto text-emerald-600 dark:text-emerald-400" />
                  <p>🎉 Parabéns! Lavagem 5 Grátis (FREE - 0 R$)!</p>
                </div>
              )}

              {/* Rain Warranty Option */}
              <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🌧️</span>
                  <div>
                    <p className="text-xs font-bold text-sky-950 dark:text-sky-200">prazo de garantia dia de chuva (Rain Warranty)</p>
                    <p className="text-[10px] text-sky-700 dark:text-sky-400">Lavagem dois por Grátis em Restante / Pendente 24 Horário</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutIsRainWarranty(!checkoutIsRainWarranty)}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg transition border cursor-pointer ${
                    checkoutIsRainWarranty
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/50'
                  }`}
                >
                  {checkoutIsRainWarranty ? 'Ativo (Grátis)' : 'Ativo'}
                </button>
              </div>

              {/* Pre-Wash Damage Inspection */}
              <details className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-300">
                <summary className="font-bold cursor-pointer select-none flex items-center justify-between text-slate-800 dark:text-slate-200">
                  <span>🛡️ Vistoria    antes de Lavagem</span>
                  <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                    {checkoutHasScratches || checkoutHasDents || checkoutHasBrokenParts ? 'Salvo com sucesso ⚠️' : 'Nenhum não há (que)'}
                  </span>
                </summary>
                <div className="pt-2 space-y-2">
                  <div className="grid grid-cols-3 gap-1">
                    <label className={`flex items-center gap-1.5 p-1.5 rounded-lg border cursor-pointer text-[11px] font-bold ${checkoutHasScratches ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                      <input
                        type="checkbox"
                        checked={checkoutHasScratches}
                        onChange={(e) => setCheckoutHasScratches(e.target.checked)}
                        className="rounded text-amber-600"
                      />
                      <span> para</span>
                    </label>
                    <label className={`flex items-center gap-1.5 p-1.5 rounded-lg border cursor-pointer text-[11px] font-bold ${checkoutHasDents ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                      <input
                        type="checkbox"
                        checked={checkoutHasDents}
                        onChange={(e) => setCheckoutHasDents(e.target.checked)}
                        className="rounded text-amber-600"
                      />
                      <span> em</span>
                    </label>
                    <label className={`flex items-center gap-1.5 p-1.5 rounded-lg border cursor-pointer text-[11px] font-bold ${checkoutHasBrokenParts ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-900 dark:text-rose-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                      <input
                        type="checkbox"
                        checked={checkoutHasBrokenParts}
                        onChange={(e) => setCheckoutHasBrokenParts(e.target.checked)}
                        className="rounded text-rose-600"
                      />
                      <span> Vidros/água</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={checkoutDamageNotes}
                    onChange={(e) => setCheckoutDamageNotes(e.target.value)}
                    placeholder="Observações  ou (como:  dez  )..."
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </details>

              {/* Vehicle Size in Checkout */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">Porte Veículo:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'sedan', label: '🚗 ' },
                    { id: 'suv', label: '🚙 ' },
                    { id: 'truck', label: '🚐 ' },
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setCheckoutVehicleSize(sz.id as VehicleSize)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        checkoutVehicleSize === sz.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* VIP Subscription Badge if active */}
              {checkoutVehicle.subscription?.status === 'active' && new Date(checkoutVehicle.subscription.endDate) > new Date() && (
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 rounded-xl flex items-center justify-between text-purple-900 dark:text-purple-200 shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="font-extrabold text-xs block">Membro VIP sem (Unlimited Pass)</span>
                      <span className="text-[10px] text-purple-700 dark:text-purple-300">Lavagem Grátis até {checkoutVehicle.subscription.endDate.split('T')[0]}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-black rounded-lg">0 R$</span>
                </div>
              )}

              {/* Service in Checkout (Filtered to Car Services Only) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-800 dark:text-slate-200 font-extrabold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Serviço Lavagem de Veículo:</span>
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">um abaixo / sob</span>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1 text-xs">
                  {(() => {
                    const carWashServices = services.filter(
                      (s) => s.category === 'Veículo' || s.category === 'Polimento  Vitrificação / Nano cerâmica'
                    );
                    const listToDisplay = carWashServices.length > 0 ? carWashServices : services;

                    return listToDisplay.map((srv) => {
                      const currentPrice = calculateServicePrice(srv, checkoutVehicleSize);
                      const isSelected = checkoutServiceId === srv.id;
                      const isVip =
                        checkoutVehicle.subscription?.status === 'active' &&
                        new Date(checkoutVehicle.subscription.endDate) > new Date();
                      const isLoyaltyFree = checkoutVehicle.currentCycleWashes >= settings.washesNeededForFree;
                      const isFree = isVip || isLoyaltyFree || checkoutIsRainWarranty;

                      return (
                        <div
                          key={srv.id}
                          onClick={() => setCheckoutServiceId(srv.id)}
                          className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-600 dark:border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-400 dark:border-slate-500'
                              }`}
                            >
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <div>
                              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white block">
                                {srv.name}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                ⏱️ {srv.durationMinutes || 25} Minutos • {srv.unit || 'Lavagem Concluído'}
                              </span>
                            </div>
                          </div>

                          <div className="text-left font-mono">
                            {isFree ? (
                              <div className="text-left space-y-0.5">
                                <span className="text-[10px] line-through text-slate-400 block font-sans">
                                  {formatR$(currentPrice)}
                                </span>
                                <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-xs inline-block">
                                  {isVip ? '0 R$ (VIP)' : '0 R$ (FREE 🎁)'}
                                </span>
                              </div>
                            ) : (
                              <strong className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                                {formatR$(currentPrice)}
                              </strong>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Cafe & Lounge Addon in Checkout */}
              <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-800/70 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                    <Coffee className="w-4 h-4 text-amber-600" />
                    <span>   Materiais (Lounge):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCafeModalVehicle(checkoutVehicle)}
                    className="text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-200/80 dark:bg-amber-900/60 hover:bg-amber-300 px-3 py-1 rounded-xl border border-amber-300 dark:border-amber-700 transition cursor-pointer"
                  >
                    + Selecionar ou Editar
                  </button>
                </div>
                {checkoutCafeItems.length > 0 ? (
                  <div className="space-y-1.5 pt-1.5 border-t border-amber-200 dark:border-amber-800/60">
                    {checkoutCafeItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs text-amber-900 dark:text-amber-200">
                        <span>• {item.name} × {item.quantity}</span>
                        <span className="font-mono font-bold">{formatR$(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center text-xs font-black text-amber-950 dark:text-amber-100 pt-1.5 border-t border-amber-200 dark:border-amber-800/60">
                      <span>Total :</span>
                      <span className="font-mono font-black text-amber-900 dark:text-amber-200">{formatR$(checkoutCafeItems.reduce((acc, it) => acc + it.price * it.quantity, 0))}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 font-medium">Nenhum  ou queum  Grátis (Fidelidade) não realizado.</p>
                )}
              </div>

              {/* Payment Method Selector ( FastPay FIB Fiado / Débito pendente) */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-800 dark:text-slate-200 font-extrabold block">Método Recebimento Valor:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-black">
                  {[
                    { id: 'cash', label: '💵  (Cash)', color: 'border-emerald-500 bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/20' },
                    { id: 'fastpay', label: '📱 FastPay', color: 'border-amber-500 bg-amber-600 text-white shadow-amber-600/30 ring-2 ring-amber-500/20' },
                    { id: 'fib', label: '🏦 FIB ', color: 'border-blue-500 bg-blue-600 text-white shadow-blue-600/30 ring-2 ring-blue-500/20' },
                    { id: 'debt', label: '⚠️ Fiado / Débito pendente (Debt)', color: 'border-rose-500 bg-rose-600 text-white shadow-rose-600/30 ring-2 ring-rose-500/20' },
                  ].map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setCheckoutPaymentMethod(pm.id as PaymentMethod)}
                      className={`py-3 px-2 rounded-xl border-2 transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                        checkoutPaymentMethod === pm.id
                          ? pm.color
                          : 'bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>

                {checkoutPaymentMethod === 'debt' && (
                  <div className="pt-1.5">
                    <input
                      type="text"
                      value={checkoutDebtNote}
                      onChange={(e) => setCheckoutDebtNote(e.target.value)}
                      placeholder="Observações Fiado / Débito pendente (Nome do Cliente ou que dez)..."
                      className="w-full px-3 py-2 bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-300 dark:border-rose-700 rounded-xl text-xs text-rose-950 dark:text-rose-200 placeholder-rose-400 font-bold focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Staff in Checkout */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-800 dark:text-slate-200 font-extrabold">Profissional por  em:</label>
                  {(() => {
                    const currWorker = staff.find((s) => s.id === checkoutStaffId);
                    const currentSrv = services.find((s) => s.id === checkoutServiceId) || services[0];
                    const currentPrice =
                      checkoutVehicle.currentCycleWashes >= settings.washesNeededForFree || checkoutIsRainWarranty
                        ? 0
                        : calculateServicePrice(currentSrv, checkoutVehicleSize);
                    const comm =
                      checkoutCustomCommission !== null
                        ? checkoutCustomCommission
                        : calculateWorkerCommission(currWorker, currentPrice);
                    return (
                      <span className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-0.5 rounded-full font-mono font-bold border border-emerald-300 dark:border-emerald-700">
                        em: {formatR$(comm)}
                      </span>
                    );
                  })()}
                </div>
                <select
                  value={checkoutStaffId}
                  onChange={(e) => {
                    setCheckoutStaffId(e.target.value);
                    setCheckoutCustomCommission(null);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role}) • {s.commissionType === 'percentage' ? `${s.commissionValue || 25} em` : s.commissionType === 'none' ? 'sem em' : `${formatR$(s.commissionValue !== undefined ? s.commissionValue : 2000)} em`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grand Total Financial Breakdown (High Impact & High Contrast) */}
              {(() => {
                const currentSrv = services.find((s) => s.id === checkoutServiceId) || services[0];
                const currentPrice = calculateServicePrice(currentSrv, checkoutVehicleSize);
                const isVip = checkoutVehicle.subscription?.status === 'active' && new Date(checkoutVehicle.subscription.endDate) > new Date();
                const isFreeWash = checkoutVehicle.currentCycleWashes >= settings.washesNeededForFree || checkoutIsRainWarranty || isVip;
                const discountAmt = (isHappyHourActive && !isFreeWash) ? Math.round((currentPrice * happyHourDiscountPercent) / 100) : 0;
                const washFinal = isFreeWash ? 0 : Math.max(0, currentPrice - discountAmt);
                const cafeSum = checkoutCafeItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
                const totalBill = washFinal + cafeSum;
                return (
                  <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 dark:from-slate-950 dark:to-slate-900 text-white rounded-2xl border-2 border-slate-700 shadow-xl space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Serviço ({currentSrv.name}):</span>
                      <span className="font-mono font-bold text-white">
                        {isFreeWash ? '0 R$ (Grátis)' : formatR$(washFinal)}
                      </span>
                    </div>

                    {cafeSum > 0 && (
                      <div className="flex items-center justify-between text-xs text-amber-300">
                        <span>   ({checkoutCafeItems.length} unid.):</span>
                        <span className="font-mono font-bold text-amber-400">+{formatR$(cafeSum)}</span>
                      </div>
                    )}

                    {discountAmt > 0 && !isFreeWash && (
                      <div className="flex items-center justify-between text-xs text-emerald-300">
                        <span>Desconto Happy Hour ({happyHourDiscountPercent}%):</span>
                        <span className="font-mono font-bold text-emerald-400">-{formatR$(discountAmt)}</span>
                      </div>
                    )}

                    <div className="pt-2.5 border-t border-slate-700/80 flex items-center justify-between">
                      <span className="font-black text-sm text-slate-100">Total Geral para Recebimento:</span>
                      <strong className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
                        {formatR$(totalBill)}
                      </strong>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Actions Footer (Always Visible at Bottom!) */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0 bg-slate-50/95 dark:bg-slate-800/90 shadow-lg">
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Concluído  dez Recibo / Comprovante</span>
              </button>
              <button
                type="button"
                onClick={() => setCheckoutVehicle(null)}
                className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Printed Receipt Modal */}
      {printedReceiptData && (
        <ReceiptModal
          vehicle={printedReceiptData.vehicle}
          service={printedReceiptData.service}
          staffName={printedReceiptData.staffName}
          isFree={printedReceiptData.isFree}
          freeReason={printedReceiptData.freeReason}
          isSubscriptionWash={printedReceiptData.isSubscriptionWash}
          cafeItems={printedReceiptData.cafeItems}
          cafeTotal={printedReceiptData.cafeTotal}
          damageInspection={printedReceiptData.damageInspection}
          settings={effectiveReceiptSettings}
          chargedPrice={printedReceiptData.chargedPrice}
          vehicleSize={printedReceiptData.vehicleSize}
          paymentMethod={printedReceiptData.paymentMethod}
          isDebt={printedReceiptData.isDebt}
          onClose={() => setPrintedReceiptData(null)}
        />
      )}

      {/* VIP Subscription Modal */}
      {subscriptionVehicle && (
        <SubscriptionModal
          vehicle={subscriptionVehicle}
          settings={settings}
          onClose={() => setSubscriptionVehicle(null)}
          onSubscribe={(updated: Vehicle, amountPaid: number) => {
            onUpdateVehicles(vehicles.map((v) => (v.id === updated.id ? updated : v)));
            setSubscriptionVehicle(null);
            onNotify(`👑  VIP por sucesso para ${updated.ownerName} Salvo com sucesso (${formatR$(amountPaid)})!`);
          }}
        />
      )}

      {/* Cafe Add-on Modal */}
      {cafeModalVehicle && (
        <CafeAddonModal
          vehicle={cafeModalVehicle}
          initialSelectedItems={
            cafeModalVehicle.currentBay
              ? (bayCafeOrders[cafeModalVehicle.currentBay] || [])
              : checkoutCafeItems
          }
          onClose={() => setCafeModalVehicle(null)}
          onSave={(items: SelectedCafeItem[], totalSum: number) => {
            if (cafeModalVehicle.currentBay) {
              setBayCafeOrders((prev) => ({
                ...prev,
                [cafeModalVehicle.currentBay!]: items,
              }));
            }
            if (checkoutVehicle && checkoutVehicle.id === cafeModalVehicle.id) {
              setCheckoutCafeItems(items);
            }
            setCafeModalVehicle(null);
            const totalCount = items.reduce((sum: number, it: SelectedCafeItem) => sum + it.quantity, 0);
            onNotify(`☕   para ${cafeModalVehicle.ownerName} Novo (${totalCount} unid. - ${formatR$(totalSum)}).`);
          }}
        />
      )}

      {/* Z-Report Modal */}
      {showZReportModal && (
        <ZReportModal
          vehicles={vehicles}
          staff={staff}
          settings={settings}
          onClose={() => setShowZReportModal(false)}
          onSaveReport={handleSaveZReport}
        />
      )}

      {/* Debt Management Modal */}
      {showDebtListModal && (
        <DebtManagementModal
          vehicles={vehicles}
          onSettleDebt={handleSettleDebtRecord}
          onClose={() => setShowDebtListModal(false)}
        />
      )}

      {/* Petty Cash Modal */}
      {showPettyCashModal && (
        <PettyCashModal
          onClose={() => setShowPettyCashModal(false)}
          onSave={(exp) => {
            const existing = getSavedExpenses();
            saveExpenses([exp, ...existing]);
            setShowPettyCashModal(false);
            onNotify(`💸 Valor ${formatR$(exp.amount)} em Caixa / Cofre  (${exp.title}).`);
          }}
        />
      )}
    </div>
  );
};