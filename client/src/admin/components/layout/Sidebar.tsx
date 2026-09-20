import React from 'react';
import { NavLink } from 'react-router-dom';
import { Leaf, X, Store } from 'lucide-react';
import { NAV_ITEMS, NAV_GROUPS } from './nav';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { can } = useAdminAuth();
  const visible = NAV_ITEMS.filter((item) => can(item.permission));

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary-500 flex items-center justify-center">
            <Leaf size={20} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-neutral-800 leading-tight block">Agrawal General & Provisional Store</span>
            <p className="text-[10px] text-neutral-500 mt-0.5">Admin Console</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-neutral-400" aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3">
        {NAV_GROUPS.map((group) => {
          const items = visible.filter((i) => i.group === group);
          if (!items.length) return null;
          return (
            <div key={group} className="mb-4">
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                {group}
              </p>
              <div className="flex flex-col gap-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                        isActive
                          ? 'bg-primary-500 text-white font-semibold'
                          : 'text-neutral-600 hover:bg-neutral-100 font-medium'
                      }`
                    }
                  >
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-neutral-100">
        <a
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-neutral-600 hover:bg-neutral-100 font-medium"
        >
          <Store size={18} />
          View Storefront
        </a>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-neutral-100 z-40">
        {content}
      </aside>

      {/* Mobile */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-neutral-900/40" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[80vw] bg-white">{content}</aside>
        </div>
      )}
    </>
  );
}
