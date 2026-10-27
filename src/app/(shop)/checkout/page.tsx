'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { byId, CFG, PAL, STATES } from '@/lib/products';
import { DeliveryType, PaymentMethod } from '@/types';
import { money } from '@/lib/utils';
import { ProductArt } from '@/components/shop/ProductArt';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, discount, feeOf, clearCart } = useCart();
  const { user, profile } = useAuth();

  const [formData, setFormData] = useState({
    name: profile?.full_name || '',
    phone: profile?.phone || '',
    email: profile?.email || user?.email || '',
    address: profile?.address || '',
    state: profile?.state || 'Abuja (FCT)',
    landmark: '',
    note: '',
  });

  const [delivery, setDelivery] = useState<DeliveryType>(
    formData.state === 'Abuja (FCT)' ? 'abuja' : 'nationwide'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('link');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deliveryFee = feeOf(delivery);
  const total = subtotal - discount + deliveryFee;

  const isPodAvailable = delivery !== 'nationwide';

  const handleStateChange = (selectedState: string) => {
    setFormData((prev) => ({ ...prev, state: selectedState }));
    if (selectedState !== 'Abuja (FCT)' && delivery === 'abuja') {
      setDelivery('nationwide');
      if (paymentMethod === 'pod') setPaymentMethod('transfer');
    } else if (selectedState === 'Abuja (FCT)' && delivery === 'nationwide') {
      setDelivery('abuja');
    }
  };

  const validate = () => {
    const err: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      err.name = 'Please enter your full name';
    }
    if (!formData.phone.trim() || formData.phone.replace(/\D/g, '').length < 10) {
      err.phone = 'Please enter a valid WhatsApp phone number';
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      err.email = 'Please enter a valid email address';
    }
    if (!formData.address.trim() || formData.address.trim().length < 6) {
      err.address = 'Please enter your street / delivery address';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (cart.length === 0) {
      router.push('/cart');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        state: formData.state,
        landmark: formData.landmark,
        note: formData.note,
        deliveryType: delivery,
        deliveryLabel: CFG.delivery[delivery].label,
        eta: CFG.delivery[delivery].eta,
        paymentMethod,
        subtotal,
        discount,
        fee: deliveryFee,
        total,
        items: cart.map((item) => {
          const p = byId(item.id);
          return {
            productId: item.id,
            name: p?.name || 'Item',
            price: p?.price || 0,
            qty: item.qty,
            art: p?.art || 'tote',
            color: item.color,
            opt: `${PAL[item.color]?.n || item.color}${item.size ? ' / ' + item.size : ''}`,
          };
        }),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to place order');
      }

      const orderId = result.order.id;

      // If user selected Paystack Card/USSD payment
      if (paymentMethod === 'link') {
        const paystackRes = await fetch('/api/checkout/paystack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            email: formData.email,
            amount: total,
          }),
        });

        const paystackData = await paystackRes.json();
        if (paystackData.status && paystackData.data?.authorization_url) {
          clearCart();
          window.location.href = paystackData.data.authorization_url;
          return;
        }
      }

      // Transfer or Pay on delivery: Redirect to success page
      clearCart();
      router.push(`/order-success?id=${orderId}`);
    } catch (err: any) {
      console.error('Order submission error:', err);
      alert(err.message || 'Something went wrong placing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center space-y-4">
        <h2 className="font-display text-2xl font-bold">Your cart is empty</h2>
        <p className="text-sm text-[var(--mute)]">Add items to cart before proceeding to checkout.</p>
        <Link href="/shop" className="btn-primary text-xs py-2.5 px-6 inline-flex">
          Go to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[var(--mute)] mb-4">
        <Link href="/" className="hover:text-brand transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/cart" className="hover:text-brand transition-colors">
          Cart
        </Link>
        <span>/</span>
        <span className="text-[var(--ink)] font-semibold">Checkout</span>
      </nav>

      <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight mb-8">
        Almost <em className="serif-italic">Yours</em>
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: 3 Steps Form */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Section 1: Customer Details */}
          <section className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm space-y-5">
            <h3 className="font-display text-xl font-bold flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center text-sm font-extrabold">
                1
              </span>
              Your Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Maryam Bello"
                  className={`w-full h-12 px-4 rounded-2xl bg-[var(--surface2)] border text-sm outline-none transition-colors ${
                    errors.name ? 'border-red-500' : 'border-transparent focus:border-brand'
                  }`}
                />
                {errors.name && <span className="text-[11px] text-red-500 mt-1 block">{errors.name}</span>}
              </div>

              {/* WhatsApp Phone Number */}
              <div>
                <label className="block text-xs font-semibold mb-1.5">WhatsApp Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 0814 573 6483"
                  className={`w-full h-12 px-4 rounded-2xl bg-[var(--surface2)] border text-sm outline-none transition-colors ${
                    errors.phone ? 'border-red-500' : 'border-transparent focus:border-brand'
                  }`}
                />
                {errors.phone && <span className="text-[11px] text-red-500 mt-1 block">{errors.phone}</span>}
              </div>

              {/* Email Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1.5">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className={`w-full h-12 px-4 rounded-2xl bg-[var(--surface2)] border text-sm outline-none transition-colors ${
                    errors.email ? 'border-red-500' : 'border-transparent focus:border-brand'
                  }`}
                />
                {errors.email && <span className="text-[11px] text-red-500 mt-1 block">{errors.email}</span>}
              </div>

              {/* Delivery Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1.5">Delivery Address *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="House number, street name, estate, area"
                  className={`w-full h-12 px-4 rounded-2xl bg-[var(--surface2)] border text-sm outline-none transition-colors ${
                    errors.address ? 'border-red-500' : 'border-transparent focus:border-brand'
                  }`}
                />
                {errors.address && <span className="text-[11px] text-red-500 mt-1 block">{errors.address}</span>}
              </div>

              {/* State */}
              <div>
                <label className="block text-xs font-semibold mb-1.5">State *</label>
                <select
                  value={formData.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full h-12 px-4 rounded-2xl bg-[var(--surface2)] border border-transparent text-sm outline-none focus:border-brand cursor-pointer"
                >
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-xs font-semibold mb-1.5">Nearest Landmark (Optional)</label>
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  placeholder="e.g. Opposite the central mosque"
                  className="w-full h-12 px-4 rounded-2xl bg-[var(--surface2)] border border-transparent text-sm outline-none focus:border-brand"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Delivery Method */}
          <section className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm space-y-4">
            <h3 className="font-display text-xl font-bold flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center text-sm font-extrabold">
                2
              </span>
              Delivery Option
            </h3>

            <div className="space-y-3">
              {/* Abuja Doorstep */}
              <label
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  delivery === 'abuja'
                    ? 'border-brand bg-[var(--pill)]'
                    : 'border-[var(--line)] hover:border-brand/40'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <input
                    type="radio"
                    name="delivery"
                    value="abuja"
                    checked={delivery === 'abuja'}
                    onChange={() => setDelivery('abuja')}
                    className="accent-brand"
                  />
                  <div>
                    <strong className="block text-sm font-semibold">Abuja Doorstep Delivery</strong>
                    <small className="text-xs text-[var(--mute)]">1 to 2 working days within FCT Abuja</small>
                  </div>
                </div>
                <span className="font-display font-bold text-sm">
                  {feeOf('abuja') === 0 ? 'Free' : money(feeOf('abuja'))}
                </span>
              </label>

              {/* Nationwide Courier */}
              <label
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  delivery === 'nationwide'
                    ? 'border-brand bg-[var(--pill)]'
                    : 'border-[var(--line)] hover:border-brand/40'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <input
                    type="radio"
                    name="delivery"
                    value="nationwide"
                    checked={delivery === 'nationwide'}
                    onChange={() => {
                      setDelivery('nationwide');
                      if (paymentMethod === 'pod') setPaymentMethod('transfer');
                    }}
                    className="accent-brand"
                  />
                  <div>
                    <strong className="block text-sm font-semibold">Nationwide Courier Delivery</strong>
                    <small className="text-xs text-[var(--mute)]">2 to 5 working days to all other states</small>
                  </div>
                </div>
                <span className="font-display font-bold text-sm">
                  {feeOf('nationwide') === 0 ? 'Free' : money(feeOf('nationwide'))}
                </span>
              </label>

              {/* Pickup in Abuja */}
              <label
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  delivery === 'pickup'
                    ? 'border-brand bg-[var(--pill)]'
                    : 'border-[var(--line)] hover:border-brand/40'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <input
                    type="radio"
                    name="delivery"
                    value="pickup"
                    checked={delivery === 'pickup'}
                    onChange={() => setDelivery('pickup')}
                    className="accent-brand"
                  />
                  <div>
                    <strong className="block text-sm font-semibold">Pickup in Abuja</strong>
                    <small className="text-xs text-[var(--mute)]">Ready same day at our store</small>
                  </div>
                </div>
                <span className="font-display font-bold text-sm text-green-600">Free</span>
              </label>
            </div>
          </section>

          {/* Section 3: Payment Method */}
          <section className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm space-y-4">
            <h3 className="font-display text-xl font-bold flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center text-sm font-extrabold">
                3
              </span>
              Payment Method
            </h3>

            <div className="space-y-3">
              {/* Paystack Online Payment */}
              <label
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'link'
                    ? 'border-brand bg-[var(--pill)]'
                    : 'border-[var(--line)] hover:border-brand/40'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <input
                    type="radio"
                    name="payment"
                    value="link"
                    checked={paymentMethod === 'link'}
                    onChange={() => setPaymentMethod('link')}
                    className="accent-brand"
                  />
                  <div>
                    <strong className="block text-sm font-semibold">Paystack (Debit Card, USSD, Apple Pay)</strong>
                    <small className="text-xs text-[var(--mute)]">Instant secure online checkout via Paystack</small>
                  </div>
                </div>
              </label>

              {/* Direct Bank Transfer */}
              <label
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'transfer'
                    ? 'border-brand bg-[var(--pill)]'
                    : 'border-[var(--line)] hover:border-brand/40'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <input
                    type="radio"
                    name="payment"
                    value="transfer"
                    checked={paymentMethod === 'transfer'}
                    onChange={() => setPaymentMethod('transfer')}
                    className="accent-brand"
                  />
                  <div>
                    <strong className="block text-sm font-semibold">Bank Transfer</strong>
                    <small className="text-xs text-[var(--mute)]">Account details displayed and sent on WhatsApp</small>
                  </div>
                </div>
              </label>

              {/* Pay on Delivery */}
              <label
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  !isPodAvailable
                    ? 'opacity-40 cursor-not-allowed border-[var(--line)]'
                    : paymentMethod === 'pod'
                    ? 'border-brand bg-[var(--pill)] cursor-pointer'
                    : 'border-[var(--line)] hover:border-brand/40 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <input
                    type="radio"
                    name="payment"
                    value="pod"
                    disabled={!isPodAvailable}
                    checked={paymentMethod === 'pod'}
                    onChange={() => setPaymentMethod('pod')}
                    className="accent-brand"
                  />
                  <div>
                    <strong className="block text-sm font-semibold">Pay on Delivery</strong>
                    <small className="text-xs text-[var(--mute)]">
                      {isPodAvailable ? 'Available for Abuja doorstep and pickup' : 'Available only within Abuja'}
                    </small>
                  </div>
                </div>
              </label>
            </div>
          </section>

          {/* Section 4: Order Note */}
          <section className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-sm space-y-2">
            <h3 className="font-display text-lg font-bold">
              Order Note <span className="text-xs font-normal text-[var(--mute)]">(Optional)</span>
            </h3>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Any specific requests about sizes, colours, timing or apartment directions?"
              className="w-full h-24 p-4 rounded-2xl bg-[var(--surface2)] border border-transparent text-sm outline-none focus:border-brand"
            />
          </section>
        </div>

        {/* Right Sticky Order Summary */}
        <aside
          className="lg:col-span-4 lg:sticky lg:top-24 p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xl flex flex-col gap-6"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          <h3 className="font-display text-xl font-bold">Your Order</h3>

          {/* Order Mini Items */}
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {cart.map((item) => {
              const product = byId(item.id);
              if (!product) return null;
              return (
                <div key={`${item.id}-${item.color}-${item.size}`} className="flex items-center gap-3 text-xs">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[var(--surface2)] border border-[var(--line)] flex-shrink-0">
                    <ProductArt type={product.art} color={item.color} view={0} />
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[var(--ink)] text-[var(--bg)] font-bold text-[10px] flex items-center justify-center">
                      {item.qty}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block font-semibold truncate">{product.name}</span>
                    <span className="text-[11px] text-[var(--mute)]">
                      {PAL[item.color]?.n || item.color}
                      {item.size ? ` / ${item.size}` : ''}
                    </span>
                  </div>
                  <span className="font-mono font-bold">{money(product.price * item.qty)}</span>
                </div>
              );
            })}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2.5 text-sm pt-4 border-t border-[var(--line)]">
            <div className="flex justify-between">
              <span className="text-[var(--mute)]">Subtotal</span>
              <span className="font-medium font-mono">{money(subtotal)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Promo Discount</span>
                <span className="font-mono">-{money(discount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-[var(--mute)]">Delivery</span>
              <span className="font-medium font-mono">
                {deliveryFee === 0 ? 'Free' : money(deliveryFee)}
              </span>
            </div>

            <div className="flex justify-between font-display text-2xl font-bold pt-3 border-t border-[var(--line)]">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary text-sm py-4 w-full justify-center disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Placing Order...
              </>
            ) : (
              <>
                Place Order <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-xs text-[var(--mute)] text-center flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand" /> Your money is safe with us.
          </p>
        </aside>
      </form>
    </div>
  );
}
