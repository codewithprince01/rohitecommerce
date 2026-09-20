import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import type { ProductWithVariants, ProductVariant } from '../lib/supabase';

export interface CartItem {
  product: ProductWithVariants;
  variant: ProductVariant;
  quantity: number;
}

export interface DeliveryLocation {
  city: string;
  area: string;
  pincode: string;
  addressLabel?: string;
}

export type PageType =
  | 'home'
  | 'categories'
  | 'subcategories'
  | 'brands'
  | 'products'
  | 'product-detail'
  | 'cart'
  | 'profile'
  | 'search'
  | 'offers'
  | 'wishlist';

export type ProfileTabType = 'orders' | 'addresses' | 'wallet' | 'coupons' | 'settings' | 'support';

interface AppState {
  currentPage: PageType;
  profileTab: ProfileTabType;
  selectedCategorySlug: string | null;
  selectedSubcategorySlug: string | null;
  selectedBrandSlug: string | null;
  selectedProductId: string | null;
  searchQuery: string;
  cart: CartItem[];
  wishlist: string[];
  deliveryLocation: DeliveryLocation;
}

type AppAction =
  | { type: 'SET_PAGE'; page: PageType; profileTab?: ProfileTabType }
  | { type: 'SET_PROFILE_TAB'; tab: ProfileTabType }
  | { type: 'SET_CATEGORY'; slug: string | null }
  | { type: 'SET_SUBCATEGORY'; slug: string | null }
  | { type: 'SET_BRAND'; slug: string | null }
  | { type: 'SET_PRODUCT'; productId: string | null }
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'ADD_TO_CART'; product: ProductWithVariants; variant: ProductVariant }
  | { type: 'REMOVE_FROM_CART'; productId: string; variantId: string }
  | { type: 'UPDATE_CART_QUANTITY'; productId: string; variantId: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_WISHLIST'; productId: string }
  | { type: 'REMOVE_FROM_WISHLIST'; productId: string }
  | { type: 'CLEAR_WISHLIST' }
  | { type: 'SET_LOCATION'; location: DeliveryLocation }
  | { type: 'SYNC_URL'; state: Omit<AppState, 'cart' | 'wishlist' | 'deliveryLocation'> };

function getInitialWishlist(): string[] {
  try {
    const saved = localStorage.getItem('freshmart_wishlist');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

function getInitialLocation(): DeliveryLocation {
  try {
    const saved = localStorage.getItem('freshmart_location');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {
    city: 'Bengaluru',
    area: 'Koramangala 4th Block',
    pincode: '560034',
    addressLabel: 'Home',
  };
}

function getInitialStateFromUrl(): Omit<AppState, 'cart' | 'wishlist' | 'deliveryLocation'> {
  const validTabs: ProfileTabType[] = ['orders', 'addresses', 'wallet', 'coupons', 'settings', 'support'];

  if (typeof window === 'undefined') {
    return {
      currentPage: 'home',
      profileTab: 'orders',
      selectedCategorySlug: null,
      selectedSubcategorySlug: null,
      selectedBrandSlug: null,
      selectedProductId: null,
      searchQuery: '',
    };
  }

  const path = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const q = searchParams.get('q') || '';
  const tabParam = searchParams.get('tab') as ProfileTabType;

  let profileTab: ProfileTabType = 'orders';
  if (tabParam && validTabs.includes(tabParam)) {
    profileTab = tabParam;
  }

  const parts = path.split('/').filter(Boolean);

  const state: Omit<AppState, 'cart' | 'wishlist' | 'deliveryLocation'> = {
    currentPage: 'home',
    profileTab,
    selectedCategorySlug: null,
    selectedSubcategorySlug: null,
    selectedBrandSlug: null,
    selectedProductId: null,
    searchQuery: q,
  };

  if (parts[0] === 'categories') {
    if (parts[1]) {
      state.selectedCategorySlug = parts[1];
      if (parts[2]) {
        state.selectedSubcategorySlug = parts[2];
        if (parts[3]) {
          state.selectedBrandSlug = parts[3];
          state.currentPage = 'products';
        } else {
          state.currentPage = 'brands';
        }
      } else {
        state.currentPage = 'subcategories';
      }
    } else {
      state.currentPage = 'categories';
    }
  } else if (parts[0] === 'product') {
    state.selectedProductId = parts[1] || null;
    state.currentPage = state.selectedProductId ? 'product-detail' : 'home';
  } else if (parts[0] === 'cart') {
    state.currentPage = 'cart';
  } else if (parts[0] === 'offers') {
    state.currentPage = 'offers';
  } else if (parts[0] === 'wishlist') {
    state.currentPage = 'wishlist';
  } else if (parts[0] === 'profile') {
    state.currentPage = 'profile';
    if (parts[1] && validTabs.includes(parts[1] as ProfileTabType)) {
      state.profileTab = parts[1] as ProfileTabType;
    }
  } else if (parts[0] === 'search') {
    state.currentPage = 'search';
  }

  return state;
}

const initialState: AppState = {
  ...getInitialStateFromUrl(),
  cart: [],
  wishlist: getInitialWishlist(),
  deliveryLocation: getInitialLocation(),
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PAGE':
      return {
        ...state,
        currentPage: action.page,
        profileTab: action.profileTab || state.profileTab || 'orders',
      };

    case 'SET_PROFILE_TAB':
      return {
        ...state,
        currentPage: 'profile',
        profileTab: action.tab,
      };

    case 'SET_CATEGORY':
      return {
        ...state,
        selectedCategorySlug: action.slug,
        selectedSubcategorySlug: null,
        selectedBrandSlug: null,
        selectedProductId: null,
        currentPage: action.slug ? 'subcategories' : 'categories',
      };

    case 'SET_SUBCATEGORY':
      return {
        ...state,
        selectedSubcategorySlug: action.slug,
        selectedBrandSlug: null,
        selectedProductId: null,
        currentPage: action.slug ? 'brands' : 'subcategories',
      };

    case 'SET_BRAND':
      return {
        ...state,
        selectedBrandSlug: action.slug,
        selectedProductId: null,
        currentPage: action.slug ? 'products' : 'brands',
      };

    case 'SET_PRODUCT':
      return {
        ...state,
        selectedProductId: action.productId,
        currentPage: action.productId
          ? 'product-detail'
          : state.selectedBrandSlug
          ? 'products'
          : state.selectedSubcategorySlug
          ? 'brands'
          : state.selectedCategorySlug
          ? 'subcategories'
          : 'home',
      };

    case 'SET_SEARCH':
      return {
        ...state,
        searchQuery: action.query,
        currentPage: action.query ? 'search' : 'home',
      };

    case 'ADD_TO_CART': {
      const existingIdx = state.cart.findIndex(
        i => i.product.id === action.product.id && i.variant.id === action.variant.id
      );

      if (existingIdx !== -1) {
        const updatedCart = [...state.cart];
        updatedCart[existingIdx] = {
          ...updatedCart[existingIdx],
          quantity: updatedCart[existingIdx].quantity + 1,
        };
        return { ...state, cart: updatedCart };
      }

      return {
        ...state,
        cart: [...state.cart, { product: action.product, variant: action.variant, quantity: 1 }],
      };
    }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(
          i => !(i.product.id === action.productId && i.variant.id === action.variantId)
        ),
      };

    case 'UPDATE_CART_QUANTITY': {
      if (action.quantity <= 0) {
        return {
          ...state,
          cart: state.cart.filter(
            i => !(i.product.id === action.productId && i.variant.id === action.variantId)
          ),
        };
      }

      return {
        ...state,
        cart: state.cart.map(i =>
          i.product.id === action.productId && i.variant.id === action.variantId
            ? { ...i, quantity: action.quantity }
            : i
        ),
      };
    }

    case 'CLEAR_CART':
      return { ...state, cart: [] };

    case 'TOGGLE_WISHLIST': {
      const exists = state.wishlist.includes(action.productId);
      const nextWishlist = exists
        ? state.wishlist.filter(id => id !== action.productId)
        : [...state.wishlist, action.productId];
      try {
        localStorage.setItem('freshmart_wishlist', JSON.stringify(nextWishlist));
      } catch (e) {}
      return { ...state, wishlist: nextWishlist };
    }

    case 'REMOVE_FROM_WISHLIST': {
      const nextWishlist = state.wishlist.filter(id => id !== action.productId);
      try {
        localStorage.setItem('freshmart_wishlist', JSON.stringify(nextWishlist));
      } catch (e) {}
      return { ...state, wishlist: nextWishlist };
    }

    case 'CLEAR_WISHLIST': {
      try {
        localStorage.removeItem('freshmart_wishlist');
      } catch (e) {}
      return { ...state, wishlist: [] };
    }

    case 'SET_LOCATION': {
      try {
        localStorage.setItem('freshmart_location', JSON.stringify(action.location));
      } catch (e) {}
      return { ...state, deliveryLocation: action.location };
    }

    case 'SYNC_URL':
      return {
        ...state,
        currentPage: action.state.currentPage,
        profileTab: action.state.profileTab,
        selectedCategorySlug: action.state.selectedCategorySlug,
        selectedSubcategorySlug: action.state.selectedSubcategorySlug,
        selectedBrandSlug: action.state.selectedBrandSlug,
        selectedProductId: action.state.selectedProductId,
        searchQuery: action.state.searchQuery,
      };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  cart: CartItem[];
  wishlist: string[];
  wishlistCount: number;
  toggleWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  deliveryLocation: DeliveryLocation;
  setDeliveryLocation: (location: DeliveryLocation) => void;
  navigate: (page: PageType, profileTab?: ProfileTabType) => void;
  setProfileTab: (tab: ProfileTabType) => void;
  setCategory: (slug: string | null) => void;
  setSubcategory: (slug: string | null) => void;
  setBrand: (slug: string | null) => void;
  openProduct: (productId: string | null) => void;
  setSearch: (query: string) => void;
  addToCart: (product: ProductWithVariants, variant: ProductVariant) => void;
  removeFromCart: (productId: string, variantId: string) => void;
  updateCartQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const cartTotal = state.cart.reduce((sum, i) => sum + i.variant.price * i.quantity, 0);
  const cartCount = state.cart.reduce((sum, i) => sum + i.quantity, 0);
  const wishlistCount = state.wishlist.length;

  const toggleWishlist = (productId: string) => {
    dispatch({ type: 'TOGGLE_WISHLIST', productId });
  };

  const removeFromWishlist = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_WISHLIST', productId });
  };

  const isInWishlist = (productId: string) => {
    return state.wishlist.includes(productId);
  };

  const clearWishlist = () => {
    dispatch({ type: 'CLEAR_WISHLIST' });
  };

  const setDeliveryLocation = (location: DeliveryLocation) => {
    dispatch({ type: 'SET_LOCATION', location });
  };

  useEffect(() => {
    const { currentPage, profileTab, selectedCategorySlug, selectedSubcategorySlug, selectedBrandSlug, selectedProductId, searchQuery } = state;

    let newUrl = '/';
    if (currentPage === 'categories') {
      newUrl = '/categories';
    } else if (currentPage === 'subcategories' && selectedCategorySlug) {
      newUrl = `/categories/${selectedCategorySlug}`;
    } else if (currentPage === 'brands' && selectedCategorySlug && selectedSubcategorySlug) {
      newUrl = `/categories/${selectedCategorySlug}/${selectedSubcategorySlug}`;
    } else if (currentPage === 'products' && selectedCategorySlug && selectedSubcategorySlug && selectedBrandSlug) {
      newUrl = `/categories/${selectedCategorySlug}/${selectedSubcategorySlug}/${selectedBrandSlug}`;
    } else if (currentPage === 'product-detail' && selectedProductId) {
      newUrl = `/product/${selectedProductId}`;
    } else if (currentPage === 'cart') {
      newUrl = '/cart';
    } else if (currentPage === 'offers') {
      newUrl = '/offers';
    } else if (currentPage === 'wishlist') {
      newUrl = '/wishlist';
    } else if (currentPage === 'profile') {
      newUrl = `/profile/${profileTab || 'orders'}`;
    } else if (currentPage === 'search') {
      newUrl = `/search?q=${encodeURIComponent(searchQuery)}`;
    }

    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.pushState(null, '', newUrl);
    }
  }, [state.currentPage, state.profileTab, state.selectedCategorySlug, state.selectedSubcategorySlug, state.selectedBrandSlug, state.selectedProductId, state.searchQuery]);

  useEffect(() => {
    const handlePopState = () => {
      const urlState = getInitialStateFromUrl();
      dispatch({ type: 'SYNC_URL', state: urlState });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        cart: state.cart,
        wishlist: state.wishlist,
        wishlistCount,
        toggleWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        deliveryLocation: state.deliveryLocation,
        setDeliveryLocation,
        navigate: (page, profileTab) => dispatch({ type: 'SET_PAGE', page, profileTab }),
        setProfileTab: (tab) => dispatch({ type: 'SET_PROFILE_TAB', tab }),
        setCategory: (slug) => dispatch({ type: 'SET_CATEGORY', slug }),
        setSubcategory: (slug) => dispatch({ type: 'SET_SUBCATEGORY', slug }),
        setBrand: (slug) => dispatch({ type: 'SET_BRAND', slug }),
        openProduct: (productId) => dispatch({ type: 'SET_PRODUCT', productId }),
        setSearch: (query) => dispatch({ type: 'SET_SEARCH', query }),
        addToCart: (product, variant) => dispatch({ type: 'ADD_TO_CART', product, variant }),
        removeFromCart: (productId, variantId) => dispatch({ type: 'REMOVE_FROM_CART', productId, variantId }),
        updateCartQuantity: (productId, variantId, quantity) =>
          dispatch({ type: 'UPDATE_CART_QUANTITY', productId, variantId, quantity }),
        clearCart: () => dispatch({ type: 'CLEAR_CART' }),
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
