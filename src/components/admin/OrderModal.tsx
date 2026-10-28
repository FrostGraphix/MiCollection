'use client';

import React, { useState, useEffect } from 'react';
import { OrderRecord, OrderStatus } from '@/types';
import { money } from '@/lib/utils';
import { CFG, PAL } from '@/lib/products';
import { ProductArt } from '@/components/shop/ProductArt';
import { ProductImage } from '@/components/shop/ProductImage';
import { FeedbackModal } from '@/components/ui/FeedbackModal';
import {
  X,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  MessageSquare,
  Printer,
  Mail,
  Copy,
  ExternalLink,
  MapPin,
  Clock,
  Phone,
  User,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  FileText,
  Send,
  Edit3,
  Loader2,
} from 'lucide-react';

interface OrderModalProps {
  order: OrderRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: (orderId: string, newStatus: OrderStatus) => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onStatusUpdate,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [viewingSlip, setViewingSlip] = useState(false);

  // Status workflow state & transition feedback
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order?.orderStatus || 'received');
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Note editing state
  const [currentNote, setCurrentNote] = useState<string>(order?.note || '');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState<string>(order?.note || '');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteFeedback, setNoteFeedback] = useState<string | null>(null);

  // Sync state when order prop updates
  useEffect(() => {
    if (order) {
      setCurrentStatus(order.orderStatus || 'received');
      setCurrentNote(order.note || '');
      setNoteDraft(order.note || '');
      setIsEditingNote(false);
      setPendingStatus(null);
    }
  }, [order]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pendingStatus) {
          setPendingStatus(null);
        } else if (isEditingNote) {
          setIsEditingNote(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pendingStatus, isEditingNote, onClose]);

  if (!isOpen || !order) return null;

  // Format Nigerian Phone for WhatsApp: strip leading 0, prepend 234
  const cleanPhone = order.phone.replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('0')
    ? '234' + cleanPhone.slice(1)
    : cleanPhone.startsWith('234')
    ? cleanPhone
    : '234' + cleanPhone;

  // Contextual WhatsApp Message based on current order status
  const getContextualWAMessage = (): string => {
    switch (currentStatus) {
      case 'confirmed':
        return `Hello ${order.name}! Thank you for ordering from MiCollections. Your order #${order.id} has been confirmed and is being packaged.`;
      case 'shipped':
      case 'dispatched':
        return `Hello ${order.name}! Your MiCollections order #${order.id} has been handed over to our courier for delivery to ${order.address}, ${order.state}. ETA: ${order.eta}.`;
      case 'delivered':
        return `Hello ${order.name}! Your MiCollections order #${order.id} has been delivered. We hope you love your items! Let us know if you need anything else.`;
      case 'cancelled':
        return `Hello ${order.name}! Regarding your MiCollections order #${order.id}, we are reaching out regarding the cancellation and refund details.`;
      case 'received':
      default:
        return `Hello ${order.name}! Thank you for ordering from MiCollections. We have received your order #${order.id} and are currently verifying the details.`;
    }
  };

  const waContactUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(
    getContextualWAMessage()
  )}`;

  // Copy to clipboard helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Status Switcher Prompt
  const handleRequestStatusChange = (newStatus: OrderStatus) => {
    if (currentStatus === newStatus || isUpdating) return;
    setPendingStatus(newStatus);
  };

  // Execute confirmed status change
  const executeStatusChange = async (newStatus: OrderStatus) => {
    if (currentStatus === newStatus || isUpdating) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.id,
          orderStatus: newStatus,
        }),
      });

      if (res.ok) {
        setCurrentStatus(newStatus);
        if (onStatusUpdate) {
          onStatusUpdate(order.id, newStatus);
        }
        setStatusFeedback(`Order #${order.id} status transitioned to ${newStatus.toUpperCase()} ✓`);
        setTimeout(() => setStatusFeedback(null), 3500);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdating(false);
      setPendingStatus(null);
    }
  };

  // Save Note Handler
  const handleSaveNote = async () => {
    if (isSavingNote) return;
    setIsSavingNote(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.id,
          note: noteDraft,
        }),
      });
      if (res.ok) {
        setCurrentNote(noteDraft);
        setIsEditingNote(false);
        setNoteFeedback('Order note updated successfully ✓');
        setTimeout(() => setNoteFeedback(null), 3000);
      }
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Dispatch Email Handler
  const handleSendEmail = async (type: 'order_confirmation' | 'dispatch') => {
    setEmailStatus('sending');
    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          orderId: order.id,
          recipientEmail: order.email,
        }),
      });
      if (res.ok) {
        setEmailStatus('sent');
        setTimeout(() => setEmailStatus(null), 3000);
      } else {
        setEmailStatus('failed');
      }
    } catch {
      setEmailStatus('failed');
    }
  };

  // Print packing slip
  const handlePrintSlip = () => {
    window.print();
  };

  // Status Pill Styling
  const getStatusBadge = (status?: OrderStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case 'shipped':
      case 'dispatched':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50">
            <Truck className="w-3.5 h-3.5" /> Dispatched
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50">
            <PackageCheck className="w-3.5 h-3.5" /> Delivered
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-700/50">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      case 'received':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50">
            <Clock className="w-3.5 h-3.5" /> Received
          </span>
        );
    }
  };

  const getPaymentBadge = () => {
    const isPaid = order.paymentStatus === 'paid';
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
          isPaid
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/40'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/40'
        }`}
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        {isPaid ? 'Paid' : 'Pending'} • {order.payLabel}
      </span>
    );
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Order #${order.id}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static"
      >
        {/* Modal Container */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl bg-[var(--surface)] text-[var(--ink)] border border-purple-500/20 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:rounded-none"
        >
          
          {/* Printable Packing Slip (rendered conditionally or formatted for @media print) */}
          <div className={`p-8 bg-white text-black font-sans ${viewingSlip ? 'block' : 'hidden print:block'}`}>
            <div className="border-b-2 border-purple-900 pb-6 mb-6 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold font-serif text-purple-900">
                  Mi<span className="text-purple-600">Collections</span>
                </h1>
                <p className="text-xs text-gray-600 mt-1 uppercase tracking-widest font-semibold">
                  Abuja HQ • Dispatch Fulfillment Slip
                </p>
                <p className="text-xs text-gray-500">
                  WhatsApp: {CFG.phoneDisp} • Support: {CFG.email}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">ORDER #{order.id}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Date: {order.createdAt ? new Date(order.createdAt).toLocaleString('en-NG') : 'N/A'}
                </div>
                <div className="mt-2 inline-block px-3 py-1 bg-gray-100 rounded text-xs font-bold uppercase text-gray-800">
                  {currentStatus}
                </div>
              </div>
            </div>

          {/* Barcode styling */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center justify-center">
            <div className="flex gap-1 h-12 items-center">
              {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 2, 4, 2, 1, 3, 2, 4, 1, 3].map((w, i) => (
                <div
                  key={i}
                  className="bg-black h-full"
                  style={{ width: `${w * 2}px` }}
                />
              ))}
            </div>
            <span className="text-xs font-mono tracking-widest mt-1 text-gray-700">
              *{order.id}*
            </span>
          </div>

          {/* Customer & Destination */}
          <div className="grid grid-cols-2 gap-6 mb-6 p-4 bg-purple-50/50 rounded-xl border border-purple-100 text-xs">
            <div>
              <strong className="block text-purple-900 uppercase font-semibold mb-1">
                Recipient Details:
              </strong>
              <p className="font-bold text-sm text-gray-900">{order.name}</p>
              <p className="text-gray-700">{order.phone}</p>
              <p className="text-gray-700">{order.email}</p>
            </div>
            <div>
              <strong className="block text-purple-900 uppercase font-semibold mb-1">
                Delivery Destination:
              </strong>
              <p className="text-gray-900 font-medium">{order.address}</p>
              <p className="text-purple-700 font-bold">{order.state}</p>
              {order.landmark && (
                <p className="text-gray-700 mt-1">
                  <span className="font-semibold">Landmark:</span> {order.landmark}
                </p>
              )}
              <p className="text-gray-600 mt-1 italic">
                Method: {order.deliveryLabel} ({order.eta})
              </p>
            </div>
          </div>

          {/* Itemized packing checklist */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-2">
              Itemized Packing Checklist:
            </h3>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-100 text-gray-700 uppercase">
                  <th className="p-2 w-10 text-center">[✓]</th>
                  <th className="p-2">Item Description</th>
                  <th className="p-2">Option / Variant</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Price</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="p-2 text-center">
                      <div className="w-4 h-4 border-2 border-gray-400 rounded inline-block" />
                    </td>
                    <td className="p-2 font-medium text-gray-900">{it.name}</td>
                    <td className="p-2 text-gray-600">{it.opt} ({it.color})</td>
                    <td className="p-2 text-center font-bold">{it.qty}</td>
                    <td className="p-2 text-right">{money(it.price)}</td>
                    <td className="p-2 text-right font-bold">{money(it.price * it.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-between items-start pt-4 border-t border-gray-300 text-xs mb-8">
            <div className="text-gray-600 space-y-1">
              <p>Payment: <strong>{order.payLabel}</strong> ({order.paymentStatus?.toUpperCase()})</p>
              {order.note && <p>Customer Note: <em>"{order.note}"</em></p>}
            </div>
            <div className="w-56 space-y-1 text-right">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>{money(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery:</span>
                <span>{order.fee > 0 ? money(order.fee) : 'FREE'}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-700 font-medium">
                  <span>Discount:</span>
                  <span>-{money(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold border-t border-gray-300 pt-1 text-purple-900">
                <span>Grand Total:</span>
                <span>{money(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Warehouse sign-off */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-200 text-xs text-gray-600">
            <div>
              <p className="mb-4">Packed By: _____________________________</p>
              <p>Date / Time: ___________________________</p>
            </div>
            <div>
              <p className="mb-4">Courier Handler: ______________________</p>
              <p>Receiver Signature: ____________________</p>
            </div>
          </div>

          {viewingSlip && (
            <div className="mt-8 flex gap-3 justify-end print:hidden">
              <button
                onClick={() => setViewingSlip(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-100"
              >
                Return to Order View
              </button>
              <button
                onClick={handlePrintSlip}
                className="px-4 py-2 bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-purple-800"
              >
                <Printer className="w-4 h-4" /> Print Document
              </button>
            </div>
          )}
        </div>

        {/* Regular Interactive Modal Header (Hidden on Print) */}
        <div className={`p-5 sm:p-7 border-b border-[var(--line)] bg-[var(--surface2)]/80 flex items-center justify-between gap-4 ${viewingSlip ? 'hidden' : 'block print:hidden'}`}>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="w-10 h-10 rounded-2xl bg-brand text-white flex items-center justify-center font-bold text-sm shadow-md">
              #{order.id.slice(-4)}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
                  Order #{order.id}
                </h2>
                <button
                  onClick={() => handleCopy(order.id, 'orderId')}
                  title="Copy Order ID"
                  className="p-1 rounded-md hover:bg-purple-500/10 text-brand transition-colors text-xs flex items-center gap-1 font-mono"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedField === 'orderId' ? 'Copied!' : ''}
                </button>
              </div>
              <p className="text-xs text-[var(--mute)] flex items-center gap-2 mt-0.5">
                <span>{order.createdAt ? new Date(order.createdAt).toLocaleString('en-NG') : 'Recent'}</span>
                <span>•</span>
                <span className="font-medium text-[var(--ink)]">{order.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              {getPaymentBadge()}
              {getStatusBadge(currentStatus)}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--mute)] hover:text-[var(--ink)] hover:bg-purple-500/10 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className={`flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 ${viewingSlip ? 'hidden' : 'block print:hidden'}`}>
          
          {/* Status Transition Feedback Banner */}
          {statusFeedback && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>{statusFeedback}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusFeedback(null)}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline px-2 py-0.5 rounded"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Mobile badges */}
          <div className="flex sm:hidden items-center justify-between gap-2 flex-wrap">
            {getPaymentBadge()}
            {getStatusBadge(currentStatus)}
          </div>

          {/* Quick Action Bar (Status Switcher & Primary 1-Click Buttons) */}
          <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            
            {/* Status Workflow Switcher */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--mute)]">
                Fulfillment Workflow:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  disabled={isUpdating}
                  onClick={() => handleRequestStatusChange('confirmed')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    currentStatus === 'confirmed'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-[var(--surface)] text-[var(--ink2)] border border-[var(--line)] hover:bg-purple-500/10'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  Mark Confirmed
                </button>

                <button
                  disabled={isUpdating}
                  onClick={() => handleRequestStatusChange('dispatched')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    currentStatus === 'dispatched' || currentStatus === 'shipped'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-[var(--surface)] text-[var(--ink2)] border border-[var(--line)] hover:bg-amber-500/10'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  Mark Dispatched
                </button>

                <button
                  disabled={isUpdating}
                  onClick={() => handleRequestStatusChange('delivered')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    currentStatus === 'delivered'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-[var(--surface)] text-[var(--ink2)] border border-[var(--line)] hover:bg-emerald-500/10'
                  }`}
                >
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Mark Delivered
                </button>

                <button
                  disabled={isUpdating}
                  onClick={() => handleRequestStatusChange('cancelled')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    currentStatus === 'cancelled'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-[var(--surface)] text-rose-500 border border-rose-500/20 hover:bg-rose-500/10'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  Cancel
                </button>
              </div>
            </div>

            {/* Print Slip & Email triggers */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => setViewingSlip(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-purple-500/10 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-brand" />
                <span>Packing Slip</span>
              </button>

              <button
                onClick={() => handleSendEmail(order.orderStatus === 'dispatched' ? 'dispatch' : 'order_confirmation')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-purple-500/10 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Mail className="w-3.5 h-3.5 text-brand" />
                <span>{emailStatus === 'sending' ? 'Sending...' : emailStatus === 'sent' ? 'Sent ✓' : 'Send Email'}</span>
              </button>
            </div>
          </div>

          {/* 1-Click WhatsApp Customer Contact Button */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                  Direct WhatsApp Dispatch Channel
                </h4>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/70 mt-0.5 max-w-md">
                  Pre-filled update message for <strong>{order.name}</strong> tailored to status: <em>{order.orderStatus?.toUpperCase()}</em>
                </p>
              </div>
            </div>

            <a
              href={waContactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold tracking-wide flex items-center gap-2 transition-transform transform active:scale-95 shadow-md shadow-emerald-500/20 w-full sm:w-auto justify-center"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Contact Customer ({order.phone})</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>

          {/* 2-Column Grid: Customer Dossier & Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Customer Details Dossier */}
            <div className="p-5 rounded-2xl bg-[var(--surface2)]/60 border border-[var(--line)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Customer Dossier
                </span>
                <span className="text-xs text-[var(--mute)]">ID: #{order.id}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[var(--mute)] block text-[11px] uppercase tracking-wider font-semibold">Name</span>
                  <span className="font-bold text-sm text-[var(--ink)]">{order.name}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[var(--mute)] block text-[11px] uppercase tracking-wider font-semibold">Phone</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <a href={`tel:${order.phone}`} className="font-semibold text-brand hover:underline">
                        {order.phone}
                      </a>
                      <button
                        onClick={() => handleCopy(order.phone, 'phone')}
                        className="text-[var(--mute)] hover:text-brand"
                        title="Copy phone"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[var(--mute)] block text-[11px] uppercase tracking-wider font-semibold">Email</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="truncate max-w-[140px] text-[var(--ink)]" title={order.email}>
                        {order.email}
                      </span>
                      <button
                        onClick={() => handleCopy(order.email, 'email')}
                        className="text-[var(--mute)] hover:text-brand"
                        title="Copy email"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[var(--mute)] block text-[11px] uppercase tracking-wider font-semibold">
                    Delivery Address & State
                  </span>
                  <p className="text-[var(--ink)] mt-0.5 font-medium leading-relaxed">
                    {order.address}
                  </p>
                  <span className="inline-block mt-1 font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-md">
                    {order.state}
                  </span>
                </div>

                {order.landmark && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                    <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider">
                      <MapPin className="w-3 h-3 text-amber-500" /> Landmark Directions:
                    </span>
                    <p className="mt-0.5 font-medium">{order.landmark}</p>
                  </div>
                )}

                <div className="pt-2 border-t border-[var(--line)] flex justify-between items-center text-[var(--mute)]">
                  <span>Method: <strong>{order.deliveryLabel}</strong></span>
                  <span>ETA: <strong>{order.eta}</strong></span>
                </div>

                {/* Interactive Order Note Section */}
                <div className="pt-2 border-t border-[var(--line)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--mute)] flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-brand" /> Fulfillment & Internal Notes
                    </span>
                    {!isEditingNote && (
                      <button
                        type="button"
                        onClick={() => {
                          setNoteDraft(currentNote);
                          setIsEditingNote(true);
                        }}
                        className="text-[11px] text-brand hover:underline font-semibold flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        {currentNote ? 'Edit Note' : '+ Add Note'}
                      </button>
                    )}
                  </div>

                  {isEditingNote ? (
                    <div className="space-y-2">
                      <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Add dispatch instructions, courier waybill number, or customer note..."
                        rows={2}
                        className="w-full text-xs p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] focus:outline-none focus:border-brand resize-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingNote(false)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--mute)] hover:bg-[var(--surface2)]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isSavingNote}
                          onClick={handleSaveNote}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-brand text-white hover:bg-brand-deep flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isSavingNote ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {currentNote ? (
                        <div className="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/10 text-xs text-[var(--ink)] leading-relaxed italic">
                          &ldquo;{currentNote}&rdquo;
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--mute)] italic">No notes recorded for this order.</p>
                      )}
                      {noteFeedback && (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">
                          {noteFeedback}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Breakdown Card */}
            <div className="p-5 rounded-2xl bg-[var(--surface2)]/60 border border-[var(--line)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5" /> Financial Breakdown
                  </span>
                  <span className="text-xs font-semibold text-[var(--mute)]">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-[var(--ink2)]">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-sm">{money(order.subtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center text-[var(--ink2)]">
                    <span>Delivery Fee ({order.deliveryLabel}):</span>
                    <span className="font-semibold">{order.fee > 0 ? money(order.fee) : 'FREE (₦0)'}</span>
                  </div>

                  {order.discount > 0 ? (
                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                      <span>Discount Applied:</span>
                      <span className="font-semibold">-{money(order.discount)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-[var(--mute)]">
                      <span>Discount:</span>
                      <span>₦0</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[var(--line)] flex justify-between items-baseline">
                    <div>
                      <span className="font-bold text-sm text-[var(--ink)] block">Grand Total</span>
                      <span className="text-[11px] text-[var(--mute)]">{order.payLabel}</span>
                    </div>
                    <span className="text-2xl font-extrabold text-brand tracking-tight font-display">
                      {money(order.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Verification Banner */}
              <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between text-xs">
                <span className="text-[var(--mute)]">Payment Reference:</span>
                <span className="font-mono text-xs font-bold text-brand">
                  PAY-{order.id}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Order Cards */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Itemized Order Items ({order.items.length})
            </h3>
            
            <div className="space-y-3">
              {order.items.map((item, idx) => {
                const colorDef = PAL[item.color] || PAL.violet;
                return (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-4 rounded-2xl bg-[var(--surface2)]/40 border border-[var(--line)] flex items-center justify-between gap-4 hover:border-purple-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Product Thumbnail */}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-purple-500/10 border border-purple-500/20 overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                        {item.image ? (
                          <ProductImage
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            fallbackArt={{ type: item.art, color: item.color }}
                          />
                        ) : (
                          <ProductArt type={item.art} color={item.color} className="w-full h-full" />
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm sm:text-base text-[var(--ink)] truncate">
                          {item.name}
                        </h4>
                        
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                          {/* Color Dot & Name */}
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--surface)] text-[var(--ink2)] border border-[var(--line)] font-medium">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block"
                              style={{ backgroundColor: colorDef.main }}
                            />
                            {colorDef.n}
                          </span>

                          {/* Option / Size */}
                          {item.opt && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-brand font-semibold text-[11px]">
                              {item.opt}
                            </span>
                          )}

                          <span className="text-[var(--mute)]">
                            Unit: {money(item.price)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Line Total */}
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-brand inline-block mb-1">
                        Qty: {item.qty}
                      </span>
                      <div className="font-extrabold text-sm sm:text-base text-[var(--ink)]">
                        {money(item.price * item.qty)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className={`p-4 sm:p-5 border-t border-[var(--line)] bg-[var(--surface2)]/80 flex items-center justify-between gap-3 ${viewingSlip ? 'hidden' : 'flex print:hidden'}`}>
          <div className="text-xs text-[var(--mute)] hidden sm:block">
            MiCollections Admin Fulfillment Control • {order.items.length} items to pack
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-xs font-bold text-[var(--ink2)] hover:bg-purple-500/10 transition-colors"
            >
              Close
            </button>

            <a
              href={waContactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>WhatsApp Message</span>
            </a>
          </div>
        </div>

      </div>
    </div>

    {/* Status Transition Confirmation FeedbackModal */}
    {pendingStatus && (
      <FeedbackModal
        isOpen={true}
        onClose={() => setPendingStatus(null)}
        variant={pendingStatus === 'cancelled' ? 'warning' : 'confirm'}
        title={
          pendingStatus === 'cancelled'
            ? `Cancel Order #${order.id}?`
            : `Transition to ${pendingStatus.toUpperCase()}?`
        }
        message={
          pendingStatus === 'cancelled' ? (
            <span>
              Are you sure you want to mark Order <strong>#{order.id}</strong> as{' '}
              <strong className="text-rose-600">CANCELLED</strong>? This will stop fulfillment.
            </span>
          ) : (
            <span>
              Are you sure you want to update Order <strong>#{order.id}</strong> from{' '}
              <strong>{currentStatus.toUpperCase()}</strong> to{' '}
              <strong className="text-brand">{pendingStatus.toUpperCase()}</strong>?
            </span>
          )
        }
        primaryAction={{
          label: pendingStatus === 'cancelled' ? 'Yes, Cancel Order' : `Mark as ${pendingStatus.toUpperCase()}`,
          variant: pendingStatus === 'cancelled' ? 'danger' : 'primary',
          loading: isUpdating,
          onClick: () => executeStatusChange(pendingStatus),
        }}
        secondaryAction={{
          label: 'Keep ' + currentStatus.toUpperCase(),
          onClick: () => setPendingStatus(null),
        }}
      />
    )}
  </>
  );
};
