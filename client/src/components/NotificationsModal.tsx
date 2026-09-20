import React, { useState } from 'react';
import { Bell, X, CheckCheck, Tag, ShoppingBag, Truck, Sparkles, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'order' | 'discount' | 'stock' | 'system';
  read: boolean;
  actionPage?: 'offers' | 'cart' | 'profile';
}

const initialNotifications: NotificationItem[] = [
  {
    id: '1',
    title: '🎉 Flat Rs 100 OFF Code Available!',
    message: 'Use coupon code FRESH100 on orders above Rs 499 for instant discount.',
    time: '10m ago',
    type: 'discount',
    read: false,
    actionPage: 'offers',
  },
  {
    id: '2',
    title: '⚡ Express 10-Minute Delivery Live',
    message: 'Farm fresh veggies and cold beverages are now dispatched in 10-15 minutes.',
    time: '1h ago',
    type: 'system',
    read: false,
  },
  {
    id: '3',
    title: '🥦 Fresh Organic Stock Just Landed',
    message: 'Farm fresh Shimla apples, avocados & hydroponic spinach are freshly stocked.',
    time: '3h ago',
    type: 'stock',
    read: true,
  },
  {
    id: '4',
    title: '📦 WhatsApp Order Tracking Active',
    message: 'You can now track your order status live from our seller WhatsApp desk.',
    time: 'Yesterday',
    type: 'order',
    read: true,
    actionPage: 'profile',
  },
];

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const { navigate } = useApp();
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  if (!isOpen) return null;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleAction = (item: NotificationItem) => {
    setNotifications(notifications.map(n => n.id === item.id ? { ...n, read: true } : n));
    if (item.actionPage) {
      navigate(item.actionPage);
      onClose();
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'discount':
        return <Tag size={18} className="text-amber-600" />;
      case 'order':
        return <Truck size={18} className="text-blue-600" />;
      case 'stock':
        return <ShoppingBag size={18} className="text-emerald-600" />;
      default:
        return <Sparkles size={18} className="text-primary-600" />;
    }
  };

  const getBg = (type: NotificationItem['type']) => {
    switch (type) {
      case 'discount':
        return 'bg-amber-100';
      case 'order':
        return 'bg-blue-100';
      case 'stock':
        return 'bg-emerald-100';
      default:
        return 'bg-primary-100';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-5 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 relative">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-800">Notifications</h3>
              <p className="text-xs text-neutral-500">Updates, offers & alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                title="Mark all as read"
                className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <CheckCheck size={14} />
                <span>Read all</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white hover:bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-500 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-3">
          {notifications.map(item => (
            <div
              key={item.id}
              onClick={() => handleAction(item)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3 items-start ${
                item.read
                  ? 'bg-white border-neutral-100 hover:border-neutral-200'
                  : 'bg-primary-50/40 border-primary-200 shadow-sm hover:bg-primary-50/60'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${getBg(item.type)}`}>
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-neutral-800 truncate">{item.title}</h4>
                  <span className="text-[10px] text-neutral-400 flex-shrink-0">{item.time}</span>
                </div>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{item.message}</p>
                {item.actionPage && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-primary-600">
                    <span>View Deal</span>
                    <ChevronRight size={12} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-50 border-t border-neutral-100 text-center">
          <p className="text-[11px] text-neutral-500">
            Agrawal General & Provisional Store notifications keep you posted with lowest grocery rates
          </p>
        </div>
      </div>
    </div>
  );
}
