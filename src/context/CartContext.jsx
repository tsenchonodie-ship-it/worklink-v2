import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('orhiz_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const persist = (next) => {
    localStorage.setItem('orhiz_cart', JSON.stringify(next));
    setItems(next);
  };

  const addToCart = (product, quantity = 1) => {
    const next = [...items];
    const found = next.find((item) => item.id === product.id);
    if (found) found.quantity += quantity;
    else next.push({ ...product, quantity });
    persist(next);
  };

  const updateQuantity = (id, quantity) => {
    persist(items.map((item) => item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item));
  };

  const removeItem = (id) => persist(items.filter((item) => item.id !== id));
  const clearCart = () => persist([]);
  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  const value = useMemo(() => ({ items, addToCart, updateQuantity, removeItem, clearCart, subtotal, count }), [items, subtotal, count]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
