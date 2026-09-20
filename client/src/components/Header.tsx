import React, { useState, useEffect } from 'react';
import { MapPin, ShoppingCart, Bell, ChevronDown, Search, Mic, X, User, Heart } from 'lucide-react';
import { useApp, PageType } from '../context/AppContext';
import DeliveryLocationModal from './DeliveryLocationModal';
import NotificationsModal from './NotificationsModal';

export default function Header() {
  const { cartCount, wishlistCount, deliveryLocation, navigate, setSearch, state } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [locationModalOpen, setLocationModalOpen] = useState(false);
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
                    placeholder="Search groceries, brands, offers..."
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
                <button
                  onClick={() => setLocationModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-200"
                >
                  <MapPin size={18} className="text-primary-600 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-[11px] text-neutral-500 font-medium">Deliver to</p>
                    <p className="text-xs font-bold text-neutral-800 flex items-center gap-1">
                      <span className="truncate max-w-[110px]">{deliveryLocation.area || deliveryLocation.city}</span>
                      <ChevronDown size={12} className="text-neutral-400" />
                    </p>
                  </div>
                </button>

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
            <div className="flex items-center justify-between py-3">
              <button
                onClick={() => setLocationModalOpen(true)}
                className="flex items-center gap-1.5 min-w-0"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-primary-600" />
                </div>
                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-0.5">
                    <span className="text-[10px] text-neutral-500 font-medium">Delivering to</span>
                    <ChevronDown size={12} className="text-neutral-400" />
                  </div>
                  <span className="text-xs font-bold text-neutral-800 block truncate max-w-[220px]">
                    {deliveryLocation.area || deliveryLocation.city}
                  </span>
                </div>
              </button>

              <div className="flex items-center">
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
                  placeholder="Search groceries, brands, offers..."
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

      {/* Location Modal */}
      <DeliveryLocationModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
      />
    </>
  );
}
