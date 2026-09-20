import React from 'react';
import type { ProductWithVariants } from '../lib/supabase';
import ZeptoProductCard from './ZeptoProductCard';

interface ProductCardProps {
  product: ProductWithVariants;
  horizontal?: boolean;
  className?: string;
}

export default function ProductCard({ product, className = '' }: ProductCardProps) {
  return <ZeptoProductCard product={product} className={className} />;
}
