"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  format: 'vinyl' | 'digital';
  imageUrl: string;
  maxQuantity?: number;
}

export interface AddToCartOptions {
  id: string;
  name: string;
  price: number;
  quantity: number;
  format: 'vinyl' | 'digital';
  imageUrl: string;
  maxQuantity?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: AddToCartOptions) => Promise<void>;
  removeFromCart: (itemId: string, format: 'vinyl' | 'digital') => void;
  updateQuantity: (itemId: string, format: 'vinyl' | 'digital', quantity: number) => Promise<void>;
  getTotal: () => number;
  getItemQuantity: (itemId: string, format: 'vinyl' | 'digital') => number;
  getRemainingQuantity: (itemId: string, format: 'vinyl' | 'digital') => number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { data: session } = useSession();

  // Simple abandoned cart detection
  useEffect(() => {
    if (items.length > 0 && session?.user?.email) {
      console.log('🛒 Cart has items, setting abandoned cart timer for 2 hours');
      
      // Set timer for 2 hours (7200000 ms)
      const timeoutId = setTimeout(async () => {
        console.log('⏰ Cart abandoned after 2 hours, sending email...');
        
        try {
          // Send abandoned cart email
          const response = await fetch('/api/abandoned-cart/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userEmail: session.user.email,
              userName: session.user.name || 'Music Lover',
              cartItems: items.map(item => ({
                name: item.name,
                price: item.price,
                format: item.format
              }))
            }),
          });

          if (response.ok) {
            console.log('✅ Abandoned cart email sent successfully');
          } else {
            console.error('❌ Failed to send abandoned cart email');
          }
        } catch (error) {
          console.error('❌ Error sending abandoned cart email:', error);
        }
      }, 2 * 60 * 60 * 1000); // 2 hours

      // Cleanup timer if cart changes or component unmounts
      return () => {
        console.log('🛒 Cart changed or unmounted, clearing abandoned cart timer');
        clearTimeout(timeoutId);
      };
    }
  }, [items, session?.user?.email, session?.user?.name]);

  const getItemQuantity = useCallback((itemId: string, format: 'vinyl' | 'digital') => {
    const item = items.find(i => i.id === itemId && i.format === format);
    return item?.quantity || 0;
  }, [items]);

  const getRemainingQuantity = useCallback((itemId: string, format: 'vinyl' | 'digital') => {
    const item = items.find(i => i.id === itemId && i.format === format);
    if (!item || !item.maxQuantity) return Infinity;
    return item.maxQuantity - item.quantity;
  }, [items]);

  const addToCart = useCallback(async (newItem: AddToCartOptions) => {
    // For vinyl presale items, check real-time inventory first
    if (newItem.format === 'vinyl') {
      try {
        const response = await fetch(`/api/nfts/${newItem.id}`);
        if (response.ok) {
          const nftData = await response.json();
          const currentAvailable = Math.max(0, (nftData.targetOrders || 100) - (nftData.currentOrders || 0));
          
          // Update maxQuantity with real-time data
          newItem.maxQuantity = Math.min(newItem.maxQuantity || Infinity, currentAvailable);
          
          if (currentAvailable <= 0) {
            console.warn(`No vinyl copies available for ${newItem.name}`);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking inventory:', error);
        // Fall back to original logic if API fails
      }
    }

    // Fallback for non-vinyl items or if API fails
    setItems(prevItems => {
      const existingItem = prevItems.find(
        i => i.id === newItem.id && i.format === newItem.format
      );

      if (existingItem) {
        // Check if adding would exceed maxQuantity
        const newQuantity = existingItem.quantity + newItem.quantity;
        if (existingItem.maxQuantity && newQuantity > existingItem.maxQuantity) {
          // If it would exceed, set to maxQuantity instead
          return prevItems.map(i =>
            i.id === newItem.id && i.format === newItem.format
              ? { ...i, quantity: i.maxQuantity! }
              : i
          );
        }

        return prevItems.map(i =>
          i.id === newItem.id && i.format === newItem.format
            ? { ...i, quantity: newQuantity }
            : i
        );
      }

      return [...prevItems, { ...newItem }];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string, format: 'vinyl' | 'digital') => {
    setItems(prevItems => 
      prevItems.filter(item => !(item.id === itemId && item.format === format))
    );
  }, []);

  const updateQuantity = useCallback(async (itemId: string, format: 'vinyl' | 'digital', newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId, format);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId && item.format === format
          ? { ...item, quantity: Math.min(newQuantity, item.maxQuantity || Infinity) }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getTotal = useCallback(() => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [items]);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      clearCart,
      updateQuantity,
      getTotal,
      getItemQuantity,
      getRemainingQuantity,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 