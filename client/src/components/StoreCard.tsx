import React from 'react';
import { Star, Clock } from 'lucide-react';
export interface Store {
  id: string;
  name: string;
  image: string;
  rating: number;
  deliveryTime: string;
  distance: string;
  offer: string;
}

interface StoreCardProps {
  store: Store;
}

export default function StoreCard({ store }: StoreCardProps) {
  return (
    <div className="flex-shrink-0 w-48 bg-white rounded-2xl shadow-card overflow-hidden active:scale-95 transition-transform cursor-pointer">
      <div className="relative h-28 overflow-hidden">
        <img
          src={store.image}
          alt={store.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className="absolute top-2 right-2 bg-accent-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {store.offer}
        </span>
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 rounded-full px-1.5 py-0.5">
          <Star size={10} className="text-amber-400 fill-amber-400" />
          <span className="text-[10px] font-semibold text-neutral-700">{store.rating}</span>
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-neutral-800">{store.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1">
            <Clock size={11} className="text-neutral-400" />
            <span className="text-xs text-neutral-500">{store.deliveryTime}</span>
          </div>
          <span className="text-neutral-300">·</span>
          <span className="text-xs text-neutral-500">{store.distance}</span>
        </div>
      </div>
    </div>
  );
}
