import { OrderRecord } from '@/types';
import { INITIAL_ORDERS } from '@/lib/mockOrders';

// In-memory orders cache for local sandbox testing, initialized with mock orders
export const localOrdersCache: Record<string, OrderRecord> = {};

INITIAL_ORDERS.forEach((ord) => {
  localOrdersCache[ord.id] = { ...ord };
});
