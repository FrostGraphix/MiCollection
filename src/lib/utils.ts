import { CartItem, ColorKey, OrderRecord } from '@/types';
import { byId, CFG, PAL } from './products';

export function money(n: number): string {
  return '₦' + Math.round(n).toLocaleString('en-NG');
}

export function lineKey(item: { id: number; color: ColorKey; size?: string }): string {
  return `${item.id}|${item.color}|${item.size || ''}`;
}

export function waLink(text: string): string {
  return `https://wa.me/${CFG.phone}?text=${encodeURIComponent(text)}`;
}

export function generateOrderText(
  order: OrderRecord | null,
  cartItems?: CartItem[],
  subtotalAmount?: number
): string {
  if (order) {
    return (
      `Hello MiCollections, I just placed order ${order.id}.\n` +
      `${order.lines.join('\n')}\n` +
      `Total: ${money(order.total)}\n` +
      `Name: ${order.name}\n` +
      `Phone: ${order.phone}\n` +
      `Delivery: ${order.deliveryLabel}, ${order.address}, ${order.state}\n` +
      `Payment: ${order.payLabel}`
    );
  }

  if (cartItems && cartItems.length) {
    const lines = cartItems.map((l) => {
      const p = byId(l.id);
      if (!p) return '';
      return `- ${l.qty} x ${p.name} (${PAL[l.color].n}${l.size ? ', ' + l.size : ''}) ${money(p.price * l.qty)}`;
    }).filter(Boolean);

    return (
      `Hello MiCollections, I would like to order:\n` +
      `${lines.join('\n')}\n` +
      `Subtotal: ${money(subtotalAmount || 0)}`
    );
  }

  return `Hello MiCollections, I would like to place an order.`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
