import React from 'react';
import { Home, Grid3X3, Search, ShoppingCart, User, Leaf, Tag, Heart } from 'lucide-react';
import { useApp, PageType } from '../context/AppContext';

interface NavItem {
  id: PageType;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  badge?: string;
}

const desktopTabs: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'categories', label: 'Categories', icon: Grid3X3 },
  { id: 'offers', label: 'Offers & Deals', icon: Tag, badge: 'HOT' },
  { id: 'wishlist', label: 'Saved Wishlist', icon: Heart },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'cart', label: 'Cart', icon: ShoppingCart },
  { id: 'profile', label: 'Profile', icon: User },
];

const mobileTabs: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'categories', label: 'Categories', icon: Grid3X3 },
  { id: 'offers', label: 'Offers', icon: Tag },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'cart', label: 'Cart', icon: ShoppingCart },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const { state, navigate, cartCount, wishlistCount } = useApp();

  return (
    <>
      {/* Desktop Sidebar - Left Side */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-neutral-100 z-40 overflow-y-auto">
        {/* Logo */}
        <div className="p-6 border-b border-neutral-100">
          <button onClick={() => navigate('home')} className="flex items-center gap-3 text-left">
            <div className="w-11 h-11 rounded-2xl bg-primary-500 flex items-center justify-center shadow-sm flex-shrink-0">
              <Leaf size={22} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-neutral-800 tracking-tight">FreshMart</span>
              <p className="text-[10px] text-neutral-500 -mt-0.5">Express Grocery Store</p>
            </div>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 flex flex-col gap-1.5">
          {desktopTabs.map(({ id, label, icon: Icon, badge }) => {
            const active = state.currentPage === id;
            const isCart = id === 'cart';
            const isWishlist = id === 'wishlist';
            return (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                  active
                    ? 'bg-primary-500 text-white font-semibold shadow-sm'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
                  <span className="text-sm font-medium">{label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {badge && !active && (
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase">
                      {badge}
                    </span>
                  )}
                  {isWishlist && wishlistCount > 0 && (
                    <span
                      className={`min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center ${
                        active ? 'bg-white text-rose-600' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {wishlistCount}
                    </span>
                  )}
                  {isCart && cartCount > 0 && (
                    <span
                      className={`min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center ${
                        active ? 'bg-white text-primary-600' : 'bg-primary-500 text-white'
                      }`}
                    >
                      {cartCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 mt-auto">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-4 text-white shadow-md">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold">10 MINS</span>
              <p className="text-xs font-bold">Instant Delivery</p>
            </div>
            <p className="text-[11px] text-emerald-100 mt-1">Farm fresh fruits, milk & groceries</p>
            <button
              onClick={() => navigate('offers')}
              className="mt-3 w-full bg-white text-emerald-700 text-xs font-bold py-2 rounded-xl hover:bg-emerald-50 active:scale-95 transition-all shadow-sm"
            >
              View Coupon Deals
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white shadow-bottom border-t border-neutral-100">
        <div className="max-w-md mx-auto flex items-center justify-around px-1 py-1.5">
          {mobileTabs.map(({ id, label, icon: Icon }) => {
            const active = state.currentPage === id;
            const isCart = id === 'cart';
            const isWishlist = id === 'wishlist';
            return (
              <button
                key={id}
                onClick={() => navigate(id)}
                className="flex flex-col items-center gap-0.5 flex-1 py-1 relative"
              >
                <div
                  className={`relative w-9 h-9 flex items-center justify-center rounded-2xl transition-all duration-200 ${
                    active ? 'bg-primary-500 text-white' : 'bg-transparent text-neutral-500'
                  }`}
                >
                  <Icon
                    size={19}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                  {isWishlist && wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                  {isCart && cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-primary-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[9px] font-medium transition-colors leading-tight ${
                    active ? 'text-primary-600 font-bold' : 'text-neutral-500'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
