'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { money } from '@/lib/utils';

export const HowItWorksPhone: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const stepsContainerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver to sync active step on scroll, from original MiCollections.html
  useEffect(() => {
    if (!stepsContainerRef.current) return;
    const stepElements = stepsContainerRef.current.querySelectorAll<HTMLElement>('.phone-step');
    if (!stepElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const stepIndex = Number(entry.target.getAttribute('data-step') || 0);
            setActiveStep(stepIndex);
          }
        });
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );

    stepElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      title: 'Browse or send a screenshot',
      desc: 'Find it on the site, or screenshot what you saw online and send it on WhatsApp. We will source it for you.',
    },
    {
      title: 'Chat to confirm',
      desc: 'Tell us your size, colour and address. We confirm availability and your total right in the chat.',
    },
    {
      title: 'Pay safely',
      desc: 'Pay by transfer, card link, or on delivery within Abuja. Customers order, we do not scam. Your money is safe with us.',
    },
    {
      title: 'Delivered to you',
      desc: 'We deliver nationwide. We are open 24 hours, so you can order any time and we will answer.',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-start">
      {/* Pinned Sticky Phone on Left (Both Desktop and Mobile) */}
      <div className="sticky top-[80px] lg:top-28 z-20 flex flex-col items-center justify-center py-2 bg-[var(--bg2)]/95 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none transition-all">
        <div
          className="w-full max-w-[300px] sm:max-w-[340px] rounded-[38px] sm:rounded-[44px] p-2.5 sm:p-3 bg-[var(--inv)] shadow-2xl border border-purple-400/20"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          <div className="rounded-[30px] sm:rounded-[34px] overflow-hidden bg-[#0f0a19] text-[#f7f2ff] flex flex-col h-[340px] sm:h-[400px] lg:h-[460px]">
            {/* Phone Header */}
            <div className="flex items-center gap-3 p-4 bg-[#1b1230] border-b border-white/10">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-brand-deep text-white flex items-center justify-center font-extrabold text-sm shadow">
                Mi
              </div>
              <div>
                <strong className="block font-medium text-sm">MiCollections</strong>
                <small className="text-emerald-400 text-xs">online now</small>
              </div>
            </div>

            {/* Simulated Chat Messages */}
            <div className="flex-1 p-4 flex flex-col justify-end gap-2.5 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent">
              {/* Message 1 (Step 0) */}
              <div className="self-end bg-brand text-white text-xs py-2 px-3.5 rounded-2xl rounded-br-sm max-w-[85%] shadow-sm animate-in fade-in slide-in-from-bottom-2">
                Hi! Is the Ultra 2 smart watch available?
              </div>
              <div className="self-start bg-[#241a3a] text-purple-100 text-xs py-2 px-3.5 rounded-2xl rounded-bl-sm max-w-[85%] shadow-sm animate-in fade-in slide-in-from-bottom-2">
                Yes it is. {money(25000)}. Which colour would you like?
              </div>

              {/* Message 2 (Step 1) */}
              {activeStep >= 1 && (
                <>
                  <div className="self-end bg-brand text-white text-xs py-2 px-3.5 rounded-2xl rounded-br-sm max-w-[85%] shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    Black please. Deliver to Gwarinpa.
                  </div>
                  <div className="self-start bg-[#241a3a] text-purple-100 text-xs py-2 px-3.5 rounded-2xl rounded-bl-sm max-w-[85%] shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    Noted! Total with delivery: {money(27500)}. Pay by transfer or on delivery.
                  </div>
                </>
              )}

              {/* Message 3 (Step 2) */}
              {activeStep >= 2 && (
                <div className="self-start bg-emerald-950 text-emerald-200 border border-emerald-800 text-xs py-2 px-3.5 rounded-2xl flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Payment confirmed
                </div>
              )}

              {/* Message 4 (Step 3) */}
              {activeStep >= 3 && (
                <>
                  <div className="self-start bg-[#241a3a] text-purple-100 text-xs py-2 px-3.5 rounded-2xl rounded-bl-sm max-w-[85%] shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    Your order is dispatched with our Abuja rider!
                  </div>
                  <div className="self-start bg-emerald-950 text-emerald-200 border border-emerald-800 text-xs py-2 px-3.5 rounded-2xl flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Delivered safely. Thank you!
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Steps List on Right */}
      <div ref={stepsContainerRef} className="flex flex-col gap-6">
        {steps.map((step, idx) => {
          const isCurrent = activeStep === idx;
          return (
            <div
              key={idx}
              data-step={idx}
              onClick={() => setActiveStep(idx)}
              className={`phone-step cursor-pointer p-6 sm:p-8 rounded-3xl border transition-all duration-300 ${
                isCurrent
                  ? 'bg-[var(--surface)] border-brand shadow-xl scale-[1.02]'
                  : 'bg-[var(--surface)]/60 border-[var(--line)] opacity-60 hover:opacity-100'
              }`}
              style={{ boxShadow: isCurrent ? 'var(--shadow)' : undefined }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-display text-lg font-bold bg-[var(--pill)] text-brand mb-4">
                {idx + 1}
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-[var(--ink2)] leading-relaxed">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
