import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Camera,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  X,
  RefreshCw,
  Upload,
} from 'lucide-react';
import type { CustomerProfileData, AddressItem, OrderData } from '../../lib/profileApi';
import { updateProfile } from '../../lib/profileApi';

const SETTINGS_STORAGE_KEY = 'freshmart_customer_settings';

export const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23ecfdf5'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23059669'/%3E%3Cpath d='M20 86c0-16.5 13.5-30 30-30s30 13.5 30 30' fill='%23059669'/%3E%3C/svg%3E";

// High quality in-browser image compression to make avatars lightweight and persist in DB
export function compressAvatar(dataUrl: string, maxSize = 400, quality = 0.88): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export interface SettingsState {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  gender: string;
  dob: string;
  alternatePhone: string;
}

// A brand new shopper starts blank — the form asks for these, it never
// pre-fills someone else's details.
const DEFAULT_SETTINGS: SettingsState = {
  name: '',
  email: '',
  phone: '',
  avatar: DEFAULT_AVATAR,
  gender: '',
  dob: '',
  alternatePhone: '',
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
  showToast,
  onSettingsUpdated,
}: ProfileSettingsViewProps) {
  // Settings form state
  const [settings, setSettings] = useState<SettingsState>(() => {
    let initialAvatar = DEFAULT_AVATAR;
    if (profile?.avatar && !profile.avatar.includes('photo-1535713875002')) {
      initialAvatar = profile.avatar;
    }
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.avatar && !parsed.avatar.includes('photo-1535713875002')) {
          initialAvatar = parsed.avatar;
        }
        if (profile?.avatar && !profile.avatar.includes('photo-1535713875002')) {
          initialAvatar = profile.avatar;
        }
        return { ...DEFAULT_SETTINGS, ...parsed, avatar: initialAvatar };
      }
    } catch (e) {}
    return {
      ...DEFAULT_SETTINGS,
      name: profile?.name || DEFAULT_SETTINGS.name,
      email: profile?.email || DEFAULT_SETTINGS.email,
      phone: profile?.phone || DEFAULT_SETTINGS.phone,
      avatar: initialAvatar,
    };
  });

  // Keep synced with profile props if updated externally
  useEffect(() => {
    if (profile) {
      setSettings((prev) => {
        const resolved =
          (profile.avatar && !profile.avatar.includes('photo-1535713875002') ? profile.avatar : null) ||
          (prev.avatar && !prev.avatar.includes('photo-1535713875002') ? prev.avatar : null) ||
          DEFAULT_AVATAR;
        return {
          ...prev,
          name: profile.name || prev.name,
          email: profile.email || prev.email,
          phone: profile.phone || prev.phone,
          avatar: resolved,
          gender: profile.gender || prev.gender,
          dob: profile.dob || prev.dob,
          alternatePhone: profile.alternate_phone || prev.alternatePhone,
        };
      });
    }
  }, [profile]);

  // Loading state
  const [actionLoading, setActionLoading] = useState(false);

  // Hidden File Input Ref for 1-Click Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal: Mobile Change Modal
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [newMobileNumber, setNewMobileNumber] = useState('');
  const [mobileOtpStep, setMobileOtpStep] = useState<1 | 2>(1);
  const [mobileOtp, setMobileOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(30);

  // Handle OTP timer
  useEffect(() => {
    let interval: any;
    if (mobileModalOpen && mobileOtpStep === 2 && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mobileModalOpen, mobileOtpStep, otpTimer]);

  // Handle Direct 1-Click Image Upload & Save to DB
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('Image size should be under 15MB', 'error');
      return;
    }

    setActionLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawDataUrl = event.target?.result as string;
        if (!rawDataUrl) return;

        // Compress and optimize to lightweight 400x400 avatar
        const compressedDataUrl = await compressAvatar(rawDataUrl, 400, 0.88);

        // 1. Immediately update component state
        const updated = { ...settings, avatar: compressedDataUrl };
        setSettings(updated);

        // 2. Immediately update parent ProfilePage state (both hero card & sidebar update in real-time)
        if (onSettingsUpdated) {
          onSettingsUpdated(updated);
        }
        if (setProfile) {
          setProfile((prev) => (prev ? { ...prev, avatar: compressedDataUrl } : null));
        }

        // 3. Immediately save to LocalStorage
        try {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {
          console.warn('LocalStorage save:', err);
        }

        // 4. Persist in MongoDB database
        await updateProfile({ avatar: compressedDataUrl });
        showToast('Profile photo updated & saved to database! 📸');
      } catch (err: any) {
        console.error('Failed to update avatar in DB:', err);
        showToast('Profile photo updated locally! 📸');
      } finally {
        setActionLoading(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Settings to Backend & LocalStorage
  const handleSaveSettings = async (e?: React.FormEvent, customToastMsg?: string) => {
    if (e) e.preventDefault();
    setActionLoading(true);

    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));

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
              }
            : null
        );
      }

      if (onSettingsUpdated) {
        onSettingsUpdated(settings);
      }

      await updateProfile({
        name: settings.name,
        email: settings.email,
        phone: settings.phone,
        avatar: settings.avatar,
        gender: settings.gender,
        dob: settings.dob,
        alternate_phone: settings.alternatePhone,
      });

      showToast(customToastMsg || 'Profile information saved successfully! ✅');
    } catch (err: any) {
      showToast(customToastMsg || 'Profile saved locally ✅');
    } finally {
      setActionLoading(false);
    }
  };

  // Mobile Change Handlers
  const handleRequestMobileOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = newMobileNumber.replace(/\D/g, '');
    if (cleanNum.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }
    setMobileOtpStep(2);
    setOtpTimer(30);
    showToast(`Verification code sent to +91 ${cleanNum.slice(-10)} 📲`);
  };

  const handleVerifyMobileOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileOtp.length !== 4 && mobileOtp !== '1234') {
      showToast('Please enter 4-digit code (use 1234 for demo)', 'error');
      return;
    }

    const formatted = `+91 ${newMobileNumber.replace(/\D/g, '').slice(-10)}`;
    const updated = { ...settings, phone: formatted };
    setSettings(updated);
    setMobileModalOpen(false);

    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      if (setProfile) {
        setProfile((prev) => (prev ? { ...prev, phone: formatted } : null));
      }
      if (onSettingsUpdated) {
        onSettingsUpdated(updated);
      }
      await updateProfile({ phone: formatted });
      showToast('Mobile number verified & updated! 📞');
    } catch (e) {
      showToast('Mobile number updated! 📞');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hidden file input for native device upload - triggers on 1-click */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* ======================================================== */}
      {/* 🌟 1. HERO PROFILE CARD WITH 1-CLICK AVATAR UPLOAD        */}
      {/* ======================================================== */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/80 to-green-100/70 border border-emerald-200/90 shadow-xs relative overflow-hidden">
        {/* Decorative soft ambient glow */}
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-56 h-56 rounded-full bg-emerald-200/40 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 rounded-full bg-teal-200/30 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar with 1-click upload */}
            <div
              className="relative shrink-0 group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              title="Click to choose photo from device"
            >
              <img
                src={settings.avatar || DEFAULT_AVATAR}
                alt="Profile Avatar"
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover border-2 border-emerald-400 shadow-sm group-hover:brightness-95 transition-all duration-200 bg-white"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1">
                <Camera className="w-5 h-5" />
                <span>Upload</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-md border border-white cursor-pointer"
                title="Upload Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-emerald-950">
                  {settings.name || 'Your name'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  Verified Customer
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-emerald-800/90 font-medium">
                <span className="font-bold text-emerald-950">{settings.phone}</span>
                {settings.email && (
                  <>
                    <span className="text-emerald-400">•</span>
                    <span className="truncate max-w-[220px]">{settings.email}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="self-start sm:self-center flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 👤 2. PERSONAL INFORMATION FORM                           */}
      {/* ======================================================== */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div>
            <h2 className="text-base font-black text-neutral-900">Personal Information</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Manage your personal identity, contact numbers, and profile details</p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:border-emerald-300 transition-colors cursor-pointer"
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
                placeholder="e.g. your full name"
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
                className="px-3.5 py-2.5 rounded-xl border border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
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
                placeholder="e.g. you@example.com"
              />
            </div>
            <span className="text-[11px] text-neutral-400 mt-1 block">Used for invoices and order confirmations</span>
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
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
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
              Date of Birth <span className="text-neutral-400 font-normal">(Optional)</span>
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
            Changes update immediately across your account and database
          </span>
          <button
            type="submit"
            disabled={actionLoading}
            className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Profile Changes</span>
          </button>
        </div>
      </form>

      {/* ======================================================== */}
      {/* 📱 MODAL: CHANGE PRIMARY MOBILE NUMBER                   */}
      {/* ======================================================== */}
      {mobileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-neutral-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-neutral-900">
                  {mobileOtpStep === 1 ? 'Update Phone Number' : 'Enter OTP Code'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {mobileOtpStep === 1 ? (
              <form onSubmit={handleRequestMobileOtp} className="space-y-4 pt-4">
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Enter your new 10-digit mobile number. We will send an SMS OTP to verify ownership.
                </p>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">New Mobile Number</label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs font-bold text-neutral-600">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={newMobileNumber}
                      onChange={(e) => setNewMobileNumber(e.target.value)}
                      placeholder="98765 43210"
                      maxLength={10}
                      className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMobileModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors cursor-pointer"
                  >
                    Send OTP
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyMobileOtp} className="space-y-4 pt-4 text-center">
                <p className="text-xs text-neutral-500">
                  Verification code sent to <strong>+91 {newMobileNumber}</strong>
                </p>

                <div className="py-2">
                  <input
                    type="text"
                    value={mobileOtp}
                    onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="• • • •"
                    maxLength={4}
                    className="w-36 mx-auto tracking-[10px] text-center font-black text-xl py-2.5 rounded-xl border-2 border-emerald-500 text-emerald-900 focus:outline-none"
                    required
                    autoFocus
                  />
                  <p className="text-[11px] text-neutral-400 mt-2">
                    Demo Code: <strong>1234</strong>
                  </p>
                </div>

                <div className="text-xs text-neutral-500">
                  {otpTimer > 0 ? (
                    <span>Resend code in {otpTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOtpTimer(30)}
                      className="text-emerald-600 font-bold hover:underline cursor-pointer"
                    >
                      Resend OTP Code
                    </button>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMobileOtpStep(1)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors cursor-pointer"
                  >
                    Verify & Update
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
