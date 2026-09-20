import React, { useState, useEffect } from 'react';
import {
  Heart,
  ShoppingCart,
  Trash2,
  ShoppingBag,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAllProducts } from '../lib/data';
import type { ProductWithVariants } from '../lib/supabase';
import ZeptoProductCard from '../components/ZeptoProductCard';

export default function WishlistPage() {
  const { wishlist, clearWishlist, navigate, addToCart } = useApp();
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWishlistItems() {
      setLoading(true);
      try {
        const all = await getAllProducts();
        const filtered = all.filter((p) => wishlist.includes(p.id));
        setProducts(filtered);
      } catch (err) {
        console.error('Failed to load wishlist items', err);
      } finally {
        setLoading(false);
      }
    }

    loadWishlistItems();
  }, [wishlist]);

  const handleMoveAllToCart = () => {
    products.forEach((product) => {
      if (product.variants && product.variants.length > 0) {
        addToCart(product, product.variants[0]);
      }
    });
    navigate('cart');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* Page Header Strip - Compact and Clean */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <Heart size={18} className="fill-rose-500 text-rose-500" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
              My Saved Wishlist
            </h1>
            <p className="text-[11px] sm:text-xs text-neutral-500 font-medium">
              {wishlist.length === 0
                ? 'No items saved yet'
                : `${wishlist.length} item${wishlist.length > 1 ? 's' : ''} saved for instant reorder`}
            </p>
          </div>
        </div>

        {wishlist.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleMoveAllToCart}
              className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <ShoppingCart size={13} />
              <span>Move All to Cart</span>
            </button>
            <button
              type="button"
              onClick={clearWishlist}
              className="px-2.5 py-1.5 bg-neutral-100 hover:bg-rose-50 hover:text-rose-600 text-neutral-600 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[35vh]">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : wishlist.length === 0 || products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-8 sm:p-12 text-center max-w-md mx-auto my-6 shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto mb-3">
            <Heart size={30} />
          </div>
          <h3 className="text-base font-bold text-neutral-800">Your wishlist is empty</h3>
          <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
            Tap the heart icon on any grocery item to save it here for fast reordering!
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigate('categories')}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all"
            >
              <ShoppingBag size={14} />
              <span>Browse Categories</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('offers')}
              className="w-full py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-semibold rounded-xl text-xs border border-neutral-200"
            >
              View Today's Offers & Deals
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Grid using ZeptoProductCard with compact gap */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
            {products.map((product) => (
              <ZeptoProductCard
                key={product.id}
                product={product}
                className="w-full"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
