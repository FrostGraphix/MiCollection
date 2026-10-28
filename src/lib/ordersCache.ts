import { OrderRecord } from '@/types';
import { INITIAL_ORDERS } from '@/lib/mockOrders';

// In-memory orders cache for local sandbox testing, initialized with mock orders
export const localOrdersCache: Record<string, OrderRecord> = {};

INITIAL_ORDERS.forEach((ord) => {
  localOrdersCache[ord.id] = { ...ord };
});

export function parseOrderDispatchInfo(note?: string | null): {
  carrier?: string;
  trackingNumber?: string;
  riderName?: string;
  riderPhone?: string;
  dispatchNote?: string;
} {
  if (!note) return {};
  try {
    const trimmed = note.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed);
      if (parsed.carrier || parsed.trackingNumber || parsed.riderName || parsed.riderPhone) {
        return {
          carrier: parsed.carrier,
          trackingNumber: parsed.trackingNumber,
          riderName: parsed.riderName,
          riderPhone: parsed.riderPhone,
          dispatchNote: parsed.dispatchNote || parsed.note,
        };
      }
    }
  } catch {}

  if (note.includes('[DISPATCH]') || note.includes('Carrier:')) {
    const carrier = note.match(/Carrier:\s*([^|]+)/i)?.[1]?.trim();
    const trackingNumber = note.match(/(?:Tracking|Waybill):\s*([^|]+)/i)?.[1]?.trim();
    const riderName = note.match(/Rider:\s*([^|]+)/i)?.[1]?.trim();
    const riderPhone = note.match(/Phone:\s*([^|]+)/i)?.[1]?.trim();
    const dispatchNote = note.match(/Note:\s*([^|]+)/i)?.[1]?.trim();
    return { carrier, trackingNumber, riderName, riderPhone, dispatchNote };
  }

  return {};
}

