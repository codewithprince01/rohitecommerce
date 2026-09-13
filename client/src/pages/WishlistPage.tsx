import React, { useState, useEffect } from 'react';
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAllProducts } from '../lib/data';
import type { ProductWithVariants } from '../lib/supabase';
import ProductCard from '../components/ProductCard';

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
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Heart size={24} className="fill-rose-500 text-rose-500" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-neutral-800">
              My Saved Wishlist
            </h1>
            <p className="text-xs text-neutral-500">
              {wishlist.length === 0
                ? 'No items saved yet'
                : `${wishlist.length} item${wishlist.length > 1 ? 's' : ''} saved for later`}
            </p>
          </div>
        </div>

        {wishlist.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleMoveAllToCart}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <ShoppingCart size={15} />
              <span>Move All to Cart</span>
            </button>
            <button
              onClick={clearWishlist}
              className="px-3 py-2 bg-neutral-100 hover:bg-rose-50 hover:text-rose-600 text-neutral-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={15} />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : wishlist.length === 0 || products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200 p-8 lg:p-14 text-center max-w-md mx-auto my-8 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <Heart size={36} />
          </div>
          <h3 className="text-lg font-bold text-neutral-800">Your wishlist is empty</h3>
          <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
            Tap the heart icon on any grocery item to save it here for fast reordering and price drops!
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => navigate('categories')}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
            >
              <ShoppingBag size={16} />
              <span>Browse Categories</span>
            </button>
            <button
              onClick={() => navigate('offers')}
              className="w-full py-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-semibold rounded-2xl text-xs border border-neutral-200"
            >
              View Today's Offers & Deals
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Value Proposition */}
          <div className="mt-10 p-5 bg-emerald-50/60 rounded-3xl border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-900">Price Drop & Stock Protection</h4>
                <p className="text-[11px] text-emerald-700">Items in your wishlist notify you when price decreases.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('offers')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl whitespace-nowrap"
            >
              Check Active Coupons
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
