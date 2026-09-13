import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, ChevronDown, User } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ROLE_LABELS } from '../../lib/permissions';
import { unreadCount } from '../../lib/services/notifications.service';

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const { admin, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    unreadCount().then(setUnread).catch(() => undefined);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  const initials = (admin?.full_name || admin?.email || 'A')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-neutral-100">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        <button onClick={onMenu} className="lg:hidden text-neutral-600" aria-label="Open menu">
          <Menu size={22} />
        </button>

        <div className="hidden lg:block" />

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/notifications')}
            className="relative w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center hover:bg-neutral-100"
            aria-label="Notifications"
          >
            <Bell size={18} className="text-neutral-600" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          <div className="relative" ref={ref}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-neutral-50"
            >
              <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-neutral-800 leading-tight">{admin?.full_name || 'Admin'}</p>
                <p className="text-[10px] text-neutral-500">{admin ? ROLE_LABELS[admin.role] : ''}</p>
              </div>
              <ChevronDown size={14} className="text-neutral-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-card-hover border border-neutral-100 py-1.5 z-50">
                <div className="px-4 py-2.5 border-b border-neutral-100">
                  <p className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
                    <User size={14} /> {admin?.full_name || 'Admin'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">{admin?.email}</p>
                </div>
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
