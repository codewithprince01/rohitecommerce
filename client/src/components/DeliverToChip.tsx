import React, { useEffect, useRef, useState } from 'react';
import { MapPin, ChevronDown, MapPinned } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface DeliverToChipProps {
  /** `compact` is the mobile header's smaller chip. */
  size?: 'sm' | 'md';
  /** Matches the surrounding header's accent. */
  tone?: 'primary' | 'emerald';
  className?: string;
}

const TONES = {
  primary: 'bg-primary-100 text-primary-600',
  emerald: 'bg-emerald-100 text-emerald-700',
};

/**
 * The "Deliver to" chip.
 *
 * The chip only has room for the first part of an address, so tapping it opens
 * the full thing — read-only. Addresses are added at checkout and managed in
 * the profile; this is purely for checking where the order is going.
 */
export default function DeliverToChip({ size = 'md', tone = 'primary', className = '' }: DeliverToChipProps) {
  const { deliveryLocation, navigate } = useApp();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const short = deliveryLocation.area || deliveryLocation.city;
  const full = deliveryLocation.full || [deliveryLocation.area, deliveryLocation.city, deliveryLocation.pincode]
    .filter(Boolean)
    .join(', ');
  const hasAddress = Boolean(full);

  const small = size === 'sm';

  return (
    <div className={`relative ${className}`} ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="See the full delivery address"
        className={`flex items-center min-w-0 text-left transition-colors rounded-xl ${
          small ? 'gap-1.5 px-1 py-0.5' : 'gap-2 px-3 py-2 hover:bg-neutral-50'
        }`}
      >
        <div
          className={`rounded-full flex items-center justify-center flex-shrink-0 ${TONES[tone]} ${
            small ? 'w-7 h-7' : 'w-8 h-8'
          }`}
        >
          <MapPin size={small ? 14 : 16} />
        </div>
        <div className="min-w-0 text-left">
          <span className={`text-neutral-500 font-medium leading-none block ${small ? 'text-[10px]' : 'text-[11px]'}`}>
            Deliver to
          </span>
          <span className="text-xs font-bold text-neutral-800 flex items-center gap-1">
            <span className={`truncate ${small ? 'max-w-[100px] sm:max-w-[130px]' : 'max-w-[140px]'}`}>
              {short || 'No address yet'}
            </span>
            <ChevronDown
              size={small ? 11 : 12}
              className={`text-neutral-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </span>
        </div>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Delivery address"
          className="absolute right-0 top-full mt-2 w-[280px] bg-white rounded-2xl shadow-xl border border-neutral-200 p-4 z-50"
        >
          {hasAddress ? (
            <>
              <div className="flex items-start gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${TONES[tone]}`}>
                  <MapPinned size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">Delivering to</p>
                  {deliveryLocation.addressLabel && (
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[10px] font-bold">
                      {deliveryLocation.addressLabel}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-neutral-700 leading-relaxed mt-2.5">{full}</p>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate('profile', 'addresses');
                }}
                className="mt-3 w-full text-xs font-bold text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg py-2 transition-colors"
              >
                Manage addresses
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-neutral-600 leading-relaxed">
                No delivery address saved yet. Add one at checkout, or from your profile.
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate('profile', 'addresses');
                }}
                className="mt-3 w-full text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg py-2 transition-colors"
              >
                Add an address
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
