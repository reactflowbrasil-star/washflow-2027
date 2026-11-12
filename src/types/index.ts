export type PlateType = 'unified' | 'old';

// Gestão de Filiais & Unidades (Multi-Branch)
export interface Branch {
  id: string; // ex: "branch-1", "branch-2"
  name: string; // ex: "Unidade 1 (Principal)", "Unidade 2"
  code: string; // ex: "B1", "B2"
  address: string;
  phone: string;
  numberOfBays: number;
  managerName?: string;
  isMain?: boolean;
}

// Autenticação de Usuários & Funções
export type UserRole = 'admin' | 'cashier';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  avatar?: string;
}

export interface AuthSession {
  currentUser: AuthUser;
  loginTime: string;
}

export interface LicensePlate {
  type: PlateType;
  // Para modelo Mercosul / unificado:
  provinceCode?: string; // ex: código de estado/região "SP", "RJ", "21"
  provinceName?: string; // ex: "São Paulo", "Rio de Janeiro"
  letter?: string; // ex: "A", "B", "M"
  number?: string; // ex: "4589"
  // Para placas antigas / outros formatos:
  oldCityName?: string; // ex: cidade
  oldCategory?: string; // ex: "Particular", "Aluguel / Comercial", "Oficial"
  oldNumber?: string; // ex: "258569"
}

// Todos os itens na Configuração Inicial já constam como adquiridos
export interface SetupItem {
  id: string;
  name: string;
  category: 'Equipamentos' | 'Materiais e Suprimentos' | 'Construção civil' | 'Elétrica e Iluminação' | 'Publicidade e Decoração';
  cost: number; // R$ (Valor de compra)
  quantity: number;
  unit: string;
  purchaseDate: string;
  notes?: string;
}

export interface Expense {
  id: string;
  title: string;
  category: 'Aluguel' | 'Produtos e Shampoos' | 'Água, Luz e Gerador' | 'Salários' | 'Manutenção' | 'Outras Despesas';
  amount: number; // R$
  date: string;
  notes?: string;
  isPettyCash?: boolean;
  paidTo?: string;
  branchId?: string; // Identificador da filial (para distinguir despesas da Unidade 1 e Unidade 2)
}

export type VehicleSize = 'sedan' | 'suv' | 'truck';
export type PaymentMethod = 'cash' | 'fastpay' | 'fib' | 'debt';

export interface CafeItem {
  id: string;
  name: string;
  price: number; // R$
  category: 'Bebidas Quentes' | 'Bebidas Geladas' | 'Aromatizantes e Acessórios' | 'Doces e Snacks';
}

export interface SelectedCafeItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CustomerReview {
  id: string;
  rating: number; // 1 a 5
  feedback?: string;
  date: string;
}

export interface VipSubscription {
  planId: string;
  planName: string;
  startDate: string; // ISO
  endDate: string; // ISO
  pricePaid: number;
  status: 'active' | 'expired';
}

export interface ServiceItem {
  id: string;
  name: string;
  category?: 'Veículo' | 'Polimento e Vitrificação' | 'Lavagem de Tapetes' | 'Higienização de Estofados' | 'Outros Serviços';
  unit?: string; // 'Veículo', 'Metro Quadrado (m²)', 'Conjunto', 'Unidade'
  price: number; // R$ (Base - Veículo de pequeno porte)
  pricesBySize?: {
    sedan?: number;
    suv?: number;
    truck?: number;
  };
  description: string;
  durationMinutes: number;
}

export interface VehicleDamageInspection {
  hasScratches?: boolean;
  hasDents?: boolean;
  brokenParts?: boolean;
  notes?: string;
  inspectedAt?: string;
}

export interface CarpetSpecs {
  areaSquareMeters: number; // Área em metros quadrados (m²)
  piecesCount: number; // Quantidade de tapetes ou peças
  ratePerSquareMeter: number; // Valor por 1 m² (R$)
  length?: number; // Comprimento (metros)
  width?: number; // Largura (metros)
  carpetType?: string; // Tipo de tapete (Comum, Seda, Estofado)
  readyDate?: string; // Previsão de entrega
  notes?: string;
}

export interface WashRecord {
  id: string;
  date: string;
  serviceId: string;
  serviceName: string;
  price: number; // R$
  isFree: boolean;
  freeReason?: 'loyalty' | 'rain_warranty' | 'courtesy' | 'promo';
  vehicleSize?: VehicleSize;
  staffId?: string;
  staffName?: string;
  bayNumber?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: 'paid' | 'unpaid';
  paidAt?: string;
  discountAmount?: number;
  discountReason?: string;
  workerCommission?: number;
  debtNote?: string;
  damageInspection?: VehicleDamageInspection;
  cafeItems?: SelectedCafeItem[];
  cafeTotal?: number;
  isSubscriptionWash?: boolean;
  itemType?: 'car' | 'carpet';
  carpetSpecs?: CarpetSpecs;
  branchId?: string;
  branchName?: string;
}

export interface DailyZReport {
  id: string;
  date: string; // YYYY-MM-DD
  closedAt: string; // ISO
  closedBy: string;
  branchId?: string;
  branchName?: string;
  totalCars: number;
  cashTotal: number;
  fastpayTotal: number;
  fibTotal: number;
  debtTotal: number;
  recoveredDebtTotal?: number; // Total recebido hoje de débitos anteriores
  newDebtTotal?: number; // Total de novos débitos gerados hoje
  freeWashesCount: number;
  totalRevenue: number;
  workerCommissionsTotal: number;
  actualCashCounted: number;
  discrepancy: number; // actualCashCounted - cashTotal
  notes?: string;
  pettyCashTotal?: number;
  expectedCash?: number;
}

export interface OwnerSocialLinks {
  whatsapp?: string;
  snapchat?: string;
  instagram?: string;
  tiktok?: string;
  telegram?: string;
  facebook?: string;
  website?: string;
}

export interface Vehicle {
  id: string;
  plate: LicensePlate;
  ownerName: string;
  phone: string;
  carModel: string;
  color: string;
  size?: VehicleSize;
  nfcTagId: string;
  hasNfcSticker: boolean;
  customerPin?: string; // PIN de 4 dígitos para o proprietário do veículo
  ownerBio?: string;
  socialLinks?: OwnerSocialLinks;
  isLoyaltyPrivate?: boolean; // Se true (padrão), cartão de fidelidade e histórico ficam protegidos por PIN
  totalWashes: number;
  currentCycleWashes: number; // 0 a 4 (5ª lavagem é grátis)
  freeWashesClaimed: number;
  lastVisitDate: string; // ISO string
  registeredDate: string;
  updatedAt?: string; // ISO string da última alteração
  status: 'active' | 'expired';
  currentBay?: number;
  currentBayBranchId?: string; // Filial atual onde o veículo está alocado no box
  bayEntryTime?: string; // ISO string de entrada no box
  washStage?: 'Aguardando' | 'Espumação' | 'Lavagem Externa' | 'Interior e Bancos' | 'Secagem e Acabamento' | 'Concluído';
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  damageInspection?: VehicleDamageInspection;
  subscription?: VipSubscription;
  reviews?: CustomerReview[];
  itemType?: 'car' | 'carpet';
  carpetSpecs?: CarpetSpecs;
  branchId?: string;
  branchName?: string;
  washHistory: WashRecord[];
}

export interface AbsentRecord {
  id: string;
  date: string;
  reason?: string;
}

export interface StaffDeduction {
  id: string;
  date: string;
  amount: number; // R$
  reason: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  salaryType: 'monthly' | 'daily';
  baseSalary: number; // R$
  commissionType?: 'fixed' | 'percentage' | 'none';
  commissionValue?: number; // ex: R$ 20 por lavagem ou 25%
  workHours: string; // ex: "08:00 - 18:00"
  startDate: string; // Data de início
  endDate?: string; // Data de saída caso arquivado
  status: 'active' | 'archived';
  branchId?: string; // Filial onde o funcionário atua
  absentRecords: AbsentRecord[];
  deductions: StaffDeduction[];
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  targetVersion: string;
  completed: boolean;
  notes?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Shampoos e Espumas' | 'Ceras e Polidores' | 'Nano e Vitrificadores' | 'Óleos e Hidráulicos' | 'Outros Insumos';
  quantity: number;
  unit: 'Litros' | 'Unidades' | 'Frascos' | 'Galões' | 'Kg' | 'Caixas';
  minAlertLevel: number;
  costPerUnit: number; // R$
  lastRestocked?: string;
  notes?: string;
}

export interface MaterialPurchase {
  id: string;
  name: string;
  category: 'Shampoos e Espumas' | 'Ceras e Polidores' | 'Nano e Vitrificadores' | 'Óleos e Hidráulicos' | 'Outros Insumos';
  quantity: number;
  unit: string;
  costPerUnit: number; // R$
  totalCost: number; // R$
  date: string; // YYYY-MM-DD
  supplier?: string;
  notes?: string;
  expenseId?: string;
}

export interface AppSettings {
  // 1. Identidade & Marca
  themeMode?: 'light' | 'dark';
  carWashName: string;
  carWashSlogan?: string;
  carWashPhone: string;
  carWashAddress: string;
  businessHours?: string;
  systemUrl?: string; // Domínio/Host personalizado opcional (ex: https://meulavarapido.com.br)

  // 2. Comprovantes & Impressão
  receiptPrinterSize?: '80mm' | '58mm';
  receiptFooterNote?: string;
  autoPrintReceipt?: boolean;
  showStaffOnReceipt?: boolean;

  // 3. Boxes & Capacidade
  numberOfBays?: number;
  dailyTargetCars?: number;

  // 4. Fidelidade, Recompensas & WhatsApp
  staffPin: string;
  adminPin?: string;
  expiryDaysLimit: number;
  washesNeededForFree: number;
  milestoneWashTarget: number;
  vipDiscountPercent?: number;
  enableWhatsAppNotification?: boolean;

  // 5. Custos Fixos & Financeiro
  monthlyRent?: number; // Valor do aluguel mensal
  dailyUtilities?: number; // Custo diário de água, luz e gerador
  averageMaterialCostPerWash?: number; // Custo médio de insumos por veículo

  // 6. Configurações de Horário de Pico / Happy Hour Promocional
  happyHourEnabled?: boolean;
  happyHourStart?: string; // ex: "09:00"
  happyHourEnd?: string; // ex: "12:00"
  happyHourDiscountPercent?: number; // ex: 15

  // 7. Impulsionador de Avaliações Google Maps & Resumo Noturno
  googleMapsReviewUrl?: string; // ex: https://maps.app.goo.gl/...
  ownerPhone?: string; // Telefone do proprietário para envio do relatório Z diário
  enableReviewBooster?: boolean;

  // 8. Planos de Assinatura VIP Ilimitada
  vipMonthlyPlanPrice?: number; // ex: R$ 150
  vipQuarterlyPlanPrice?: number; // ex: R$ 400

  // 9. Integração com Bot do Telegram
  telegramBotEnabled?: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;

  // 10. Gestão de Pátio / Estacionamento
  garageCapacity?: number; // Capacidade de vagas do estacionamento (ex: 30 vagas)
  garageDailyRate?: number; // Tarifa diária de estacionamento (ex: R$ 20)
  garageOvernightRate?: number; // Tarifa de pernoite (ex: R$ 35)
  garageMonthlyRate?: number; // Mensalidade de estacionamento (ex: R$ 250)

  // 11. Multi-Filiais & Sincronização em Tempo Real
  branches?: Branch[]; // Lista de filiais (Unidade 1, Unidade 2, etc.)
  activeBranchId?: string; // Identificador da filial ativa neste dispositivo
  autoSyncIntervalMs?: number; // Intervalo de sincronização rápida com servidor (ex: 1500ms)
}

// ==========================================
// Tipos de Gestão de Estacionamento & Pátio
// ==========================================

export type ParkingRateType = 'daily' | 'hourly' | 'overnight' | 'monthly';

export interface ParkingRecord {
  id: string;
  ticketNumber: string; // ex: "G-101"
  plate: LicensePlate;
  slotNumber: number; // 1 a 30
  entryTime: string; // ISO string
  exitTime?: string; // ISO string
  status: 'parked' | 'exited' | 'washing';
  rateType: ParkingRateType;
  fee: number; // R$
  paymentStatus: 'paid' | 'unpaid';
  paymentMethod?: PaymentMethod;
  carModel?: string;
  ownerName?: string;
  phone?: string;
  notes?: string;
  linkedWashBay?: number;
  linkedWashVehicleId?: string;
}
