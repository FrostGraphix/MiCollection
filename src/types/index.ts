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
}

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
  orderStatus?: 'received' | 'confirmed' | 'shipped' | 'delivered';
  fee: number;
  subtotal: number;
  discount: number;
  total: number;
  items: OrderItemRecord[];
  lines: string[];
  wa: string;
  createdAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  address?: string;
  state?: string;
}
