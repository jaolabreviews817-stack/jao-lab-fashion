import { useEffect, useState } from 'react';
import { useGetCart, useReplaceCart, useClearCart } from '@workspace/api-client-react';
import type { Product } from '@workspace/api-client-react';
import { useAuth } from './auth';

export type CartLine = { product: Product; quantity: number; size?: string; color?: string };

export function useCart() {
  const { user } = useAuth();
  const serverCart = useGetCart({ query: { queryKey: ['cart'], enabled: !!user } });
  const replaceCart = useReplaceCart();
  const clearServerCart = useClearCart();
  const [cart, setCart] = useState<CartLine[]>(() => {
    try { return JSON.parse(localStorage.getItem('jao-cart') || '[]'); } catch { return []; }
  });
  useEffect(() => {
    if (user && serverCart.data) setCart(serverCart.data.items as CartLine[]);
  }, [serverCart.data, user]);
  useEffect(() => {
    if (!user) {
      try { setCart(JSON.parse(localStorage.getItem('jao-cart') || '[]')); } catch { setCart([]); }
    }
  }, [user]);
  const setAndPersist = (next: CartLine[]) => {
    setCart(next);
    if (user) replaceCart.mutate({ data: { items: next.map((line) => ({ productId: line.product.id, quantity: line.quantity, size: line.size || '', color: line.color || '' })) } });
    else localStorage.setItem('jao-cart', JSON.stringify(next));
  };
  const add = (product: Product, size?: string, color?: string) => {
    const key = `${product.id}-${size || ''}-${color || ''}`;
    const found = cart.find((line) => `${line.product.id}-${line.size || ''}-${line.color || ''}` === key);
    setAndPersist(found ? cart.map((line) => line === found ? { ...line, quantity: line.quantity + 1 } : line) : [...cart, { product, quantity: 1, size, color }]);
  };
  const update = (index: number, quantity: number) => setAndPersist(quantity < 1 ? cart.filter((_, i) => i !== index) : cart.map((line, i) => i === index ? { ...line, quantity } : line));
  const remove = (index: number) => setAndPersist(cart.filter((_, i) => i !== index));
  const clear = () => { setCart([]); if (user) clearServerCart.mutate(); else localStorage.setItem('jao-cart', '[]'); };
  return { cart, add, update, remove, clear, count: cart.reduce((a, l) => a + l.quantity, 0), total: cart.reduce((a, l) => a + l.quantity * l.product.price, 0) };
}