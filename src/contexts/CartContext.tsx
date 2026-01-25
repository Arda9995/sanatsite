import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import type { Artwork } from '../lib/database.types';

interface CartItemWithArtwork {
  id: string;
  artwork_id: string;
  quantity: number;
  size: string | null;
  material: string | null;
  frame: string | null;
  price: number | null;
  artwork: Artwork & { artists: { name: string; slug: string } };
}

interface CartContextType {
  cartItems: CartItemWithArtwork[];
  cartCount: number;
  addToCart: (artworkId: string, options?: { size?: string; material?: string; frame?: string; price?: number }, quantity?: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [cartItems, setCartItems] = useState<CartItemWithArtwork[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      console.log('User detected in CartProvider:', user.email, user.id);
      loadCart();
    } else {
      console.log('No user detected in CartProvider');
      setCartItems([]);
    }
  }, [user]);

  const isMockUser = user?.id === 'da3db02a-6096-4876-857e-000000000000';

  const loadCart = async () => {
    if (!user) {
      console.log('❌ loadCart: No user, skipping');
      return;
    }

    if (isMockUser) {
      console.log('🤖 Mock user detected, loading from LocalStorage');
      const localCart = localStorage.getItem('sanatsite_mock_cart');
      if (localCart) {
        setCartItems(JSON.parse(localCart));
      } else {
        setCartItems([]);
      }
      return;
    }

    console.log('🔄 loadCart: Starting for user', user.id);
    setLoading(true);

    try {
      // First, get cart items
      console.log('📦 loadCart: Fetching cart_items...');
      const { data: cartData, error: cartError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id);

      // ... (rest of DB loading logic remains same, just moved inside)
      if (cartError) {
        console.error('❌ Error loading cart items:', cartError);
        showToast(`Cart error: ${cartError.message}`, 'error');
        setLoading(false);
        return;
      }

      if (!cartData || cartData.length === 0) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      const itemsWithArtwork = await Promise.all(
        (cartData as any[]).map(async (item: any) => {
          const { data: artwork } = await supabase
            .from('artworks')
            .select('*')
            .eq('id', item.artwork_id)
            .single();

          if (!artwork) return null;

          const { data: artist } = await supabase
            .from('artists')
            .select('name, slug')
            .eq('id', (artwork as any).artist_id)
            .single();

          return {
            ...item,
            artwork: {
              ...(artwork as any),
              artists: { name: (artist as any)?.name || 'Unknown', slug: (artist as any)?.slug || '' }
            }
          };
        })
      );

      const validItems = itemsWithArtwork.filter((item: any) => item !== null) as CartItemWithArtwork[];
      setCartItems(validItems);
    } catch (err) {
      console.error('💥 Unexpected error loading cart:', err);
      showToast('Failed to load cart', 'error');
    }

    setLoading(false);
  };

  const addToCart = async (artworkId: string, options?: { size?: string; material?: string; frame?: string; price?: number }, quantity: number = 1) => {
    if (!user) {
      showToast('Please sign in to add items to cart', 'info');
      return;
    }

    // MOCK USER HANDLER
    if (isMockUser) {
      const newItem = {
        id: `mock-item-${Date.now()}`,
        artwork_id: artworkId,
        quantity: quantity,
        size: options?.size || null,
        material: options?.material || null,
        frame: options?.frame || null,
        price: options?.price || null,
        user_id: user.id
      };

      // Fetch artwork details for local display
      const { data: artwork } = await supabase.from('artworks').select('*').eq('id', artworkId).single();
      if (!artwork) {
        showToast('Artwork not found', 'error');
        return;
      }

      const { data: artist } = await supabase.from('artists').select('name, slug').eq('id', (artwork as any).artist_id).single();

      const fullItem = {
        ...newItem,
        artwork: { ...(artwork as any), artists: { name: (artist as any)?.name || 'Unknown', slug: (artist as any)?.slug || '' } }
      };

      const updatedCart = [...cartItems, fullItem as any];
      setCartItems(updatedCart);
      localStorage.setItem('sanatsite_mock_cart', JSON.stringify(updatedCart));
      showToast(`Added ${quantity} item(s) to cart (Admin Mode)`, 'success');
      return;
    }

    // REAL DB HANDLER
    console.log('Adding to cart:', artworkId, options, 'Quantity:', quantity);

    // Check if item with same options already exists
    const existingItem = (cartItems as any[]).find(item =>
      item.artwork_id === artworkId &&
      item.size === (options?.size || null) &&
      item.material === (options?.material || null) &&
      item.frame === (options?.frame || null)
    );

    if (existingItem) {
      const { error } = await (supabase
        .from('cart_items' as any) as any)
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id);

      if (!error) {
        showToast('Quantity updated in cart', 'success');
        await loadCart();
      } else {
        console.error('Error updating cart quantity:', error);
        showToast('Failed to update cart', 'error');
      }
      return;
    }

    const { error } = await (supabase
      .from('cart_items' as any) as any)
      .insert({
        user_id: user.id,
        artwork_id: artworkId,
        quantity: quantity,
        size: options?.size || null,
        material: options?.material || null,
        frame: options?.frame || null,
        price: options?.price || null
      });

    if (!error) {
      console.log('Successfully added to cart');
      showToast('Added to cart successfully', 'success');
      await loadCart();
    } else {
      console.error('Error adding to cart:', error);
      showToast(`Error adding to cart: ${error.message}`, 'error');
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (isMockUser) {
      const updatedCart = cartItems.filter(item => item.id !== cartItemId);
      setCartItems(updatedCart);
      localStorage.setItem('sanatsite_mock_cart', JSON.stringify(updatedCart));
      showToast('Item removed (Admin Mode)', 'success');
      return;
    }

    console.log('Removing from cart:', cartItemId);

    // Optimistic update
    const previousItems = cartItems;
    setCartItems(cartItems.filter(item => item.id !== cartItemId));

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (!error) {
      showToast('Item removed from cart', 'success');
    } else {
      console.error('Error removing from cart:', error);
      setCartItems(previousItems);
      showToast('Failed to remove item', 'error');
    }
  };

  const clearCart = async () => {
    if (!user) return;

    if (isMockUser) {
      setCartItems([]);
      localStorage.removeItem('sanatsite_mock_cart');
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (!error) {
      setCartItems([]);
    }
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount: cartItems.length,
      addToCart,
      removeFromCart,
      clearCart,
      loading
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
