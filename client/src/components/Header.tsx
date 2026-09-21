import React, { useState, useEffect } from 'react';
import { MapPin, ShoppingCart, Bell, Search, Mic, X, User, Heart } from 'lucide-react';
import { useApp, PageType } from '../context/AppContext';
import NotificationsModal from './NotificationsModal';
import DeliverToChip from './DeliverToChip';

export default function Header() {
  const { cartCount, wishlistCount, deliveryLocation, navigate, setSearch, state } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (val: string) => {
    setLocalSearch(val);
    setSearch(val);
  };

  const clearSearch = () => {
    setLocalSearch('');
    setSearch('');
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 lg:left-64 right-0 z-40 transition-all duration-200 ${
          scrolled ? 'bg-white shadow-header' : 'bg-white border-b border-neutral-100'
        }`}
      >
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <div className="max-w-7xl mx-auto px-6">
            {/* Top bar */}
            <div className="flex items-center justify-between py-3.5 border-b border-neutral-100 gap-6">

              {/* Search */}
              <div className="flex-1 max-w-lg mx-8">
                <div className="flex items-center gap-3 bg-neutral-50 rounded-2xl px-4 py-2.5 border border-neutral-200 focus-within:border-primary-400 transition-colors">
                  <Search size={18} className="text-neutral-400" />
                  <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search products, categories, brands…"
                    className="flex-1 bg-transparent text-sm text-neutral-700 placeholder-neutral-400 outline-none"
                  />
                  {localSearch ? (
                    <button onClick={clearSearch}>
                      <X size={16} className="text-neutral-400" />
                    </button>
                  ) : (
                    <button>
                      <Mic size={16} className="text-neutral-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* RightActions */}
              <div className="flex items-center gap-3">
                <DeliverToChip />

                {/* Notifications Bell */}
                <button
                  onClick={() => setNotificationsModalOpen(true)}
                  title="Notifications & Alerts"
                  className="relative w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center hover:bg-neutral-100 transition-colors"
                >
                  <Bell size={18} className="text-neutral-600" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-500" />
                </button>

                {/* Wishlist Icon */}
                <button
                  onClick={() => navigate('wishlist')}
                  title="My Wishlist"
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    state.currentPage === 'wishlist'
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-neutral-50 hover:bg-rose-50 text-neutral-600 hover:text-rose-600'
                  }`}
                >
                  <Heart size={18} className={wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : ''} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </button>

                {/* Cart Icon */}
                <button
                  onClick={() => navigate('cart')}
                  className="relative w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center hover:bg-primary-100 transition-colors"
                >
                  <ShoppingCart size={18} className="text-primary-600" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>

                {/* Profile Button */}
                <button
                  onClick={() => navigate('profile')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                >
                  <User size={16} />
                  <span className="text-sm font-semibold">Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        {state.currentPage !== 'product-detail' && (
          <div className="lg:hidden">
          <div className="max-w-md mx-auto px-4">
            {/* Top bar */}
            <div className="flex items-center justify-between py-2.5 gap-2">
              <button onClick={() => navigate('home')} className="flex items-center flex-shrink-0" aria-label="Home">
                <img
                  src="/agrawal_log.png"
                  alt="Agrawal Store"
                  className="h-9 sm:h-10 w-auto max-w-[145px] sm:max-w-[175px] object-contain"
                />
              </button>

              <DeliverToChip size="sm" className="min-w-0 flex-1 flex justify-end" />

              <div className="flex items-center flex-shrink-0">
                <button
                  className="relative w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors active:scale-95"
                  onClick={() => navigate('cart')}
                  aria-label="View Cart"
                >
                  <ShoppingCart size={18} className="text-neutral-700" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Search bar */}
            <div className="pb-3">
              <div className="flex items-center gap-3 bg-neutral-100 rounded-2xl px-4 py-2.5 border border-neutral-200">
                <Search size={18} className="text-neutral-400 flex-shrink-0" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search products, categories, brands…"
                  className="flex-1 bg-transparent text-xs sm:text-sm text-neutral-700 placeholder-neutral-400 outline-none min-w-0"
                />
                {localSearch ? (
                  <button onClick={clearSearch}>
                    <X size={16} className="text-neutral-400" />
                  </button>
                ) : (
                  <button>
                    <Mic size={16} className="text-neutral-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
      />
    </>
  );
}
