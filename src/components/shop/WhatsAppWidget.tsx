'use client';

import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { CFG } from '@/lib/products';
import { waLink } from '@/lib/utils';

export const WhatsAppWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const quickPrompts = [
    {
      label: 'Ask about a product',
      text: 'Hello MiCollections, I would like to ask about a product in stock.',
    },
    {
      label: 'Delivery to my state',
      text: 'Hello MiCollections, do you deliver to my state? How much is courier delivery?',
    },
    {
      label: 'I will send a screenshot',
      text: 'Hello MiCollections, I want something I saw online. I will send a screenshot.',
    },
    {
      label: 'Pay on delivery in Abuja',
      text: 'Hello MiCollections, is pay on delivery available in Abuja?',
    },
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = message.trim() || 'Hello MiCollections, I need help with an order.';
    window.open(waLink(textToSend), '_blank', 'noopener,noreferrer');
    setMessage('');
  };

  return (
    <div className="fixed right-5 bottom-5 z-40 flex flex-col items-end gap-3 pointer-events-none">
      {/* Expanded Chat Box */}
      {isOpen && (
        <div
          className="pointer-events-auto w-[min(360px,calc(100vw-32px))] rounded-3xl overflow-hidden bg-[var(--surface)] border border-[var(--line)] shadow-2xl animate-in zoom-in-95 origin-bottom-right duration-200"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-wa-deep via-wa-dark to-wa p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-white text-brand flex items-center justify-center font-extrabold text-sm shadow">
                Mi
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-wa-deep" />
              </div>
              <div>
                <strong className="block text-sm leading-tight">MiCollections</strong>
                <small className="text-[11px] text-green-100/90">
                  Open 24 hours &bull; Replies fast on WhatsApp
                </small>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-black/10"
              aria-label="Close WhatsApp chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="p-4 bg-[var(--surface2)] flex flex-col gap-3 max-h-[300px] overflow-y-auto">
            <div className="bg-[var(--surface)] p-3 rounded-2xl rounded-tl-sm text-xs shadow-sm max-w-[90%] border border-[var(--line)]">
              <p>
                Hi there! Welcome to MiCollections, your home of varieties. What can we help you find today?
              </p>
              <span className="block text-[10px] text-[var(--mute)] text-right mt-1">now</span>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-col gap-1.5 items-start">
              {quickPrompts.map((prompt, idx) => (
                <a
                  key={idx}
                  href={waLink(prompt.text)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border border-wa/30 bg-[var(--surface)] text-wa-dark hover:bg-wa hover:text-white transition-all shadow-sm"
                >
                  {prompt.label}
                </a>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-[var(--surface)] border-t border-[var(--line)] flex gap-2 items-center"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-[var(--surface2)] text-xs h-10 px-4 rounded-full border-0 outline-none placeholder:text-[var(--mute)]"
            />
            <button
              type="submit"
              className="w-10 h-10 rounded-full bg-wa text-white flex items-center justify-center hover:bg-wa-dark transition-colors flex-shrink-0 shadow-sm"
              aria-label="Send WhatsApp message"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Button */}
      <div className="pointer-events-auto relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 rounded-full bg-wa text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
          style={{ boxShadow: '0 16px 36px -10px rgba(37, 211, 102, 0.7)' }}
          aria-label="Chat on WhatsApp"
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform rotate-0 hover:rotate-90" />
          ) : (
            <MessageSquare className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
};
