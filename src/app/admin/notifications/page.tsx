'use client';

import React, { useState, useEffect } from 'react';
import { StoreNotification } from '@/types';
import { INITIAL_NOTIFICATIONS, INITIAL_ORDERS } from '@/lib/mockOrders';
import { playOrderChime } from '@/components/admin/AudioAlert';
import { money } from '@/lib/utils';
import {
  Bell,
  Mail,
  MessageSquare,
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Eye,
  RefreshCw,
  Phone,
  ShieldAlert,
  Smartphone,
  Monitor,
  ExternalLink,
  Layers,
} from 'lucide-react';

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'emails' | 'broadcast'>('alerts');
  const [notifications, setNotifications] = useState<StoreNotification[]>(INITIAL_NOTIFICATIONS);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [isSimulating, setIsSimulating] = useState(false);

  // Email pipeline state
  const [emailTemplate, setEmailTemplate] = useState<'order_confirmation' | 'admin_alert' | 'dispatch'>('order_confirmation');
  const [emailHtml, setEmailHtml] = useState<string>('');
  const [emailPreviewMode, setEmailPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [testEmailAddress, setTestEmailAddress] = useState('admin@micollections.com');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSendStatus, setEmailSendStatus] = useState<string | null>(null);

  // Fetch email preview from API
  useEffect(() => {
    async function loadEmail() {
      try {
        const res = await fetch(`/api/admin/email?type=${emailTemplate}`);
        if (res.ok) {
          const data = await res.json();
          setEmailHtml(data.html || '');
        }
      } catch (err) {
        console.warn('Failed to load email preview:', err);
      }
    }
    loadEmail();
  }, [emailTemplate]);

  // Handle Mark All Read
  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Simulate New Live Order Event
  const handleSimulateOrder = () => {
    setIsSimulating(true);
    playOrderChime(true);

    const newId = `MC-${Math.floor(100000 + Math.random() * 900000)}`;
    const randomAmount = Math.floor(45000 + Math.random() * 75000);
    const newNotif: StoreNotification = {
      id: `notif-${Date.now()}`,
      type: 'order_new',
      title: `⚡ Live Order Received: #${newId}`,
      message: `Zainab Aliyu placed a new order for ${money(randomAmount)} (Maitama, Abuja).`,
      timestamp: 'Just now',
      orderId: newId,
      customerName: 'Zainab Aliyu',
      amount: randomAmount,
      read: false,
      priority: 'high',
    };

    setNotifications((prev) => [newNotif, ...prev]);

    // Dispatch global event for other components listening
    window.dispatchEvent(
      new CustomEvent('mc:new-order', {
        detail: {
          id: newId,
          amount: randomAmount,
          customer: 'Zainab Aliyu',
          city: 'Maitama, Abuja',
        },
      })
    );

    setTimeout(() => {
      setIsSimulating(false);
    }, 1200);
  };

  // Handle Send Test Email
  const handleSendTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);
    setEmailSendStatus(null);

    setTimeout(() => {
      setIsSendingEmail(false);
      setEmailSendStatus(`✓ Branded email sent successfully to ${testEmailAddress}`);
      setTimeout(() => setEmailSendStatus(null), 4000);
    }, 1000);
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    if (selectedFilter === 'unread') return !n.read;
    if (selectedFilter === 'high') return n.priority === 'high';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[var(--ink)]">
              Emails & Multi-Channel <em className="serif-italic">Alerts</em>
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand text-white shadow-sm shadow-brand/20">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[var(--mute)] mt-1">
            Real-time Web Audio chimes, automated WhatsApp customer triggers, and transactional email dispatch.
          </p>
        </div>

        {/* Global Action: Test Audio Chime */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => playOrderChime(true)}
            className="btn-ghost flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-brand/10 hover:text-brand transition-all shadow-sm"
            title="Synthesize 528Hz + 660Hz harmonic chime via Web Audio API"
          >
            <Volume2 className="w-4 h-4 text-brand" />
            <span>Test Sound Chime</span>
          </button>
          <button
            type="button"
            onClick={handleSimulateOrder}
            disabled={isSimulating}
            className="btn-primary flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Sparkles className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>Simulate Live Order</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] w-fit shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'alerts'
              ? 'bg-gradient-to-r from-brand to-orchid text-white shadow-sm'
              : 'text-[var(--mute)] hover:text-[var(--ink)]'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>In-Store Activity Feed</span>
          {unreadCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'alerts' ? 'bg-white/20 text-white' : 'bg-brand/10 text-brand'
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('emails')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'emails'
              ? 'bg-gradient-to-r from-brand to-orchid text-white shadow-sm'
              : 'text-[var(--mute)] hover:text-[var(--ink)]'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Transactional Emails</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'broadcast'
              ? 'bg-gradient-to-r from-brand to-orchid text-white shadow-sm'
              : 'text-[var(--mute)] hover:text-[var(--ink)]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp Broadcast Channel</span>
        </button>
      </div>

      {/* TAB 1: IN-STORE ALERTS FEED */}
      {activeTab === 'alerts' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Sub Filters & Actions */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--surface)] border border-[var(--line)]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  selectedFilter === 'all'
                    ? 'bg-brand/15 text-brand font-bold'
                    : 'text-[var(--mute)] hover:text-[var(--ink)]'
                }`}
              >
                All Events ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('unread')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  selectedFilter === 'unread'
                    ? 'bg-brand/15 text-brand font-bold'
                    : 'text-[var(--mute)] hover:text-[var(--ink)]'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('high')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  selectedFilter === 'high'
                    ? 'bg-rose-500/15 text-rose-600 font-bold'
                    : 'text-[var(--mute)] hover:text-[var(--ink)]'
                }`}
              >
                High Priority
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-brand hover:underline flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-start gap-4 ${
                  !notif.read
                    ? 'bg-gradient-to-r from-brand/5 via-[var(--surface)] to-[var(--surface)] border-brand/30 shadow-md shadow-brand/5'
                    : 'bg-[var(--surface)] border-[var(--line)] opacity-85 hover:opacity-100'
                }`}
              >
                {/* Icon based on type */}
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                    notif.type === 'order_new'
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
                      : notif.type === 'payment_alert'
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
                      : notif.type === 'stock_warning'
                      ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white'
                      : notif.type === 'vip_customer'
                      ? 'bg-gradient-to-br from-purple-500 to-brand text-white'
                      : 'bg-gradient-to-br from-brand to-orchid text-white'
                  }`}
                >
                  {notif.type === 'order_new' ? (
                    <Sparkles className="w-5 h-5" />
                  ) : notif.type === 'payment_alert' ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : notif.type === 'stock_warning' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Bell className="w-5 h-5" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                      <span>{notif.title}</span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                      )}
                    </h3>
                    <span className="text-[11px] text-[var(--mute)] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {notif.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--ink2)] mt-1 leading-relaxed">
                    {notif.message}
                  </p>

                  {/* Contextual actions */}
                  <div className="mt-3 flex items-center gap-2">
                    {notif.orderId && (
                      <a
                        href={`/admin/orders?q=${notif.orderId}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[var(--surface2)] text-brand hover:bg-brand hover:text-white text-xs font-semibold border border-[var(--line)] transition-all"
                      >
                        <span>View Order #{notif.orderId}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {notif.priority === 'high' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
                        Urgent Action Required
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTIONAL EMAIL PIPELINE */}
      {activeTab === 'emails' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Template Selector & Test Dispatch Form */}
            <div className="space-y-6">
              {/* Template Chooser Card */}
              <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-sm space-y-4">
                <h3 className="font-display font-bold text-base text-[var(--ink)] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand" />
                  <span>Choose Email Template</span>
                </h3>

                <div className="space-y-2">
                  {[
                    {
                      id: 'order_confirmation',
                      title: 'Order Confirmation',
                      desc: 'Sent immediately to customer with itemized receipt & payment notice.',
                    },
                    {
                      id: 'admin_alert',
                      title: 'Admin Store Alert',
                      desc: 'Dispatched to MiCollections staff for instant packing & routing.',
                    },
                    {
                      id: 'dispatch',
                      title: 'Courier Dispatch Notice',
                      desc: 'Sent to customer with dispatch rider details & delivery window.',
                    },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setEmailTemplate(tpl.id as any)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        emailTemplate === tpl.id
                          ? 'border-brand bg-brand/10 text-brand shadow-sm'
                          : 'border-[var(--line)] hover:border-brand/40 bg-[var(--surface2)]/50 text-[var(--ink)]'
                      }`}
                    >
                      <strong className="block text-xs font-bold leading-tight">
                        {tpl.title}
                      </strong>
                      <span className="block text-[11px] text-[var(--mute)] mt-1">
                        {tpl.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Send Test Dispatch Simulator */}
              <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-sm space-y-4">
                <h3 className="font-display font-bold text-base text-[var(--ink)] flex items-center gap-2">
                  <Send className="w-4 h-4 text-orchid" />
                  <span>Send Test Email</span>
                </h3>
                <p className="text-xs text-[var(--mute)] leading-relaxed">
                  Trigger a live HTML rendering test delivered to any mailbox using MiCollections branding.
                </p>

                <form onSubmit={handleSendTestEmail} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--ink2)] mb-1">
                      Recipient Email Address
                    </label>
                    <input
                      type="email"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--surface2)] border border-[var(--line)] focus:outline-none focus:border-brand"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSendingEmail ? 'animate-spin' : ''}`} />
                    <span>{isSendingEmail ? 'Dispatching...' : 'Dispatch Test Email'}</span>
                  </button>

                  {emailSendStatus && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-semibold animate-in fade-in">
                      {emailSendStatus}
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Right Column: Live Rendered Iframe Preview */}
            <div className="lg:col-span-2 space-y-3">
              {/* Preview Controls Bar */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--surface)] border border-[var(--line)]">
                <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-2">
                  <Eye className="w-4 h-4 text-brand" />
                  <span>Live Render Preview</span>
                </span>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface2)] border border-[var(--line)]">
                  <button
                    type="button"
                    onClick={() => setEmailPreviewMode('desktop')}
                    className={`p-1.5 rounded-lg transition-all ${
                      emailPreviewMode === 'desktop'
                        ? 'bg-[var(--surface)] text-brand shadow-sm font-bold'
                        : 'text-[var(--mute)] hover:text-[var(--ink)]'
                    }`}
                    title="Desktop Preview (640px)"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailPreviewMode('mobile')}
                    className={`p-1.5 rounded-lg transition-all ${
                      emailPreviewMode === 'mobile'
                        ? 'bg-[var(--surface)] text-brand shadow-sm font-bold'
                        : 'text-[var(--mute)] hover:text-[var(--ink)]'
                    }`}
                    title="Mobile Preview (375px)"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Iframe Viewport Container */}
              <div className="p-4 sm:p-6 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] flex justify-center min-h-[580px] overflow-hidden">
                <div
                  className={`transition-all duration-300 rounded-xl overflow-hidden shadow-2xl bg-white border border-[var(--line)] ${
                    emailPreviewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-[640px]'
                  }`}
                  style={{ height: '620px' }}
                >
                  <iframe
                    title="Email Preview"
                    srcDoc={emailHtml}
                    className="w-full h-full border-0"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WHATSAPP BROADCAST CHANNEL */}
      {activeTab === 'broadcast' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950 via-[#075e54] to-wa-deep text-white border border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-emerald-700 flex items-center justify-center font-black text-lg shadow-md">
                WA
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-white">
                  WhatsApp Direct Dispatch & Broadcast Suite
                </h3>
                <p className="text-xs text-emerald-100/90">
                  Instant deep links tailored to Nigerian commerce with zero customer friction.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-2">
                <h4 className="text-sm font-bold text-emerald-300">Fast Order Confirmation</h4>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  1-click messaging with customer order lines, totals in Naira, and Abuja doorstep ETA.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-2">
                <h4 className="text-sm font-bold text-emerald-300">Rider Contact Deep Link</h4>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  Provides delivery riders with customer phone, GPS landmark instructions, and cash-on-delivery balance.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-2">
                <h4 className="text-sm font-bold text-emerald-300">Promo Broadcast</h4>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  One-tap copy of new arrivals and seasonal discount codes formatted for WhatsApp status and groups.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
