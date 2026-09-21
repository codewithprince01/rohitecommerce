import React from 'react';
import { Clock } from 'lucide-react';

// No rating field: we have never collected store ratings, so there is no
// honest number to put here.
export interface Store {
  id: string;
  name: string;
  image: string;
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
