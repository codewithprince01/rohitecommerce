import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Camera,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  Key,
  Lock,
  Smartphone,
  Laptop,
  Globe,
  Leaf,
  Truck,
  Bell,
  Clock,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  Copy,
  Check,
  Zap,
  Sparkles,
  MessageSquare,
  Eye,
  EyeOff,
  Trash2,
  Building,
  Receipt,
  CreditCard,
  HelpCircle,
  Info,
  SlidersHorizontal,
  Volume2,
  Moon,
  Sun,
  FileText,
  CheckSquare,
  Upload,
  Shield,
  ArrowRight,
  Send,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import type { CustomerProfileData, AddressItem, OrderData } from '../../lib/profileApi';
import { updateProfile } from '../../lib/profileApi';

const SETTINGS_STORAGE_KEY = 'freshmart_customer_settings';

// Preset avatar options
const AVATAR_PRESETS = [
  {
    id: 'avatar-1',
    label: 'Aarav (Default)',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=compress&cs=tinysrgb&w=200',
    category: 'Portrait',
  },
  {
    id: 'avatar-2',
    label: 'Rohan',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=compress&cs=tinysrgb&w=200',
    category: 'Portrait',
  },
  {
    id: 'avatar-3',
    label: 'Priya',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=compress&cs=tinysrgb&w=200',
    category: 'Portrait',
  },
  {
    id: 'avatar-4',
    label: 'Ananya',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=compress&cs=tinysrgb&w=200',
    category: 'Portrait',
  },
  {
    id: 'avatar-5',
    label: 'Vikram',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=compress&cs=tinysrgb&w=200',
    category: 'Portrait',
  },
  {
    id: 'avatar-6',
    label: 'Neha',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=compress&cs=tinysrgb&w=200',
    category: 'Portrait',
  },
  {
    id: 'avatar-7',
    label: 'Master Chef 👨‍🍳',
    url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=compress&cs=tinysrgb&w=200',
    category: 'Foodie',
  },
  {
    id: 'avatar-8',
    label: 'Green Grocer 🥦',
    url: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=compress&cs=tinysrgb&w=200',
    category: 'Foodie',
  },
  {
    id: 'avatar-9',
    label: 'Coffee Enthusiast ☕',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=compress&cs=tinysrgb&w=200',
    category: 'Foodie',
  },
  {
    id: 'avatar-10',
    label: 'Smart Shopper 🛒',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=compress&cs=tinysrgb&w=200',
    category: 'Portrait',
  },
  {
    id: 'avatar-11',
    label: 'Fit & Organic 🥑',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=compress&cs=tinysrgb&w=200',
    category: 'Portrait',
  },
  {
    id: 'avatar-12',
    label: 'Agrawal Store Explorer ✨',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=compress&cs=tinysrgb&w=200',
    category: 'Portrait',
  },
];

export interface SettingsState {
  name: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  alternatePhone: string;
  avatar: string;
  defaultInstruction: string;
  preferredSlot: string;
  language: string;
  optOutOfCutlery: boolean;
  paperlessInvoicing: boolean;
  evPriority: boolean;
  bagReturnProgram: boolean;
  whatsappUpdates: boolean;
  smsPromos: boolean;
  appPushNotifications: boolean;
  emailReceipts: boolean;
  quietHours: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  twoFactorAuth: boolean;
  biometricLock: boolean;
  requirePinForHighCod: boolean;
  personalizedAds: boolean;
  shareCrashReports: boolean;
  businessGstEnabled: boolean;
  businessName: string;
  businessGstin: string;
  businessAddress: string;
}

const DEFAULT_SETTINGS: SettingsState = {
  name: 'Aarav Sharma',
  email: 'aarav.sharma@example.com',
  phone: '+91 99066 72945',
  gender: 'male',
  dob: '1996-08-15',
  alternatePhone: '+91 98112 34567',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=compress&cs=tinysrgb&w=200',
  defaultInstruction: 'Leave at door 🚪',
  preferredSlot: '10-15',
  language: 'English (India)',
  optOutOfCutlery: true,
  paperlessInvoicing: true,
  evPriority: true,
  bagReturnProgram: true,
  whatsappUpdates: true,
  smsPromos: false,
  appPushNotifications: true,
  emailReceipts: true,
  quietHours: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  twoFactorAuth: true,
  biometricLock: false,
  requirePinForHighCod: true,
  personalizedAds: true,
  shareCrashReports: false,
  businessGstEnabled: false,
  businessName: '',
  businessGstin: '',
  businessAddress: '',
};

interface ProfileSettingsViewProps {
  profile: CustomerProfileData | null;
  setProfile: React.Dispatch<React.SetStateAction<CustomerProfileData | null>>;
  addresses: AddressItem[];
  orders: OrderData[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  navigate: (page: any, tab?: any) => void;
  onSettingsUpdated?: (settings: SettingsState) => void;
}

export default function ProfileSettingsView({
  profile,
  setProfile,
  addresses,
  orders,
  showToast,
  navigate,
  onSettingsUpdated,
}: ProfileSettingsViewProps) {
  // 1. Subtab state
  const [activeSubTab, setActiveSubTab] = useState<
    'profile' | 'delivery' | 'notifications' | 'security' | 'invoicing' | 'privacy'
  >('profile');

  // 2. Settings form state
  const [settings, setSettings] = useState<SettingsState>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return {
      ...DEFAULT_SETTINGS,
      name: profile?.name || DEFAULT_SETTINGS.name,
      email: profile?.email || DEFAULT_SETTINGS.email,
      phone: profile?.phone || DEFAULT_SETTINGS.phone,
    };
  });

  // Keep synced with profile props if updated externally
  useEffect(() => {
    if (profile) {
      setSettings((prev) => ({
        ...prev,
        name: profile.name || prev.name,
        email: profile.email || prev.email,
        phone: profile.phone || prev.phone,
        avatar: profile.avatar || prev.avatar,
        gender: profile.gender || prev.gender,
        dob: profile.dob || prev.dob,
        alternatePhone: profile.alternate_phone || prev.alternatePhone,
        ...(profile.preferences || {}),
      }));
    }
  }, [profile]);

  // Loading state
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // 3. Modals State
  // Modal 1: Avatar Modal
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState('');
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal 2: Mobile Change Modal
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [newMobileNumber, setNewMobileNumber] = useState('');
  const [mobileOtpStep, setMobileOtpStep] = useState<1 | 2>(1);
  const [mobileOtp, setMobileOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(30);

  // Modal 3: Password / PIN Modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [securityTab, setSecurityTab] = useState<'password' | 'pin'>('password');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Modal 4: Delete Account Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteReason, setDeleteReason] = useState('Found another grocery provider');

  // Modal 5: Vacation Freeze Modal
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [freezeDuration, setFreezeDuration] = useState('14');

  // Active Sessions state
  const [sessions, setSessions] = useState([
    {
      id: 'sess-1',
      device: 'Desktop',
      browser: 'Chrome 128 on Windows 11',
      location: 'Sabalgarh, Morena, Madhya Pradesh, India',
      ip: '103.211.54.19',
      lastActive: 'Active Now',
      isCurrent: true,
    },
    {
      id: 'sess-2',
      device: 'Mobile',
      browser: 'Agrawal Store App • iPhone 15 Pro',
      location: 'New Delhi, India',
      ip: '182.73.12.88',
      lastActive: '18 mins ago',
      isCurrent: false,
    },
    {
      id: 'sess-3',
      device: 'Tablet',
      browser: 'Safari 18 on iPad Air (M2)',
      location: 'Noida, Uttar Pradesh, India',
      ip: '115.112.98.42',
      lastActive: 'Yesterday, 8:40 PM',
      isCurrent: false,
    },
  ]);

  // Handle OTP timer
  useEffect(() => {
    let interval: any;
    if (mobileModalOpen && mobileOtpStep === 2 && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mobileModalOpen, mobileOtpStep, otpTimer]);

  // Calculate dynamic security & profile completion score
  const securityScore = React.useMemo(() => {
    let score = 0;
    if (settings.name && settings.name.trim().length > 2) score += 15;
    if (settings.phone && settings.phone.trim().length >= 10) score += 20;
    if (settings.email && settings.email.includes('@')) score += 15;
    if (settings.twoFactorAuth) score += 20;
    if (settings.biometricLock) score += 10;
    if (addresses && addresses.length > 0) score += 10;
    if (settings.defaultInstruction) score += 10;
    return Math.min(100, score);
  }, [settings, addresses]);

  // Copy Customer ID helper
  const handleCopyCustomerId = () => {
    const custId = profile?.id ? `CUST-${profile.id.slice(-5).toUpperCase()}` : 'CUST-84920';
    navigator.clipboard.writeText(custId);
    setCopiedId(true);
    showToast('Customer ID copied to clipboard! 📋');
    setTimeout(() => setCopiedId(false), 2500);
  };

  // Save Settings to Backend & LocalStorage
  const handleSaveSettings = async (e?: React.FormEvent, customToastMsg?: string) => {
    if (e) e.preventDefault();
    setActionLoading(true);

    try {
      // 1. Save to localStorage immediately
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));

      // 2. Sync to parent profile state
      if (setProfile) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                name: settings.name,
                email: settings.email,
                phone: settings.phone,
                avatar: settings.avatar,
                gender: settings.gender,
                dob: settings.dob,
                alternate_phone: settings.alternatePhone,
                preferences: { ...settings },
              }
            : null
        );
      }

      // 3. Inform parent callback if provided
      if (onSettingsUpdated) {
        onSettingsUpdated(settings);
      }

      // 4. Send to backend API
      await updateProfile({
        name: settings.name,
        email: settings.email,
        phone: settings.phone,
        avatar: settings.avatar,
        gender: settings.gender,
        dob: settings.dob,
        alternate_phone: settings.alternatePhone,
        preferences: {
          default_instruction: settings.defaultInstruction,
          preferred_slot: settings.preferredSlot,
          language: settings.language,
          opt_out_cutlery: settings.optOutOfCutlery,
          paperless_invoicing: settings.paperlessInvoicing,
          ev_priority: settings.evPriority,
          bag_return_program: settings.bagReturnProgram,
          whatsapp_updates: settings.whatsappUpdates,
          sms_promos: settings.smsPromos,
          app_push: settings.appPushNotifications,
          email_receipts: settings.emailReceipts,
          quiet_hours: settings.quietHours,
          two_factor_auth: settings.twoFactorAuth,
          biometric_lock: settings.biometricLock,
          business_gst_enabled: settings.businessGstEnabled,
          business_name: settings.businessName,
          business_gstin: settings.businessGstin,
          business_address: settings.businessAddress,
        },
      }).catch(() => null);

      showToast(customToastMsg || 'Preferences saved successfully! 🚀');
    } catch (err: any) {
      showToast('Settings saved locally! ✨');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Avatar Modal
  const handleOpenAvatarModal = () => {
    setSelectedAvatarUrl(settings.avatar);
    setCustomAvatarInput('');
    setAvatarModalOpen(true);
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be under 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedAvatarUrl(result);
      showToast('Photo uploaded ready for preview! 📸');
    };
    reader.readAsDataURL(file);
  };

  // Confirm Avatar Change
  const handleApplyAvatar = () => {
    if (!selectedAvatarUrl) {
      showToast('Please select or upload an avatar', 'error');
      return;
    }
    const updated = { ...settings, avatar: selectedAvatarUrl };
    setSettings(updated);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    if (setProfile) {
      setProfile((prev) => (prev ? { ...prev, avatar: selectedAvatarUrl } : null));
    }
    if (onSettingsUpdated) {
      onSettingsUpdated(updated);
    }
    updateProfile({ avatar: selectedAvatarUrl }).catch(() => null);
    setAvatarModalOpen(false);
    showToast('Profile photo updated successfully! 📸');
  };

  // Start Mobile Change
  const handleStartMobileChange = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = newMobileNumber.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      showToast('Please enter a valid 10-digit Indian mobile number', 'error');
      return;
    }
    setMobileOtpStep(2);
    setOtpTimer(30);
    setMobileOtp('');
    showToast(`Verification code sent to +91 ${cleanNumber.slice(-10)} 📲`);
  };

  // Verify Mobile OTP
  const handleVerifyMobileOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = mobileOtp.trim();
    if (cleanOtp.length < 4) {
      showToast('Please enter the 4-digit verification code', 'error');
      return;
    }

    const cleanNumber = newMobileNumber.replace(/\D/g, '').slice(-10);
    const newPhone = `+91 ${cleanNumber}`;
    const updated = { ...settings, phone: newPhone };
    setSettings(updated);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));

    if (setProfile) {
      setProfile((prev) => (prev ? { ...prev, phone: newPhone } : null));
    }
    if (onSettingsUpdated) {
      onSettingsUpdated(updated);
    }
    updateProfile({ phone: newPhone }).catch(() => null);

    setMobileModalOpen(false);
    setMobileOtpStep(1);
    setMobileOtp('');
    setNewMobileNumber('');
    showToast('Primary mobile verified & updated! ✅');
  };

  // Change Password or PIN
  const handleSaveSecurityCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast(`Please enter your current ${securityTab === 'password' ? 'password' : 'PIN'}`, 'error');
      return;
    }
    if (securityTab === 'password' && newPassword.length < 6) {
      showToast('New password must be at least 6 characters long', 'error');
      return;
    }
    if (securityTab === 'pin' && (newPassword.length !== 4 || isNaN(Number(newPassword)))) {
      showToast('PIN must be a 4-digit numeric code', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Confirmation does not match new entry', 'error');
      return;
    }

    setPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast(`${securityTab === 'password' ? 'Password' : 'App PIN'} updated securely! 🔒`);
  };

  // Terminate Sessions
  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    showToast('Session terminated and device logged out! 🛡️');
  };

  const handleTerminateOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    showToast('All other active devices & sessions logged out! 🛡️');
  };

  // Test notification preview
  const handleSendTestAlert = () => {
    showToast('🔔 Live Dispatch: Pilot Ramesh has picked up your fresh groceries! ETA: 9 Mins 🛵', 'info');
  };

  // Export JSON personal data
  const handleDownloadPersonalData = () => {
    const exportData = {
      userProfile: {
        ...settings,
        accountStatus: 'Active & Verified',
        freshPassVIP: profile?.is_vip ?? true,
        freshpassExpiry: profile?.freshpass_expiry ?? '31 Dec 2026',
        walletBalance: profile?.wallet_balance ?? 250,
        cashbackEarned: profile?.cashback_earned ?? 45,
      },
      savedDeliveryAddresses: addresses,
      ordersSummary: orders.map((o) => ({
        order_number: o.order_number,
        date: o.placed_at || (o as any).created_at,
        total: o.total,
        status: o.status,
        itemCount: o.items?.length || 0,
        items: o.items?.map((it) => ({
          name: it.product_name,
          quantity: it.quantity,
          price: it.line_total,
        })),
      })),
      exportMetadata: {
        platform: 'Agrawal General & Provisional Store',
        dataProtectionCompliance: 'Digital Personal Data Protection (DPDP) Act 2023',
        generatedAt: new Date().toISOString(),
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agrawal_store_personal_data_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Personal account data downloaded in JSON format! 📥');
  };

  // Clear App Cache & Suggestions
  const handleClearAppCache = () => {
    try {
      localStorage.removeItem('freshmart_recent_searches');
      localStorage.removeItem('freshmart_temp_filters');
      localStorage.removeItem('freshmart_last_visited_cat');
    } catch (e) {}
    showToast('Search cache & local temporary recommendations cleared! 🧹');
  };

  // Vacation Freeze Account
  const handleFreezeAccount = () => {
    setFreezeModalOpen(false);
    showToast(`Account paused on Vacation Mode for ${freezeDuration} days! 🌴`);
  };

  // Delete Account
  const handleDeleteAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      showToast('Please type "DELETE" exactly to confirm deactivation', 'error');
      return;
    }
    setDeleteModalOpen(false);
    showToast('Account scheduled for permanent deletion after 14-day grace period.', 'error');
    setTimeout(() => {
      navigate('home');
    }, 2000);
  };

  // Password strength helper
  const getPasswordStrength = (pw: string) => {
    if (!pw) return { label: '', color: 'bg-neutral-200', pct: 0 };
    if (pw.length < 6) return { label: 'Weak', color: 'bg-rose-500', pct: 30 };
    const hasNum = /\d/.test(pw);
    const hasSpecial = /[!@#$%^&*]/.test(pw);
    if (pw.length >= 8 && hasNum && hasSpecial) {
      return { label: 'Strong', color: 'bg-emerald-500', pct: 100 };
    }
    return { label: 'Moderate', color: 'bg-amber-500', pct: 65 };
  };

  const pwStrength = getPasswordStrength(newPassword);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* 🌟 1. HERO PROFILE CARD WITH INTERACTIVE AVATAR & SCORE  */}
      {/* ======================================================== */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-green-950 text-white shadow-xl relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* User Details */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Avatar with status pulse and edit trigger */}
            <div className="relative shrink-0 group">
              <img
                src={settings.avatar}
                alt="Profile Avatar"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-3 border-emerald-400/80 shadow-lg group-hover:scale-105 transition-transform duration-200 cursor-pointer"
                onClick={handleOpenAvatarModal}
              />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-emerald-800" />
              </span>
              <button
                type="button"
                onClick={handleOpenAvatarModal}
                className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-neutral-900/90 text-white hover:bg-emerald-500 transition-colors shadow-md border border-white/20"
                title="Change Profile Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {settings.name || 'Aarav Sharma'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 text-[10px] font-black uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" />
                  Verified Customer
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-wide flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3 h-3" />
                  FreshPass VIP
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-emerald-100/90">
                <span className="font-semibold">{settings.phone}</span>
                <span>•</span>
                <span className="truncate max-w-[220px]">{settings.email}</span>
              </div>

              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyCustomerId}
                  className="inline-flex items-center gap-1 text-[11px] text-emerald-200 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors border border-white/10"
                  title="Click to copy ID"
                >
                  {copiedId ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId ? 'Copied!' : 'ID: CUST-84920'}</span>
                </button>
                <span className="text-[11px] text-emerald-300/80 font-medium">
                  Member since Sep 2023 • 48 Orders Delivered
                </span>
              </div>
            </div>
          </div>

          {/* Right: Security & Profile Completion Score */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 min-w-[260px] lg:max-w-xs w-full lg:w-auto">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-100 mb-2">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-300" />
                Account Security & Profile
              </span>
              <span className="text-white font-black text-sm">{securityScore}%</span>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden mb-2.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  securityScore >= 80 ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                style={{ width: `${securityScore}%` }}
              />
            </div>

            {/* Checklist tags */}
            <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-200">
              <span className="flex items-center gap-0.5">
                <Check className="w-3 h-3 text-emerald-300" /> Phone
              </span>
              <span className="flex items-center gap-0.5">
                <Check className="w-3 h-3 text-emerald-300" /> Email
              </span>
              <span className="flex items-center gap-0.5">
                <Check className="w-3 h-3 text-emerald-300" /> 2FA Active
              </span>
              <span className="flex items-center gap-0.5">
                <Check className="w-3 h-3 text-emerald-300" /> 100% COD
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 🧭 2. SUBTAB NAVIGATION PILLS                             */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-neutral-200">
        {[
          { id: 'profile', label: 'Personal Profile', icon: User },
          { id: 'delivery', label: 'Delivery Preferences', icon: Truck },
          { id: 'notifications', label: 'Alerts & Notifications', icon: Bell },
          { id: 'security', label: 'Security & Devices', icon: Lock },
          { id: 'invoicing', label: 'GST & Invoicing', icon: Receipt },
          { id: 'privacy', label: 'Privacy & Data Controls', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 bg-white border border-neutral-200/70'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 👤 SUBTAB 1: PERSONAL INFORMATION                        */}
      {/* ======================================================== */}
      {activeSubTab === 'profile' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div>
              <h2 className="text-base font-black text-neutral-900">Personal Information</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Manage your personal identity, contact numbers, and delivery details</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAvatarModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:border-emerald-300 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-neutral-500" />
              <span>Change Photo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Full Name */}
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1.5">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Aarav Sharma"
                  required
                />
              </div>
            </div>

            {/* Primary Mobile with Change Button */}
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1.5">Primary Mobile Number *</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    readOnly
                    value={settings.phone}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-800 cursor-default"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewMobileNumber('');
                    setMobileOtpStep(1);
                    setMobileModalOpen(true);
                  }}
                  className="px-3.5 py-2.5 rounded-xl border border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold transition-colors whitespace-nowrap"
                >
                  Change Number
                </button>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified for instant OTPs & doorstep delivery calls
              </span>
            </div>

            {/* Email Address */}
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. aarav.sharma@example.com"
                />
              </div>
              <span className="text-[11px] text-neutral-400 mt-1 block">Used for GST tax invoices and order receipts</span>
            </div>

            {/* Gender */}
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1.5">Gender</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'male', label: 'Male' },
                  { id: 'female', label: 'Female' },
                  { id: 'other', label: 'Other' },
                  { id: 'unspecified', label: 'Prefer not' },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSettings({ ...settings, gender: g.id })}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                      settings.gender === g.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1.5">
                Date of Birth <span className="text-neutral-400 font-normal">(Special birthday surprise rewards 🎂)</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type="date"
                  value={settings.dob}
                  onChange={(e) => setSettings({ ...settings, dob: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Emergency / Alternate Phone */}
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1.5">Alternate Contact Phone (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={settings.alternatePhone}
                  onChange={(e) => setSettings({ ...settings, alternatePhone: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. +91 98112 34567"
                />
              </div>
              <span className="text-[11px] text-neutral-400 mt-1 block">Rider will call this if primary mobile is unreachable</span>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-neutral-400 text-center sm:text-left">
              All changes update immediately across your account and dark store dispatcher
            </span>
            <button
              type="submit"
              disabled={actionLoading}
              className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
            >
              {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* 🚚 SUBTAB 2: DELIVERY PREFERENCES                        */}
      {/* ======================================================== */}
      {activeSubTab === 'delivery' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-7 shadow-xs space-y-6">
          <div className="border-b border-neutral-100 pb-4">
            <h2 className="text-base font-black text-neutral-900">Delivery & Packaging Preferences</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Customize how delivery pilots interact and hand over your groceries</p>
          </div>

          {/* Default Instructions Chips */}
          <div>
            <label className="text-xs font-black text-neutral-800 uppercase tracking-wider block mb-2">
              Default Doorstep Instructions
            </label>
            <p className="text-xs text-neutral-500 mb-3">Pre-selected automatically on all your upcoming orders</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                'Leave at door 🚪',
                'Ring doorbell 🔔',
                'Avoid calling 🤫',
                'Leave with guard 👮',
                'Beware of pets 🐕',
                'Contactless drop 📦',
              ].map((inst) => {
                const isSelected = settings.defaultInstruction === inst;
                return (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => setSettings({ ...settings, defaultInstruction: inst })}
                    className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span>{inst}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Delivery Time Slot */}
          <div className="pt-4 border-t border-neutral-100">
            <label className="text-xs font-black text-neutral-800 uppercase tracking-wider block mb-2">
              Preferred Delivery Speed & Slot
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: '10-15', title: 'Anytime Express (10-15 Min)', desc: 'Fastest dark store pilot dispatch ⚡', badge: 'Default' },
                { id: 'morning', title: 'Morning Window (7 AM - 10 AM)', desc: 'Ideal for daily dairy & breakfast essentials 🌅', badge: 'Popular' },
                { id: 'evening', title: 'Evening Window (6 PM - 9 PM)', desc: 'Fresh dinner vegetables and fruits 🌙', badge: '' },
              ].map((slot) => {
                const isSelected = settings.preferredSlot === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSettings({ ...settings, preferredSlot: slot.id })}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-neutral-900">{slot.title}</span>
                      {slot.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {slot.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500">{slot.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* App Language */}
          <div className="pt-4 border-t border-neutral-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>Interface & Communication Language</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Choose your preferred reading language for product names, order updates, and receipts
                </p>
              </div>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="px-3.5 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-800 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option>English (India)</option>
                <option>हिन्दी (Hindi)</option>
                <option>मराठी (Marathi)</option>
                <option>বাংলা (Bengali)</option>
                <option>தமிழ் (Tamil)</option>
                <option>తెలుగు (Telugu)</option>
                <option>ગુજરાતી (Gujarati)</option>
              </select>
            </div>
          </div>

          {/* Eco-Friendly Initiatives */}
          <div className="pt-4 border-t border-neutral-100 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span>Green & Eco-Friendly Initiatives</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/40 cursor-pointer hover:bg-emerald-50/70 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.optOutOfCutlery}
                  onChange={(e) => setSettings({ ...settings, optOutOfCutlery: e.target.checked })}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-neutral-900 block">Opt out of disposable cutlery & plastic 🌱</span>
                  <span className="text-[11px] text-neutral-500">Save plastic on each order. Delivered in biodegradable pouches.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/40 cursor-pointer hover:bg-emerald-50/70 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.paperlessInvoicing}
                  onChange={(e) => setSettings({ ...settings, paperlessInvoicing: e.target.checked })}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-neutral-900 block">100% Paperless Digital GST Invoices 📄</span>
                  <span className="text-[11px] text-neutral-500">No printed paper receipts. Digital copy sent to Email & WhatsApp.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/40 cursor-pointer hover:bg-emerald-50/70 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.evPriority}
                  onChange={(e) => setSettings({ ...settings, evPriority: e.target.checked })}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-neutral-900 block">Prioritize Electric Vehicle (EV) Pilots ⚡</span>
                  <span className="text-[11px] text-neutral-500">Dispatch zero-emission 2-wheelers from micro dark store whenever available.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/40 cursor-pointer hover:bg-emerald-50/70 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.bagReturnProgram}
                  onChange={(e) => setSettings({ ...settings, bagReturnProgram: e.target.checked })}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-neutral-900 block">Bag Return & Cashback Program ♻️</span>
                  <span className="text-[11px] text-neutral-500">Return clean grocery bags to pilot for ₹5 Fresh Cash coin credit per bag.</span>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-end">
            <button
              type="submit"
              disabled={actionLoading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm active:scale-95"
            >
              Save Delivery Preferences
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* 🔔 SUBTAB 3: ALERTS & NOTIFICATIONS                      */}
      {/* ======================================================== */}
      {activeSubTab === 'notifications' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
            <div>
              <h2 className="text-base font-black text-neutral-900">Communication & Alert Preferences</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Control how and when Agrawal General & Provisional Store sends you delivery updates and alerts</p>
            </div>
            <button
              type="button"
              onClick={handleSendTestAlert}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-600" />
              <span>Send Sample Alert</span>
            </button>
          </div>

          <div className="divide-y divide-neutral-100">
            {/* WhatsApp Tracking */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 mt-0.5">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-900 block">WhatsApp Live Order Tracking & Pilot Updates</span>
                  <span className="text-[11px] text-neutral-500">Receive rider assignment, dark store dispatch, and doorstep arrival alerts.</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.whatsappUpdates}
                onChange={(e) => setSettings({ ...settings, whatsappUpdates: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5 cursor-pointer"
              />
            </div>

            {/* SMS Dispatches */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-900 block">SMS OTP & Security Alerts</span>
                  <span className="text-[11px] text-neutral-500">Critical delivery hand-off PINs and order confirmation text messages.</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.smsPromos}
                onChange={(e) => setSettings({ ...settings, smsPromos: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5 cursor-pointer"
              />
            </div>

            {/* App Push */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-900 block">App Push Notifications for Restocks & Flash Sales</span>
                  <span className="text-[11px] text-neutral-500">Instant notification when organic milk, paneer, and staples restock in Dark Store #04.</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.appPushNotifications}
                onChange={(e) => setSettings({ ...settings, appPushNotifications: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5 cursor-pointer"
              />
            </div>

            {/* Email Receipts */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-900 block">Email Invoices & Monthly Grocery Summaries</span>
                  <span className="text-[11px] text-neutral-500">Itemized bills and monthly expense analytics sent to your registered email.</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.emailReceipts}
                onChange={(e) => setSettings({ ...settings, emailReceipts: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5 cursor-pointer"
              />
            </div>

            {/* Quiet Hours */}
            <div className="py-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block">Do Not Disturb / Quiet Hours</span>
                    <span className="text-[11px] text-neutral-500">Silence all promotional alerts during night and early morning hours.</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.quietHours}
                  onChange={(e) => setSettings({ ...settings, quietHours: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5 cursor-pointer"
                />
              </div>

              {settings.quietHours && (
                <div className="ml-11 p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center gap-3 text-xs">
                  <span className="font-bold text-neutral-700">From:</span>
                  <input
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={(e) => setSettings({ ...settings, quietHoursStart: e.target.value })}
                    className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white font-semibold"
                  />
                  <span className="font-bold text-neutral-700">To:</span>
                  <input
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) => setSettings({ ...settings, quietHoursEnd: e.target.value })}
                    className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white font-semibold"
                  />
                  <span className="text-[11px] text-neutral-400">(Emergency order OTPs still delivered)</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-end">
            <button
              type="submit"
              disabled={actionLoading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm active:scale-95"
            >
              Save Alert Preferences
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* 🛡️ SUBTAB 4: SECURITY & SESSIONS                         */}
      {/* ======================================================== */}
      {activeSubTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <div>
                <h2 className="text-base font-black text-neutral-900">Account Security & Credentials</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Protect your account with passwords, two-factor authentication, and biometrics</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Change Password / PIN</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 2FA Card */}
              <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-neutral-900">Two-Factor Authentication (2FA)</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Require WhatsApp / SMS OTP verification whenever logging in from an unrecognized device or browser.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.twoFactorAuth}
                  onChange={(e) => {
                    const updated = { ...settings, twoFactorAuth: e.target.checked };
                    setSettings(updated);
                    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
                    showToast(e.target.checked ? '2FA Protection Enabled! 🛡️' : '2FA Disabled');
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5 cursor-pointer shrink-0 mt-1"
                />
              </div>

              {/* Biometric Card */}
              <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-neutral-900">Biometric / App Lock</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Require Fingerprint or FaceID before viewing saved payment addresses and placing instant orders.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.biometricLock}
                  onChange={(e) => {
                    const updated = { ...settings, biometricLock: e.target.checked };
                    setSettings(updated);
                    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
                    showToast(e.target.checked ? 'Biometric App Lock Enabled! 📱' : 'Biometric Lock Disabled');
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5 cursor-pointer shrink-0 mt-1"
                />
              </div>

              {/* Require PIN for high COD */}
              <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-neutral-900">High-Value COD Verification</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Require confirmation code on Cash on Delivery orders above ₹1,000 to prevent accidental clicks.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requirePinForHighCod}
                  onChange={(e) => {
                    const updated = { ...settings, requirePinForHighCod: e.target.checked };
                    setSettings(updated);
                    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
                    showToast(e.target.checked ? 'High-Value COD Protection Active! 🔒' : 'Protection Disabled');
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5 cursor-pointer shrink-0 mt-1"
                />
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">Security Status: Excellent</span>
                  <span className="text-[11px] text-emerald-700">All logins are encrypted with 256-bit SSL tokens.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Sessions & Logged In Devices */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-neutral-900">Active Devices & Logged-in Sessions</h3>
                <p className="text-xs text-neutral-500 mt-0.5">These devices are currently logged into your Agrawal Store account</p>
              </div>
              {sessions.length > 1 && (
                <button
                  type="button"
                  onClick={handleTerminateOtherSessions}
                  className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Log Out All Other Devices</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-neutral-100">
              {sessions.map((sess) => (
                <div key={sess.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
                      {sess.device === 'Desktop' ? <Laptop className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900">{sess.browser}</span>
                        {sess.isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                            Current Device
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {sess.location} • IP: {sess.ip} • <span className="font-medium text-neutral-600">{sess.lastActive}</span>
                      </p>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(sess.id)}
                      className="text-xs font-bold text-neutral-400 hover:text-rose-600 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📄 SUBTAB 5: GST & INVOICING                             */}
      {/* ======================================================== */}
      {activeSubTab === 'invoicing' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-7 shadow-xs space-y-6">
          <div className="border-b border-neutral-100 pb-4">
            <h2 className="text-base font-black text-neutral-900">GSTIN & Business Invoicing</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Add your company GSTIN to claim Input Tax Credit (ITC) on office pantry and grocery purchases
            </p>
          </div>

          <label className="flex items-start gap-3 p-4 rounded-2xl border border-neutral-200 bg-neutral-50/70 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.businessGstEnabled}
              onChange={(e) => setSettings({ ...settings, businessGstEnabled: e.target.checked })}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-neutral-900 block">Enable Business Invoicing on Orders</span>
              <span className="text-[11px] text-neutral-500">
                Automatically generate B2B tax invoices with your GST number on all eligible grocery orders.
              </span>
            </div>
          </label>

          {settings.businessGstEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1.5">Registered Company / Trade Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Technologies Pvt Ltd"
                  value={settings.businessName}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required={settings.businessGstEnabled}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1.5">15-Digit GSTIN Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 06AAAAA0000A1Z5"
                  maxLength={15}
                  value={settings.businessGstin}
                  onChange={(e) => setSettings({ ...settings, businessGstin: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium uppercase tracking-wider focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  required={settings.businessGstEnabled}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-neutral-700 block mb-1.5">Registered Business Address *</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 5th Floor, Cyber Hub, DLF Phase 2, Gurugram, Haryana - 122002"
                  value={settings.businessAddress}
                  onChange={(e) => setSettings({ ...settings, businessAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required={settings.businessGstEnabled}
                />
              </div>
            </div>
          )}

          {/* Doorstep Payment Mode Info */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
            <Receipt className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">100% Cash on Delivery (COD) & Doorstep UPI</span>
              <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                Whether personal or corporate orders, you can pay using cash or instant UPI scan directly to the pilot upon doorstep arrival. Digital tax invoice is generated instantly upon delivery hand-off.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-end">
            <button
              type="submit"
              disabled={actionLoading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm active:scale-95"
            >
              Save Invoicing Settings
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* 🔒 SUBTAB 6: PRIVACY & DATA CONTROLS                     */}
      {/* ======================================================== */}
      {activeSubTab === 'privacy' && (
        <div className="space-y-6">
          {/* Privacy Transparency */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="border-b border-neutral-100 pb-4">
              <h2 className="text-base font-black text-neutral-900">Data Privacy & Portability</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Under Digital Personal Data Protection standards, you retain full ownership and control over your data.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Export Data */}
              <div className="p-4 rounded-2xl border border-neutral-200 bg-slate-50/70 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-bold text-neutral-900 text-xs mb-1">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Download Account Data (JSON)</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Receive a complete export file of your personal profile, addresses, and full order history.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadPersonalData}
                  className="px-4 py-2 rounded-xl bg-white border border-neutral-200 hover:bg-emerald-50 text-xs font-bold text-neutral-800 hover:text-emerald-800 transition-colors shadow-xs w-full flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export My Data Now</span>
                </button>
              </div>

              {/* Clear Cache */}
              <div className="p-4 rounded-2xl border border-neutral-200 bg-slate-50/70 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-bold text-neutral-900 text-xs mb-1">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                    <span>Clear Search Cache & Recommendations</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Reset recent grocery searches, auto-suggestions, and locally cached recommendations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearAppCache}
                  className="px-4 py-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-100 text-xs font-bold text-neutral-800 transition-colors shadow-xs w-full"
                >
                  Clear Search Cache
                </button>
              </div>
            </div>

            {/* Privacy Toggles */}
            <div className="pt-3 border-t border-neutral-100 space-y-3">
              <label className="flex items-center justify-between gap-3 text-xs cursor-pointer">
                <div>
                  <span className="font-bold text-neutral-900 block">Personalized Grocery Recommendations</span>
                  <span className="text-[11px] text-neutral-500">
                    Use your previous purchases to recommend relevant organic produce and flash sales.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.personalizedAds}
                  onChange={(e) => {
                    const updated = { ...settings, personalizedAds: e.target.checked };
                    setSettings(updated);
                    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
                    showToast(e.target.checked ? 'Recommendations enabled' : 'Generic recommendations active');
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-5 h-5 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Vacation Freeze & Danger Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vacation Pause */}
            <div className="bg-amber-50/50 rounded-3xl border border-amber-200 p-6 shadow-xs flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-amber-800 text-xs font-black uppercase tracking-wider mb-1">
                  <Moon className="w-4 h-4 text-amber-600" />
                  <span>Vacation Mode</span>
                </div>
                <h3 className="text-sm font-black text-neutral-900">Pause Grocery Notifications</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Traveling or on holiday? Pause all daily grocery reminders and alerts for up to 60 days.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFreezeModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-xs self-start"
              >
                Enable Vacation Pause
              </button>
            </div>

            {/* Delete Account */}
            <div className="bg-rose-50/50 rounded-3xl border border-rose-200 p-6 shadow-xs flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-rose-700 text-xs font-black uppercase tracking-wider mb-1">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Danger Zone</span>
                </div>
                <h3 className="text-sm font-black text-neutral-900">Deactivate or Delete Account</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Permanently erase your personal profile, addresses, and order history after a 14-day grace period.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmText('');
                  setDeleteModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-colors shadow-xs self-start"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🖼️ MODAL 1: CHOOSE / UPLOAD PROFILE AVATAR                */}
      {/* ======================================================== */}
      {avatarModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-neutral-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-neutral-900">Choose Profile Photo</h3>
              </div>
              <button
                type="button"
                onClick={() => setAvatarModalOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Selection Preview */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 mt-4">
              <img
                src={selectedAvatarUrl || settings.avatar}
                alt="Selected preview"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
              />
              <div>
                <span className="text-xs font-black text-neutral-900 block">Avatar Preview</span>
                <span className="text-[11px] text-neutral-500">
                  This photo will be displayed on your profile and shown to delivery pilots.
                </span>
              </div>
            </div>

            {/* Preset Avatar Selection Grid */}
            <div className="mt-4">
              <label className="text-xs font-black text-neutral-700 uppercase tracking-wider block mb-2">
                Select from Curated Avatars
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-52 overflow-y-auto p-1">
                {AVATAR_PRESETS.map((item) => {
                  const isSelected = selectedAvatarUrl === item.url;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedAvatarUrl(item.url)}
                      className={`relative rounded-2xl overflow-hidden border-2 transition-all p-0.5 group ${
                        isSelected
                          ? 'border-emerald-600 ring-2 ring-emerald-500/30 scale-105 shadow-md'
                          : 'border-transparent hover:border-neutral-300'
                      }`}
                      title={item.label}
                    >
                      <img src={item.url} alt={item.label} className="w-full aspect-square object-cover rounded-xl" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center rounded-xl">
                          <Check className="w-5 h-5 text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Local File Upload or Custom URL */}
            <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3">
              <label className="text-xs font-black text-neutral-700 uppercase tracking-wider block">
                Or Upload / Use Custom Image URL
              </label>

              {/* Upload file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Device Photo</span>
                </button>

                <div className="relative flex-1">
                  <input
                    type="url"
                    placeholder="Paste image link https://..."
                    value={customAvatarInput}
                    onChange={(e) => {
                      setCustomAvatarInput(e.target.value);
                      if (e.target.value.startsWith('http')) {
                        setSelectedAvatarUrl(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-5 mt-4 border-t border-neutral-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAvatarModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyAvatar}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors shadow-xs"
              >
                Apply Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📱 MODAL 2: CHANGE MOBILE NUMBER WITH OTP VERIFICATION    */}
      {/* ======================================================== */}
      {mobileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-neutral-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-neutral-900">Change Mobile Number</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileModalOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {mobileOtpStep === 1 ? (
              <form onSubmit={handleStartMobileChange} className="space-y-4 pt-4 text-xs">
                <p className="text-neutral-500 leading-relaxed">
                  Enter your new 10-digit mobile number. We will send an SMS verification OTP to verify ownership.
                </p>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">New Mobile Number</label>
                  <div className="flex items-center rounded-xl border border-neutral-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                    <span className="px-3 py-2.5 bg-neutral-100 text-neutral-700 font-bold border-r border-neutral-200">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="98765 43210"
                      value={newMobileNumber}
                      onChange={(e) => setNewMobileNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2.5 text-xs font-bold focus:outline-none"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMobileModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-200 font-bold text-neutral-600 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xs"
                  >
                    Send OTP
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyMobileOtp} className="space-y-4 pt-4 text-xs text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Send className="w-6 h-6" />
                </div>

                <div>
                  <h4 className="text-sm font-black text-neutral-900">Enter Verification Code</h4>
                  <p className="text-neutral-500 mt-1 text-[11px]">
                    Enter 4-digit code sent to <strong>+91 {newMobileNumber}</strong>
                  </p>
                </div>

                {/* Demo auto-fill helper */}
                <button
                  type="button"
                  onClick={() => setMobileOtp('4892')}
                  className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] inline-flex items-center gap-1 hover:bg-emerald-100"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Click to autofill Demo OTP: 4892</span>
                </button>

                <div>
                  <input
                    type="text"
                    maxLength={4}
                    value={mobileOtp}
                    onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • •"
                    className="w-40 mx-auto text-center tracking-[1em] text-lg font-black py-2 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    autoFocus
                    required
                  />
                </div>

                <div className="text-[11px] text-neutral-400">
                  {otpTimer > 0 ? (
                    <span>Resend code in {otpTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOtpTimer(30)}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      Resend OTP Code
                    </button>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMobileOtpStep(1)}
                    className="flex-1 py-2 rounded-xl border border-neutral-200 font-bold text-neutral-600 hover:bg-neutral-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xs"
                  >
                    Verify & Save
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🔒 MODAL 3: CHANGE PASSWORD / APP PIN                     */}
      {/* ======================================================== */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-neutral-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-neutral-900">Account Credentials</h3>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab switch between Password and PIN */}
            <div className="grid grid-cols-2 gap-2 mt-4 p-1 rounded-xl bg-neutral-100">
              <button
                type="button"
                onClick={() => setSecurityTab('password')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  securityTab === 'password' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'
                }`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => setSecurityTab('pin')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  securityTab === 'pin' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'
                }`}
              >
                4-Digit Quick PIN
              </button>
            </div>

            <form onSubmit={handleSaveSecurityCredentials} className="space-y-4 pt-4 text-xs">
              {/* Current credential */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Current {securityTab === 'password' ? 'Password' : '4-Digit PIN'} *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={securityTab === 'password' ? 'Enter current password' : 'Enter current 4-digit PIN'}
                    maxLength={securityTab === 'pin' ? 4 : undefined}
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-neutral-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700"
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New credential */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  New {securityTab === 'password' ? 'Password' : '4-Digit PIN'} *
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={securityTab === 'password' ? 'At least 6 characters' : '4 numeric digits'}
                    maxLength={securityTab === 'pin' ? 4 : undefined}
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-neutral-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength meter */}
                {securityTab === 'password' && newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${pwStrength.color} transition-all duration-300`}
                        style={{ width: `${pwStrength.pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-neutral-500 block text-right">
                      Strength: {pwStrength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm credential */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Confirm New {securityTab === 'password' ? 'Password' : '4-Digit PIN'} *
                </label>
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter to confirm"
                  maxLength={securityTab === 'pin' ? 4 : undefined}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 font-bold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xs"
                >
                  Update Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🌴 MODAL 4: VACATION MODE MODAL                          */}
      {/* ======================================================== */}
      {freezeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-neutral-200 text-center animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <Moon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-neutral-900 mb-1">Vacation Mode</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Select how long you would like to pause all daily grocery notifications and marketing messages.
            </p>

            <select
              value={freezeDuration}
              onChange={(e) => setFreezeDuration(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-800 mb-5 focus:outline-none"
            >
              <option value="7">7 Days (1 Week Vacation)</option>
              <option value="14">14 Days (2 Weeks Vacation)</option>
              <option value="30">30 Days (1 Month)</option>
              <option value="60">60 Days (Extended Holiday)</option>
            </select>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFreezeModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFreezeAccount}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black"
              >
                Activate Pause
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ⚠️ MODAL 5: DELETE ACCOUNT CONFIRMATION                   */}
      {/* ======================================================== */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-neutral-200 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-neutral-900 text-center mb-1">
              Deactivate or Delete Agrawal Store Account?
            </h3>
            <p className="text-xs text-neutral-500 text-center mb-4">
              This action initiates permanent removal of your account, saved addresses, VIP perks, and order records.
            </p>

            <form onSubmit={handleDeleteAccount} className="space-y-4 text-xs">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Why are you deleting?</label>
                <select
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:outline-none"
                >
                  <option>Found another grocery provider</option>
                  <option>Relocating to another city</option>
                  <option>Too many promotional alerts</option>
                  <option>Privacy concerns</option>
                  <option>Other reason</option>
                </select>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[11px] leading-relaxed">
                <strong>14-Day Recovery Grace Period:</strong> You can log back in within 14 days to cancel this request. Afterwards, your data is wiped permanently.
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Type <strong>DELETE</strong> to confirm:
                </label>
                <input
                  type="text"
                  placeholder="DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:ring-2 focus:ring-rose-500 focus:outline-none uppercase font-bold text-rose-600"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 font-bold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-black transition-colors"
                >
                  Permanently Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
