export type ColorKey =
  | 'violet'
  | 'black'
  | 'ivory'
  | 'orchid'
  | 'lilac'
  | 'plum'
  | 'gold'
  | 'silver';

export interface ColorDef {
  n: string;
  main: string;
  dark: string;
  light: string;
  deep: string;
}

export type ArtType =
  | 'dress'
  | 'abaya'
  | 'hoodie'
  | 'sneaker'
  | 'heel'
  | 'tote'
  | 'crossbody'
  | 'necklace'
  | 'earrings'
  | 'ring'
  | 'watch'
  | 'ledpanel'
  | 'earbuds'
  | 'powerbank'
  | 'pot'
  | 'spoons'
  | 'bottles'
  | 'basket'
  | 'cushion'
  | 'candles'
  | 'perfume'
  | 'gummies'
  | 'nailkit';

export interface Category {
  id: string;
  name: string;
  blurb: string;
  art: ArtType[];
  cols: ColorKey[];
  image?: string;
}

export interface Product {
  id: number;
  name: string;
  cat: string;
  price: number;
  was?: number | null;
  art: ArtType;
  colors: ColorKey[];
  sizes?: string[];
  badge?: string | null;
  desc: string;
  feat: string[];
  images: string[];
  cogs?: number;
  stock?: number;
  lowStockThreshold?: number;
  status?: 'active' | 'draft' | 'archived';
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: number;
  color: ColorKey;
  size?: string;
  qty: number;
}

export type DeliveryType = 'abuja' | 'nationwide' | 'pickup';
export type PaymentMethod = 'transfer' | 'link' | 'pod';

export interface DeliveryOption {
  label: string;
  eta: string;
  fee: number;
}

export interface OrderCustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  landmark?: string;
  note?: string;
}

export interface OrderItemRecord {
  name: string;
  price: number;
  qty: number;
  art: ArtType;
  color: ColorKey;
  opt: string;
  image?: string;
}

export type OrderStatus =
  | 'received'
  | 'confirmed'
  | 'shipped'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';

export interface OrderRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  landmark?: string;
  deliveryLabel: string;
  eta: string;
  payLabel: string;
  paymentMethod: string;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  orderStatus?: OrderStatus;
  fee: number;
  subtotal: number;
  discount: number;
  total: number;
  items: OrderItemRecord[];
  lines: string[];
  wa: string;
  createdAt?: string;
  note?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  address?: string;
  state?: string;
}

export interface DiscountCoupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number; // percentage or fixed amount in ₦
  minSpend?: number; // minimum order spend in ₦
  expiryDate?: string;
  usageLimit?: number;
  usageCount: number;
  revenueDriven: number; // in ₦
  isActive: boolean;
  createdAt?: string;
  description?: string;
}

export type CustomerVIPTier = 'VIP Platinum' | 'Gold Member' | 'Regular';

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  state: string;
  address?: string;
  landmark?: string;
  totalOrders: number;
  lifetimeValue: number; // LTV in ₦
  lastOrderDate: string;
  tier: CustomerVIPTier;
  orders?: OrderRecord[];
}

export type NotificationType =
  | 'order_new'
  | 'order_confirmed'
  | 'order_dispatched'
  | 'order_delivered'
  | 'payment_alert'
  | 'vip_customer'
  | 'stock_warning'
  | 'inquiry';

export interface StoreNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  orderId?: string;
  customerName?: string;
  amount?: number;
  read: boolean;
  priority: 'low' | 'normal' | 'high';
}

