import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CategoriesPage from './pages/CategoriesPage';
import SubcategoriesPage from './pages/SubcategoriesPage';
import BrandsPage from './pages/BrandsPage';
import ProductsPage from './pages/ProductsPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import OffersPage from './pages/OffersPage';
import WishlistPage from './pages/WishlistPage';

function AppContent() {
  const { state } = useApp();
  const { currentPage } = state;

  const isProfile = currentPage === 'profile';
  const isProductDetail = currentPage === 'product-detail';
  const showHeader = !isProfile;
  const showSidebar = !isProfile;

  const renderPage = () => {
    switch (currentPage) {
      case 'categories':
        return <CategoriesPage />;
      case 'subcategories':
        return <SubcategoriesPage />;
      case 'brands':
        return <BrandsPage />;
      case 'products':
        return <ProductsPage />;
      case 'product-detail':
        return <ProductDetailPage />;
      case 'cart':
        return <CartPage />;
      case 'offers':
        return <OffersPage />;
      case 'wishlist':
        return <WishlistPage />;
      case 'profile':
        return <ProfilePage />;
      case 'search':
        return <SearchPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header - only visible for regular store pages */}
      {showHeader && <Header />}

      {/* Main Content */}
      <main
        className={`min-h-screen transition-all duration-200 ${
          // Desktop: Add left margin for sidebar only when sidebar is active
          showSidebar ? 'lg:ml-64' : 'w-full'
        } ${
          // Mobile: Add top padding for header
          isProductDetail
            ? 'pt-0 lg:pt-[73px]'
            : showHeader
            ? 'pt-[104px] lg:pt-[73px]'
            : 'pt-0'
        } ${
          // Mobile: Add bottom padding for nav
          showSidebar ? 'pb-20 lg:pb-0' : 'pb-0'
        }`}
      >
        {renderPage()}
      </main>

      {/* Bottom Nav / Sidebar - hidden on profile for full-page experience */}
      {showSidebar && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
