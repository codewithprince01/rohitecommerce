import React from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ZeptoHeroBanners() {
  const { setCategory, navigate } = useApp();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 lg:mb-8">
      {/* Left Card: All New Zepto Experience */}
      <div className="bg-[#F4EEFD] border border-[#E9D5FF] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div>
          {/* Top Title */}
          <div className="flex items-center gap-1.5 mb-4 text-center sm:text-left justify-center sm:justify-start">
            <span className="text-xs sm:text-sm font-black text-[#3B125A] tracking-wider uppercase">ALL</span>
            <span className="text-xs sm:text-sm font-black text-[#9333EA] tracking-wider uppercase">NEW ZEPTO</span>
            <span className="text-xs sm:text-sm font-black text-[#3B125A] tracking-wider uppercase">EXPERIENCE</span>
          </div>

          {/* 2 White Feature Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Widget 1: ₹0 FEES */}
            <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-purple-100/80 flex items-center gap-2.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                <span className="font-black text-xl tracking-tighter">Z</span>
              </div>
              <div>
                <span className="text-lg sm:text-2xl font-black text-[#3B125A] tracking-tight block leading-none">
                  ₹0 FEES
                </span>
              </div>
            </div>

            {/* Widget 2: EVERYDAY LOW PRICES */}
            <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-purple-100/80 flex items-center gap-2.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#A855F7] to-[#7E22CE] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
              </div>
              <div className="leading-tight">
                <span className="text-[10px] sm:text-[11px] font-black text-[#6B21A8] uppercase tracking-wider block">
                  EVERYDAY
                </span>
                <span className="text-xs sm:text-sm font-black text-[#3B125A] tracking-tight flex items-center gap-0.5">
                  LOW PRICES <span className="text-xs">▼</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom 3 Green Checkmarks & Disclaimer */}
        <div>
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3 pt-1 border-t border-purple-200/50">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-[#16A34A] text-white flex items-center justify-center">
                <Check size={10} className="stroke-[3]" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-[#3B125A]">
                ₹0 Handling Fee
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-[#16A34A] text-white flex items-center justify-center">
                <Check size={10} className="stroke-[3]" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-[#3B125A]">
                ₹0 Delivery Fee*
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-[#16A34A] text-white flex items-center justify-center">
                <Check size={10} className="stroke-[3]" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-[#3B125A]">
                ₹0 Rain & Surge Fee
              </span>
            </div>
          </div>
          <p className="text-[9px] text-[#6B21A8]/70 mt-2 text-center sm:text-left">
            *T&C Apply. Above specific minimum order value
          </p>
        </div>
      </div>

      {/* Right Card: Paan Corner */}
      <div className="bg-[#E5F7F6] border border-[#99F6E4] rounded-3xl p-5 sm:p-6 shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="z-10 max-w-[58%]">
          <h3 className="text-2xl sm:text-3xl font-black text-[#0B4D43] tracking-tight leading-none">
            PAAN CORNER
          </h3>
          <p className="text-xs sm:text-sm text-[#0B4D43]/85 font-medium mt-2 leading-snug">
            Get smoking accessories, fresheners & more delivered in minutes!
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory('snacks-namkeen');
              navigate('categories');
            }}
            className="mt-4 bg-[#1F2937] hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-full inline-flex items-center gap-1 shadow-sm active:scale-95 transition-all"
          >
            <span>Order now</span>
            <ChevronRight size={14} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Paan Corner Visual Showcase */}
        <div className="relative w-36 sm:w-44 h-32 sm:h-36 flex items-center justify-center flex-shrink-0">
          <div className="relative flex items-center justify-center">
            {/* Background Accent Card */}
            <div className="w-24 h-28 bg-white/95 rounded-2xl shadow-md rotate-6 transform p-1.5 border border-teal-100 flex flex-col justify-between">
              <div className="w-full h-16 bg-neutral-100 rounded-lg overflow-hidden flex items-center justify-center">
                <span className="text-2xl font-black text-neutral-700 tracking-tighter">6</span>
                <span className="text-[8px] font-bold text-neutral-500 uppercase ml-1">BROWN<br/>CONES</span>
              </div>
              <div className="bg-neutral-800 text-white text-[8px] font-black text-center py-1 rounded">
                stash-pro
              </div>
            </div>

            {/* Foreground Lighter & Accessories */}
            <div className="absolute -left-3 bottom-0 w-16 h-24 bg-neutral-900 rounded-xl shadow-lg -rotate-12 transform p-1 border border-neutral-700 flex flex-col justify-between">
              <div className="w-full h-3 bg-amber-400 rounded-t-sm" />
              <div className="text-white text-[8px] font-bold text-center tracking-widest uppercase">
                LIGHTER
              </div>
              <div className="w-2 h-2 rounded-full bg-red-500 mx-auto mb-1" />
            </div>

            {/* Pack pill */}
            <div className="absolute -bottom-1 -right-1 bg-white text-neutral-900 font-extrabold text-[9px] px-2 py-0.5 rounded-full shadow border border-neutral-200">
              stash-pro
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
