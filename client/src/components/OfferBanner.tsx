import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import type { StoreBanner } from '../lib/banners';

interface OfferBannerProps {
  offers: StoreBanner[];
  onSelect?: (banner: StoreBanner) => void;
}

// Maps a stored tailwind bg class to a gradient for a richer hero look.
const bgMap: Record<string, string> = {
  'bg-primary-500': 'from-primary-500 to-primary-400',
  'bg-green-500': 'from-green-500 to-green-400',
  'bg-orange-400': 'from-orange-400 to-amber-400',
  'bg-blue-500': 'from-blue-500 to-cyan-400',
  'bg-rose-500': 'from-rose-500 to-pink-400',
  'bg-violet-500': 'from-violet-500 to-purple-400',
  'bg-amber-500': 'from-amber-500 to-yellow-400',
  'bg-cyan-500': 'from-cyan-500 to-sky-400',
  'bg-neutral-800': 'from-neutral-800 to-neutral-700',
};

export default function OfferBanner({ offers, onSelect }: OfferBannerProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (offers.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % offers.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [offers.length]);

  // Keep index valid if the banner list changes.
  useEffect(() => {
    if (current >= offers.length) setCurrent(0);
  }, [offers.length, current]);

  if (!offers.length) return null;

  const offer = offers[current] ?? offers[0];
  const gradient = bgMap[offer.bg_color] || 'from-primary-500 to-primary-400';

  const goPrev = () => setCurrent((c) => (c - 1 + offers.length) % offers.length);
  const goNext = () => setCurrent((c) => (c + 1) % offers.length);

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-card group">
      {/* Desktop: Side by side layout */}
      <div
        className={`hidden lg:flex bg-gradient-to-r ${gradient} transition-all duration-500`}
        style={{ minHeight: 160 }}
      >
        <div className="flex-1 p-8 flex flex-col justify-center">
          <h3 className="text-white font-bold text-2xl leading-tight">{offer.title}</h3>
          {offer.subtitle && <p className="text-white/80 text-base mt-1">{offer.subtitle}</p>}
          <button
            onClick={() => onSelect?.(offer)}
            className="mt-4 bg-white rounded-xl px-6 py-2 text-sm font-semibold text-neutral-700 w-fit hover:scale-105 transition-transform"
          >
            Shop Now
          </button>
        </div>
        {offer.image && (
          <div className="w-72 h-full flex items-center justify-center p-6">
            <img src={offer.image} alt={offer.title} className="w-full h-full object-cover rounded-xl" loading="lazy" />
          </div>
        )}

        {offers.length > 1 && (
          <>
            <button onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeft size={20} className="text-white" />
            </button>
            <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight size={20} className="text-white" />
            </button>
          </>
        )}
      </div>

      {/* Mobile: compact layout */}
      <div
        className={`lg:hidden bg-gradient-to-r ${gradient} p-4 flex items-center gap-3 transition-all duration-500`}
        style={{ minHeight: 120 }}
      >
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg leading-tight">{offer.title}</h3>
          {offer.subtitle && <p className="text-white/80 text-sm mt-1">{offer.subtitle}</p>}
          <button
            onClick={() => onSelect?.(offer)}
            className="mt-3 bg-white rounded-xl px-4 py-1.5 text-xs font-semibold text-neutral-700 active:scale-95 transition-transform"
          >
            Shop Now
          </button>
        </div>
        <div className="w-28 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-white/15 flex items-center justify-center">
          {offer.image ? (
            <img src={offer.image} alt={offer.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <ShoppingBag size={28} className="text-white/70" />
          )}
        </div>
      </div>

      {/* Dots */}
      {offers.length > 1 && (
        <div className="absolute bottom-3 left-4 flex gap-1.5">
          {offers.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${i === current ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
