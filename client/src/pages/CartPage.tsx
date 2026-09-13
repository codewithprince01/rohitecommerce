import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Tag,
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
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// Seller's WhatsApp destination number (with country code 91)
const SELLER_WHATSAPP_NUMBER = '919458524697';
const DISPLAY_PHONE_NUMBER = '+91 9458524697';

const DELIVERY_SLOTS = [
  { id: '10-15', label: 'Express (10-15 min)', sub: 'Available now', badge: 'Fastest' },
  { id: '20-30', label: '20-30 minutes', sub: 'Standard', badge: '' },
  { id: '60', label: 'Next 1 hour', sub: 'Relaxed delivery', badge: '' },
  { id: 'tomorrow', label: 'Tomorrow Morning', sub: '8 AM - 10 AM', badge: 'Scheduled' },
];

type CheckoutStep = 'cart' | 'address' | 'delivery' | 'payment' | 'success';

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
  slotLabel: string;
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
        `${idx + 1}️⃣ *${item.name}* (${item.quantityLabel})\n   ▫️ Qty: ${item.quantity} × ₹${item.price} = *₹${item.price * item.quantity}*`
    )
    .join('\n\n');

  const lines = [
    `🛍️ *NEW ORDER - FreshMart*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🆔 *Order ID:* #${order.orderId}`,
    `📅 *Order Time:* ${order.dateTime}`,
    ``,
    `👤 *CUSTOMER DETAILS:*`,
    `• *Customer Name:* ${order.customerName}`,
    `• *Mobile Number:* ${order.customerPhone}`,
    `• *Delivery Address (${order.addressLabel}):* ${order.address}`,
    `• *Delivery Slot:* ${order.slotLabel}`,
    order.note ? `• *Special Instruction:* ${order.note}` : '',
    ``,
    `📦 *ORDERED ITEMS (${totalQuantity} items):*`,
    itemsList,
    ``,
    `💰 *BILL SUMMARY:*`,
    `• Items Subtotal: ₹${order.cartTotal}`,
    `• Delivery Fee: ${order.delivery === 0 ? 'FREE' : `₹${order.delivery}`}`,
    `• *FINAL PAYABLE AMOUNT: ₹${order.total}*`,
    `• *Payment Mode:* ${order.paymentMethod}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `⚡ *Please confirm and dispatch this order. Thank you!* 🙏`,
  ];

  return lines.filter(line => line !== '').join('\n');
}

export default function CartPage() {
  const { state, updateCartQuantity, removeFromCart, clearCart, navigate, cartTotal, cartCount } = useApp();
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [selectedPayment, setSelectedPayment] = useState('cod');
  const [selectedSlot, setSelectedSlot] = useState('10-15');

  // Address state
  const [addresses, setAddresses] = useState<AddressItem[]>([
    { id: '1', label: 'Home', address: '12A, 3rd Floor, Koramangala 5th Block, Bengaluru - 560034' },
    { id: '2', label: 'Office', address: '14th Main, HSR Layout, Bengaluru - 560102' },
  ]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('1');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newLabel, setNewLabel] = useState<'Home' | 'Office' | 'Other'>('Home');
  const [newAddressText, setNewAddressText] = useState('');

  // Confirmed Order state (preserved after cart is cleared for display)
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTextPreview, setShowTextPreview] = useState(false);

  const delivery = cartTotal >= 299 ? 0 : 49;
  const discount = 0;
  const total = cartTotal + delivery;

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

    // Customer profile info from saved settings
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
    } catch {
      // fallback
    }

    const itemsSnapshot: ConfirmedOrderItem[] = state.cart.map(item => ({
      id: `${item.product.id}-${item.variant.id}`,
      name: item.product.name,
      quantityLabel: item.variant.quantity,
      price: item.variant.price,
      quantity: item.quantity,
      image: item.product.image,
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

    const paymentMethodLabel =
      selectedPayment === 'cod'
        ? 'Cash on Delivery (Doorstep Cash / UPI QR)'
        : 'Online Payment (Prepaid)';

    const whatsappText = buildWhatsAppMessage({
      orderId,
      items: itemsSnapshot,
      customerName,
      customerPhone,
      address: chosenAddress.address,
      addressLabel: chosenAddress.label,
      slotLabel: chosenSlot.label,
      cartTotal,
      delivery,
      total,
      paymentMethod: paymentMethodLabel,
      note: customerNote,
      dateTime: dateTimeStr,
    });

    const whatsappUrl = `https://wa.me/${SELLER_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

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

    // Save order to MongoDB backend so it appears in Admin panel & customer order history
    fetch('/api/customer/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
        },
        delivery_slot: chosenSlot.label,
        subtotal: cartTotal,
        delivery_fee: delivery,
        discount,
        total,
        payment_method: 'cod',
        notes: customerNote || undefined,
      }),
    }).catch((err) => {
      console.warn('Could not post order to backend:', err);
    });

    // Automatically trigger WhatsApp redirect
    try {
      window.open(whatsappUrl, '_blank');
    } catch (e) {
      console.error('Failed to auto-open WhatsApp:', e);
    }
  };

  const handleCopyOrder = () => {
    if (!confirmedOrder) return;
    navigator.clipboard.writeText(confirmedOrder.whatsappText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (state.cart.length === 0 && step === 'cart') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] lg:min-h-[70vh] gap-4 px-4">
        <div className="w-28 h-28 rounded-full bg-neutral-100 flex items-center justify-center">
          <ShoppingBag size={48} className="text-neutral-300" />
        </div>
        <h2 className="text-xl lg:text-2xl font-bold text-neutral-700">Your cart is empty</h2>
        <p className="text-sm lg:text-base text-neutral-500 text-center max-w-md">
          Looks like you haven't added anything yet. Start shopping!
        </p>
        <button
          onClick={() => navigate('home')}
          className="mt-2 bg-primary-500 text-white font-semibold text-sm lg:text-base px-8 py-3 rounded-2xl active:scale-95 transition-transform hover:bg-primary-600"
        >
          Shop Now
        </button>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-[75vh] py-8 px-4 flex flex-col items-center justify-center max-w-2xl mx-auto">
        {/* Animated Celebration Icon */}
        <div className="relative mb-5">
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-500/10 animate-bounce">
            <CheckCircle2 size={56} />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold shadow-md">
            <Sparkles size={16} />
          </div>
        </div>

        <h2 className="text-2xl lg:text-3xl font-extrabold text-neutral-900 text-center">
          Order Placed Successfully!
        </h2>
        <p className="text-sm lg:text-base text-neutral-600 text-center max-w-md mt-1.5">
          Aapke order ki complete list automatic generate ho chuki hai aur WhatsApp order desk par ready hai.
        </p>

        {/* WhatsApp Dispatch Card */}
        {confirmedOrder && (
          <div className="w-full mt-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 border-2 border-emerald-300 rounded-3xl p-5 lg:p-6 shadow-xl shadow-emerald-600/5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                  <Send size={22} className="translate-x-0.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-neutral-900">WhatsApp Order Desk</h3>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">
                      Automated
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 font-medium">
                    Target Number: <span className="font-bold text-neutral-900">{DISPLAY_PHONE_NUMBER}</span>
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs lg:text-sm text-neutral-700 bg-white/80 backdrop-blur rounded-2xl p-3.5 border border-emerald-200/70 mb-4 leading-relaxed">
              Order ki itemized details WhatsApp window mein pre-fill kar di gayi hain. Agar WhatsApp tab open nahi hua ya aap dobara bhejna chahte hain, toh neeche diye button par click karein:
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={confirmedOrder.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-bold text-sm lg:text-base py-3.5 px-5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all text-center"
              >
                <Send size={18} />
                <span>Send to WhatsApp ({DISPLAY_PHONE_NUMBER})</span>
                <ExternalLink size={16} className="opacity-80" />
              </a>

              <button
                type="button"
                onClick={handleCopyOrder}
                className="bg-white hover:bg-neutral-50 active:scale-[0.98] text-neutral-700 font-semibold text-sm py-3.5 px-4 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-center gap-2 transition-all shrink-0"
              >
                {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Order List'}</span>
              </button>
            </div>

            {/* Toggle Preview */}
            <button
              type="button"
              onClick={() => setShowTextPreview(!showTextPreview)}
              className="mt-3 text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 transition-colors mx-auto"
            >
              <FileText size={14} />
              <span>{showTextPreview ? 'Hide WhatsApp Message Preview' : 'View Formatted WhatsApp Message'}</span>
            </button>

            {showTextPreview && (
              <div className="mt-3 bg-neutral-900 text-emerald-300 font-mono text-[11px] p-3.5 rounded-2xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-neutral-800">
                {confirmedOrder.whatsappText}
              </div>
            )}
          </div>
        )}

        {/* Order Details Breakdown Card */}
        {confirmedOrder && (
          <div className="w-full mt-6 bg-white rounded-3xl p-5 lg:p-6 shadow-card border border-neutral-100">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-neutral-100">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold">Order ID</span>
                <p className="text-base font-extrabold text-neutral-900">#{confirmedOrder.orderId}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold">Placed On</span>
                <p className="text-xs font-semibold text-neutral-600">{confirmedOrder.orderDate}, {confirmedOrder.orderTime}</p>
              </div>
            </div>

            {/* Customer & Delivery Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 p-3.5 bg-neutral-50 rounded-2xl text-xs text-neutral-700">
              <div>
                <p className="font-bold text-neutral-900 flex items-center gap-1.5 mb-1">
                  <User size={13} className="text-primary-600" />
                  <span>{confirmedOrder.customerName}</span>
                </p>
                <p className="text-neutral-500 flex items-center gap-1.5">
                  <Phone size={13} className="text-neutral-400" />
                  <span>{confirmedOrder.customerPhone}</span>
                </p>
              </div>
              <div>
                <p className="font-bold text-neutral-900 flex items-center gap-1.5 mb-1">
                  <MapPin size={13} className="text-primary-600" />
                  <span>{confirmedOrder.addressLabel}</span>
                </p>
                <p className="text-neutral-500 truncate" title={confirmedOrder.address}>
                  {confirmedOrder.address}
                </p>
                <p className="text-primary-700 font-semibold mt-1 flex items-center gap-1">
                  <Clock size={12} />
                  <span>Slot: {confirmedOrder.slotLabel}</span>
                </p>
              </div>
            </div>

            {/* Items List */}
            <div className="divide-y divide-neutral-100">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                Order Items ({confirmedOrder.items.length})
              </p>
              {confirmedOrder.items.map(item => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-xl shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-800 truncate">{item.name}</p>
                      <p className="text-xs text-neutral-400">{item.quantityLabel} × {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-neutral-900 shrink-0">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Final Bill */}
            <div className="mt-4 pt-4 border-t border-dashed border-neutral-200 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Items Subtotal</span>
                <span>₹{confirmedOrder.cartTotal}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Delivery Charge</span>
                <span className={confirmedOrder.delivery === 0 ? 'text-primary-600 font-semibold' : ''}>
                  {confirmedOrder.delivery === 0 ? 'FREE' : `₹${confirmedOrder.delivery}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-neutral-900 pt-2 border-t border-neutral-100">
                <span>Grand Total</span>
                <span className="text-base text-primary-600">₹{confirmedOrder.total}</span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Payment: <span className="font-semibold text-neutral-700">{confirmedOrder.paymentMethod}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3 mt-6">
          <button
            type="button"
            onClick={() => {
              navigate('home');
            }}
            className="flex-1 bg-primary-500 text-white font-semibold text-sm lg:text-base py-3.5 px-6 rounded-2xl hover:bg-primary-600 transition-colors text-center"
          >
            Continue Shopping
          </button>
          <button
            type="button"
            onClick={() => {
              navigate('profile', 'orders');
            }}
            className="bg-neutral-100 text-neutral-700 font-semibold text-sm lg:text-base py-3.5 px-6 rounded-2xl hover:bg-neutral-200 transition-colors text-center"
          >
            My Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 lg:pb-8">
      {/* Mobile Step header */}
      <div className="lg:hidden sticky top-[104px] z-40 bg-white px-4 py-3 flex items-center gap-3 border-b border-neutral-100">
        <button
          onClick={() => step === 'cart' ? navigate('home') : setStep('cart')}
          className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-neutral-700" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-neutral-800">
            {step === 'cart' ? 'My Cart' : step === 'address' ? 'Delivery Address' : step === 'delivery' ? 'Delivery Slot' : 'Payment'}
          </h2>
          {step === 'cart' && <p className="text-xs text-neutral-500">{cartCount} items</p>}
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => step === 'cart' ? navigate('home') : setStep('cart')}
            className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors"
          >
            <ArrowLeft size={20} className="text-neutral-700" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-neutral-800">
              {step === 'cart' ? 'My Cart' : step === 'address' ? 'Delivery Address' : step === 'delivery' ? 'Delivery Slot' : 'Payment'}
            </h2>
            {step === 'cart' && <p className="text-sm text-neutral-500">{cartCount} items in cart</p>}
          </div>
        </div>

        {/* Progress Stepper - Desktop */}
        <div className="flex items-center gap-3 mt-6">
          {(['cart', 'address', 'delivery', 'payment'] as CheckoutStep[]).map((s, i) => {
            const currentIndex = ['cart', 'address', 'delivery', 'payment'].indexOf(step);
            const isActive = currentIndex >= i;
            return (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 ${isActive ? 'text-primary-600' : 'text-neutral-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isActive ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-500'
                  }`}>
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium capitalize">{s === 'address' ? 'Address' : s}</span>
                </div>
                {i < 3 && <div className={`flex-1 h-1 rounded-full ${currentIndex > i ? 'bg-primary-500' : 'bg-neutral-200'}`} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Mobile Progress */}
      <div className="lg:hidden px-4 py-3 flex items-center gap-1">
        {(['cart', 'address', 'delivery', 'payment'] as CheckoutStep[]).map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              ['cart', 'address', 'delivery', 'payment'].indexOf(step) >= i
                ? 'bg-primary-500'
                : 'bg-neutral-200'
            }`}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8 lg:px-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Cart Step */}
            {step === 'cart' && (
              <div className="px-4 lg:px-0">
                {/* Mobile Delivery Banner */}
                {cartTotal < 299 && (
                  <div className="lg:hidden bg-accent-50 border border-accent-100 rounded-2xl p-3 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-accent-100 flex items-center justify-center flex-shrink-0">
                      <Truck size={14} className="text-accent-600" />
                    </div>
                    <p className="text-xs text-accent-700 font-medium">
                      Add ₹{299 - cartTotal} more for <span className="font-bold">FREE delivery</span>
                    </p>
                  </div>
                )}

                {/* Desktop Layout */}
                <div className="hidden lg:block">
                  <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                    <div className="divide-y divide-neutral-100">
                      {state.cart.map(item => (
                        <div key={`${item.product.id}-${item.variant.id}`} className="p-5 flex items-center gap-4">
                          <img
                            src={item.product.image || 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400'}
                            alt={item.product.name}
                            className="w-24 h-24 object-cover rounded-xl"
                          />
                          <div className="flex-1">
                            <p className="text-base font-semibold text-neutral-800">{item.product.name}</p>
                            <p className="text-sm text-neutral-500">{item.variant.quantity}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-lg font-bold text-neutral-800">₹{item.variant.price * item.quantity}</span>
                              {item.variant.original_price > item.variant.price && (
                                <span className="text-sm text-neutral-400 line-through">₹{item.variant.original_price * item.quantity}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => removeFromCart(item.product.id, item.variant.id)}
                              className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center hover:bg-rose-100 transition-colors"
                            >
                              <Trash2 size={16} className="text-rose-500" />
                            </button>
                            <div className="flex items-center gap-2 bg-primary-500 rounded-xl px-3 py-2">
                              <button onClick={() => updateCartQuantity(item.product.id, item.variant.id, item.quantity - 1)}>
                                <Minus size={14} className="text-white" />
                              </button>
                              <span className="text-sm font-bold text-white min-w-[16px] text-center">{item.quantity}</span>
                              <button onClick={() => updateCartQuantity(item.product.id, item.variant.id, item.quantity + 1)}>
                                <Plus size={14} className="text-white" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="flex flex-col gap-3 mb-4 lg:hidden">
                  {state.cart.map(item => (
                    <div key={`${item.product.id}-${item.variant.id}`} className="bg-white rounded-2xl p-3 shadow-card flex items-center gap-3">
                      <img
                        src={item.product.image || 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400'}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-800 line-clamp-2">{item.product.name}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{item.variant.quantity}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-neutral-800">₹{item.variant.price * item.quantity}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeFromCart(item.product.id, item.variant.id)}
                              className="w-7 h-7 rounded-xl bg-rose-50 flex items-center justify-center"
                            >
                              <Trash2 size={13} className="text-rose-500" />
                            </button>
                            <div className="flex items-center gap-2 bg-primary-500 rounded-xl px-2 py-1">
                              <button onClick={() => updateCartQuantity(item.product.id, item.variant.id, item.quantity - 1)}>
                                <Minus size={12} className="text-white" />
                              </button>
                              <span className="text-xs font-bold text-white min-w-[12px] text-center">{item.quantity}</span>
                              <button onClick={() => updateCartQuantity(item.product.id, item.variant.id, item.quantity + 1)}>
                                <Plus size={12} className="text-white" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Address Step */}
            {step === 'address' && (
              <div className="px-4 lg:px-0">
                <div className="flex flex-col gap-3">
                  {addresses.map(addr => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`bg-white rounded-2xl p-4 lg:p-5 shadow-card border-2 flex items-start gap-4 transition-colors text-left ${
                          isSelected ? 'border-primary-500 bg-primary-50/20' : 'border-transparent hover:border-neutral-200'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-primary-100' : 'bg-neutral-100'}`}>
                          <MapPinned size={18} className={isSelected ? 'text-primary-600' : 'text-neutral-500'} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-base font-semibold text-neutral-800">{addr.label}</p>
                            {isSelected && (
                              <CheckCircle2 size={18} className="text-primary-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-neutral-500 mt-1">{addr.address}</p>
                        </div>
                      </button>
                    );
                  })}

                  {!showAddAddress ? (
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(true)}
                      className="bg-white rounded-2xl p-4 lg:p-5 shadow-card border-2 border-dashed border-neutral-300 flex items-center gap-4 hover:border-primary-400 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                        <Plus size={18} className="text-neutral-500" />
                      </div>
                      <span className="text-sm font-semibold text-neutral-600">Add New Address</span>
                    </button>
                  ) : (
                    <form onSubmit={handleAddNewAddress} className="bg-white rounded-2xl p-5 shadow-card border border-primary-200 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-neutral-800">Add Delivery Address</h4>
                        <button
                          type="button"
                          onClick={() => setShowAddAddress(false)}
                          className="text-neutral-400 hover:text-neutral-600"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="flex gap-2">
                        {(['Home', 'Office', 'Other'] as const).map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setNewLabel(tag)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                              newLabel === tag
                                ? 'bg-primary-500 text-white border-primary-500'
                                : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>

                      <textarea
                        required
                        rows={3}
                        value={newAddressText}
                        onChange={e => setNewAddressText(e.target.value)}
                        placeholder="House / Flat No., Street, Landmark, Area, City - Pincode"
                        className="w-full text-sm p-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddAddress(false)}
                          className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 text-xs font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-xl shadow-md shadow-primary-500/20"
                        >
                          Save & Select
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Slot Step */}
            {step === 'delivery' && (
              <div className="px-4 lg:px-0">
                <div className="flex flex-col gap-4">
                  <div className="bg-primary-50 rounded-2xl p-4 flex items-center gap-2 border border-primary-100">
                    <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <Truck size={14} className="text-primary-600" />
                    </div>
                    <p className="text-sm text-primary-700 font-medium">Express delivery available</p>
                  </div>
                  <h3 className="text-base font-semibold text-neutral-800">Choose Delivery Slot</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {DELIVERY_SLOTS.map(slot => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot.id)}
                        className={`bg-white rounded-2xl p-4 lg:p-5 shadow-card border-2 flex items-center justify-between transition-all ${
                          selectedSlot === slot.id ? 'border-primary-500' : 'border-transparent hover:border-neutral-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedSlot === slot.id ? 'bg-primary-100' : 'bg-neutral-100'}`}>
                            <Clock size={18} className={selectedSlot === slot.id ? 'text-primary-600' : 'text-neutral-500'} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm lg:text-base font-semibold text-neutral-800">{slot.label}</p>
                            <p className="text-xs lg:text-sm text-neutral-500">{slot.sub}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {slot.badge && (
                            <span className="text-[10px] font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full hidden lg:inline">
                              {slot.badge}
                            </span>
                          )}
                          {selectedSlot === slot.id && <CheckCircle2 size={18} className="text-primary-500" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Payment & WhatsApp Confirmation Step */}
            {step === 'payment' && (
              <div className="px-4 lg:px-0 flex flex-col gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-card border-2 border-primary-500">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                      <Banknote size={28} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-neutral-900">Cash on Delivery (COD)</h3>
                        <span className="text-[11px] font-bold bg-primary-100 text-primary-800 px-2.5 py-0.5 rounded-full">
                          100% Guaranteed
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">
                        Pay ₹{total} in cash or scan UPI directly to our delivery pilot at your doorstep. Zero advance online payment needed.
                      </p>
                      <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 size={16} />
                        <span>Exact change or QR code scanner available with delivery pilot</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Dispatch Notice */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3.5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-emerald-950">Automatic WhatsApp Order Dispatch</h4>
                      <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                        {DISPLAY_PHONE_NUMBER}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      Jaise hi aap <strong>"Place Order"</strong> par click karenge, aapke items ki poori itemized list date, address aur total amount ke saath automatically prepare hokar seller ke WhatsApp number <strong>{DISPLAY_PHONE_NUMBER}</strong> par open ho jayegi. Bas aapko WhatsApp mein 'Send' dabana hoga!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-[140px]">
              <div className="bg-white rounded-2xl shadow-card p-6">
                {/* Bill Summary */}
                <h3 className="text-base font-bold text-neutral-800 mb-3">Bill Summary</h3>
                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Item Total ({cartCount} items)</span>
                    <span className="text-sm font-semibold text-neutral-800">₹{cartTotal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Delivery Fee</span>
                    <span className={`text-sm font-semibold ${delivery === 0 ? 'text-primary-600' : 'text-neutral-800'}`}>
                      {delivery === 0 ? 'FREE' : `₹${delivery}`}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Coupon Discount</span>
                      <span className="text-sm font-semibold text-primary-600">-₹{discount}</span>
                    </div>
                  )}
                  <div className="border-t border-dashed border-neutral-200 pt-2.5 mt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-neutral-800">Total</span>
                      <span className="text-lg font-bold text-neutral-800">₹{total}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Progress */}
                {step === 'cart' && cartTotal < 299 && (
                  <div className="mt-5 pt-5 border-t border-neutral-100">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingBasket size={14} className="text-accent-500" />
                      <span className="text-xs text-neutral-600">Add ₹{299 - cartTotal} more for FREE delivery</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500 rounded-full transition-all"
                        style={{ width: `${Math.min((cartTotal / 299) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (step === 'cart') setStep('address');
                    else if (step === 'address') setStep('delivery');
                    else if (step === 'delivery') setStep('payment');
                    else handlePlaceOrder();
                  }}
                  className={`mt-5 w-full font-semibold text-base py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                    step === 'payment'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                      : 'bg-primary-500 hover:bg-primary-600 text-white shadow-primary-500/20'
                  }`}
                >
                  {step === 'cart' ? (
                    <>
                      <span>Proceed to Checkout</span>
                      <ChevronRight size={18} />
                    </>
                  ) : step === 'address' ? (
                    <>
                      <span>Continue to Slot</span>
                      <ChevronRight size={18} />
                    </>
                  ) : step === 'delivery' ? (
                    <>
                      <span>Continue to Payment</span>
                      <ChevronRight size={18} />
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Place Order & Send to WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bill Summary - Only show in cart step */}
      {step === 'cart' && (
        <div className="lg:hidden px-4">
          <div className="bg-white rounded-2xl p-4 shadow-card">
            <h3 className="text-sm font-bold text-neutral-800 mb-3">Bill Summary</h3>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Item Total', value: `₹${cartTotal}` },
                { label: 'Delivery Fee', value: delivery === 0 ? 'FREE' : `₹${delivery}`, green: delivery === 0 },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">{row.label}</span>
                  <span className={`text-sm font-semibold ${row.green ? 'text-primary-600' : 'text-neutral-800'}`}>
                    {row.value}
                  </span>
                </div>
              ))}
              <div className="border-t border-dashed border-neutral-200 my-1" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-neutral-800">Total Amount</span>
                <span className="text-base font-bold text-neutral-800">₹{total}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Footer - Mobile */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 px-4 z-40">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-card-hover p-3 flex items-center justify-between gap-3 border border-neutral-100">
            <div>
              <span className="text-lg font-bold text-neutral-800">₹{total}</span>
              <p className="text-xs text-neutral-500">{cartCount} items</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (step === 'cart') setStep('address');
                else if (step === 'address') setStep('delivery');
                else if (step === 'delivery') setStep('payment');
                else handlePlaceOrder();
              }}
              className={`flex-1 font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform ${
                step === 'payment'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'bg-primary-500 text-white'
              }`}
            >
              {step === 'cart' ? (
                <>
                  <span>Proceed</span>
                  <ChevronRight size={16} />
                </>
              ) : step === 'address' ? (
                <>
                  <span>Next</span>
                  <ChevronRight size={16} />
                </>
              ) : step === 'delivery' ? (
                <>
                  <span>Continue</span>
                  <ChevronRight size={16} />
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Place Order (WhatsApp)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
