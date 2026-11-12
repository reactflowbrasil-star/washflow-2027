'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getSavedVehicles,
  getSavedServices,
  getSavedSettings,
  isNfcExpired,
  calculateDaysSince,
  formatR$,
  saveVehicles,
  normalizeDigits,
} from '@/lib/storage';
import { Vehicle, ServiceItem, AppSettings, WashRecord, OwnerSocialLinks, CustomerReview } from '@/types';
import { PlateDisplay } from '@/components/ui/PlateDisplay';
import { NfcPassCard } from '@/components/ui/NfcPassCard';
import {
  Car,
  Gift,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Award,
  Phone,
  Clock,
  RotateCcw,
  Video,
  Camera,
  Key,
  DollarSign,
  History,
  User,
  RefreshCw,
  Check,
  Eye,
  MessageCircle,
  ExternalLink,
  Edit3,
  LogOut,
  Globe,
  Share2,
  X,
  Shield,
  HelpCircle,
  Copy,
  Wifi,
  Smartphone,
  Send,
  MessageSquare,
  Star,
  Crown,
} from 'lucide-react';

// Authentic Brand SVGs for luxury tactile profile buttons
function WhatsAppSvg({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.16C10.57 20.16 9.12 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.05 20.16ZM16.57 14.39C16.32 14.27 15.11 13.67 14.88 13.58C14.65 13.5 14.49 13.46 14.32 13.71C14.15 13.96 13.67 14.52 13.52 14.69C13.38 14.85 13.23 14.88 12.98 14.75C12.74 14.63 11.94 14.37 11 13.53C10.26 12.87 9.77 12.06 9.62 11.82C9.48 11.57 9.61 11.44 9.73 11.32C9.84 11.21 9.98 11.03 10.1 10.89C10.23 10.74 10.27 10.64 10.35 10.48C10.43 10.31 10.39 10.17 10.33 10.05C10.27 9.92 9.77 8.7 9.57 8.19C9.37 7.7 9.16 7.77 9.01 7.76H8.52C8.35 7.76 8.08 7.82 7.85 8.07C7.62 8.32 7 8.9 7 10.07C7 11.24 7.85 12.37 7.97 12.53C8.09 12.69 9.67 15.12 12.09 16.16C12.66 16.41 13.11 16.56 13.46 16.67C14.04 16.85 14.56 16.83 14.98 16.76C15.45 16.69 16.42 16.17 16.62 15.6C16.82 15.02 16.82 14.53 16.76 14.43C16.7 14.33 16.55 14.27 16.3 14.15L16.57 14.39Z"/>
    </svg>
  );
}

function SnapchatSvg({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.001 2.25c-3.79 0-6.19 2.74-6.19 5.86 0 .86.2 1.94.57 2.82.1.25.04.54-.15.74-.32.34-.84.66-1.5.86-.34.1-.53.46-.42.79.17.5.7 1.05 1.57 1.34.18.06.31.21.34.39.11.75.46 1.76 1.52 2.37.28.16.42.48.33.79-.19.64-.81 1.63-2.58 1.92-.35.06-.57.39-.49.73.08.34.4.58.75.56 1.46-.07 2.67-.48 3.52-.96.2-.11.45-.11.65.01.76.47 1.7.75 2.54.75.83 0 1.76-.28 2.53-.75.2-.12.45-.12.65-.01.85.48 2.06.89 3.52.96.35.02.67-.22.75-.56.08-.34-.14-.67-.49-.73-1.77-.29-2.39-1.28-2.58-1.92-.09-.31.05-.63.33-.79 1.06-.61 1.41-1.62 1.52-2.37.03-.18.16-.33.34-.39.87-.29 1.4-.84 1.57-1.34.11-.33-.08-.69-.42-.79-.66-.2-1.18-.52-1.5-.86-.19-.2-.25-.49-.15-.74.37-.88.57-1.96.57-2.82 0-3.12-2.4-5.86-6.19-5.86z"/>
    </svg>
  );
}

function InstagramSvg({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function TikTokSvg({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.41a6.33 6.33 0 0 0-.85-.06A6.34 6.34 0 0 0 3.1 15.69a6.34 6.34 0 0 0 10.82 4.48c.04-.04.09-.08.13-.12.06-.06.12-.13.17-.19.14-.17.26-.35.36-.54.06-.11.11-.23.16-.35.04-.11.08-.22.11-.34.02-.08.04-.17.06-.25.02-.12.03-.25.04-.38V8.34a8.27 8.27 0 0 0 4.75 1.48V6.37a4.83 4.83 0 0 1-.11-.32z"/>
    </svg>
  );
}

function TelegramSvg({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .27z"/>
    </svg>
  );
}

// Color dot helper for car color preview
function getCarColorStyle(colorName: string): { bg: string; border: string } {
  const c = (colorName || '').toLowerCase();
  if (c.includes('Preto') || c.includes('black')) return { bg: '#18181b', border: '#3f3f46' };
  if (c.includes('Branco') || c.includes('white')) return { bg: '#f8fafc', border: '#cbd5e1' };
  if (c.includes('Vermelho') || c.includes('red')) return { bg: '#dc2626', border: '#f87171' };
  if (c.includes('Azul') || c.includes('blue')) return { bg: '#2563eb', border: '#60a5fa' };
  if (c.includes('') || c.includes('Cinza') || c.includes('') || c.includes('silver') || c.includes('gray'))
    return { bg: '#64748b', border: '#94a3b8' };
  if (c.includes('Amarelo') || c.includes('yellow')) return { bg: '#eab308', border: '#fde047' };
  if (c.includes('Vinho') || c.includes('Quantidade') || c.includes('Marrom') || c.includes('maroon') || c.includes('brown'))
    return { bg: '#701a75', border: '#c084fc' };
  return { bg: '#3b82f6', border: '#60a5fa' };
}

// Helpers to format social media links safely
function getWhatsAppUrl(phoneOrLink: string): string {
  if (!phoneOrLink) return '';
  if (phoneOrLink.startsWith('http://') || phoneOrLink.startsWith('https://')) return phoneOrLink;
  let digits = phoneOrLink.replace(/[\s\-\(\)\+]/g, '');
  if (digits.startsWith('07')) digits = '964' + digits.substring(1);
  else if (digits.startsWith('7')) digits = '964' + digits;
  return `https://wa.me/${digits}`;
}

function getSnapchatUrl(snapUserOrLink: string): string {
  if (!snapUserOrLink) return '';
  if (snapUserOrLink.startsWith('http://') || snapUserOrLink.startsWith('https://')) return snapUserOrLink;
  const cleaned = snapUserOrLink.replace('@', '').trim();
  return `https://www.snapchat.com/add/${cleaned}`;
}

function getInstagramUrl(instaUserOrLink: string): string {
  if (!instaUserOrLink) return '';
  if (instaUserOrLink.startsWith('http://') || instaUserOrLink.startsWith('https://')) return instaUserOrLink;
  const cleaned = instaUserOrLink.replace('@', '').trim();
  return `https://www.instagram.com/${cleaned}`;
}

function getTikTokUrl(tiktokUserOrLink: string): string {
  if (!tiktokUserOrLink) return '';
  if (tiktokUserOrLink.startsWith('http://') || tiktokUserOrLink.startsWith('https://')) return tiktokUserOrLink;
  let cleaned = tiktokUserOrLink.trim();
  if (!cleaned.startsWith('@')) cleaned = '@' + cleaned;
  return `https://www.tiktok.com/${cleaned}`;
}

function getTelegramUrl(teleUserOrLink: string): string {
  if (!teleUserOrLink) return '';
  if (teleUserOrLink.startsWith('http://') || teleUserOrLink.startsWith('https://')) return teleUserOrLink;
  const cleaned = teleUserOrLink.replace('@', '').trim();
  return `https://t.me/${cleaned}`;
}

export default function NfcVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getSavedSettings());
  const [loading, setLoading] = useState(true);

  // Authentication states
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginReason, setLoginReason] = useState<'unlock' | 'edit'>('unlock');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [failedCustomerAttempts, setFailedCustomerAttempts] = useState(0);
  const [customerLockoutUntil, setCustomerLockoutUntil] = useState(0);

  // Profile Edit modal
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editWhatsApp, setEditWhatsApp] = useState('');
  const [editSnapchat, setEditSnapchat] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editTikTok, setEditTikTok] = useState('');
  const [editTelegram, setEditTelegram] = useState('');
  const [editNewPin, setEditNewPin] = useState('');
  const [editIsLoyaltyPrivate, setEditIsLoyaltyPrivate] = useState<boolean>(true);

  // Staff PIN modal state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffPinInput, setStaffPinInput] = useState('');
  const [staffPinError, setStaffPinError] = useState('');
  const [failedStaffAttempts, setFailedStaffAttempts] = useState(0);
  const [staffLockoutUntil, setStaffLockoutUntil] = useState(0);
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [staffName, setStaffName] = useState('Profissional acima / topo');

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Copy Profile Link State
  const [copiedLink, setCopiedLink] = useState(false);
  const handleCopyProfileLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      showToast('🔗   o Veículo Total !');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Google Maps Review & CSAT Rating State
  const [userRating, setUserRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleRateStar = (stars: number) => {
    setUserRating(stars);
    if (stars === 5) {
      showToast('⭐️  obrigado para confiançaque! Por favor em Google Maps  dez.');
    }
  };

  const handleSendFeedback = () => {
    if (!vehicle) return;
    const newReview: CustomerReview = {
      id: `rev-${Date.now()}`,
      rating: userRating,
      feedback: feedbackText.trim() || undefined,
      date: new Date().toISOString(),
    };
    const updatedVehicle: Vehicle = {
      ...vehicle,
      reviews: [newReview, ...(vehicle.reviews || [])],
    };
    const allVehicles = getSavedVehicles().map((v) =>
      v.id === vehicle.id ? updatedVehicle : v
    );
    saveVehicles(allVehicles);
    fetch(`/api/vehicles/${encodeURIComponent(vehicle.id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedVehicle),
    }).catch(console.error);
    setVehicle(updatedVehicle);
    setFeedbackSubmitted(true);
    showToast('✅ Observaçõesque por sucesso para Administrador !');
  };

  // Clock
  const [liveTime, setLiveTime] = useState<string>('');

  useEffect(() => {
    if (!id) return;

    const loadVehicle = async () => {
      // 1. Try local storage first
      const allVehicles = getSavedVehicles();
      const foundLocal = allVehicles.find(
        (v) => v.id === id || v.nfcTagId.toLowerCase() === id.toLowerCase()
      );
      if (foundLocal) {
        setVehicle(foundLocal);
      }

      // 2. Fetch from central server (ensures customer mobile phones scanning NFC load the latest data)
      try {
        const res = await fetch(`/api/vehicles/${encodeURIComponent(id)}`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.vehicle) {
            setVehicle(json.vehicle);
            if (json.settings) setSettings(json.settings);
            if (json.services) setServices(json.services);
          }
        }
      } catch {
        // Fallback to local
      }

      const srvs = getSavedServices();
      setServices((prev) => (prev.length > 0 ? prev : srvs));
      if (srvs.length > 0) setSelectedServiceId((prev) => prev || srvs[0]?.id || '');
      setSettings((prev) => prev || getSavedSettings());
      setLoading(false);
    };

    loadVehicle();
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(
        new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle Customer PIN Login
  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;

    if (Date.now() < customerLockoutUntil) {
      const waitSec = Math.ceil((customerLockoutUntil - Date.now()) / 1000);
      setPinError(`⚠️ por 5  Erro Por favor ${waitSec} Segundos Pendente por.`);
      return;
    }

    const normalizedEnteredPin = normalizeDigits(pinInput.trim());
    let isMatch = false;

    // 1. Secure Server-side PIN verification
    try {
      const res = await fetch(`/api/vehicles/${encodeURIComponent(vehicle.id || id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-customer-pin', pin: normalizedEnteredPin }),
      });
      if (res.ok) {
        const json = await res.json();
        isMatch = Boolean(json.success);
      }
    } catch {
      // Offline fallback: check local match
      const targetPin = vehicle.customerPin || vehicle.phone?.slice(-4) || '1234';
      isMatch = normalizedEnteredPin === targetPin;
    }

    if (isMatch) {
      setIsCustomerLoggedIn(true);
      setShowLoginModal(false);
      setPinInput('');
      setPinError('');
      setFailedCustomerAttempts(0);
      if (loginReason === 'edit') {
        openProfileEditor();
        showToast('seja bem-vindo(a)! você pode Editar   que que.');
      } else {
        showToast('🔓 seja bem-vindo(a)! cartão Fidelidade  Histórico de Lavagens .');
      }
    } else {
      const nextFail = failedCustomerAttempts + 1;
      setFailedCustomerAttempts(nextFail);
      if (nextFail >= 5) {
        setCustomerLockoutUntil(Date.now() + 60000); // 60s cooldown
        setPinError('⚠️ 5  UF Erro ! Entrar / Login para Restante / Pendente 60 Segundos .');
      } else {
        setPinError(`UF segredo / PIN (PIN) Erro! (${5 - nextFail}  Restante / Pendente)`);
      }
    }
  };

  const openProfileEditor = () => {
    if (!vehicle) return;
    setEditOwnerName(vehicle.ownerName || '');
    setEditPhone(vehicle.phone || '');
    setEditBio(vehicle.ownerBio || '');
    setEditWhatsApp(vehicle.socialLinks?.whatsapp || vehicle.phone || '');
    setEditSnapchat(vehicle.socialLinks?.snapchat || '');
    setEditInstagram(vehicle.socialLinks?.instagram || '');
    setEditTikTok(vehicle.socialLinks?.tiktok || '');
    setEditTelegram(vehicle.socialLinks?.telegram || '');
    setEditNewPin(vehicle.customerPin || '');
    setEditIsLoyaltyPrivate(vehicle.isLoyaltyPrivate !== false);
    setShowEditProfileModal(true);
  };

  // Save Profile Changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;

    const updatedLinks: OwnerSocialLinks = {
      whatsapp: editWhatsApp.trim() || undefined,
      snapchat: editSnapchat.trim() || undefined,
      instagram: editInstagram.trim() || undefined,
      tiktok: editTikTok.trim() || undefined,
      telegram: editTelegram.trim() || undefined,
    };

    const updatedVehicle: Vehicle = {
      ...vehicle,
      ownerName: editOwnerName.trim() || vehicle.ownerName,
      phone: editPhone.trim() || vehicle.phone,
      ownerBio: editBio.trim() || undefined,
      socialLinks: updatedLinks,
      isLoyaltyPrivate: editIsLoyaltyPrivate,
      customerPin: editNewPin.trim() ? normalizeDigits(editNewPin.trim()) : vehicle.customerPin,
    };

    const allVehicles = getSavedVehicles();
    const updatedAll = allVehicles.map((v) => (v.id === vehicle.id ? updatedVehicle : v));
    saveVehicles(updatedAll);
    fetch(`/api/vehicles/${encodeURIComponent(vehicle.id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedVehicle),
    }).catch(console.error);
    setVehicle(updatedVehicle);
    setShowEditProfileModal(false);
    showToast('✨ informações   atéque atualizado com sucesso!');
  };

  // Staff Login
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (Date.now() < staffLockoutUntil) {
      const waitSec = Math.ceil((staffLockoutUntil - Date.now()) / 1000);
      setStaffPinError(`⚠️ Entrar / Login até  Por favor ${waitSec} Segundos Pendente por.`);
      return;
    }

    const normalizedStaffPin = normalizeDigits(staffPinInput.trim());
    let isMatch = false;

    // Verify Staff PIN securely via server endpoint
    try {
      const res = await fetch(`/api/vehicles/${encodeURIComponent(vehicle?.id || id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-staff-pin', pin: normalizedStaffPin }),
      });
      if (res.ok) {
        const json = await res.json();
        isMatch = Boolean(json.success);
      }
    } catch {
      isMatch = normalizedStaffPin === (settings.staffPin || '1234');
    }

    if (isMatch) {
      setIsStaffAuthenticated(true);
      setShowStaffModal(false);
      setStaffPinInput('');
      setStaffPinError('');
      setFailedStaffAttempts(0);
      showToast('Entrar / Login até acima / topoque .');
    } else {
      const nextFail = failedStaffAttempts + 1;
      setFailedStaffAttempts(nextFail);
      if (nextFail >= 5) {
        setStaffLockoutUntil(Date.now() + 60000); // 60s cooldown
        setStaffPinError('⚠️ 5  UF até Erro ! Entrar / Login para Restante / Pendente 60 Segundos .');
      } else {
        setStaffPinError(`UF até Erro! (${5 - nextFail}  Restante / Pendente)`);
      }
    }
  };

  // Staff Record Wash
  const handleStaffRecordWash = () => {
    if (!vehicle) return;
    const srv = services.find((s) => s.id === selectedServiceId) || services[0];
    const isFree = vehicle.currentCycleWashes >= settings.washesNeededForFree;

    const newWashRecord: WashRecord = {
      id: `w-${Date.now()}`,
      date: new Date().toISOString(),
      serviceId: srv?.id || 'srv-quick',
      serviceName: srv?.name || 'Lavagem Rápido',
      price: isFree ? 0 : srv?.price || 10000,
      isFree,
      staffName,
      bayNumber: vehicle.currentBay || 1,
    };

    const updatedVehicle: Vehicle = {
      ...vehicle,
      totalWashes: (vehicle.totalWashes || 0) + 1,
      currentCycleWashes: isFree ? 0 : (vehicle.currentCycleWashes || 0) + 1,
      freeWashesClaimed: isFree ? (vehicle.freeWashesClaimed || 0) + 1 : (vehicle.freeWashesClaimed || 0),
      lastVisitDate: new Date().toISOString(),
      status: 'active',
      washHistory: [newWashRecord, ...(vehicle.washHistory || [])],
    };

    const allVehicles = getSavedVehicles();
    const updatedAll = allVehicles.map((v) => (v.id === vehicle.id ? updatedVehicle : v));
    saveVehicles(updatedAll);
    fetch(`/api/vehicles/${encodeURIComponent(vehicle.id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedVehicle),
    }).catch(console.error);
    setVehicle(updatedVehicle);
    showToast('Lavagem Novo por sucesso Salvo com sucesso!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-400 font-sans" dir="ltr">
        <div className="flex items-center gap-2 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          <span>Vistoria Placa  Carregar / Upload ...</span>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-6 text-center select-none" dir="ltr">
        <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-rose-400 mb-4 shadow-2xl">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h1 className="text-xl font-black mb-2">este Veículo !</h1>
        <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
          Nenhum Veículoum por Totaldez ({id}) em sistema Registrar não realizado. você pode  por  emque que.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg"
        >
          <Car className="w-4 h-4" />
          Buscar para  Principal
        </Link>
      </div>
    );
  }

  // Active social links
  const social = vehicle.socialLinks || {};
  const hasAnySocial = Boolean(
    social.whatsapp || social.snapchat || social.instagram || social.tiktok || social.telegram || social.website
  );
  const carColorStyle = getCarColorStyle(vehicle.color);

  // Privacy condition: Loyalty & Wash History are private by default unless owner logged in
  const isLoyaltyPrivate = vehicle.isLoyaltyPrivate !== false;
  const canViewPrivateData = !isLoyaltyPrivate || isCustomerLoggedIn;

  // Loyalty calculations
  const isFreeNext = vehicle.currentCycleWashes >= settings.washesNeededForFree;
  const isExpired = isNfcExpired(vehicle.lastVisitDate, settings.expiryDaysLimit);
  const daysSince = calculateDaysSince(vehicle.lastVisitDate);
  const daysLeft = Math.max(0, settings.expiryDaysLimit - daysSince);

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white" dir="ltr">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      {/* ----------------- TOP NAVBAR ----------------- */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-black text-white tracking-tight">{settings.carWashName}</h1>
            <span className="text-[10px] text-slate-400 block">até   até Veículo</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Owner PIN Login / Edit Button */}
          {isCustomerLoggedIn ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={openProfileEditor}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Editar 
              </button>
              <button
                onClick={() => {
                  setIsCustomerLoggedIn(false);
                  showToast('saída acima / topoque .');
                }}
                className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                title="saída"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setLoginReason('edit');
                setPinError('');
                setPinInput('');
                setShowLoginModal(true);
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/25 active:scale-95"
            >
              <Lock className="w-3.5 h-3.5" />
              Entrar / Login Proprietário Veículo (PIN)
            </button>
          )}

          {/* Staff Button (Discreet) */}
          <button
            onClick={() => {
              setStaffPinError('');
              setStaffPinInput('');
              setShowStaffModal(true);
            }}
            className="p-1.5 text-slate-500 hover:text-slate-300 transition rounded-lg hover:bg-slate-900"
            title="Entrar / Login até"
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ----------------- MAIN CONTENT ----------------- */}
      <main className="max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* ============================================================== */}
        {/* 0. LUXURY 3D INTERACTIVE NFC PASS (cartão   aplicativo ) */}
        {/* ============================================================== */}
        <NfcPassCard vehicle={vehicle} settings={settings} />

        {/* ============================================================== */}
        {/* 1. PERSONAL DIGITAL PROFILE CARD ( até Proprietário Veículo) */}
        {/* ============================================================== */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0b1324] via-[#080d19] to-[#04070e] border border-blue-500/30 p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(30,58,138,0.35)] space-y-6 text-center group">
          {/* Subtle Ambient Background Lighting */}
          <div className="absolute -top-24 right-1/2 translate-x-1/2 w-80 h-48 bg-gradient-to-b from-blue-500/20 via-indigo-500/10 to-transparent blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/10 blur-3xl pointer-events-none"></div>

          {/* Top Holographic / Smart Tag Header */}
          <div className="relative z-10 flex items-center justify-between pb-1 border-b border-slate-800/80">
            {/* VIP Status Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-500/30 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.12)]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-[11px] font-black tracking-wider">VIP PASS</span>
              <span className="w-1 h-1 rounded-full bg-amber-400/80"></span>
              <span className="text-[10px] text-amber-200/90 font-bold">Membro Particular</span>
            </div>

            {/* Wireless Tag Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wifi className="w-3.5 h-3.5 text-blue-400 rotate-90" />
              <span>NFC #{vehicle.nfcTagId || vehicle.id}</span>
            </div>
          </div>

          {/* Avatar & Verified Identity */}
          <div className="relative z-10 space-y-3.5">
            <div className="relative inline-block mx-auto">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-[3px] bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 shadow-[0_0_35px_rgba(59,130,246,0.3)] transition-transform duration-300 hover:scale-105">
                <div className="w-full h-full rounded-[21px] bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
                  <Car className="w-20 h-20 text-slate-800/15 absolute -right-3 -bottom-3 pointer-events-none" />
                  <span className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    {vehicle.ownerName ? vehicle.ownerName.split(' ').map((n) => n[0]).slice(0, 2).join('') : '🚗'}
                  </span>
                </div>
              </div>

              {/* Verified Owner Badge */}
              <div className="absolute -bottom-1.5 -left-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[10px] font-black flex items-center gap-1 shadow-lg border-2 border-slate-950" title="Proprietário Veículo Oficial">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Proprietário Veículo</span>
              </div>
            </div>

            {/* Owner Name & Vehicle Specs */}
            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm">
                {vehicle.ownerName}
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-bold shadow-sm">
                  <Car className="w-3.5 h-3.5 text-blue-400" />
                  <span>{vehicle.carModel}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs font-medium shadow-sm">
                  <span
                    className="w-2.5 h-2.5 rounded-full border"
                    style={{
                      backgroundColor: carColorStyle.bg,
                      borderColor: carColorStyle.border,
                    }}
                  ></span>
                  <span>{vehicle.color}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono">
                  <span>Total: {vehicle.id}</span>
                </div>
              </div>
            </div>

            {/* Owner Bio (dez  ou ) */}
            {vehicle.ownerBio && (
              <div className="max-w-md mx-auto pt-1">
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/70 border border-slate-800/90 px-4 py-2.5 rounded-2xl italic relative shadow-inner">
                  "{vehicle.ownerBio}"
                </p>
              </div>
            )}

            {/* License Plate Display inside Chrome/Bevel Frame */}
            <div className="pt-2 flex justify-center">
              <div className="p-2 rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border border-slate-700/90 shadow-2xl inline-block">
                <PlateDisplay plate={vehicle.plate} size="md" />
              </div>
            </div>

            {/* Quick Action Bar: Call if Parked + Copy Profile Link */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1.5">
              {vehicle.phone && (
                <a
                  href={`tel:${vehicle.phone}`}
                  className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 hover:border-emerald-500/80 text-emerald-300 text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-emerald-950 active:scale-95"
                  title="em Horário  ou porpor  Veículo"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span> em Horário  (Call Owner)</span>
                </a>
              )}
              <button
                onClick={handleCopyProfileLink}
                className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-sm"
                title="Total  este em"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedLink ? 'Total !' : 'Total '}</span>
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 2. SOCIAL & CONTACT LINKS GRID (   dezdezque) */}
          {/* ============================================================== */}
          <div className="relative z-10 space-y-3 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold">
              <Share2 className="w-3.5 h-3.5 text-blue-400" />
              <span>   Totalum</span>
            </div>

            {hasAnySocial ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                {/* 1. WhatsApp Link */}
                {social.whatsapp && (
                  <a
                    href={getWhatsAppUrl(social.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative overflow-hidden p-3.5 rounded-2xl bg-gradient-to-r from-[#25D366]/15 via-emerald-950/40 to-slate-950 border border-[#25D366]/40 hover:border-[#25D366] transition-all duration-200 group/btn flex items-center justify-between shadow-lg shadow-emerald-950/20 hover:shadow-[#25D366]/20 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-slate-950 flex items-center justify-center font-bold shadow-md shadow-[#25D366]/30 group-hover/btn:scale-110 transition-transform shrink-0">
                        <WhatsAppSvg className="w-5 h-5 text-slate-950" />
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-black text-xs tracking-tight">WhatsApp</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#25D366]/20 text-[#25D366] font-bold"> enviar</span>
                        </div>
                        <span className="text-[11px] text-emerald-300 font-mono block pt-0.5">{social.whatsapp}</span>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-xl bg-slate-900/90 border border-[#25D366]/30 flex items-center justify-center text-emerald-400 group-hover/btn:bg-[#25D366] group-hover/btn:text-slate-950 transition shrink-0">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </a>
                )}

                {/* 2. Snapchat Link */}
                {social.snapchat && (
                  <a
                    href={getSnapchatUrl(social.snapchat)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative overflow-hidden p-3.5 rounded-2xl bg-gradient-to-r from-[#FFFC00]/15 via-amber-950/40 to-slate-950 border border-[#FFFC00]/40 hover:border-[#FFFC00] transition-all duration-200 group/btn flex items-center justify-between shadow-lg shadow-amber-950/20 hover:shadow-[#FFFC00]/20 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FFFC00] text-slate-950 flex items-center justify-center font-bold shadow-md shadow-[#FFFC00]/30 group-hover/btn:scale-110 transition-transform shrink-0">
                        <SnapchatSvg className="w-5 h-5 text-slate-950" />
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-black text-xs tracking-tight">Snapchat</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FFFC00]/20 text-amber-300 font-bold"> que</span>
                        </div>
                        <span className="text-[11px] text-amber-300 font-mono block pt-0.5">@{social.snapchat.replace('@', '')}</span>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-xl bg-slate-900/90 border border-[#FFFC00]/30 flex items-center justify-center text-amber-300 group-hover/btn:bg-[#FFFC00] group-hover/btn:text-slate-950 transition shrink-0">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </a>
                )}

                {/* 3. Instagram Link */}
                {social.instagram && (
                  <a
                    href={getInstagramUrl(social.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative overflow-hidden p-3.5 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-slate-950 border border-pink-500/40 hover:border-pink-500 transition-all duration-200 group/btn flex items-center justify-between shadow-lg shadow-pink-950/20 hover:shadow-pink-500/20 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-pink-500/30 group-hover/btn:scale-110 transition-transform shrink-0">
                        <InstagramSvg className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-black text-xs tracking-tight">Instagram</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold"> que</span>
                        </div>
                        <span className="text-[11px] text-pink-300 font-mono block pt-0.5">@{social.instagram.replace('@', '')}</span>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-xl bg-slate-900/90 border border-pink-500/30 flex items-center justify-center text-pink-300 group-hover/btn:bg-gradient-to-r group-hover/btn:from-rose-500 group-hover/btn:to-purple-600 group-hover/btn:text-white transition shrink-0">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </a>
                )}

                {/* 4. TikTok Link */}
                {social.tiktok && (
                  <a
                    href={getTikTokUrl(social.tiktok)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative overflow-hidden p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/40 hover:border-cyan-400 transition-all duration-200 group/btn flex items-center justify-between shadow-lg shadow-cyan-950/20 hover:shadow-cyan-500/20 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold shadow-md group-hover/btn:scale-110 transition-transform shrink-0">
                        <TikTokSvg className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-black text-xs tracking-tight">TikTok</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold"></span>
                        </div>
                        <span className="text-[11px] text-cyan-300 font-mono block pt-0.5">
                          {social.tiktok.startsWith('@') ? social.tiktok : '@' + social.tiktok}
                        </span>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover/btn:bg-cyan-500 group-hover/btn:text-slate-950 transition shrink-0">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </a>
                )}

                {/* 5. Telegram Link */}
                {social.telegram && (
                  <a
                    href={getTelegramUrl(social.telegram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative overflow-hidden p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-950 border border-sky-500/40 hover:border-sky-400 transition-all duration-200 group/btn flex items-center justify-between shadow-lg shadow-sky-950/20 hover:shadow-sky-500/20 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#0088cc] text-white flex items-center justify-center font-bold shadow-md shadow-[#0088cc]/30 group-hover/btn:scale-110 transition-transform shrink-0">
                        <TelegramSvg className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-black text-xs tracking-tight">Telegram</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold">que / </span>
                        </div>
                        <span className="text-[11px] text-sky-300 font-mono block pt-0.5">@{social.telegram.replace('@', '')}</span>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-xl bg-slate-900/90 border border-sky-500/30 flex items-center justify-center text-sky-300 group-hover/btn:bg-[#0088cc] group-hover/btn:text-white transition shrink-0">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </a>
                )}

                {/* 6. Direct Phone Call */}
                {vehicle.phone && (
                  <a
                    href={`tel:${vehicle.phone}`}
                    className="relative overflow-hidden p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-950 border border-blue-500/40 hover:border-blue-400 transition-all duration-200 group/btn flex items-center justify-between shadow-lg shadow-blue-950/20 hover:shadow-blue-500/20 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/30 group-hover/btn:scale-110 transition-transform shrink-0">
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-black text-xs tracking-tight"> em</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">em</span>
                        </div>
                        <span className="text-[11px] text-blue-300 font-mono block pt-0.5">{vehicle.phone}</span>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-xl bg-slate-900/90 border border-blue-500/30 flex items-center justify-center text-blue-300 group-hover/btn:bg-blue-600 group-hover/btn:text-white transition shrink-0">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </a>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-center space-y-2">
                <p className="text-xs text-slate-400">
                  Proprietário Veículo até Nenhum   Grátis (Fidelidade) dois.
                </p>
                {!isCustomerLoggedIn && (
                  <button
                    onClick={() => {
                      setLoginReason('edit');
                      setPinError('');
                      setPinInput('');
                      setShowLoginModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 active:scale-95"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Entrar / Login por PIN para  que
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Card Footer / Owner Mode Quick Action */}
          <div className="relative z-10 pt-3 border-t border-slate-800/80">
            {isCustomerLoggedIn ? (
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-300 shadow-inner">
                <span className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Status Proprietário Veículo Ativo (você pode  Novo que)
                </span>
                <button
                  onClick={openProfileEditor}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-blue-600/30 active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Editar que  
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  até Oficial  por por sistema {settings.carWashName}
                </span>
                <button
                  onClick={() => {
                    setLoginReason('edit');
                    setPinError('');
                    setPinInput('');
                    setShowLoginModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold transition flex items-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                  Editar  (Proprietário Veículo)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. LIVE CAR WASH STATUS (Status até Veículo em lava-rápido)           */}
        {/* ============================================================== */}
        {vehicle.currentBay ? (
          <div className="bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-slate-900 border border-blue-500/50 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-blue-850/60 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                <h3 className="font-bold text-sm text-white">o Veículo em Nome Box Lavagem!</h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-600 text-white font-bold">
                Box {vehicle.currentBay}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">etapa até:</span>
                <strong className="text-amber-300 text-sm font-black">{vehicle.washStage || 'em '}</strong>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Profissional por:</span>
                <strong className="text-white text-sm font-bold">{vehicle.assignedWorkerName || 'Profissional'}</strong>
              </div>
            </div>

            {/* Live Wash Progress Stepper (dez   porsem  dez) */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  etapa  o Veículo
                </span>
                <span className="text-emerald-400 font-mono text-[11px] font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  em 
                </span>
              </div>

              {/* 4 Steps Visual Timeline */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { id: 1, label: 'dez', sub: 'acima / topoaté' },
                  { id: 2, label: 'Espuma  água', sub: 'Externa' },
                  { id: 3, label: 'Interna  aspirador', sub: '' },
                  { id: 4, label: 'Abrir', sub: 'Concluído' },
                ].map((st, idx) => {
                  const currentStageLower = (vehicle.washStage || '').toLowerCase();
                  const isCurrent =
                    (idx === 0 && (currentStageLower.includes('dez') || currentStageLower.includes('Recebimento') || !vehicle.washStage)) ||
                    (idx === 1 && (currentStageLower.includes('Espuma') || currentStageLower.includes('Externa') || currentStageLower.includes('Lavagem'))) ||
                    (idx === 2 && (currentStageLower.includes('Nome') || currentStageLower.includes('aspirador') || currentStageLower.includes('vacuum'))) ||
                    (idx === 3 && (currentStageLower.includes('') || currentStageLower.includes('Concluído') || currentStageLower.includes('ready')));

                  return (
                    <div
                      key={st.id}
                      className={`rounded-xl p-2 text-center border transition-all ${
                        isCurrent
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/20 ring-1 ring-blue-500'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-1">
                        <span
                          className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                            isCurrent
                              ? 'bg-blue-500 text-white ring-2 ring-blue-400/50'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {st.id}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold truncate">{st.label}</div>
                      <div className="text-[9px] text-slate-500 truncate">{st.sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* ============================================================== */}
        {/* 4 & 5. LOYALTY & WASH HISTORY (Particular por Proprietário Veículo)          */}
        {/* ============================================================== */}
        {!canViewPrivateData ? (
          /* ============================================================== */
          /* LOCKED VAULT CARD ( protegido Particular por Proprietário Veículo)      */
          /* ============================================================== */
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0d1627] via-[#09101d] to-[#040812] border border-amber-500/30 p-6 sm:p-8 shadow-[0_20px_50px_-15px_rgba(245,158,11,0.2)] text-center space-y-5">
            {/* Ambient Security Glow */}
            <div className="absolute -top-20 right-1/2 translate-x-1/2 w-72 h-40 bg-gradient-to-b from-amber-500/15 via-yellow-500/5 to-transparent blur-3xl pointer-events-none"></div>

            {/* Glowing 3D Vault Shield */}
            <div className="relative z-10 w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl bg-amber-500/15 animate-ping opacity-60"></div>
              <div className="w-full h-full rounded-3xl bg-gradient-to-tr from-amber-500/25 via-yellow-500/10 to-amber-500/30 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-xl shadow-amber-500/20">
                <Lock className="w-9 h-9 text-amber-300" />
              </div>
            </div>

            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30 text-[11px] font-bold shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Particular por Proprietário Veículo • PRIVATE VAULT</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white pt-1 tracking-tight">
                cartão recompensa Fidelidade  Histórico de Lavagens protegido
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                para  Particular  informações um  Fidelidade os recibos  Histórico de Lavagens este Veículo  .
              </p>
            </div>

            {/* Preview of Protected Features */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md mx-auto text-xs text-slate-300 text-right">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex items-center gap-2.5">
                <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px]">cartão Fidelidade (4 + 1 Lavagem Grátis (Fidelidade))</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex items-center gap-2.5">
                <History className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-[11px]">os recibos  Histórico de Todos acima / topounid.</span>
              </div>
            </div>

            {/* Unlock CTA Button */}
            <div className="relative z-10 pt-2">
              <button
                onClick={() => {
                  setLoginReason('unlock');
                  setPinError('');
                  setPinInput('');
                  setShowLoginModal(true);
                }}
                className="px-7 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black transition inline-flex items-center gap-2 shadow-xl shadow-blue-600/30 active:scale-95"
              >
                <Key className="w-4 h-4" />
                <span>Abrir por UF segredo / PIN (PIN)</span>
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* UNLOCKED: SHOW LOYALTY CARD & WASH HISTORY                     */
          /* ============================================================== */
          <div className="space-y-6 animate-fadeIn">
            {isCustomerLoggedIn && (
              <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-300 shadow-md">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold">Status protegido Proprietário Veículo Ativo (cartão Fidelidade   ).</span>
                </div>
                <button
                  onClick={() => {
                    setIsCustomerLoggedIn(false);
                    showToast('informaçõesum  .');
                  }}
                  className="text-[11px] text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Lock className="w-3 h-3 text-amber-400" />
                  Abrir
                </button>
              </div>
            )}

            {/* Active VIP Unlimited Membership Card */}
            {vehicle.subscription &&
              vehicle.subscription.status === 'active' &&
              new Date(vehicle.subscription.endDate) > new Date() && (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border border-purple-500/50 p-5 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400 text-purple-300 flex items-center justify-center font-bold">
                        <Crown className="w-5 h-5 text-purple-300 animate-bounce" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-purple-400 block font-mono">
                          VIP MEMBERSHIP PASS
                        </span>
                        <h4 className="text-sm font-black text-white">{vehicle.subscription.planName}</h4>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40 text-xs font-bold">
                      👑 Ativo (sem)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-purple-500/20 text-slate-300 font-sans">
                    <span>poracima / topodez em Data:</span>
                    <span className="font-mono font-bold text-purple-200">
                      {new Date(vehicle.subscription.endDate).toLocaleDateString('ku')}
                    </span>
                  </div>
                </div>
              )}

            {/* ============================================================== */}
            {/* 4. LUXURY LOYALTY REWARDS CARD (cartão recompensa Fidelidade 4 + 1)      */}
            {/* ============================================================== */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0f172a] via-[#0b1120] to-[#040711] border border-amber-500/30 p-6 sm:p-7 shadow-[0_20px_50px_-12px_rgba(245,158,11,0.18)] space-y-6">
              {/* Subtle Ambient Gold Aura */}
              <div className="absolute -top-24 right-1/4 w-72 h-44 bg-gradient-to-b from-amber-500/15 via-yellow-500/5 to-transparent blur-3xl pointer-events-none"></div>

              {/* Loyalty Header */}
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500/25 to-yellow-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-md shadow-amber-500/10 shrink-0">
                    <Gift className="w-6 h-6 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
                      <span>cartão recompensa Fidelidade</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        4 + 1 Grátis
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 pt-0.5">
                      4  o Veículo  5ou por Grátis (Fidelidade)  Grátis receber!
                    </p>
                  </div>
                </div>

                <div>
                  {isFreeNext ? (
                    <span className="text-xs px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-950 to-teal-950 text-emerald-300 border border-emerald-500/60 font-black animate-pulse flex items-center gap-1.5 shadow-lg shadow-emerald-900/30">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Lavagem Grátis (Fidelidade) Pronto! (FREE)
                    </span>
                  ) : (
                    <span className="text-xs px-3.5 py-1.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/40 font-bold flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                      {vehicle.currentCycleWashes} em 4 Roxo ({4 - vehicle.currentCycleWashes} Restante / Pendente para Grátis (Fidelidade))
                    </span>
                  )}
                </div>
              </div>

              {/* Dynamic Cycle Progress Track */}
              <div className="relative z-10 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
                  <span>porantes de ciclo de lavagens Fidelidade</span>
                  <span className="text-amber-300 font-mono">
                    {Math.min(100, Math.round((vehicle.currentCycleWashes / (settings.washesNeededForFree || 4)) * 100))}%
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-950/90 rounded-full p-0.5 border border-slate-800/90 relative overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-400 transition-all duration-700 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                    style={{
                      width: `${Math.min(100, Math.round((vehicle.currentCycleWashes / (settings.washesNeededForFree || 4)) * 100))}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* 5-Step Visual Stamp Tokens Grid */}
              <div className="relative z-10 grid grid-cols-5 gap-2 sm:gap-3 text-center">
                {[1, 2, 3, 4].map((step) => {
                  const isDone = vehicle.currentCycleWashes >= step;
                  const isCurrentTarget = vehicle.currentCycleWashes === step - 1;

                  return (
                    <div
                      key={step}
                      className={`relative overflow-hidden p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-between gap-1.5 ${
                        isDone
                          ? 'bg-gradient-to-b from-blue-600/25 via-blue-900/30 to-slate-950 border-blue-500 text-white shadow-lg shadow-blue-600/25 ring-1 ring-blue-400/40'
                          : isCurrentTarget
                          ? 'bg-gradient-to-b from-amber-500/10 via-slate-950 to-slate-950 border-amber-400/80 border-dashed text-amber-300 ring-2 ring-amber-400/20 animate-pulse'
                          : 'bg-slate-950/80 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="text-[10px] font-bold font-mono tracking-wider">#{step}</span>
                      
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform ${
                        isDone
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40'
                          : isCurrentTarget
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-900 text-slate-600'
                      }`}>
                        <Car className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>

                      {isDone ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded-full border border-cyan-500/30">
                          <Check className="w-2.5 h-2.5" />
                          Concluído
                        </span>
                      ) : isCurrentTarget ? (
                        <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded-full border border-amber-500/30">
                          Faturado
                        </span>
                      ) : (
                        <span className="text-[9px] font-medium text-slate-600">
                          Restante / Pendente
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* 5th Stamp: Free Gift Wash */}
                <div
                  className={`relative overflow-hidden p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-between gap-1.5 ${
                    isFreeNext
                      ? 'bg-gradient-to-b from-emerald-500/30 via-amber-500/20 to-slate-950 border-emerald-400 text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400 animate-pulse'
                      : 'bg-gradient-to-b from-amber-500/10 via-slate-950 to-slate-950 border-amber-500/40 text-amber-300/80 shadow-md shadow-amber-950/20'
                  }`}
                >
                  <span className="text-[10px] font-black font-mono tracking-wider text-amber-300">#5 </span>

                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform ${
                    isFreeNext
                      ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/50 scale-105'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>

                  <span className={`inline-flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    isFreeNext
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {isFreeNext ? 'Parabéns!' : 'Grátis'}
                  </span>
                </div>
              </div>

              {/* 3 Metrics Cards Footer */}
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* 1. Total Washes */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                    <Car className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Total acima / topounid.</span>
                    <strong className="text-white text-sm font-black font-mono">{vehicle.totalWashes} </strong>
                  </div>
                </div>

                {/* 2. Free Washes Claimed */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Lavagem Grátis </span>
                    <strong className="text-emerald-400 text-sm font-black font-mono">{vehicle.freeWashesClaimed} </strong>
                  </div>
                </div>

                {/* 3. Days Since / Last Visit */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">acima / topo antes de</span>
                    <strong className="text-slate-200 text-xs font-bold block pt-0.5">
                      {daysSince === 0 ? 'Hoje' : `${daysSince} dias empor`}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* 5. WASH HISTORY & RECEIPTS (Histórico de Lavagens  os recibos)        */}
            {/* ============================================================== */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0b1220] via-[#080d17] to-[#04060c] border border-slate-800/90 p-6 sm:p-7 shadow-2xl space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white tracking-tight">
                      Histórico de Lavagens em {settings.carWashName}
                    </h3>
                    <span className="text-[10px] text-slate-400 block">Registro de Oficial Recibo / Comprovante  acima / topounid. este Veículo</span>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono font-bold">
                  {vehicle.washHistory.length} Recibo / Comprovante
                </span>
              </div>

              {/* Wash History Cards */}
              {vehicle.washHistory.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-600 flex items-center justify-center mx-auto">
                    <History className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-400 font-medium">Nenhum Registrar Lavagem para este Veículo .</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {vehicle.washHistory.map((wash) => {
                    const dateStr = wash.date ? new Date(wash.date).toLocaleDateString('ku') : '';
                    const isVip = (wash.serviceName || '').toLowerCase().includes('vip');

                    return (
                      <div
                        key={wash.id}
                        className="p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-900/90 border border-slate-800/90 hover:border-blue-500/40 rounded-2xl transition duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-sm"
                      >
                        {/* Service Info & Badges */}
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-sm ${
                            wash.isFree
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isVip
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {wash.isFree ? (
                              <Sparkles className="w-5 h-5 text-emerald-400" />
                            ) : isVip ? (
                              <Award className="w-5 h-5 text-amber-400" />
                            ) : (
                              <Car className="w-5 h-5 text-blue-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white text-xs sm:text-sm block group-hover:text-blue-300 transition-colors">
                              {wash.serviceName}
                            </span>
                            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                {dateStr}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-500" />
                                Profissional: {wash.staffName || 'Grátis (Fidelidade) '}
                              </span>
                              {wash.bayNumber && (
                                <>
                                  <span>•</span>
                                  <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                                    Box {wash.bayNumber}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Price & Paid Status */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                          <div className="text-right sm:text-left">
                            <span className={`font-mono font-black text-xs sm:text-sm block ${
                              wash.isFree ? 'text-emerald-400' : 'text-slate-100'
                            }`}>
                              {wash.isFree ? '0 R$ (Grátis)' : formatR$(wash.price)}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 justify-end">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Concluído
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ============================================================== */}
            {/* 6. GOOGLE MAPS 5-STAR REVIEW BOOSTER & CUSTOMER FEEDBACK (CSAT) */}
            {/* ============================================================== */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0b1220] via-[#070b14] to-[#04060c] border border-amber-500/30 p-6 sm:p-7 shadow-2xl space-y-4 text-center">
              <div className="max-w-md mx-auto space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto shadow-md">
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />
                </div>
                <h3 className="text-base font-black text-white tracking-tight">
                    emacima / topo   Serviçoque Hoje
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  dez  acima / topoque confiança pordez  para antes deque  Limpo e Inspecionado.
                </p>

                {/* 5 Interactive Stars */}
                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRateStar(star)}
                      className={`p-2 rounded-2xl transition duration-200 active:scale-90 ${
                        userRating >= star
                          ? 'text-amber-400 scale-110 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      <Star className={`w-7 h-7 sm:w-8 sm:h-8 ${userRating >= star ? 'fill-amber-400' : ''}`} />
                    </button>
                  ))}
                </div>

                {/* 5-Star Celebration & Google Maps Launcher */}
                {userRating === 5 && (
                  <div className="p-4 bg-gradient-to-r from-emerald-950/70 to-teal-950/70 border border-emerald-500/50 rounded-2xl space-y-2.5 animate-in fade-in">
                    <p className="text-xs font-bold text-emerald-300">
                      🎉  Azul que Lavagem o Veículo   !
                    </p>
                    <p className="text-[11px] text-slate-300">
                      Por favor por 1 clique em Google Maps por 5  dez dez até   :
                    </p>
                    <a
                      href={settings.googleMapsReviewUrl || 'https://maps.google.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-98"
                    >
                      <Star className="w-4 h-4 fill-slate-950" />
                      <span> 5  em Google Maps ⭐️⭐️⭐️⭐️⭐️</span>
                    </a>
                  </div>
                )}

                {/* 1 to 4 Stars: Internal Management Feedback Box */}
                {userRating > 0 && userRating < 5 && !feedbackSubmitted && (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5 animate-in fade-in text-right">
                    <p className="text-xs font-bold text-amber-300">
                        dezque  queum sem!
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Por favor em ou Observações  digite até Administrador emque ao vivo / tempo real por para Horário:
                    </p>
                    <textarea
                      rows={3}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Observações  por Limpar Lavadores / Equipe Horário..."
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleSendFeedback}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar Observações para Administrador</span>
                    </button>
                  </div>
                )}

                {feedbackSubmitted && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold">
                    ✅  obrigado Observaçõesque por segredo / PIN  dez  emque  por para dezAluguel / Comercial.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ----------------- FOOTER ----------------- */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        <p className="font-bold text-slate-400">{settings.carWashName}</p>
        <p className="text-[11px] pt-0.5">{settings.carWashAddress} • em: {settings.carWashPhone}</p>
      </footer>

      {/* ============================================================== */}
      {/* MODAL 1: CUSTOMER PIN LOGIN (Entrar / Login Proprietário Veículo)        */}
      {/* ============================================================== */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm text-white">Entrar / Login por PIN</h3>
              </div>
              <button onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Por favor UF segredo / PIN 4 Número (PIN) Particular por  dez para Editar    que:
            </p>

            <form onSubmit={handleCustomerLogin} className="space-y-4 text-xs">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="• • • •"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-center text-xl font-mono tracking-widest text-white focus:outline-none focus:border-blue-500"
                />
                {pinError && <p className="text-[11px] text-rose-400 mt-1.5 font-bold text-center">{pinError}</p>}
                <p className="text-[10px] text-slate-500 text-center mt-1">
                  (UF : após 4 Telefone / Celular Cliente)
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30"
                >
                  <Key className="w-4 h-4" />
                  Entrar / Login
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="px-4 py-3 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Fechar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EDIT PROFILE & SOCIAL LINKS (Editar que)   */}
      {/* ============================================================== */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm text-white">Editar  até</h3>
              </div>
              <button onClick={() => setShowEditProfileModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              cada  que poraté sem em emque  .     informaçõesou dezdezque que  ou dezque:
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              {/* Name & Phone */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Nome :</label>
                  <input
                    type="text"
                    required
                    value={editOwnerName}
                    onChange={(e) => setEditOwnerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Telefone / Celular:</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="text-slate-300 font-bold block mb-1"> /   (Bio):</label>
                <input
                  type="text"
                  placeholder="como: Proprietário Veículo • porsem para !"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Social Links */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-300 block flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-blue-400" />
                  que  Totalum:
                </span>

                {/* WhatsApp */}
                <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80 space-y-1">
                  <label className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                    <WhatsAppSvg className="w-3.5 h-3.5 text-[#25D366]" />
                    Número ou  WhatsApp:
                  </label>
                  <input
                    type="text"
                    placeholder="exemplo: 07501234567 ou  wa.me"
                    value={editWhatsApp}
                    onChange={(e) => setEditWhatsApp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Snapchat */}
                <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80 space-y-1">
                  <label className="text-[11px] text-amber-300 font-bold flex items-center gap-1.5">
                    <SnapchatSvg className="w-3.5 h-3.5 text-[#FFFC00]" />
                     ou  Snapchat:
                  </label>
                  <input
                    type="text"
                    placeholder="exemplo: dilshad_24"
                    value={editSnapchat}
                    onChange={(e) => setEditSnapchat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Instagram */}
                <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80 space-y-1">
                  <label className="text-[11px] text-pink-400 font-bold flex items-center gap-1.5">
                    <InstagramSvg className="w-3.5 h-3.5 text-pink-400" />
                     ou  Instagram:
                  </label>
                  <input
                    type="text"
                    placeholder="exemplo: dilshad.car"
                    value={editInstagram}
                    onChange={(e) => setEditInstagram(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-pink-500"
                  />
                </div>

                {/* TikTok */}
                <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80 space-y-1">
                  <label className="text-[11px] text-cyan-400 font-bold flex items-center gap-1.5">
                    <TikTokSvg className="w-3.5 h-3.5 text-cyan-400" />
                     ou  TikTok:
                  </label>
                  <input
                    type="text"
                    placeholder="exemplo: @dilshad_sorento"
                    value={editTikTok}
                    onChange={(e) => setEditTikTok(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Telegram */}
                <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80 space-y-1">
                  <label className="text-[11px] text-sky-400 font-bold flex items-center gap-1.5">
                    <TelegramSvg className="w-3.5 h-3.5 text-sky-400" />
                     ou  Telegram:
                  </label>
                  <input
                    type="text"
                    placeholder="exemplo: @dilshad_tele"
                    value={editTelegram}
                    onChange={(e) => setEditTelegram(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Change PIN */}
              <div className="pt-2 border-t border-slate-800">
                <label className="text-slate-300 font-bold block mb-1">Alterar UF segredo / PIN (New PIN):</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="4 Número digite"
                  value={editNewPin}
                  onChange={(e) => setEditNewPin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Privacy Toggle for Loyalty & History */}
              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center justify-between cursor-pointer p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition">
                  <div className="space-y-0.5 pr-1">
                    <span className="text-white font-bold text-xs flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      Cidade  Particular Fidelidade  :
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                       após  PIN dezque até que    Horário.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editIsLoyaltyPrivate}
                    onChange={(e) => setEditIsLoyaltyPrivate(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0"
                  />
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Salvar 
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-3 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Fechar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: STAFF NFC SCAN ACTION (para até  Lavadores / Equipe)            */}
      {/* ============================================================== */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Entrar / Login até</h3>
              </div>
              <button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!isStaffAuthenticated ? (
              <form onSubmit={handleStaffLogin} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1">UF até (Staff PIN):</label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    autoFocus
                    placeholder="• • • •"
                    value={staffPinInput}
                    onChange={(e) => setStaffPinInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-center text-xl font-mono tracking-widest text-white focus:outline-none focus:border-emerald-500"
                  />
                  {staffPinError && <p className="text-[11px] text-rose-400 mt-1 font-bold">{staffPinError}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition"
                  >
                    Entrar / Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStaffModal(false)}
                    className="px-4 py-3 bg-slate-800 text-slate-300 rounded-xl"
                  >
                    Fechar
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-center font-bold">
                  até Ativo: você pode Lavagem Novo Registrar que
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300 block">Serviço Grátis (Fidelidade) que:</label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} - {formatR$(s.price)}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleStaffRecordWash}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Salvar / Registrar Lavagem
                  </button>
                  <button
                    onClick={() => setShowStaffModal(false)}
                    className="px-4 py-3 bg-slate-800 text-slate-300 rounded-xl"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
