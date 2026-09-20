import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Clock,
  Banknote,
  CheckCircle2,
  ShoppingBag,
  Truck,
  ChevronRight,
  ShoppingBasket,
  MapPinned,
  Send,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Sparkles,
  User,
  Phone,
  FileText,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { createCustomerOrder } from '../lib/profileApi';

// Seller's WhatsApp destination number (with country code 91)
const SELLER_WHATSAPP_NUMBER = '919285108057';
const DISPLAY_PHONE_NUMBER = '+91 9285108057';

const DELIVERY_SLOTS = [
  { id: '10-15', label: 'Instant Express (10-15 mins)', sub: 'Dark Store Dispatch', badge: 'Fastest' },
  { id: '20-30', label: 'Standard (20-30 mins)', sub: 'Next available pilot', badge: '' },
  { id: '60', label: 'Next 1 Hour', sub: 'Flexible delivery', badge: '' },
  { id: 'tomorrow', label: 'Tomorrow Morning', sub: '8:00 AM - 10:00 AM', badge: 'Scheduled' },
];

type CheckoutStep = 'cart' | 'address' | 'payment' | 'success';

interface AddressItem {
  id: string;
  label: string;
  address: string;
}

interface ConfirmedOrderItem {
  id: string;
  name: string;
  quantityLabel: string;
  price: number;
  quantity: number;
  image?: string;
}

interface ConfirmedOrder {
  orderId: string;
  items: ConfirmedOrderItem[];
  itemCount: number;
  cartTotal: number;
  delivery: number;
  discount: number;
  total: number;
  address: string;
  addressLabel: string;
  slotLabel: string;
  paymentMethod: string;
  customerName: string;
  customerPhone: string;
  customerNote?: string;
  orderTime: string;
  orderDate: string;
  whatsappUrl: string;
  whatsappText: string;
}

function buildWhatsAppMessage(order: {
  orderId: string;
  items: ConfirmedOrderItem[];
  customerName: string;
  customerPhone: string;
  address: string;
  addressLabel: string;
  cartTotal: number;
  delivery: number;
  total: number;
  paymentMethod: string;
  note?: string;
  dateTime: string;
}): string {
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const itemsList = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.name}* (${item.quantityLabel})\n   Qty: ${item.quantity} x Rs. ${item.price} = Rs. ${item.price * item.quantity}`
    )
    .join('\n\n');

  return (
    `*NEW ORDER - Agrawal General & Provisional Store*\n` +
    `Order ID: #${order.orderId}\n` +
    `Date & Time: ${order.dateTime}\n\n` +
    `*ORDER ITEMS (${totalQuantity} items):*\n` +
    `${itemsList}\n\n` +
    `*BILL SUMMARY:*\n` +
    `- Total Amount: Rs. ${order.total}\n` +
    `- Payment Mode: Cash on Delivery (COD)\n\n` +
    `*DELIVERY DETAILS:*\n` +
    `- Name: ${order.customerName} (${order.customerPhone})\n` +
    `- Address (${order.addressLabel}): ${order.address}\n` +
    (order.note ? `- Notes: ${order.note}\n` : '') +
    `\nPlease confirm this order. Thank you!`
  );
}

export default function CartPage() {
  const { state, updateCartQuantity, removeFromCart, clearCart, navigate, cartTotal, cartCount } = useApp();
  const [step, setStep] = useState<CheckoutStep>(() => {
    try {
      const savedStep = sessionStorage.getItem('freshmart_checkout_step');
      if (savedStep === 'payment' || savedStep === 'address') {
        sessionStorage.removeItem('freshmart_checkout_step');
        return savedStep;
      }
    } catch {}
    return 'cart';
  });
  const [selectedSlot, setSelectedSlot] = useState('10-15');

  // Address state
  const [addresses, setAddresses] = useState<AddressItem[]>([
    { id: '1', label: 'Home', address: 'Fatehchand colony, ward no 5, near ram mandir chauraha, sabalgarh, Morena, madhya pradesh - 476229' },
    { id: '2', label: 'Shop/Office', address: 'Main Market, Sabalgarh, Morena, Madhya Pradesh - 476229' },
  ]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('1');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newLabel, setNewLabel] = useState<'Home' | 'Office' | 'Other'>('Home');
  const [newAddressText, setNewAddressText] = useState('');

  // Confirmed Order state
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTextPreview, setShowTextPreview] = useState(false);

  const delivery = 0;
  const discount = 0;
  const total = cartTotal;

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressText.trim()) return;
    const newId = Date.now().toString();
    const newAddr: AddressItem = {
      id: newId,
      label: newLabel,
      address: newAddressText.trim(),
    };
    setAddresses(prev => [...prev, newAddr]);
    setSelectedAddressId(newId);
    setNewAddressText('');
    setShowAddAddress(false);
  };

  const handlePlaceOrder = () => {
    if (state.cart.length === 0) return;

    const orderId = `GRO${Date.now().toString().slice(-6)}`;
    const chosenAddress = addresses.find(a => a.id === selectedAddressId) || addresses[0];
    const chosenSlot = DELIVERY_SLOTS.find(s => s.id === selectedSlot) || DELIVERY_SLOTS[0];

    // Customer profile info
    let customerName = 'Aarav Sharma';
    let customerPhone = '+91 99066 72945';
    let customerNote = '';

    try {
      const stored = localStorage.getItem('freshmart_customer_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) customerName = parsed.name;
        if (parsed.phone) customerPhone = parsed.phone;
        if (parsed.defaultInstruction) customerNote = parsed.defaultInstruction;
      }
    } catch {}

    const itemsSnapshot: ConfirmedOrderItem[] = state.cart.map(item => ({
      id: `${item.product.id}-${item.variant.id}`,
      name: item.product.name,
      quantityLabel: item.variant.quantity,
      price: item.variant.price,
      quantity: item.quantity,
      image: item.product.image ?? undefined,
    }));

    const now = new Date();
    const dateTimeStr = now.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const paymentMethodLabel = 'Cash on Delivery (COD)';

    const whatsappText = buildWhatsAppMessage({
      orderId,
      items: itemsSnapshot,
      customerName,
      customerPhone,
      address: chosenAddress.address,
      addressLabel: chosenAddress.label,
      cartTotal,
      delivery,
      total,
      paymentMethod: paymentMethodLabel,
      note: customerNote,
      dateTime: dateTimeStr,
    });

    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const whatsappUrl = isMobile
      ? `https://api.whatsapp.com/send/?phone=${SELLER_WHATSAPP_NUMBER}&text=${encodeURIComponent(whatsappText)}&type=phone_number&app_absent=0`
      : `https://web.whatsapp.com/send/?phone=${SELLER_WHATSAPP_NUMBER}&text=${encodeURIComponent(whatsappText)}&_t=${Date.now()}`;

    const orderRecord: ConfirmedOrder = {
      orderId,
      items: itemsSnapshot,
      itemCount: cartCount,
      cartTotal,
      delivery,
      discount,
      total,
      address: chosenAddress.address,
      addressLabel: chosenAddress.label,
      slotLabel: chosenSlot.label,
      paymentMethod: paymentMethodLabel,
      customerName,
      customerPhone,
      customerNote,
      orderTime: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      orderDate: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      whatsappUrl,
      whatsappText,
    };

    setConfirmedOrder(orderRecord);
    clearCart();
    setStep('success');

    // Save order to backend and sync with customer profile
    const orderPayload = {
      order_number: orderId,
      items: itemsSnapshot.map((it) => ({
        product_name: it.name,
        variant_label: it.quantityLabel,
        unit_price: it.price,
        quantity: it.quantity,
        line_total: it.price * it.quantity,
      })),
      delivery_address: {
        label: chosenAddress.label,
        line1: chosenAddress.address,
        city: 'Sabalgarh',
        state: 'Madhya Pradesh',
        pincode: '476229',
      },
      delivery_slot: chosenSlot.label,
      subtotal: cartTotal,
      delivery_fee: delivery,
      discount,
      total,
      payment_method: 'cod',
      notes: customerNote || undefined,
      placed_at: now.toISOString(),
    };

    createCustomerOrder(orderPayload).catch((err) => {
      console.warn('Could not post order to backend:', err);
    });

    // Also store in localStorage so ProfilePage displays this exact order immediately with accurate timestamp
    try {
      const prevStored = JSON.parse(localStorage.getItem('freshmart_placed_orders') || '[]');
      const localRecord = {
        _id: `ord-${Date.now()}`,
        id: `ord-${Date.now()}`,
        order_number: orderId,
        customer_id: 'cust-current',
        status: 'pending',
        payment_status: 'cod_pending',
        payment_method: 'cod',
        subtotal: cartTotal,
        discount,
        delivery_fee: delivery,
        tax: 0,
        total,
        delivery_address: {
          label: chosenAddress.label,
          line1: chosenAddress.address,
          city: 'Sabalgarh',
          state: 'Madhya Pradesh',
          pincode: '476229',
        },
        delivery_slot: chosenSlot.label,
        notes: customerNote || undefined,
        placed_at: now.toISOString(),
        delivery_eta: '10-15 Mins',
        items: itemsSnapshot.map((it) => ({
          _id: `it-${Date.now()}-${Math.random()}`,
          product_name: it.name,
          variant_label: it.quantityLabel,
          unit_price: it.price,
          quantity: it.quantity,
          line_total: it.price * it.quantity,
          image: it.image,
        })),
      };
      localStorage.setItem('freshmart_placed_orders', JSON.stringify([localRecord, ...prevStored.filter((p: any) => p.order_number !== orderId)]));
    } catch {}

    // 1. Always copy text to clipboard as guaranteed backup
    try {
      if (navigator?.clipboard) {
        navigator.clipboard.writeText(whatsappText);
      }
    } catch {}

    // 2. Open WhatsApp reliably with a unique window target name
    const windowTarget = `WhatsApp_${orderId}`;
    try {
      const link = document.createElement('a');
      link.href = whatsappUrl;
      if (!isMobile) {
        link.target = windowTarget;
        link.rel = 'noopener noreferrer';
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.warn('Programmatic link click failed:', e);
    }

    // 3. Fallback for mobile and popup-blocked browsers
    setTimeout(() => {
      try {
        if (isMobile) {
          window.location.href = whatsappUrl;
        } else {
          window.open(whatsappUrl, windowTarget);
        }
      } catch (e) {
        console.error('Fallback WhatsApp open failed:', e);
      }
    }, 250);
  };

  const handleCopyOrder = () => {
    if (!confirmedOrder) return;
    navigator.clipboard.writeText(confirmedOrder.whatsappText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // ─────────────────────────────────────────────────────────────
  // EMPTY CART STATE
  // ─────────────────────────────────────────────────────────────
  if (state.cart.length === 0 && step === 'cart') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-sm">
          <ShoppingBag size={40} className="stroke-[1.8]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight text-center">
          Your cart is empty
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 text-center max-w-sm mt-1 leading-relaxed">
          Looks like you haven't added anything to your cart yet. Explore our fresh grocery aisles and flash deals!
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5 w-full max-w-xs">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="flex-1 py-2.5 px-5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all text-center"
          >
            Start Shopping
          </button>
          <button
            type="button"
            onClick={() => navigate('offers')}
            className="flex-1 py-2.5 px-5 bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-700 font-bold text-xs rounded-xl active:scale-95 transition-all text-center"
          >
            Today's Deals
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // ORDER SUCCESS STATE
  // ─────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-[70vh] py-6 px-4 flex flex-col items-center justify-center max-w-2xl mx-auto">
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 size={38} />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
            <Sparkles size={12} />
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-neutral-900 text-center">
          Order Placed Successfully!
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 text-center max-w-md mt-1">
          Aapke order ki list ready hai. WhatsApp order desk par direct send karke delivery confirm karein.
        </p>

        {confirmedOrder && (
          <div className="w-full mt-5 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-950">WhatsApp Order Desk</h4>
                  <p className="text-[11px] text-emerald-700">{DISPLAY_PHONE_NUMBER}</p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md">
                COD Ready
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  if (confirmedOrder?.whatsappText) {
                    try {
                      navigator.clipboard.writeText(confirmedOrder.whatsappText);
                    } catch {}
                  }
                  const isMob = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                  const targetWin = `WhatsApp_${confirmedOrder?.orderId || Date.now()}`;
                  if (isMob) {
                    window.location.href = confirmedOrder?.whatsappUrl || '';
                  } else {
                    window.open(confirmedOrder?.whatsappUrl, targetWin);
                  }
                }}
                className="flex-1 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all text-center"
              >
                <Send size={14} />
                <span>Open WhatsApp & Send Order</span>
                <ExternalLink size={12} className="opacity-80" />
              </button>
              <button
                type="button"
                onClick={handleCopyOrder}
                className="bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-emerald-300 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                {copied ? <Check size={14} className="text-emerald-600 stroke-[3]" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
              </button>
            </div>

            <div className="mt-2.5 p-2.5 bg-white/80 rounded-xl border border-emerald-200/90 text-[11px] text-emerald-900 flex items-start gap-2 shadow-2xs">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Order message clipboard me copy ho gaya hai!</span>
                <p className="text-neutral-600 mt-0.5">
                  Agar WhatsApp pehle se open ho aur text box me message na dikhe, toh chat me seedha <strong>Paste (Ctrl+V)</strong> karke send kar dein.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTextPreview(!showTextPreview)}
              className="mt-2.5 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition-colors mx-auto"
            >
              <FileText size={12} />
              <span>{showTextPreview ? 'Hide Message Preview' : 'View Formatted Message'}</span>
            </button>

            {showTextPreview && (
              <div className="mt-2.5 bg-neutral-900 text-emerald-300 font-mono text-[10.5px] p-3 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-neutral-800">
                {confirmedOrder.whatsappText}
              </div>
            )}
          </div>
        )}

        {/* Order Details Breakdown */}
        {confirmedOrder && (
          <div className="w-full mt-4 bg-white rounded-2xl p-4 sm:p-5 shadow-2xs border border-neutral-200/80">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Order ID</span>
                <p className="text-sm font-black text-neutral-900">#{confirmedOrder.orderId}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Payment</span>
                <p className="text-xs font-bold text-emerald-700">Cash on Delivery</p>
              </div>
            </div>

            <div className="divide-y divide-neutral-100 my-2">
              {confirmedOrder.items.map(item => (
                <div key={item.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-8 h-8 object-contain rounded-lg border border-neutral-100 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-neutral-400">{item.quantityLabel} × {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-neutral-900 shrink-0">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-neutral-100 flex justify-between text-xs font-bold text-neutral-900">
              <span>Total To Pay (Cash on Delivery)</span>
              <span className="text-primary-600 font-black">₹{confirmedOrder.total}</span>
            </div>
          </div>
        )}

        <div className="w-full flex gap-2.5 mt-4">
          <button
            type="button"
            onClick={() => {
              setConfirmedOrder(null);
              setStep('cart');
              navigate('home');
            }}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl active:scale-95 transition-all text-center shadow-xs"
          >
            Continue Shopping
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmedOrder(null);
              setStep('cart');
              navigate('profile', 'orders');
            }}
            className="bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-neutral-200 transition-all text-center"
          >
            My Orders
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN CART & CHECKOUT STEPS VIEW
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 lg:pb-8">
      {/* Top Breadcrumb / Stepper Bar */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5 pb-3 border-b border-neutral-200/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (step === 'cart' ? navigate('home') : step === 'payment' ? setStep('address') : setStep('cart'))}
            className="w-8 h-8 rounded-xl bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors shadow-2xs"
          >
            <ArrowLeft size={16} className="text-neutral-700" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight leading-none">
              {step === 'cart' ? 'My Cart' : step === 'address' ? 'Delivery Address' : 'Confirm Order (COD)'}
            </h1>
            <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
              {step === 'cart' ? `${cartCount} items in basket` : 'Cash on Delivery guaranteed'}
            </p>
          </div>
        </div>

        {/* Compact Stepper Pills */}
        <div className="hidden sm:flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl">
          {(['cart', 'address', 'payment'] as CheckoutStep[]).map((s, i) => {
            const stepsOrder = ['cart', 'address', 'payment'];
            const currentIndex = stepsOrder.indexOf(step);
            const isActive = currentIndex === i;
            const isCompleted = currentIndex > i;
            const labels = ['Cart', 'Address', 'COD'];

            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (isCompleted) setStep(s);
                }}
                disabled={!isCompleted && !isActive}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-white text-primary-600 shadow-2xs'
                    : isCompleted
                    ? 'text-neutral-600 hover:text-neutral-900 cursor-pointer'
                    : 'text-neutral-400 cursor-not-allowed opacity-60'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                  isActive ? 'bg-primary-600 text-white' : isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-500'
                }`}>
                  {isCompleted ? '✓' : i + 1}
                </span>
                <span>{labels[i]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-3 lg:gap-6 items-start">
        {/* Left 2 Columns: Main Steps */}
        <div className="lg:col-span-2 space-y-4">
          {/* ──────────────────────────────────
              STEP 1: CART ITEMS
          ────────────────────────────────── */}
          {step === 'cart' && (
            <div className="space-y-3">
              {/* Delivery Speed Strip */}
              <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <Clock size={16} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">Delivery in 10-15 Mins</h4>
                    <p className="text-[10.5px] text-emerald-700">Dispatched immediately from your local dark store</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg shrink-0">
                  FREE Delivery
                </span>
              </div>

              {/* Items Card List */}
              <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden divide-y divide-neutral-100">
                {state.cart.map((item) => (
                  <div
                    key={`${item.product.id}-${item.variant.id}`}
                    className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-neutral-50/60 transition-colors"
                  >
                    {/* Image & Title */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={item.product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'}
                        alt={item.product.name}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs sm:text-sm font-bold text-neutral-800 truncate">
                          {item.product.name}
                        </h3>
                        <p className="text-[10.5px] text-neutral-400 font-medium mt-0.5">
                          {item.variant.quantity}
                        </p>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-xs sm:text-sm font-extrabold text-neutral-900">
                            ₹{item.variant.price * item.quantity}
                          </span>
                          {item.variant.original_price > item.variant.price && (
                            <span className="text-[10px] text-neutral-400 line-through">
                              ₹{item.variant.original_price * item.quantity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Counter and Trash Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id, item.variant.id)}
                        className="w-7 h-7 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                        title="Remove item"
                      >
                        <Trash2 size={13} />
                      </button>

                      <div className="bg-primary-600 text-white rounded-xl px-2 py-1 flex items-center gap-2 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, item.variant.id, item.quantity - 1)}
                          className="w-4 h-4 flex items-center justify-center hover:opacity-80 active:scale-90"
                        >
                          <Minus size={11} className="stroke-[3]" />
                        </button>
                        <span className="text-xs font-black min-w-[12px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, item.variant.id, item.quantity + 1)}
                          className="w-4 h-4 flex items-center justify-center hover:opacity-80 active:scale-90"
                        >
                          <Plus size={11} className="stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Free delivery progress */}
              {cartTotal < 299 && (
                <div className="p-3 bg-white rounded-xl border border-neutral-200/80 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                    <span className="text-neutral-700">Add ₹{299 - cartTotal} more for FREE delivery</span>
                    <span className="text-emerald-700">Target ₹299</span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((cartTotal / 299) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ──────────────────────────────────
              STEP 2: ADDRESS SELECTION
          ────────────────────────────────── */}
          {step === 'address' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-neutral-900">
                  Select Delivery Address
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddAddress(!showAddAddress)}
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Plus size={14} />
                  <span>Add New</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`w-full bg-white rounded-xl p-3.5 border transition-all text-left flex items-start gap-3 ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50/15 shadow-xs'
                          : 'border-neutral-200/80 hover:border-neutral-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-500'
                      }`}>
                        <MapPinned size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-neutral-900">{addr.label}</h4>
                          {isSelected && <CheckCircle2 size={16} className="text-primary-600 shrink-0" />}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{addr.address}</p>
                      </div>
                    </button>
                  );
                })}

                {showAddAddress && (
                  <form onSubmit={handleAddNewAddress} className="bg-white rounded-xl p-4 border border-primary-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-neutral-800">Add New Address</h4>
                      <button type="button" onClick={() => setShowAddAddress(false)} className="text-neutral-400">
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      {(['Home', 'Office', 'Other'] as const).map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setNewLabel(tag)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                            newLabel === tag ? 'bg-primary-600 text-white border-primary-600' : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    <textarea
                      required
                      rows={2}
                      value={newAddressText}
                      onChange={e => setNewAddressText(e.target.value)}
                      placeholder="House / Flat No., Street, Landmark, City, Pincode"
                      className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-primary-500 resize-none"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddAddress(false)}
                        className="px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-50 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-2xs"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}



          {/* ──────────────────────────────────
              STEP 4: PAYMENT (100% COD)
          ────────────────────────────────── */}
          {step === 'payment' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-primary-600 shadow-xs flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Banknote size={22} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-neutral-900">Cash on Delivery (COD)</h3>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      100% Available
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                    Pay <span className="font-bold text-neutral-900">₹{total}</span> in cash or scan UPI QR directly to the delivery pilot when your order arrives. Zero online payment risk!
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                    <ShieldCheck size={14} />
                    <span>Exact change and UPI QR code available with rider</span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Notice */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MessageSquare size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">WhatsApp Order Confirmation</h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                    Order place karte hi aapke items ka formatted bill WhatsApp par open hoga. Seller ko direct message jaakar delivery turant dispatch ho jayegi.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ──────────────────────────────────
            RIGHT COLUMN: COMPACT BILL SUMMARY
        ────────────────────────────────── */}
        <div className="mt-4 lg:mt-0">
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 sm:p-5 shadow-2xs space-y-3 sticky top-[100px]">
            <h3 className="text-xs sm:text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-100">
              Bill Summary
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Items Total ({cartCount})</span>
                <span className="font-semibold text-neutral-800">₹{cartTotal}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Payment Mode</span>
                <span className="font-bold text-emerald-700">Cash on Delivery</span>
              </div>

              <div className="pt-2 border-t border-dashed border-neutral-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-neutral-900">Total To Pay</span>
                <span className="text-base font-black text-primary-600">₹{total}</span>
              </div>
            </div>

            {/* Main Action Button */}
            <button
              type="button"
              onClick={() => {
                if (step === 'cart') setStep('address');
                else if (step === 'address') setStep('payment');
                else handlePlaceOrder();
              }}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xs ${
                step === 'payment'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {step === 'cart' ? (
                <>
                  <span>Select Address</span>
                  <ChevronRight size={15} />
                </>
              ) : step === 'address' ? (
                <>
                  <span>Proceed to COD</span>
                  <ChevronRight size={15} />
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Place Order via WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Fixed Bar */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 p-3 bg-white border-t border-neutral-200 z-40 shadow-lg">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div>
            <p className="text-[10px] text-neutral-400 font-bold uppercase">Total To Pay</p>
            <p className="text-base font-black text-neutral-900 leading-tight">₹{total}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (step === 'cart') setStep('address');
              else if (step === 'address') setStep('payment');
              else handlePlaceOrder();
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs ${
              step === 'payment'
                ? 'bg-emerald-600 text-white'
                : 'bg-primary-600 text-white'
            }`}
          >
            {step === 'cart' ? (
              <>
                <span>Select Address</span>
                <ChevronRight size={14} />
              </>
            ) : step === 'address' ? (
              <>
                <span>Proceed to COD</span>
                <ChevronRight size={14} />
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Place Order (WhatsApp)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
