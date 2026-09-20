import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Package,
  MapPin,
  Wallet,
  Tag,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  ShoppingCart,
  Send,
  Copy,
  Check,
  AlertCircle,
  X,
  CreditCard,
  Phone,
  Mail,
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Bell,
  ShieldCheck,
  Search,
  Printer,
  FileText,
  Star,
  Navigation,
  MessageSquare,
  Home,
  Briefcase,
  Users,
  Share2,
  LocateFixed,
  Building,
  Bike,
  SlidersHorizontal,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Info,
  CheckSquare,
  Square,
  Receipt,
  Truck,
  Banknote,
  Lock,
  Key,
  Smartphone,
  Laptop,
  Globe,
  Leaf,
  Eye,
  EyeOff,
  Camera,
  Download,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ProfileTabType } from '../context/AppContext';
import type { ProductWithVariants, ProductVariant } from '../lib/supabase';
import {
  fetchProfile,
  updateProfile,
  fetchOrders,
  cancelOrder,
  reorderItems,
  rateOrder,
  fetchAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  fetchWallet,
  topupWallet,
  fetchCoupons,
  applyCoupon,
  fetchSupportTickets,
  createSupportTicket,
  replySupportTicket,
  logoutCustomer,
  type CustomerProfileData,
  type OrderData,
  type OrderItemData,
  type AddressItem,
  type WalletData,
  type CouponItem,
  type SupportTicketItem,
} from '../lib/profileApi';
import ProfileSettingsView, { DEFAULT_AVATAR, compressAvatar } from '../components/profile/ProfileSettingsView';
import DeliveryLocationModal from '../components/DeliveryLocationModal';

export const formatOrderDateTime = (dateVal?: string | Date | null) => {
  if (!dateVal) {
    return new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    return new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const getOrderPlacedAt = (order: OrderData) => {
  // If this was an old seed test order like TESTORD-001, present current active time for live feel
  if (order.order_number === 'TESTORD-001') {
    return new Date();
  }
  return order.placed_at || (order as any).created_at || (order as any).createdAt || new Date();
};

const DELIVERY_INSTRUCTION_OPTIONS = [
  'Leave at door 🚪',
  'Ring doorbell 🔔',
  'Avoid calling 🤫',
  'Leave with guard 👮',
  'Beware of pets 🐕',
];

const FALLBACK_ORDERS: OrderData[] = [
  {
    _id: 'ord-active-1',
    id: 'ord-active-1',
    order_number: 'FM-942810',
    customer_id: 'cust-demo',
    status: 'out_for_delivery',
    payment_status: 'cod_pending',
    payment_method: 'cod',
    subtotal: 211,
    discount: 0,
    delivery_fee: 0,
    tax: 0,
    total: 211,
    delivery_address: {
      label: 'Home',
      line1: 'Fatehchand colony, ward no 5',
      line2: 'Near ram mandir chauraha',
      city: 'Sabalgarh, Morena',
      state: 'Madhya Pradesh',
      pincode: '476229',
    },
    notes: 'Leave at door 🚪',
    placed_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    delivery_eta: '6-8 Mins',
    rider: {
      name: 'Ramesh Kumar',
      phone: '+91 98102 34567',
      rating: 4.9,
      trips: 1842,
      vehicle: 'Hero Electric Nyx (HR-26-BK-4091)',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=compress&cs=tinysrgb&w=150',
    },
    items: [
      {
        _id: 'item-1-1',
        order_id: 'ord-active-1',
        product_id: 'p-milk-1',
        variant_id: 'v-milk-1',
        product_name: 'Amul Taaza Fresh Toned Milk',
        variant_label: '1 L Pouch',
        unit_price: 54,
        quantity: 2,
        line_total: 108,
        image: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=200',
      },
      {
        _id: 'item-1-2',
        order_id: 'ord-active-1',
        product_id: 'p-banana-1',
        variant_id: 'v-banana-1',
        product_name: 'Fresh Robusta Cavendish Banana',
        variant_label: 'Pack of 6 (approx 750g)',
        unit_price: 48,
        quantity: 1,
        line_total: 48,
        image: 'https://images.pexels.com/photos/1093038/pexels-photo-1093038.jpeg?auto=compress&cs=tinysrgb&w=200',
      },
      {
        _id: 'item-1-3',
        order_id: 'ord-active-1',
        product_id: 'p-bread-1',
        variant_id: 'v-bread-1',
        product_name: 'The Health Factory Zero Maida Brown Bread',
        variant_label: '400 g Pack',
        unit_price: 55,
        quantity: 1,
        line_total: 55,
        image: 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=200',
      },
    ],
  },
  {
    _id: 'ord-active-2',
    id: 'ord-active-2',
    order_number: 'FM-881924',
    customer_id: 'cust-demo',
    status: 'packed',
    payment_status: 'cod_pending',
    payment_method: 'cod',
    subtotal: 385,
    discount: 0,
    delivery_fee: 0,
    tax: 0,
    total: 385,
    delivery_address: {
      label: 'Home',
      line1: 'Fatehchand colony, ward no 5',
      line2: 'Near ram mandir chauraha',
      city: 'Sabalgarh, Morena',
      state: 'Madhya Pradesh',
      pincode: '476229',
    },
    notes: 'Ring doorbell 🔔',
    placed_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    delivery_eta: '10-12 Mins',
    rider: {
      name: 'Suresh Verma',
      phone: '+91 98711 82910',
      rating: 4.8,
      trips: 940,
      vehicle: 'Ather 450X (HR-26-CZ-9102)',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=compress&cs=tinysrgb&w=150',
    },
    items: [
      {
        _id: 'item-2-1',
        order_id: 'ord-active-2',
        product_id: 'p-paneer-1',
        variant_id: 'v-paneer-1',
        product_name: 'Amul Malai Fresh Paneer Cube',
        variant_label: '200 g Block',
        unit_price: 120,
        quantity: 2,
        line_total: 240,
        image: 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=200',
      },
      {
        _id: 'item-2-2',
        order_id: 'ord-active-2',
        product_id: 'p-oil-1',
        variant_id: 'v-oil-1',
        product_name: 'Fortune Sunlite Refined Sunflower Oil',
        variant_label: '1 L Pouch',
        unit_price: 145,
        quantity: 1,
        line_total: 145,
        image: 'https://images.pexels.com/photos/33783/olive-oil-salad-dressing-cooking-olive.jpg?auto=compress&cs=tinysrgb&w=200',
      },
    ],
  },
  {
    _id: 'ord-delivered-1',
    id: 'ord-delivered-1',
    order_number: 'FM-762109',
    customer_id: 'cust-demo',
    status: 'delivered',
    payment_status: 'cod_collected',
    payment_method: 'cod',
    subtotal: 472,
    discount: 0,
    delivery_fee: 0,
    tax: 0,
    total: 472,
    delivery_address: {
      label: 'Home',
      line1: 'Fatehchand colony, ward no 5',
      line2: 'Near ram mandir chauraha',
      city: 'Sabalgarh, Morena',
      state: 'Madhya Pradesh',
      pincode: '476229',
    },
    notes: 'Leave with guard 👮',
    placed_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    delivery_eta: 'Delivered in 8.5 Mins',
    rider: {
      name: 'Vikram Singh',
      phone: '+91 99580 12830',
      rating: 5.0,
      trips: 2410,
      vehicle: 'Ola S1 Pro (DL-3S-AQ-5819)',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=compress&cs=tinysrgb&w=150',
    },
    rating: 5,
    rating_review: 'Fresh vegetables and chilled dairy delivered super fast in 8 minutes!',
    rating_tags: ['Superfast Delivery ⚡', 'Fresh & Chilled 🥦', 'Polite Pilot 😊'],
    items: [
      {
        _id: 'item-3-1',
        order_id: 'ord-delivered-1',
        product_id: 'p-tomato-1',
        variant_id: 'v-tomato-1',
        product_name: 'Farm Fresh Organic Hybrid Tomatoes',
        variant_label: '1 kg Pack',
        unit_price: 38,
        quantity: 1,
        line_total: 38,
        image: 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=200',
      },
      {
        _id: 'item-3-2',
        order_id: 'ord-delivered-1',
        product_id: 'p-apple-1',
        variant_id: 'v-apple-1',
        product_name: 'Royal Gala Crisp Himachal Apples',
        variant_label: 'Pack of 4 (approx 600g)',
        unit_price: 149,
        quantity: 1,
        line_total: 149,
        image: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=200',
      },
      {
        _id: 'item-3-3',
        order_id: 'ord-delivered-1',
        product_id: 'p-yogurt-1',
        variant_id: 'v-yogurt-1',
        product_name: 'Epigamia Greek Yogurt Natural High Protein',
        variant_label: '100 g Cup',
        unit_price: 50,
        quantity: 3,
        line_total: 150,
        image: 'https://images.pexels.com/photos/414262/pexels-photo-414262.jpeg?auto=compress&cs=tinysrgb&w=200',
      },
      {
        _id: 'item-3-4',
        order_id: 'ord-delivered-1',
        product_id: 'p-cheese-1',
        variant_id: 'v-cheese-1',
        product_name: 'Britannia Classic Cheddar Cheese Slices',
        variant_label: '200 g (10 Slices)',
        unit_price: 175,
        quantity: 1,
        line_total: 175,
        image: 'https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&w=200',
      },
    ],
  },
  {
    _id: 'ord-delivered-2',
    id: 'ord-delivered-2',
    order_number: 'FM-639102',
    customer_id: 'cust-demo',
    status: 'delivered',
    payment_status: 'cod_collected',
    payment_method: 'cod',
    subtotal: 433,
    discount: 0,
    delivery_fee: 0,
    tax: 0,
    total: 433,
    delivery_address: {
      label: 'Home',
      line1: 'Fatehchand colony, ward no 5',
      line2: 'Near ram mandir chauraha',
      city: 'Sabalgarh, Morena',
      state: 'Madhya Pradesh',
      pincode: '476229',
    },
    notes: 'Leave at door 🚪',
    placed_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    delivery_eta: 'Delivered in 9.2 Mins',
    rating: 5,
    rating_review: 'Always reliable quality packaging!',
    rating_tags: ['Well Packed 📦', 'Accurate Items ✅'],
    items: [
      {
        _id: 'item-4-1',
        order_id: 'ord-delivered-2',
        product_id: 'p-tea-1',
        variant_id: 'v-tea-1',
        product_name: 'Tata Tea Premium Desh Ki Chai Leaf Tea',
        variant_label: '500 g Pouch',
        unit_price: 265,
        quantity: 1,
        line_total: 265,
        image: 'https://images.pexels.com/photos/1417945/pexels-photo-1417945.jpeg?auto=compress&cs=tinysrgb&w=200',
      },
      {
        _id: 'item-4-2',
        order_id: 'ord-delivered-2',
        product_id: 'p-maggi-1',
        variant_id: 'v-maggi-1',
        product_name: 'Maggi 2-Minute Masala Instant Noodles',
        variant_label: 'Family Pack (12 x 70g)',
        unit_price: 168,
        quantity: 1,
        line_total: 168,
        image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=200',
      },
    ],
  },
];

export default function ProfilePage() {
  const {
    state,
    navigate,
    setProfileTab,
    cartCount,
    addToCart,
    setCart,
    deliveryLocation,
    setDeliveryLocation,
  } = useApp();
  const currentTab: ProfileTabType = state.profileTab || 'orders';

  // State loaded from MongoDB backend
  const [profile, setProfile] = useState<CustomerProfileData | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);

  // Delivery Location Modal
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // Active default address of whichever account is logged in
  const defaultAccountAddress = useMemo(() => {
    return addresses.find((a) => a.is_default) || addresses[0] || null;
  }, [addresses]);

  const activeDisplayAddress = useMemo(() => {
    if (defaultAccountAddress) {
      return (
        defaultAccountAddress.landmark ||
        defaultAccountAddress.line2 ||
        defaultAccountAddress.line1.split(',')[0] ||
        defaultAccountAddress.city ||
        'Ram Mandir Chauraha'
      );
    }
    return deliveryLocation?.area || deliveryLocation?.city || 'Ram Mandir Chauraha';
  }, [defaultAccountAddress, deliveryLocation]);

  // Keep deliveryLocation synchronized with default address of current customer account
  useEffect(() => {
    if (defaultAccountAddress && setDeliveryLocation) {
      setDeliveryLocation({
        city: defaultAccountAddress.city || 'Sabalgarh',
        area:
          defaultAccountAddress.landmark ||
          defaultAccountAddress.line2 ||
          defaultAccountAddress.line1.split(',')[0] ||
          'Ram Mandir Chauraha',
        pincode: defaultAccountAddress.pincode || '476229',
        addressLabel: defaultAccountAddress.label || 'Home',
      });
    }
  }, [defaultAccountAddress]);

  // Loading & feedback states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Orders Search, Filter, Sort, Timeframe & Expanded state
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [orderTimeframe, setOrderTimeframe] = useState<'all' | '30days' | '6months' | 'this_year'>('all');
  const [orderSortBy, setOrderSortBy] = useState<'newest' | 'oldest' | 'highest_amount' | 'lowest_amount'>('newest');
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Modals for Orders
  const [trackingOrder, setTrackingOrder] = useState<OrderData | null>(null);
  // Mobile profile navigation view: menu vs active sub-tab
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      return parts.length <= 1;
    }
    return false;
  });
  const [invoiceOrder, setInvoiceOrder] = useState<OrderData | null>(null);
  const [ratingOrderData, setRatingOrderData] = useState<OrderData | null>(null);
  const [userRating, setUserRating] = useState<number>(5);
  const [ratingReview, setRatingReview] = useState<string>('');
  const [selectedRatingTags, setSelectedRatingTags] = useState<string[]>([]);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of mind / placed by mistake');

  // Report Issue / Need Help Modal for Orders
  const [issueOrder, setIssueOrder] = useState<OrderData | null>(null);
  const [issueType, setIssueType] = useState<string>('Damaged / Spoiled Items');
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [selectedIssueItems, setSelectedIssueItems] = useState<string[]>([]);

  // Address Modal State
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<AddressItem | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Address Form State
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    receiver_name: '',
    receiver_phone: '',
    line1: '',
    line2: '',
    landmark: '',
    city: 'Sabalgarh',
    state: 'Madhya Pradesh',
    pincode: '476229',
    delivery_instructions: [] as string[],
    is_default: false,
  });

  // Wallet Topup State
  const [topupAmount, setTopupAmount] = useState<number>(250);

  // Coupon Test State
  const [couponTestCode, setCouponTestCode] = useState('');
  const [couponResult, setCouponResult] = useState<{ success: boolean; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Settings Form State for Left Sidebar Preview - Initialized from localStorage to eliminate flicker
  const [settingsForm, setSettingsForm] = useState(() => {
    let savedSettings: any = null;
    try {
      const s = localStorage.getItem('freshmart_customer_settings');
      if (s) savedSettings = JSON.parse(s);
    } catch (e) {}

    const av =
      savedSettings?.avatar && !savedSettings.avatar.includes('photo-1535713875002')
        ? savedSettings.avatar
        : DEFAULT_AVATAR;

    return {
      name: savedSettings?.name || 'Diya Patel',
      email: savedSettings?.email || 'diya.patel@example.com',
      phone: savedSettings?.phone || '9657989989',
      gender: savedSettings?.gender || 'female',
      dob: savedSettings?.dob || '1996-08-15',
      alternatePhone: savedSettings?.alternatePhone || '+91 98112 34567',
      avatar: av,
    };
  });

  // Hidden File Input Ref for 1-Click Upload from Sidebar or Mobile Header
  const sidebarFileInputRef = useRef<HTMLInputElement>(null);

  // Handle direct 1-click photo upload from Left Sidebar / Mobile Header
  const handleSidebarAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('Image size should be under 15MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawDataUrl = event.target?.result as string;
        if (!rawDataUrl) return;

        // Compress and optimize to lightweight 400x400 avatar
        const compressedDataUrl = await compressAvatar(rawDataUrl, 400, 0.88);

        // 1. Instantly update ProfilePage state (both sidebar and settings hero sync)
        setSettingsForm((prev) => ({ ...prev, avatar: compressedDataUrl }));
        setProfile((prev) => (prev ? { ...prev, avatar: compressedDataUrl } : null));

        // 2. Instantly save to LocalStorage
        try {
          const saved = localStorage.getItem('freshmart_customer_settings');
          const parsed = saved ? JSON.parse(saved) : {};
          parsed.avatar = compressedDataUrl;
          localStorage.setItem('freshmart_customer_settings', JSON.stringify(parsed));
        } catch (err) {}

        // 3. Persist in MongoDB database
        await updateProfile({ avatar: compressedDataUrl });
        showToast('Profile photo updated & saved to database! 📸');
      } catch (err) {
        console.error('Failed to update avatar in DB:', err);
        showToast('Profile photo updated locally! 📸');
      } finally {
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  // Support Ticket Form
  const [newTicketForm, setNewTicketForm] = useState({
    category: 'Order Issue',
    order_number: '',
    subject: '',
    message: '',
  });
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  // FAQ Accordion
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Logout confirm modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial load from backend (with rich fallback)
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [profileData, ordersData, addressesData, walletData, couponsData, ticketsData] = await Promise.all([
        fetchProfile().catch(() => null),
        fetchOrders().catch(() => []),
        fetchAddresses().catch(() => []),
        fetchWallet().catch(() => null),
        fetchCoupons().catch(() => []),
        fetchSupportTickets().catch(() => []),
      ]);

      let localSettings: any = null;
      try {
        const saved = localStorage.getItem('freshmart_customer_settings');
        if (saved) localSettings = JSON.parse(saved);
      } catch (e) {}

      const resolvedAvatar =
        (profileData?.avatar && !profileData.avatar.includes('photo-1535713875002') ? profileData.avatar : null) ||
        (localSettings?.avatar && !localSettings.avatar.includes('photo-1535713875002') ? localSettings.avatar : null) ||
        DEFAULT_AVATAR;

      if (profileData || localSettings) {
        if (profileData) {
          setProfile({ ...profileData, avatar: resolvedAvatar });
        }
        setSettingsForm((prev) => ({
          ...prev,
          name: profileData?.name || localSettings?.name || prev.name,
          email: profileData?.email || localSettings?.email || prev.email,
          phone: profileData?.phone || localSettings?.phone || prev.phone,
          avatar: resolvedAvatar,
          gender: profileData?.gender || localSettings?.gender || prev.gender,
          dob: profileData?.dob || localSettings?.dob || prev.dob,
          alternatePhone: profileData?.alternate_phone || localSettings?.alternatePhone || prev.alternatePhone,
        }));

        // Keep local storage fresh with resolved avatar so it never disappears on reload
        try {
          const toStore = {
            ...(localSettings || {}),
            avatar: resolvedAvatar,
            name: profileData?.name || localSettings?.name || 'Diya Patel',
            phone: profileData?.phone || localSettings?.phone || '9657989989',
            email: profileData?.email || localSettings?.email || 'diya.patel@example.com',
          };
          localStorage.setItem('freshmart_customer_settings', JSON.stringify(toStore));
        } catch (e) {}
      }
      let localPlacedOrders: OrderData[] = [];
      try {
        const stored = localStorage.getItem('freshmart_placed_orders');
        if (stored) localPlacedOrders = JSON.parse(stored);
      } catch (e) {}

      // Combine local placed orders with backend orders, prioritizing freshly placed ones
      const mergedOrders: OrderData[] = [...localPlacedOrders];
      for (const bo of (ordersData || [])) {
        if (bo.order_number === 'TESTORD-001') {
          bo.placed_at = new Date().toISOString();
        }
        if (!mergedOrders.some((m) => m.order_number === bo.order_number || (m._id && m._id === bo._id))) {
          mergedOrders.push(bo);
        }
      }
      const finalOrders = (mergedOrders.length > 0 ? mergedOrders : FALLBACK_ORDERS).filter(
        (o) => o.status !== 'cancelled' && o.status !== 'returned'
      );
      setOrders(finalOrders);
      setAddresses(addressesData);
      setWallet(walletData);
      setCoupons(couponsData);
      setTickets(ticketsData);
    } catch (err) {
      console.error('Failed to load profile data:', err);
      let localPlacedOrders: OrderData[] = [];
      try {
        const stored = localStorage.getItem('freshmart_placed_orders');
        if (stored) localPlacedOrders = JSON.parse(stored);
      } catch (e) {}
      const fallbackList = localPlacedOrders.length > 0 ? [...localPlacedOrders, ...FALLBACK_ORDERS] : FALLBACK_ORDERS;
      setOrders(fallbackList.filter((o) => o.status !== 'cancelled' && o.status !== 'returned'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Auto-sync active tracking order status with backend
  useEffect(() => {
    if (!trackingOrder) return;
    const interval = setInterval(async () => {
      try {
        const freshOrders = await fetchOrders().catch(() => []);
        setOrders(freshOrders);
        const targetId = trackingOrder._id || trackingOrder.id;
        const fresh = freshOrders.find((o) => (o._id || o.id) === targetId);
        if (fresh && fresh.status !== trackingOrder.status) {
          setTrackingOrder(fresh);
        }
      } catch {
        // silent fail
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [trackingOrder]);

  useEffect(() => {
    const handlePopState = () => {
      const parts = window.location.pathname.split('/').filter(Boolean);
      if (parts[0] === 'profile') {
        if (parts[1]) {
          setMobileMenuOpen(false);
          setProfileTab(parts[1] as ProfileTabType);
        } else {
          setMobileMenuOpen(true);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tab: ProfileTabType) => {
    setProfileTab(tab);
    setTrackingOrder(null);
    setMobileMenuOpen(false);
    window.history.pushState({}, '', `/profile/${tab}`);
  };

  const handleBack = () => {
    if (trackingOrder) {
      setTrackingOrder(null);
      return;
    }
    if (!mobileMenuOpen) {
      setMobileMenuOpen(true);
      window.history.pushState({}, '', '/profile');
    } else {
      navigate('home');
    }
  };

  // Toggle expanded order items
  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // Copy Order ID with checkmark feedback
  const handleCopyOrderId = (orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber);
    setCopiedOrderId(orderNumber);
    showToast(`Order #${orderNumber} copied to clipboard!`);
    setTimeout(() => setCopiedOrderId(null), 2500);
  };

  // 1. ORDER ACTIONS
  // Add single order item to active cart
  const handleAddOrderItemToCart = (item: OrderItemData) => {
    const dummyVariant: ProductVariant = {
      id: item.variant_id || `var-${item._id || item.product_name}`,
      product_id: item.product_id || item._id || 'p-gen',
      quantity: item.variant_label || 'Standard Pack',
      price: item.unit_price,
      original_price: Math.round(item.unit_price * 1.15),
      discount: Math.round(item.unit_price * 0.15),
      stock: 99,
      is_available: true,
      created_at: new Date().toISOString(),
    };

    const dummyProduct: ProductWithVariants = {
      id: item.product_id || item._id || 'p-gen',
      brand_id: 'b1',
      category_id: 'c1',
      subcategory_id: 's1',
      name: item.product_name,
      slug: item.product_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: item.product_name,
      image: item.image || null,
      is_available: true,
      tags: [],
      created_at: new Date().toISOString(),
      variants: [dummyVariant],
    };

    addToCart(dummyProduct, dummyVariant);
    showToast(`Added "${item.product_name}" to your cart! 🛒`);
  };

  // Add all items in an order to cart
  const handleAddAllOrderItemsToCart = (order: OrderData) => {
    if (!order.items || order.items.length === 0) return;
    order.items.forEach((item) => {
      const dummyVariant: ProductVariant = {
        id: item.variant_id || `var-${item._id || item.product_name}`,
        product_id: item.product_id || item._id || 'p-gen',
        quantity: item.variant_label || 'Standard Pack',
        price: item.unit_price,
        original_price: Math.round(item.unit_price * 1.15),
        discount: Math.round(item.unit_price * 0.15),
        stock: 99,
        is_available: true,
        created_at: new Date().toISOString(),
      };

      const dummyProduct: ProductWithVariants = {
        id: item.product_id || item._id || 'p-gen',
        brand_id: 'b1',
        category_id: 'c1',
        subcategory_id: 's1',
        name: item.product_name,
        slug: item.product_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: item.product_name,
        image: item.image || null,
        is_available: true,
        tags: [],
        created_at: new Date().toISOString(),
        variants: [dummyVariant],
      };

      addToCart(dummyProduct, dummyVariant);
    });
    showToast(`All ${order.items.length} items from #${order.order_number} added to cart! 🛒`);
  };

  const handleReorder = (order: OrderData) => {
    if (!order.items || order.items.length === 0) {
      showToast('No items found in this order to reorder', 'error');
      return;
    }

    const cartItems = order.items.map((item) => {
      const dummyVariant: ProductVariant = {
        id: item.variant_id || `var-${item._id || item.product_name}`,
        product_id: item.product_id || item._id || 'p-gen',
        quantity: item.variant_label || 'Standard Pack',
        price: item.unit_price,
        original_price: Math.round(item.unit_price * 1.15),
        discount: Math.round(item.unit_price * 0.15),
        stock: 99,
        is_available: true,
        created_at: new Date().toISOString(),
      };

      const dummyProduct: ProductWithVariants = {
        id: item.product_id || item._id || 'p-gen',
        brand_id: 'b1',
        category_id: 'c1',
        subcategory_id: 's1',
        name: item.product_name,
        slug: item.product_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: item.product_name,
        image: item.image || null,
        is_available: true,
        tags: [],
        created_at: new Date().toISOString(),
        variants: [dummyVariant],
      };

      return {
        product: dummyProduct,
        variant: dummyVariant,
        quantity: item.quantity || 1,
      };
    });

    // 1. Pre-select all products in cart
    setCart(cartItems);

    // 2. Instruct CartPage to open directly on Cash on Delivery step
    try {
      sessionStorage.setItem('freshmart_checkout_step', 'payment');
    } catch {}

    showToast(`Reordering ${order.items.length} item(s)! Redirecting to Cash on Delivery... ⚡`);

    // 3. Navigate to Cart / COD page
    navigate('cart');
  };

  const handleCancelOrder = async () => {
    if (!cancellingOrderId) return;
    setActionLoading(true);
    try {
      const res = await cancelOrder(cancellingOrderId, cancelReason);
      showToast(res.message || 'Order cancelled successfully. Since this was Cash on Delivery, no payment was charged.');
      setCancellingOrderId(null);
      const updatedOrders = await fetchOrders().catch(() => []);
      if (updatedOrders.length > 0) {
        setOrders(updatedOrders);
      } else {
        setOrders((prev) =>
          prev.map((o) =>
            (o._id || o.id) === cancellingOrderId
              ? { ...o, status: 'cancelled', notes: `Cancelled: ${cancelReason}`, payment_status: 'cancelled', delivery_eta: 'Cancelled' }
              : o
          )
        );
      }
      const p = await fetchProfile().catch(() => null);
      if (p) setProfile(p);
    } catch (err: any) {
      // Optimistic cancel
      setOrders((prev) =>
        prev.map((o) =>
          (o._id || o.id) === cancellingOrderId
            ? { ...o, status: 'cancelled', notes: `Cancelled: ${cancelReason}`, payment_status: 'cancelled', delivery_eta: 'Cancelled' }
            : o
        )
      );
      setCancellingOrderId(null);
      showToast('Order cancelled. Since this was Cash on Delivery, no payment was charged.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintInvoice = (order: OrderData) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    const customerName = profile?.name || (order as any).customer_name || 'Aarav Sharma';
    const customerPhone = profile?.phone || (order as any).customer_phone || '+91 99066 72945';
    const addr = order.delivery_address;
    const addressLine = addr
      ? `${addr.line1 || ''}${addr.city ? `, ${addr.city}` : ''}${addr.pincode ? ` - ${addr.pincode}` : ''}`
      : 'Fatehchand colony, ward no 5, near ram mandir chauraha, sabalgarh, Morena, madhya pradesh - 476229, India';
    const orderDate = formatOrderDateTime(getOrderPlacedAt(order));

    const itemsRows = (order.items || [])
      .map(
        (it, idx) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">${idx + 1}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #111827;">
            ${it.product_name}
            ${it.variant_label ? `<div style="font-size: 11px; color: #9ca3af; font-weight: normal;">${it.variant_label}</div>` : ''}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; text-align: center; color: #374151; font-weight: 600;">${it.quantity}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; text-align: right; color: #374151;">₹${it.unit_price}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; text-align: right; font-weight: bold; color: #111827;">₹${it.line_total}</td>
        </tr>`
      )
      .join('');

    const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice #${order.order_number}</title>
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
    body { margin: 0; padding: 32px; color: #1f2937; background: #fff; }
    .top-bar { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #10b981; }
    .brand-box { display: flex; align-items: center; gap: 8px; }
    .logo-badge { background: #059669; color: #fff; font-weight: 900; font-size: 14px; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.5px; }
    .brand-name { font-size: 13px; font-weight: 700; color: #4b5563; }
    .store-address { font-size: 12px; color: #6b7280; margin-top: 6px; line-height: 1.5; }
    .meta-box { text-align: right; }
    .inv-title { font-size: 18px; font-weight: 900; color: #111827; }
    .order-ref { font-size: 13px; font-weight: 700; color: #374151; margin-top: 4px; }
    .order-date { font-size: 12px; color: #6b7280; margin-top: 3px; }
    .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px 18px; margin: 20px 0; display: flex; justify-content: space-between; font-size: 12px; }
    .card-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #9ca3af; margin-bottom: 4px; }
    .cust-name { font-size: 14px; font-weight: 800; color: #111827; }
    .cust-line { color: #4b5563; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    th { background: #f3f4f6; color: #4b5563; text-transform: uppercase; font-size: 11px; font-weight: 800; padding: 10px 12px; text-align: left; }
    .totals-box { margin-top: 20px; margin-left: auto; width: 280px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px 18px; }
    .total-line { display: flex; justify-content: space-between; font-size: 13px; color: #4b5563; padding: 4px 0; }
    .grand { border-top: 2px solid #e5e7eb; margin-top: 8px; padding-top: 10px; font-size: 16px; font-weight: 900; color: #111827; }
    .grand .val { color: #059669; }
    .footer { margin-top: 36px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
    @media print {
      body { padding: 16px; }
      @page { margin: 12mm; }
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <div>
      <div class="brand-box">
        <img src="${window.location.origin}/agrawal-logo.png" alt="Agrawal General & Provisional Store" style="height: 48px; max-width: 260px; object-fit: contain;" />
      </div>
      <div class="store-address">
        Fatehchand colony, ward no 5, near ram mandir chauraha, sabalgarh, Morena, madhya pradesh - 476229, India<br/>
        Orders & Support: +91 9285108057
      </div>
    </div>
    <div class="meta-box">
      <div class="inv-title">Tax Invoice</div>
      <div class="order-ref">Order #${order.order_number}</div>
      <div class="order-date">Date & Time: <strong>${orderDate}</strong></div>
    </div>
  </div>

  <div class="card">
    <div>
      <div class="card-title">Billed & Delivered To:</div>
      <div class="cust-name">${customerName}</div>
      <div class="cust-line">${addressLine}</div>
      <div class="cust-line">Phone: ${customerPhone}</div>
    </div>
    <div style="text-align: right;">
      <div class="card-title">Payment Mode:</div>
      <div style="font-size: 13px; font-weight: 800; color: #059669;">Cash on Delivery (COD)</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px;">#</th>
        <th>Item Description</th>
        <th style="text-align: center; width: 60px;">Qty</th>
        <th style="text-align: right; width: 90px;">Unit Price</th>
        <th style="text-align: right; width: 100px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows || '<tr><td colspan="5" style="text-align: center; padding: 16px; color: #9ca3af;">No items</td></tr>'}
    </tbody>
  </table>

  <div class="totals-box">
    <div class="total-line">
      <span>Items Subtotal</span>
      <span style="font-weight: 700; color: #111827;">₹${order.subtotal || order.total}</span>
    </div>
    ${order.discount ? `<div class="total-line" style="color: #059669;"><span>Discount</span><span>-₹${order.discount}</span></div>` : ''}
    <div class="total-line grand">
      <span>Total Amount</span>
      <span class="val">₹${order.total}</span>
    </div>
  </div>

  <div class="footer">
    Thank you for shopping with Agrawal General & Provisional Store!
  </div>
</body>
</html>`;

    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try {
          printWindow.print();
        } catch {}
      }, 300);
    } else {
      window.print();
    }
  };

  const openRateModal = (order: OrderData) => {
    setRatingOrderData(order);
    setUserRating(order.rating || 5);
    setRatingReview(order.rating_review || '');
    setSelectedRatingTags(order.rating_tags || ['Superfast Delivery ⚡', 'Fresh Groceries 🥦']);
  };

  const toggleRatingTag = (tag: string) => {
    if (selectedRatingTags.includes(tag)) {
      setSelectedRatingTags(selectedRatingTags.filter((t) => t !== tag));
    } else {
      setSelectedRatingTags([...selectedRatingTags, tag]);
    }
  };

  const handleSubmitRating = async () => {
    if (!ratingOrderData) return;
    const targetId = ratingOrderData._id || ratingOrderData.id || '';
    setActionLoading(true);
    try {
      await rateOrder(targetId, userRating, ratingReview, selectedRatingTags);
      showToast('Thank you! Your delivery & grocery rating is recorded.');
      setRatingOrderData(null);
      const updated = await fetchOrders().catch(() => []);
      if (updated.length > 0) {
        setOrders(updated);
      } else {
        setOrders((prev) =>
          prev.map((o) =>
            (o._id || o.id) === targetId
              ? { ...o, rating: userRating, rating_review: ratingReview, rating_tags: selectedRatingTags }
              : o
          )
        );
      }
    } catch (err: any) {
      setOrders((prev) =>
        prev.map((o) =>
          (o._id || o.id) === targetId
            ? { ...o, rating: userRating, rating_review: ratingReview, rating_tags: selectedRatingTags }
            : o
        )
      );
      setRatingOrderData(null);
      showToast('Rating saved successfully!');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Issue Report Modal for Order
  const handleOpenReportIssue = (order: OrderData) => {
    setIssueOrder(order);
    setIssueType('Damaged / Spoiled Items');
    setIssueDescription('');
    setSelectedIssueItems(order.items?.map((i) => i.product_name) || []);
  };

  const toggleIssueItem = (productName: string) => {
    if (selectedIssueItems.includes(productName)) {
      setSelectedIssueItems(selectedIssueItems.filter((i) => i !== productName));
    } else {
      setSelectedIssueItems([...selectedIssueItems, productName]);
    }
  };

  const handleSubmitReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueOrder) return;
    setActionLoading(true);
    try {
      await createSupportTicket({
        category: 'Order Issue',
        order_number: issueOrder.order_number,
        subject: `[${issueType}] Order #${issueOrder.order_number}`,
        message: `Issue reported: ${issueType}. Affected items: ${selectedIssueItems.join(', ') || 'All items'}. Details: ${
          issueDescription || 'Quick resolution requested'
        }. Priority replacement / Fresh Cash wallet credit requested.`,
      });
      showToast(`Ticket raised for Order #${issueOrder.order_number}! Priority resolution assigned.`);
      setIssueOrder(null);
      const t = await fetchSupportTickets().catch(() => []);
      if (t.length > 0) setTickets(t);
    } catch (err: any) {
      showToast(`Report logged for #${issueOrder.order_number}! Agent assigned.`);
      setIssueOrder(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleHelpWithOrder = (orderNumber: string) => {
    const o = orders.find((ord) => ord.order_number === orderNumber);
    if (o) {
      handleOpenReportIssue(o);
    } else {
      showToast(`For assistance with Order #${orderNumber}, call us at +91 9285108057`);
    }
  };

  // 2. ADDRESS ACTIONS
  const openAddAddressModal = () => {
    setEditingAddress(null);
    setAddressForm({
      label: 'Home',
      receiver_name: profile?.name || 'Aarav Sharma',
      receiver_phone: profile?.phone || '9906672945',
      line1: '',
      line2: '',
      landmark: '',
      city: 'Sabalgarh',
      state: 'Madhya Pradesh',
      pincode: '476229',
      delivery_instructions: ['Leave at door 🚪'],
      is_default: addresses.length === 0,
    });
    setAddressModalOpen(true);
  };

  const openEditAddressModal = (addr: AddressItem) => {
    setEditingAddress(addr);
    setAddressForm({
      label: addr.label,
      receiver_name: addr.receiver_name || profile?.name || 'Aarav Sharma',
      receiver_phone: addr.receiver_phone || profile?.phone || '9906672945',
      line1: addr.line1,
      line2: addr.line2 || '',
      landmark: addr.landmark || '',
      city: addr.city,
      state: addr.state || 'Madhya Pradesh',
      pincode: addr.pincode,
      delivery_instructions: addr.delivery_instructions || [],
      is_default: addr.is_default,
    });
    setAddressModalOpen(true);
  };

  const handleDetectGPS = () => {
    setDetectingLocation(true);
    setTimeout(() => {
      setDetectingLocation(false);
      setAddressForm((prev) => ({
        ...prev,
        city: 'Sabalgarh',
        state: 'Madhya Pradesh',
        pincode: '476229',
        landmark: 'Near Ram Mandir Chauraha',
        line1: prev.line1 || 'Fatehchand colony, ward no 5',
        line2: 'Ward No 5',
      }));
      showToast('📍 GPS location detected: Ram Mandir Chauraha, Sabalgarh');
    }, 700);
  };

  const toggleInstruction = (tag: string) => {
    if (addressForm.delivery_instructions.includes(tag)) {
      setAddressForm({
        ...addressForm,
        delivery_instructions: addressForm.delivery_instructions.filter((t) => t !== tag),
      });
    } else {
      setAddressForm({
        ...addressForm,
        delivery_instructions: [...addressForm.delivery_instructions, tag],
      });
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.line1 || !addressForm.city || !addressForm.pincode) {
      showToast('Please fill all required address fields', 'error');
      return;
    }
    setActionLoading(true);
    try {
      if (editingAddress) {
        await updateAddress(editingAddress._id, addressForm);
        showToast('Address updated successfully');
      } else {
        await addAddress(addressForm);
        showToast('New delivery address saved successfully');
      }
      setAddressModalOpen(false);
      const addrs = await fetchAddresses();
      setAddresses(addrs);
      const p = await fetchProfile();
      setProfile(p);
    } catch (err: any) {
      showToast(err.message || 'Failed to save address', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDeleteAddress = async () => {
    if (!deletingAddress) return;
    setActionLoading(true);
    try {
      await deleteAddress(deletingAddress._id);
      showToast('Address removed from your account');
      setDeletingAddress(null);
      const addrs = await fetchAddresses();
      setAddresses(addrs);
      const p = await fetchProfile();
      setProfile(p);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete address', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    setActionLoading(true);
    try {
      await setDefaultAddress(id);
      showToast('Primary delivery location updated!');
      const addrs = await fetchAddresses();
      setAddresses(addrs);
    } catch (err: any) {
      showToast(err.message || 'Failed to update default address', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShareAddress = (addr: AddressItem) => {
    const formatted = `${addr.label}: ${addr.line1}, ${addr.line2 ? addr.line2 + ', ' : ''}${addr.city} - ${addr.pincode} (Ph: ${addr.receiver_phone || profile?.phone})`;
    navigator.clipboard.writeText(formatted);
    showToast('Address details copied to clipboard!');
  };

  // 3. WALLET ACTIONS
  const handleTopup = async () => {
    if (topupAmount <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await topupWallet(topupAmount);
      showToast(res.message || `₹${topupAmount} added to Fresh Cash!`);
      const w = await fetchWallet();
      setWallet(w);
      const p = await fetchProfile();
      setProfile(p);
    } catch (err: any) {
      showToast(err.message || 'Failed to top up wallet', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. COUPON ACTIONS
  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Code "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleTestCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponTestCode) return;
    setActionLoading(true);
    try {
      const res = await applyCoupon(couponTestCode, 500);
      setCouponResult({ success: true, text: res.message });
      showToast(res.message);
    } catch (err: any) {
      setCouponResult({ success: false, text: err.message || 'Invalid coupon code' });
      showToast(err.message || 'Invalid coupon', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. SUPPORT TICKET ACTIONS
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketForm.subject || !newTicketForm.message) {
      showToast('Subject and message are required', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await createSupportTicket(newTicketForm);
      showToast('Support ticket raised! Live agent assigned.');
      setNewTicketForm({
        category: 'Order Issue',
        order_number: '',
        subject: '',
        message: '',
      });
      const t = await fetchSupportTickets();
      setTickets(t);
      setActiveTicketId(res._id);
    } catch (err: any) {
      showToast(err.message || 'Failed to raise ticket', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendTicketReply = async (ticketId: string) => {
    if (!ticketReplyText.trim()) return;
    setActionLoading(true);
    try {
      await replySupportTicket(ticketId, ticketReplyText.trim());
      setTicketReplyText('');
      showToast('Reply sent');
      const t = await fetchSupportTickets();
      setTickets(t);
    } catch (err: any) {
      showToast(err.message || 'Failed to send reply', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 7. LOGOUT
  const handleLogout = async () => {
    try {
      await logoutCustomer();
      showToast('Logged out safely');
      setShowLogoutModal(false);
      navigate('home');
    } catch (e) {
      navigate('home');
    }
  };

  // Computed metrics for Orders
  const activeOrdersCount = orders.filter((o) =>
    ['pending', 'confirmed', 'packed', 'out_for_delivery'].includes(o.status)
  ).length;

  const deliveredOrdersCount = orders.filter((o) => o.status === 'delivered').length;

  const totalSpent = orders.reduce((sum, o) => (o.status !== 'cancelled' ? sum + o.total : sum), 0);
  const totalSavings = orders.reduce(
    (sum, o) => (o.status !== 'cancelled' ? sum + (o.discount || 0) + 25 : sum),
    0
  );

  // Frequently ordered essentials (Buy Again Shelf)
  const buyAgainItems = useMemo(() => {
    const seen = new Set<string>();
    const items: OrderItemData[] = [];
    for (const o of orders) {
      if (o.status !== 'cancelled') {
        for (const it of o.items || []) {
          const key = it.product_name.toLowerCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            items.push(it);
          }
        }
      }
    }
    return items.slice(0, 10);
  }, [orders]);

  // Filtered & Sorted orders
  const filteredOrders = orders
    .filter((o) => {
      if (o.status === 'cancelled' || o.status === 'returned') return false;
      if (orderFilter === 'active') return ['pending', 'confirmed', 'packed', 'out_for_delivery'].includes(o.status);
      if (orderFilter === 'completed') return o.status === 'delivered';
      return true;
    })
    .filter((o) => {
      if (orderTimeframe === 'all') return true;
      const placedTime = new Date(o.placed_at).getTime();
      const now = Date.now();
      if (orderTimeframe === '30days') return now - placedTime <= 30 * 24 * 3600 * 1000;
      if (orderTimeframe === '6months') return now - placedTime <= 180 * 24 * 3600 * 1000;
      if (orderTimeframe === 'this_year') return new Date(o.placed_at).getFullYear() === new Date().getFullYear();
      return true;
    })
    .filter((o) => {
      if (!orderSearch.trim()) return true;
      const q = orderSearch.toLowerCase().replace(/^#/, '');
      const matchNumber = o.order_number.toLowerCase().includes(q);
      const matchItem = o.items?.some((it) => it.product_name.toLowerCase().includes(q));
      const matchVariant = o.items?.some((it) => it.variant_label?.toLowerCase().includes(q));
      const matchAddress =
        o.delivery_address?.line1?.toLowerCase().includes(q) ||
        o.delivery_address?.city?.toLowerCase().includes(q) ||
        o.delivery_address?.pincode?.includes(q);
      return matchNumber || matchItem || matchVariant || matchAddress;
    })
    .sort((a, b) => {
      if (orderSortBy === 'oldest') {
        return new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime();
      }
      if (orderSortBy === 'highest_amount') {
        return b.total - a.total;
      }
      if (orderSortBy === 'lowest_amount') {
        return a.total - b.total;
      }
      return new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime();
    });

  const defaultAddr = addresses.find((a) => a.is_default);

  const navItems = [
    {
      id: 'orders' as ProfileTabType,
      label: 'Your Orders',
      subtitle: 'Track active orders & reorder past items',
      icon: Package,
      badge: activeOrdersCount > 0 ? `${activeOrdersCount} Active` : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800',
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'addresses' as ProfileTabType,
      label: 'Saved Addresses',
      subtitle: 'Home, work & delivery instructions',
      icon: MapPin,
      badge: addresses.length > 0 ? `${addresses.length} Saved` : undefined,
      badgeColor: 'bg-blue-50 text-blue-700',
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      id: 'settings' as ProfileTabType,
      label: 'Profile & Settings',
      subtitle: 'Personal info, phone, email & security',
      icon: Settings,
      badge: undefined,
      badgeColor: '',
      iconBg: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#F6F8FA] flex flex-col font-sans text-neutral-800 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-bounce">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-rose-600 text-white border-rose-700'
            }`}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {toastMessage.text}
          </div>
        </div>
      )}

      {/* TOP BAR: Clean edge-to-edge navbar */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-neutral-200/90 shadow-2xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Mobile view header: Back button + Title on Left, Delivery Address + Cart on Right */}
          <div className="flex sm:hidden items-center justify-between w-full gap-1.5 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 shrink-0">
              <button
                type="button"
                onClick={handleBack}
                className="w-8 h-8 -ml-1 rounded-xl flex items-center justify-center text-neutral-700 hover:bg-neutral-100 active:scale-95 transition-all shrink-0"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-sm font-extrabold text-neutral-900 truncate max-w-[85px]">
                {mobileMenuOpen
                  ? 'Account'
                  : currentTab === 'orders'
                  ? (trackingOrder ? 'Track' : 'Orders')
                  : currentTab === 'addresses'
                  ? 'Addresses'
                  : currentTab === 'wallet'
                  ? 'Wallet'
                  : currentTab === 'coupons'
                  ? 'Coupons'
                  : 'Settings'}
              </h1>
            </div>

            {/* Delivery address button + Cart icon matching exactly user screenshot */}
            <div className="flex items-center gap-2 min-w-0 justify-end flex-1">
              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="flex items-center gap-1.5 min-w-0 text-left hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                title="Change delivery location"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <MapPin size={14} className="text-emerald-700" />
                </div>
                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-0.5">
                    <span className="text-[10px] text-neutral-500 font-medium leading-none">Deliver to</span>
                    <ChevronDown size={11} className="text-neutral-400" />
                  </div>
                  <span className="text-xs font-bold text-neutral-800 block truncate max-w-[100px] sm:max-w-[130px]">
                    {activeDisplayAddress}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('cart')}
                className="relative w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors active:scale-95 shrink-0"
                aria-label="Cart"
              >
                <ShoppingCart size={17} className="text-neutral-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Desktop view header brand + back */}
          <div className="hidden sm:flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-neutral-700 hover:text-emerald-600 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-emerald-50 group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>{!mobileMenuOpen ? 'Back to Menu' : 'Back to Store'}</span>
            </button>
            <div className="h-4 w-px bg-neutral-200" />
            <div className="flex items-center cursor-pointer" onClick={() => navigate('home')}>
              <img
                src="/agrawal_log.png"
                alt="Agrawal General & Provisional Store"
                className="h-10 sm:h-11 w-auto max-w-[200px] sm:max-w-[230px] object-contain"
              />
            </div>
          </div>

          {/* Desktop Right side: Deliver to + Quick Cart */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setLocationModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-200 text-left cursor-pointer"
              title="Change delivery location"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <MapPin size={15} className="text-emerald-700" />
              </div>
              <div className="text-left">
                <p className="text-[11px] text-neutral-500 font-medium leading-none">Deliver to</p>
                <p className="text-xs font-bold text-neutral-800 flex items-center gap-1 mt-0.5">
                  <span className="truncate max-w-[140px]">{activeDisplayAddress}</span>
                  <ChevronDown size={12} className="text-neutral-400" />
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('cart')}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition-colors border border-emerald-200/60 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER: Centered max-w-6xl with Responsive Layout */}
      <div className="max-w-6xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-7 flex-1">
        {/* Hidden input for 1-click photo upload anywhere from sidebar or header */}
        <input
          type="file"
          ref={sidebarFileInputRef}
          onChange={handleSidebarAvatarUpload}
          accept="image/*"
          className="hidden"
        />

        {/* MOBILE ACCOUNT MENU: Rendered exclusively on mobile when mobileMenuOpen is true */}
        {mobileMenuOpen && (
          <div className="lg:hidden space-y-3.5 w-full pb-8 animate-in fade-in duration-200">
            {/* User Profile Card */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4">
              <div className="flex items-center gap-3.5">
                <div
                  onClick={() => sidebarFileInputRef.current?.click()}
                  className="relative shrink-0 group cursor-pointer"
                  title="Click to choose photo from device"
                >
                  <img
                    src={settingsForm.avatar || DEFAULT_AVATAR}
                    alt="Avatar"
                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/30 shadow-xs group-hover:brightness-95 transition-all bg-white"
                  />
                  <div className="absolute inset-0 rounded-full bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-neutral-900 group-hover:bg-emerald-600 text-white shadow-xs border border-white transition-colors">
                    <Camera className="w-3 h-3" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-extrabold text-neutral-900 truncate">
                    {settingsForm.name || profile?.name || 'Diya Patel'}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{settingsForm.phone || profile?.phone || '985798989'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{settingsForm.email || profile?.email || 'diya.patel@example.com'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange('settings')}
                  className="self-center p-2 rounded-xl text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 transition-colors"
                  title="Edit Profile"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            </div>

            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleTabChange('orders')}
                className="bg-white p-3 rounded-2xl border border-neutral-200/90 shadow-2xs flex flex-col items-center text-center hover:border-emerald-300 active:scale-95 transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                  <Package className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-neutral-900">Orders</span>
                <span className="text-[10px] font-semibold text-emerald-600">
                  {activeOrdersCount > 0 ? `${activeOrdersCount} Active` : `${orders.length} Total`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('addresses')}
                className="bg-white p-3 rounded-2xl border border-neutral-200/90 shadow-2xs flex flex-col items-center text-center hover:border-blue-300 active:scale-95 transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-neutral-900">Addresses</span>
                <span className="text-[10px] font-semibold text-neutral-500">
                  {addresses.length} Saved
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('settings')}
                className="bg-white p-3 rounded-2xl border border-neutral-200/90 shadow-2xs flex flex-col items-center text-center hover:border-emerald-300 active:scale-95 transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
                  <Settings className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-neutral-900">Settings</span>
                <span className="text-[10px] font-semibold text-emerald-600">Profile</span>
              </button>
            </div>

            {/* Grouped Menu List */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs divide-y divide-neutral-100 overflow-hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-50 active:bg-neutral-100 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-neutral-900 group-hover:text-emerald-600 transition-colors truncate">
                          {item.label}
                        </p>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {item.badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Log Out Option */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden">
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center justify-between p-3.5 hover:bg-rose-50/60 active:bg-rose-50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-rose-600">Log Out</p>
                    <p className="text-[11px] text-neutral-400">Sign out of your account</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-300 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Version Footer */}
            <div className="text-center pt-2">
              <p className="text-xs font-bold text-neutral-400 tracking-wide">Agrawal General & Provisional Store v2.4.0</p>
              <p className="text-[10.5px] text-neutral-400 mt-0.5">Quick Commerce & Local Store Delivery</p>
            </div>
          </div>
        )}

        <div className={`flex flex-col lg:flex-row gap-6 items-start ${mobileMenuOpen ? 'hidden lg:flex' : 'flex'}`}>
          {/* DESKTOP SIDEBAR: Left sticky navigation */}
          <aside className="hidden lg:block w-72 shrink-0 sticky top-20">
            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-4 sm:p-5 space-y-4">
              {/* User Profile Card */}
              <div className="flex items-center gap-3 pb-3.5 border-b border-neutral-100">
                <div
                  onClick={() => sidebarFileInputRef.current?.click()}
                  className="relative shrink-0 group cursor-pointer"
                  title="Click to choose photo from device"
                >
                  <img
                    src={settingsForm.avatar || DEFAULT_AVATAR}
                    alt="Avatar"
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/30 shadow-2xs group-hover:border-emerald-500 group-hover:brightness-95 transition-all bg-white"
                  />
                  <div className="absolute inset-0 rounded-full bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-neutral-900 group-hover:bg-emerald-600 text-white shadow-xs border border-white transition-colors">
                    <Camera className="w-2.5 h-2.5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-neutral-900 truncate">
                    {settingsForm.name || profile?.name || 'Diya Patel'}
                  </h2>
                  <p className="text-xs text-neutral-500 truncate">{settingsForm.phone || profile?.phone || '985798989'}</p>
                  <p className="text-[11px] text-neutral-400 truncate">{settingsForm.email || profile?.email || 'diya.patel@example.com'}</p>
                </div>
              </div>

              {/* Main Vertical Nav Tabs */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left group ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500 group-hover:text-emerald-600'}`} />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isActive ? 'bg-white/20 text-white' : item.badgeColor
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white/80' : 'text-neutral-400 group-hover:translate-x-0.5 transition-transform'}`} />
                      </div>
                    </button>
                  );
                })}
              </nav>

              {/* Logout Button */}
              <div className="pt-2 border-t border-neutral-100">
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </aside>

          {/* RIGHT CONTENT AREA */}
          <main className="flex-1 min-w-0 w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-neutral-400 bg-white rounded-2xl border border-neutral-200 shadow-xs">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
                <p className="text-sm font-semibold">Connecting with Agrawal Store live backend...</p>
              </div>
            ) : (
              <>
                {/* TAB 1: MY ORDERS & REORDER - AUTHENTIC ZEPTO DESIGN */}
                {currentTab === 'orders' && (
                  trackingOrder ? (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Top Header Card with Back Button */}
                      <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setTrackingOrder(null)}
                            className="w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors shadow-2xs active:scale-95"
                            title="Back to Orders"
                          >
                            <ArrowLeft size={18} />
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <h1 className="text-base sm:text-lg font-bold text-neutral-900">
                                Track Order
                              </h1>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                                #{trackingOrder.order_number}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-400 font-medium mt-0.5">
                              Placed on {formatOrderDateTime(getOrderPlacedAt(trackingOrder))}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setActionLoading(true);
                              const fresh = await fetchOrders().catch(() => []);
                              setOrders(fresh);
                              const targetId = trackingOrder._id || trackingOrder.id;
                              const found = fresh.find((o) => (o._id || o.id) === targetId);
                              if (found) setTrackingOrder(found);
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-xl border border-neutral-200/90 hover:bg-neutral-50 text-neutral-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs active:scale-95"
                        >
                          <RefreshCw size={13} className={actionLoading ? 'animate-spin text-emerald-600' : 'text-neutral-500'} />
                          <span>Refresh</span>
                        </button>
                      </div>

                      {/* 3 Steps Tracker Card: Packed -> On the way -> Delivered */}
                      <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 sm:p-7 shadow-xs">
                        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-6">
                          <div>
                            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                              Live Status
                            </span>
                            <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 mt-0.5">
                              {trackingOrder.status === 'delivered'
                                ? 'Delivered'
                                : trackingOrder.status === 'out_for_delivery'
                                ? 'On the way'
                                : trackingOrder.status === 'packed'
                                ? 'Packed'
                                : trackingOrder.status === 'cancelled' || trackingOrder.status === 'returned'
                                ? 'Order Cancelled'
                                : 'Packing your order'}
                            </h2>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              trackingOrder.status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : trackingOrder.status === 'out_for_delivery'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : trackingOrder.status === 'packed'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : trackingOrder.status === 'cancelled' || trackingOrder.status === 'returned'
                                ? 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {trackingOrder.status === 'delivered'
                              ? 'Delivered'
                              : trackingOrder.status === 'out_for_delivery'
                              ? 'On the way'
                              : trackingOrder.status === 'packed'
                              ? 'Packed'
                              : trackingOrder.status === 'cancelled' || trackingOrder.status === 'returned'
                              ? 'Cancelled'
                              : 'Order Placed'}
                          </span>
                        </div>

                        {/* 3 STEPS ONLY (Packed -> On the way -> Delivered) */}
                        <div className="max-w-md mx-auto py-2">
                          {(() => {
                            const status = trackingOrder.status;

                            // Step 1: Packed
                            const step1Done = ['packed', 'out_for_delivery', 'delivered'].includes(status);
                            const step1Active = ['pending', 'confirmed'].includes(status);

                            // Step 2: On the way
                            const step2Done = status === 'delivered';
                            const step2Active = status === 'out_for_delivery';

                            // Step 3: Delivered
                            const step3Done = status === 'delivered';

                            return (
                              <div className="relative pl-10 space-y-9">
                                {/* Connecting vertical line: Step 1 -> Step 2 */}
                                <div
                                  className={`absolute left-4 top-5 w-0.5 h-16 -translate-x-1/2 transition-colors ${
                                    step1Done ? 'bg-emerald-500' : 'bg-neutral-200'
                                  }`}
                                />
                                {/* Connecting vertical line: Step 2 -> Step 3 */}
                                <div
                                  className={`absolute left-4 top-24 w-0.5 h-16 -translate-x-1/2 transition-colors ${
                                    step2Done ? 'bg-emerald-500' : 'bg-neutral-200'
                                  }`}
                                />

                                {/* 1. PACKED */}
                                <div className="relative flex items-start gap-3.5">
                                  <div
                                    className={`absolute -left-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                      step1Done
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : step1Active
                                        ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-600 animate-pulse'
                                        : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                                    }`}
                                  >
                                    {step1Done ? <Check size={16} strokeWidth={3} /> : '1'}
                                  </div>
                                  <div>
                                    <h3
                                      className={`text-sm sm:text-base font-bold ${
                                        step1Done || step1Active ? 'text-neutral-900' : 'text-neutral-400'
                                      }`}
                                    >
                                      Packed
                                    </h3>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                      {step1Done
                                        ? 'Order packed and sealed'
                                        : step1Active
                                        ? 'Store is packing your items'
                                        : 'Awaiting packing'}
                                    </p>
                                  </div>
                                </div>

                                {/* 2. ON THE WAY */}
                                <div className="relative flex items-start gap-3.5">
                                  <div
                                    className={`absolute -left-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                      step2Done
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : step2Active
                                        ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-600 animate-pulse'
                                        : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                                    }`}
                                  >
                                    {step2Done ? <Check size={16} strokeWidth={3} /> : '2'}
                                  </div>
                                  <div>
                                    <h3
                                      className={`text-sm sm:text-base font-bold ${
                                        step2Done || step2Active ? 'text-neutral-900' : 'text-neutral-400'
                                      }`}
                                    >
                                      On the way
                                    </h3>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                      {step2Done
                                        ? 'Completed'
                                        : step2Active
                                        ? 'Delivery partner is on the way to your address'
                                        : 'Will be dispatched once packed'}
                                    </p>
                                  </div>
                                </div>

                                {/* 3. DELIVERED */}
                                <div className="relative flex items-start gap-3.5">
                                  <div
                                    className={`absolute -left-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                      step3Done
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                                    }`}
                                  >
                                    {step3Done ? <Check size={16} strokeWidth={3} /> : '3'}
                                  </div>
                                  <div>
                                    <h3
                                      className={`text-sm sm:text-base font-bold ${
                                        step3Done ? 'text-neutral-900' : 'text-neutral-400'
                                      }`}
                                    >
                                      Delivered
                                    </h3>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                      {step3Done
                                        ? 'Order delivered successfully'
                                        : 'Pending delivery at doorstep'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Order Items & Address Summary */}
                      <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-xs space-y-4">
                        <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2.5">
                          Items in this Order ({trackingOrder.items?.length || 0})
                        </h3>
                        <div className="space-y-3">
                          {trackingOrder.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=compress&cs=tinysrgb&w=200'}
                                  alt={item.product_name}
                                  className="w-11 h-11 rounded-xl object-contain bg-neutral-50 border border-neutral-100 p-0.5 shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm font-semibold text-neutral-800 truncate">{item.product_name}</p>
                                  <p className="text-[11px] text-neutral-400">{item.variant_label || 'Standard'} • Qty: {item.quantity}</p>
                                </div>
                              </div>
                              <span className="text-xs sm:text-sm font-bold text-neutral-900 shrink-0">₹{item.line_total}</span>
                            </div>
                          ))}
                        </div>

                        {/* Delivery Address & Total */}
                        <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          {trackingOrder.delivery_address && (
                            <div className="flex items-center gap-2 text-neutral-600 min-w-0">
                              <MapPin size={14} className="text-emerald-600 shrink-0" />
                              <span className="truncate">
                                <strong>{trackingOrder.delivery_address?.label || 'Delivered to'}:</strong> {trackingOrder.delivery_address?.line1}
                                {trackingOrder.delivery_address?.city ? `, ${trackingOrder.delivery_address.city}` : ''}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            <span className="text-neutral-500 font-medium">Total:</span>
                            <span className="text-base font-extrabold text-neutral-900">₹{trackingOrder.total}</span>
                            <span className="text-[11px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                              Cash on Delivery
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                    {/* Clean Orders Header & Filter Tabs */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
                      <div className="flex items-center gap-2">
                        <h1 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
                          My Orders
                        </h1>
                        <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-semibold">
                          {orders.length}
                        </span>
                      </div>

                      {/* Filter Tabs */}
                      <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl self-start sm:self-auto">
                        {(['all', 'active', 'completed'] as const).map((filter) => {
                          const count =
                            filter === 'all'
                              ? orders.length
                              : filter === 'active'
                              ? activeOrdersCount
                              : deliveredOrdersCount;

                          const label =
                            filter === 'all'
                              ? 'All Orders'
                              : filter === 'active'
                              ? 'In-Transit'
                              : 'Delivered';

                          return (
                            <button
                              key={filter}
                              onClick={() => setOrderFilter(filter)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                orderFilter === filter
                                  ? 'bg-white text-emerald-800 shadow-xs'
                                  : 'text-neutral-600 hover:text-neutral-900'
                              }`}
                            >
                              <span>{label}</span>
                              {count > 0 && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    orderFilter === filter
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-neutral-200 text-neutral-600'
                                  }`}
                                >
                                  {count}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Orders List View */}
                    {filteredOrders.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-xs">
                        <div className="w-16 h-16 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
                          <Package className="w-8 h-8" />
                        </div>
                        <h3 className="text-base font-black text-neutral-800">No matching orders found</h3>
                        <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                          You don't have any orders matching the selected filter criteria.
                        </p>
                        <button
                          onClick={() => navigate('home')}
                          className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          Start Shopping Now
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredOrders.map((order) => {
                          const isLive = ['pending', 'confirmed', 'packed', 'out_for_delivery'].includes(order.status);
                          const isDelivered = order.status === 'delivered';
                          const isCancelled = order.status === 'cancelled' || order.status === 'returned';
                          const isExpanded = Boolean(expandedOrderIds[order._id || order.id || '']);

                          const rawPlaced = getOrderPlacedAt(order);
                          const placedDate = formatOrderDateTime(rawPlaced);

                          const getOrderStatus = () => {
                            if (order.status === 'delivered') return { label: 'Delivered', style: 'bg-emerald-50 text-emerald-700 border-emerald-200/70' };
                            if (order.status === 'out_for_delivery') return { label: 'On the way', style: 'bg-blue-50 text-blue-700 border-blue-200/70' };
                            if (order.status === 'packed') return { label: 'Packed', style: 'bg-amber-50 text-amber-800 border-amber-200/70' };
                            if (order.status === 'cancelled' || order.status === 'returned') return { label: 'Cancelled', style: 'bg-neutral-100 text-neutral-600 border-neutral-200/60' };
                            return { label: 'Order Placed', style: 'bg-emerald-50 text-emerald-700 border-emerald-200/70' };
                          };
                          const orderStatusInfo = getOrderStatus();

                          return (
                            <div
                              key={order._id || order.id}
                              className="bg-white rounded-2xl border border-neutral-200/90 hover:border-neutral-300 shadow-xs transition-all overflow-hidden"
                            >
                              {/* 1. Header: Status, Timestamp, Track Button & Total */}
                              <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${orderStatusInfo.style}`}
                                    >
                                      {isDelivered ? (
                                        <CheckCircle2 size={12} className="stroke-[2.5]" />
                                      ) : isLive ? (
                                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                      ) : null}
                                      {orderStatusInfo.label}
                                    </span>
                                    <span className="text-[11px] text-neutral-500 font-semibold">
                                      {placedDate}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
                                    Order #{order.order_number}
                                  </p>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  {isLive && (
                                    <button
                                      type="button"
                                      onClick={() => setTrackingOrder(order)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 transition-colors border border-emerald-200/70 shadow-2xs"
                                    >
                                      <span>Track</span>
                                      <ChevronRight size={13} strokeWidth={2.5} />
                                    </button>
                                  )}
                                  <div className="text-right">
                                    <span className="text-base font-extrabold text-neutral-900 block">
                                      ₹{order.total}
                                    </span>
                                    <span className="text-[10px] text-neutral-400 font-medium block">
                                      Cash on Delivery
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* 3. Products Showcase (Zepto-style clean item list) */}
                              <div className="p-4">
                                <div className="space-y-3">
                                  {order.items?.slice(0, isExpanded ? undefined : 2).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <img
                                          src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=compress&cs=tinysrgb&w=200'}
                                          alt={item.product_name}
                                          className="w-11 h-11 rounded-xl object-contain bg-neutral-50 border border-neutral-100 p-0.5 shrink-0"
                                        />
                                        <div className="min-w-0">
                                          <p className="text-xs sm:text-sm font-semibold text-neutral-800 truncate">{item.product_name}</p>
                                          <p className="text-[11px] text-neutral-400">{item.variant_label || 'Standard'} • Qty: {item.quantity}</p>
                                        </div>
                                      </div>
                                      <span className="text-xs sm:text-sm font-bold text-neutral-900 shrink-0">₹{item.line_total}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Toggle expand if more than 2 items */}
                                {(order.items?.length || 0) > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => toggleOrderExpand(order._id || order.id || '')}
                                    className="mt-2.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                  >
                                    <span>{isExpanded ? 'Show less' : `+ ${(order.items?.length || 0) - 2} more item${(order.items?.length || 0) - 2 > 1 ? 's' : ''}`}</span>
                                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                  </button>
                                )}

                                {/* Expanded Bill Details */}
                                {isExpanded && (
                                  <div className="mt-3 pt-3 border-t border-neutral-100 space-y-2">
                                    <div className="p-3 bg-neutral-50 rounded-xl space-y-1.5 text-xs">
                                      <div className="flex justify-between text-neutral-600">
                                        <span>Items Total</span>
                                        <span>₹{order.subtotal || order.total}</span>
                                      </div>
                                      <div className="flex justify-between text-neutral-600">
                                        <span>Delivery Fee</span>
                                        <span className="text-emerald-700 font-bold">FREE</span>
                                      </div>
                                      <div className="flex justify-between text-neutral-600">
                                        <span>Payment Mode</span>
                                        <span className="font-bold text-neutral-800">Cash on Delivery</span>
                                      </div>
                                      <div className="pt-1.5 border-t border-neutral-200 flex justify-between font-bold text-neutral-900 text-sm">
                                        <span>Total</span>
                                        <span className="text-emerald-700">₹{order.total}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Delivery Address snippet */}
                                {order.delivery_address && (
                                  <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center gap-1.5 text-[11px] text-neutral-500 truncate">
                                    <MapPin size={12} className="text-neutral-400 shrink-0" />
                                    <span className="truncate">
                                      {order.delivery_address?.label || 'Home'}: {order.delivery_address?.line1}
                                      {order.delivery_address?.city ? `, ${order.delivery_address.city}` : ''}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* 4. Zepto Action Buttons Row */}
                              <div className="px-4 py-2.5 bg-neutral-50/70 border-t border-neutral-100 flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setInvoiceOrder(order)}
                                    className="px-2.5 py-1.5 rounded-lg border border-neutral-200/90 bg-white hover:bg-neutral-50 text-neutral-700 text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                                  >
                                    <Receipt size={12} className="text-neutral-500" />
                                    <span>Invoice</span>
                                  </button>

                                  {isDelivered && (
                                    <button
                                      type="button"
                                      onClick={() => openRateModal(order)}
                                      className="px-2.5 py-1.5 rounded-lg border border-neutral-200/90 bg-white hover:bg-neutral-50 text-amber-700 text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                                    >
                                      <Star size={12} className="fill-amber-400 text-amber-400" />
                                      <span>{order.rating ? 'Rated ★' : 'Rate'}</span>
                                    </button>
                                  )}

                                  {/* Help button removed as requested */}
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Cancel button removed - orders cannot be cancelled once placed */}

                                  <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => handleReorder(order)}
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                                  >
                                    <RotateCcw size={12} />
                                    <span>Reorder</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  )
                )}

              {/* TAB 2: FULLY UPGRADED SAVED ADDRESSES EXPERIENCE */}
              {currentTab === 'addresses' && (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-200">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Saved Addresses</h1>
                      <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-semibold">
                        {addresses.length}
                      </span>
                    </div>

                    <button
                      onClick={openAddAddressModal}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Address</span>
                    </button>
                  </div>

                  {/* Addresses Cards Grid */}
                  {addresses.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
                      <MapPin className="w-14 h-14 text-neutral-300 mx-auto mb-3" />
                      <h3 className="text-base font-bold text-neutral-800">No saved addresses found</h3>
                      <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                        You haven't saved any delivery addresses yet. Add an address for faster checkout.
                      </p>
                      <button
                        onClick={openAddAddressModal}
                        className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        + Add Delivery Address
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr) => {
                        const isDefault = addr.is_default;
                        const labelLower = addr.label.toLowerCase();
                        const LabelIcon =
                          labelLower.includes('home')
                            ? Home
                            : labelLower.includes('work') || labelLower.includes('office')
                            ? Briefcase
                            : labelLower.includes('friend') || labelLower.includes('family')
                            ? Users
                            : Building;

                        return (
                          <div
                            key={addr._id}
                            className="bg-white rounded-2xl border border-neutral-200/90 hover:border-neutral-300 shadow-xs transition-all p-4 sm:p-5 flex flex-col justify-between relative"
                          >
                            {/* Card Top Pill */}
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                                      labelLower.includes('home')
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : labelLower.includes('work')
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-purple-100 text-purple-800'
                                    }`}
                                  >
                                    <LabelIcon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold uppercase text-neutral-900 tracking-wider">
                                      {addr.label}
                                    </span>
                                  </div>
                                </div>

                                {isDefault ? (
                                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full shadow-2xs">
                                    <Check size={11} strokeWidth={3} /> Default Address
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleSetDefaultAddress(addr._id)}
                                    className="text-xs font-semibold text-neutral-500 hover:text-emerald-700 px-2.5 py-1 rounded-lg hover:bg-neutral-100 transition-colors"
                                  >
                                    Set as Default
                                  </button>
                                )}
                              </div>

                              {/* Recipient Details */}
                              <div className="bg-slate-50 p-2.5 rounded-xl mb-3 flex items-center justify-between text-xs text-neutral-600">
                                <div className="flex items-center gap-2">
                                  <User className="w-3.5 h-3.5 text-neutral-400" />
                                  <span className="font-bold text-neutral-800">
                                    {addr.receiver_name || profile?.name || 'Aarav Sharma'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-neutral-500">
                                  <Phone className="w-3 h-3 text-neutral-400" />
                                  <span>{addr.receiver_phone || profile?.phone || '+91 99066 72945'}</span>
                                </div>
                              </div>

                              {/* Address Lines */}
                              <div className="space-y-1">
                                <p className="text-sm font-black text-neutral-900 leading-snug">{addr.line1}</p>
                                {addr.line2 && <p className="text-xs text-neutral-600">{addr.line2}</p>}
                                {addr.landmark && (
                                  <p className="text-xs text-neutral-500 italic">Landmark: {addr.landmark}</p>
                                )}
                                <p className="text-xs text-neutral-500 font-medium">
                                  {addr.city}, {addr.state || 'Haryana'} -{' '}
                                  <span className="font-bold text-neutral-700">{addr.pincode}</span>
                                </p>
                              </div>

                              {/* Delivery Instructions Pills */}
                              {addr.delivery_instructions && addr.delivery_instructions.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-neutral-100">
                                  <span className="text-[10px] font-black uppercase text-neutral-400 block mb-1.5">
                                    Delivery Instructions:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {addr.delivery_instructions.map((inst, i) => (
                                      <span
                                        key={i}
                                        className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-neutral-100 text-neutral-700"
                                      >
                                        {inst}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Card Footer Actions */}
                            <div className="flex items-center justify-between pt-4 mt-4 border-t border-neutral-100">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => openEditAddressModal(addr)}
                                  className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-emerald-700 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleShareAddress(addr)}
                                  className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-800 transition-colors"
                                  title="Copy address"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                  <span>Share</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setDeletingAddress(addr)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                                  title="Delete Address"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>

                                {!isDefault && (
                                  <button
                                    onClick={() => handleSetDefaultAddress(addr._id)}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors shadow-xs"
                                  >
                                    Deliver Here
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}



              {/* TAB 5: ACCOUNT & SETTINGS - FULLY UPGRADED */}
              {currentTab === 'settings' && (
                <ProfileSettingsView
                  profile={profile}
                  setProfile={setProfile}
                  addresses={addresses}
                  orders={orders}
                  showToast={showToast}
                  navigate={navigate}
                  onSettingsUpdated={(newSettings) => {
                    setSettingsForm((prev) => ({
                      ...prev,
                      name: newSettings.name,
                      email: newSettings.email,
                      phone: newSettings.phone,
                      avatar: newSettings.avatar,
                      gender: newSettings.gender,
                      dob: newSettings.dob,
                      alternatePhone: newSettings.alternatePhone,
                    }));
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>



      {/* MODAL 2: CLEAN TAX INVOICE */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full my-auto flex flex-col border border-neutral-200 animate-in fade-in zoom-in duration-200 overflow-hidden">
            {/* Modal Header Actions */}
            <div className="p-3.5 sm:p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-neutral-900">Tax Invoice</h3>
                  <p className="text-[11px] text-neutral-500 font-medium">Order #{invoiceOrder.order_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintInvoice(invoiceOrder)}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-3 py-1.5 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceOrder(null)}
                  className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content Area */}
            <div id="printable-tax-invoice" className="p-4 sm:p-6 overflow-y-auto max-h-[80vh] space-y-4 text-xs font-sans">
              {/* Brand & Invoice Header */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 pb-4 border-b-2 border-neutral-200">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <img
                      src="/agrawal_log.png"
                      alt="Agrawal General & Provisional Store"
                      className="h-10 w-auto max-w-[220px] object-contain"
                    />
                  </div>
                  <p className="text-neutral-500 text-[11px] leading-relaxed">
                    Fatehchand colony, ward no 5, near ram mandir chauraha, sabalgarh, Morena, madhya pradesh - 476229, India
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Orders & Support: +91 9285108057</p>
                </div>

                <div className="sm:text-right shrink-0">
                  <div className="text-neutral-900 font-black text-base">
                    Tax Invoice
                  </div>
                  <div className="text-[11px] font-semibold text-neutral-600 mt-0.5">
                    Order #{invoiceOrder.order_number}
                  </div>
                  <div className="text-[11px] text-neutral-500 font-medium mt-0.5">
                    Date & Time:{' '}
                    <span className="font-bold text-neutral-800">
                      {formatOrderDateTime(getOrderPlacedAt(invoiceOrder))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Billed To / Delivery Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/70">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1">
                    Billed & Delivered To:
                  </span>
                  <p className="font-extrabold text-neutral-900 text-sm">
                    {profile?.name || (invoiceOrder as any).customer_name || 'Aarav Sharma'}
                  </p>
                  <p className="text-neutral-600 text-[11px] mt-0.5">
                    {invoiceOrder.delivery_address?.line1 || 'Fatehchand colony, ward no 5, near ram mandir chauraha'}
                    {invoiceOrder.delivery_address?.city ? `, ${invoiceOrder.delivery_address.city}` : ', Sabalgarh'}
                    {invoiceOrder.delivery_address?.pincode ? ` - ${invoiceOrder.delivery_address.pincode}` : ' - 476229'}
                  </p>
                  <p className="text-neutral-600 text-[11px] mt-0.5">
                    <span className="font-medium text-neutral-500">Phone:</span>{' '}
                    {profile?.phone || (invoiceOrder as any).customer_phone || '+91 99066 72945'}
                  </p>
                </div>

                <div className="sm:text-right flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1">
                      Payment Mode:
                    </span>
                    <p className="text-xs font-extrabold text-emerald-700">
                      Cash on Delivery (COD)
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-100/90 border-b border-neutral-200 text-neutral-600 text-[10px] font-black uppercase tracking-wider">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    {invoiceOrder.items?.map((it, idx) => (
                      <tr key={it._id || idx} className="hover:bg-neutral-50/50">
                        <td className="py-2.5 px-3 text-neutral-400 font-medium">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-neutral-900">{it.product_name}</p>
                          {it.variant_label && (
                            <p className="text-[10px] text-neutral-400 font-medium">
                              {it.variant_label}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-neutral-800">{it.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-medium">₹{it.unit_price}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-neutral-900">
                          ₹{it.line_total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bill Financial Summary */}
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/70 space-y-1.5">
                <div className="flex justify-between text-neutral-600 font-medium">
                  <span>Items Subtotal:</span>
                  <span className="text-neutral-900 font-bold">₹{invoiceOrder.subtotal || invoiceOrder.total}</span>
                </div>
                {invoiceOrder.discount ? (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount Savings:</span>
                    <span className="font-bold">-₹{invoiceOrder.discount}</span>
                  </div>
                ) : null}
                <div className="flex justify-between pt-2 border-t border-neutral-200 text-base font-black text-neutral-900">
                  <span className="flex items-center gap-1.5">
                    Total Amount:
                    <span className="text-[11px] font-bold text-neutral-500">(Cash on Delivery)</span>
                  </span>
                  <span className="text-emerald-700 text-lg">₹{invoiceOrder.total}</span>
                </div>
              </div>

              {/* Simple Clean Footer */}
              <div className="pt-2 border-t border-neutral-100 text-center text-xs font-medium text-neutral-400">
                Thank you for shopping with Agrawal General & Provisional Store!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RATE DELIVERY & ITEMS */}
      {ratingOrderData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-neutral-200 animate-in fade-in zoom-in duration-150 text-center">
            <h3 className="text-base font-black text-neutral-900 mb-1">Rate Delivery & Groceries</h3>
            <p className="text-xs text-neutral-500 mb-4">
              How was your instant delivery experience for Order #{ratingOrderData.order_number}?
            </p>

            <div className="flex items-center justify-center gap-2 py-3 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setUserRating(star)}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${
                      userRating >= star
                        ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                        : 'text-neutral-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-black text-amber-600 uppercase tracking-wide block mb-4">
              {userRating === 5
                ? '⭐⭐⭐⭐⭐ Outstanding Experience'
                : userRating === 4
                ? '⭐⭐⭐⭐ Very Good'
                : userRating === 3
                ? '⭐⭐⭐ Good'
                : '⭐ Needs Improvement'}
            </span>

            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
              {[
                'Superfast Delivery ⚡',
                'Fresh & Chilled 🥦',
                'Polite Pilot 😊',
                'Well Packed 📦',
                'Accurate Items ✅',
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleRatingTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                    selectedRatingTags.includes(tag)
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              placeholder="Write a feedback or praise for your pilot..."
              value={ratingReview}
              onChange={(e) => setRatingReview(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-4"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRatingOrderData(null)}
                className="flex-1 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
              >
                Skip
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={actionLoading}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors"
              >
                {actionLoading ? 'Saving...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: FULLY UPGRADED ADD / EDIT ADDRESS MODAL */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-neutral-200 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-neutral-900">
                  {editingAddress ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                </h3>
              </div>
              <button
                onClick={() => setAddressModalOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* GPS Detection Bar */}
            <div className="mt-4 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <LocateFixed className="w-4 h-4 text-emerald-600" />
                <span>Instant GPS Location Autofill</span>
              </div>
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={detectingLocation}
                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all active:scale-95"
              >
                {detectingLocation ? 'Detecting...' : 'Detect Location'}
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4 pt-4">
              {/* Address Type Selector */}
              <div>
                <label className="text-xs font-black text-neutral-700 uppercase tracking-wider block mb-1.5">
                  Save Address As
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Home', icon: Home },
                    { label: 'Work', icon: Briefcase },
                    { label: 'Friends & Family', icon: Users },
                    { label: 'Other', icon: Building },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = addressForm.label === item.label;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setAddressForm({ ...addressForm, label: item.label })}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="truncate text-[11px]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recipient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Receiver's Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Aarav Sharma"
                    value={addressForm.receiver_name}
                    onChange={(e) => setAddressForm({ ...addressForm, receiver_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Receiver's Mobile</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9906672945"
                    value={addressForm.receiver_phone}
                    onChange={(e) => setAddressForm({ ...addressForm, receiver_phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Flat / Street / Landmark */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  House / Flat / Floor / Tower *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 402, 4th Floor, Tower B"
                  value={addressForm.line1}
                  onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Apartment / Society / Street Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Green Meadows Society, Sector 45"
                  value={addressForm.line2}
                  onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Nearby Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Opposite City Center Mall"
                  value={addressForm.landmark}
                  onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">City *</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Pincode *</label>
                  <input
                    type="text"
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Delivery Instructions Tags */}
              <div>
                <label className="text-xs font-black text-neutral-700 uppercase tracking-wider block mb-1.5">
                  Delivery Instructions for Pilot
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DELIVERY_INSTRUCTION_OPTIONS.map((tag) => {
                    const isSelected = addressForm.delivery_instructions.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleInstruction(tag)}
                        className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Checkbox */}
              <label className="flex items-center gap-2 pt-2 text-xs font-bold text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addressForm.is_default}
                  onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Set as primary / default delivery location</span>
              </label>

              <div className="pt-4 flex justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors shadow-xs"
                >
                  {actionLoading ? 'Saving...' : 'Save & Confirm Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: DELETE ADDRESS CONFIRMATION */}
      {deletingAddress && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-neutral-200 text-center animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-neutral-900 mb-1">Delete Address?</h3>
            <p className="text-xs text-neutral-500 mb-5">
              Are you sure you want to delete <strong>{deletingAddress.label}</strong> ({deletingAddress.line1})? This action cannot be undone.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDeletingAddress(null)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteAddress}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-colors"
              >
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: CANCEL ORDER REASON */}
      {cancellingOrderId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-neutral-200">
            <h3 className="text-base font-black text-neutral-900 mb-2">Cancel Order</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Please let us know the reason for cancellation. Since this order is Cash on Delivery, no payment was deducted.
            </p>
            <div className="space-y-2 mb-4">
              {[
                'Change of mind / placed by mistake',
                'Delivery time is taking too long',
                'Forgot to add essential grocery items',
                'Incorrect delivery address selected',
              ].map((reason) => (
                <label key={reason} className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                  <input
                    type="radio"
                    name="cancel_reason"
                    checked={cancelReason === reason}
                    onChange={() => setCancelReason(reason)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCancellingOrderId(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6B: DEDICATED REPORT ISSUE / ORDER SUPPORT MODAL */}
      {issueOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-neutral-200 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-900">
                    Need Help with Order #{issueOrder.order_number}
                  </h3>
                  <p className="text-xs text-neutral-500">Agrawal General & Provisional Store 100% Quality Promise</p>
                </div>
              </div>
              <button
                onClick={() => setIssueOrder(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReportIssue} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="text-xs font-black text-neutral-700 uppercase tracking-wider block mb-1.5">
                  Select Issue Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Damaged / Spoiled Items',
                    'Missing Item from Bag',
                    'Delivery Delay Query',
                    'Wrong Item Delivered',
                    'Payment / Cashback Query',
                    'Other Issue',
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setIssueType(cat)}
                      className={`p-2.5 rounded-xl border text-left font-bold transition-all text-xs ${
                        issueType === cat
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select affected items */}
              {issueOrder.items && issueOrder.items.length > 0 && (
                <div>
                  <label className="text-xs font-black text-neutral-700 uppercase tracking-wider block mb-1.5">
                    Which item(s) are affected?
                  </label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {issueOrder.items.map((item) => {
                      const isSelected = selectedIssueItems.includes(item.product_name);
                      return (
                        <div
                          key={item._id}
                          onClick={() => toggleIssueItem(item.product_name)}
                          className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950'
                              : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-neutral-400 shrink-0" />
                            )}
                            <span className="font-bold">{item.product_name}</span>
                          </div>
                          <span className="text-neutral-400 text-[11px]">₹{item.line_total}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Describe what went wrong (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Milk pouch had a puncture, or items were missing from sealed bag..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] font-medium flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Our 24x7 resolution pilot team reviews requests instantly. Approved claims are credited to your <strong>Fresh Cash</strong> wallet within minutes!
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIssueOrder(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-colors"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Issue & Request Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: LOGOUT CONFIRMATION */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-neutral-200 text-center">
            <LogOut className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-black text-neutral-900 mb-1">Confirm Log Out</h3>
            <p className="text-xs text-neutral-500 mb-6">
              Are you sure you want to log out of your Agrawal Store account?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: DELIVERY LOCATION SELECTOR MODAL */}
      <DeliveryLocationModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
      />
    </div>
  );
}
