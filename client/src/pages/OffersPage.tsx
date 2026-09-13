import React, { useState, useEffect } from 'react';
import {
  Tag,
  Copy,
  Check,
  Percent,
  Sparkles,
  Clock,
  ArrowRight,
  Gift,
  ShieldCheck,
  CreditCard,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getFeaturedProducts } from '../lib/data';
import type { ProductWithVariants } from '../lib/supabase';
import ProductCard from '../components/ProductCard';

interface Coupon {
  code: string;
  title: string;
  discount: string;
  minOrder: string;
  validTill: string;
  category: string;
  description: string;
}

const coupons: Coupon[] = [
  {
    code: 'WELCOME100',
    title: 'New Customer Special',
    discount: 'Flat ₹100 OFF',
    minOrder: 'Min order ₹399',
    validTill: 'Valid on 1st order',
    category: 'All Items',
    description: 'Flat Rs 100 discount applied at cart checkout. Valid for all new shoppers.',
  },
  {
    code: 'FRESH50',
    title: 'Fresh Mart Savings',
    discount: 'Flat ₹50 OFF',
    minOrder: 'Min order ₹299',
    validTill: 'Expires in 3 days',
    category: 'Groceries',
    description: 'Extra Rs 50 savings across dairy, snacks, cooking essentials, and fruits.',
  },
  {
    code: 'VEGGIE20',
    title: 'Farm Fresh Organic',
    discount: '20% OFF',
    minOrder: 'Min order ₹199',
    validTill: 'Valid this week',
    category: 'Vegetables & Fruits',
    description: 'Enjoy crisp organic vegetables directly sourced from local farmers.',
  },
  {
    code: 'FREEFLY',
    title: 'Zero Delivery Fee',
    discount: 'FREE Delivery',
    minOrder: 'No min order',
    validTill: 'Daily 10am - 8pm',
    category: 'Express Delivery',
    description: 'Get free priority 10-15 minute delivery straight to your doorstep.',
  },
  {
    code: 'SUPER300',
    title: 'Monthly Mega Stockup',
    discount: 'Flat ₹300 OFF',
    minOrder: 'Min order ₹1,499',
    validTill: 'End of Month',
    category: 'Bulk Cart',
    description: 'Stock up your kitchen for the month and unlock flat Rs 300 mega discount.',
  },
];

const bankOffers = [
  {
    bank: 'Google Pay / PhonePe UPI',
    offer: 'Get up to ₹75 Scratch Card Cashback',
    terms: 'Valid on UPI payment above ₹350',
  },
  {
    bank: 'HDFC Bank Cards',
    offer: 'Instant 10% Discount up to ₹150',
    terms: 'Use debit or credit card on checkout',
  },
  {
    bank: 'ICICI Net Banking',
    offer: 'Flat ₹100 Cashback on order',
    terms: 'Applicable on min cart value ₹799',
  },
  {
    bank: 'Paytm Wallet',
    offer: 'Guaranteed 5% Cashback Points',
    terms: 'Add wallet balance and redeem instantly',
  },
];

export default function OffersPage() {
  const { navigate } = useApp();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [dealProducts, setDealProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDeals() {
      try {
        const data = await getFeaturedProducts();
        setDealProducts(data);
      } catch (e) {
        console.error('Failed to load deals', e);
      } finally {
        setLoading(false);
      }
    }
    loadDeals();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-primary-700 text-white p-6 lg:p-10 shadow-xl">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-4">
            <Sparkles size={14} className="text-amber-300" />
            <span>EXCLUSIVE SAVINGS FESTIVAL</span>
          </div>
          <h1 className="text-2xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Best Deals, Coupons & Bank Offers
          </h1>
          <p className="mt-2 text-sm lg:text-base text-emerald-50 opacity-90 leading-relaxed">
            Save big on fresh vegetables, dairy, snacks, and kitchen pantry with verified coupons & flash sales.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('categories')}
              className="px-5 py-2.5 bg-white text-emerald-700 font-bold rounded-xl text-sm shadow-md hover:bg-emerald-50 transition-all active:scale-95 flex items-center gap-2"
            >
              <span>Explore Categories</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('cart')}
              className="px-5 py-2.5 bg-emerald-800/60 hover:bg-emerald-800/80 border border-white/20 text-white font-bold rounded-xl text-sm transition-all"
            >
              Go to Cart
            </button>
          </div>
        </div>

        {/* Decorative graphic background */}
        <div className="absolute right-0 -bottom-10 opacity-20 lg:opacity-30 pointer-events-none transform translate-x-12 translate-y-6">
          <Tag size={320} className="text-white" />
        </div>
      </div>

      {/* Coupons Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-neutral-800 flex items-center gap-2">
              <Tag size={20} className="text-primary-600" />
              <span>Active Promo Codes</span>
            </h2>
            <p className="text-xs text-neutral-500">Tap to copy code and paste directly during checkout</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon) => {
            const isCopied = copiedCode === coupon.code;
            return (
              <div
                key={coupon.code}
                className="relative bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 border border-primary-100">
                      {coupon.category}
                    </span>
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <Clock size={12} />
                      {coupon.validTill}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-neutral-900">{coupon.discount}</h3>
                  <p className="text-xs font-semibold text-neutral-700 mt-0.5">{coupon.title}</p>
                  <p className="text-xs text-neutral-500 mt-2 leading-relaxed">{coupon.description}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-dashed border-neutral-200 flex items-center justify-between gap-3">
                  <div className="bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-xl font-mono text-sm font-bold text-neutral-800 tracking-wider">
                    {coupon.code}
                  </div>
                  <button
                    onClick={() => handleCopy(coupon.code)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-primary-500 hover:bg-primary-600 text-white active:scale-95'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} className="stroke-[3]" />
                        <span>COPIED!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>COPY CODE</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flash Deals / Steal of the Day */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-neutral-800 flex items-center gap-2">
              <Zap size={20} className="text-amber-500 fill-amber-500" />
              <span>Today's Top Discounted Products</span>
            </h2>
            <p className="text-xs text-neutral-500">Handpicked items with biggest price cuts right now</p>
          </div>
          <button
            onClick={() => navigate('categories')}
            className="text-xs font-bold text-primary-600 hover:text-primary-700"
          >
            See All &rarr;
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {dealProducts.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Bank & Payment Partner Offers */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg lg:text-xl font-bold text-neutral-800 flex items-center gap-2">
            <CreditCard size={20} className="text-primary-600" />
            <span>Bank & Payment Partner Cashback</span>
          </h2>
          <p className="text-xs text-neutral-500">Extra instant savings with your favorite payment mode</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bankOffers.map((item, idx) => (
            <div
              key={idx}
              className="p-4 bg-white rounded-2xl border border-neutral-200/80 shadow-card flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 mb-3">
                  <CreditCard size={18} />
                </div>
                <h4 className="text-xs font-bold text-neutral-800">{item.bank}</h4>
                <p className="text-sm font-extrabold text-emerald-600 mt-1">{item.offer}</p>
                <p className="text-[11px] text-neutral-500 mt-1">{item.terms}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center gap-1 text-[10px] text-neutral-400">
                <ShieldCheck size={12} className="text-emerald-600" />
                <span>Auto applied on checkout</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
