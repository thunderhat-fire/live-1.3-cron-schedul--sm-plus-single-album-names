"use client";

import { CartProvider } from '@/contexts/CartContext';
import { SearchProvider } from '@/contexts/SearchContext';
import { LikesProvider } from '@/contexts/LikesContext';
import { FollowProvider } from '@/contexts/FollowContext';
import { ReactNode } from 'react';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <SearchProvider>
        <LikesProvider>
          <FollowProvider>
            {children}
          </FollowProvider>
        </LikesProvider>
      </SearchProvider>
    </CartProvider>
  );
} 