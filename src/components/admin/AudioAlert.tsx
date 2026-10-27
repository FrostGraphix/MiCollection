'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, BellRing, Sparkles } from 'lucide-react';

const AUDIO_MUTE_KEY = 'mc_admin_sound_muted';

let audioCtx: AudioContext | null = null;

/**
 * Returns a singleton Web Audio API context, resuming if suspended by browser autoplay policy
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Checks if sound alerts are muted in local storage
 */
export function isAudioMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(AUDIO_MUTE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Updates the sound alert mute preference and broadcasts the change
 */
export function setAudioMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUDIO_MUTE_KEY, String(muted));
  } catch {}
  window.dispatchEvent(new CustomEvent('mc:audio-mute-change', { detail: { muted } }));
}

/**
 * Plays a procedural 2-tone harmonic chime (~528Hz + 660Hz) using Web Audio API.
 * Zero external audio files required.
 *
 * @param force If true, plays even if muted (e.g. for preview / test button)
 */
export function playOrderChime(force = false): boolean {
  if (typeof window === 'undefined') return false;
  if (!force && isAudioMuted()) return false;

  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    const now = ctx.currentTime;

    // Master bus to control overall volume and prevent clipping
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.7, now);
    masterGain.connect(ctx.destination);

    // Tone 1: 528 Hz (Solfeggio harmonic foundation - warm & serene)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(528, now);

    // Soft attack (35ms) and exponential decay
    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.linearRampToValueAtTime(0.24, now + 0.035);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.9);

    // Tone 2: 660 Hz (Pure major 3rd harmonic overtone, staggered by 80ms)
    const t2 = now + 0.08;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(660, t2);

    gain2.gain.setValueAtTime(0.0001, t2);
    gain2.gain.linearRampToValueAtTime(0.2, t2 + 0.035);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.95);

    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(t2);
    osc2.stop(t2 + 1.0);

    // Tone 3: Subtle crystal overtone (1056 Hz octave sparkle at low volume)
    const t3 = now + 0.04;
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1056, t3);

    gain3.gain.setValueAtTime(0.0001, t3);
    gain3.gain.linearRampToValueAtTime(0.06, t3 + 0.03);
    gain3.gain.exponentialRampToValueAtTime(0.0001, t3 + 0.65);

    osc3.connect(gain3);
    gain3.connect(masterGain);
    osc3.start(t3);
    osc3.stop(t3 + 0.7);

    return true;
  } catch (err) {
    console.warn('Procedural chime synthesis failed:', err);
    return false;
  }
}

interface AudioAlertProps {
  compact?: boolean;
  className?: string;
  showTestButton?: boolean;
}

export const AudioAlert: React.FC<AudioAlertProps> = ({
  compact = false,
  className = '',
  showTestButton = true,
}) => {
  const [muted, setMuted] = useState(false);
  const [isRinging, setIsRinging] = useState(false);

  useEffect(() => {
    setMuted(isAudioMuted());

    const handleNewOrder = () => {
      setIsRinging(true);
      playOrderChime(false);
      setTimeout(() => setIsRinging(false), 1200);
    };

    const handleMuteChange = (e: Event) => {
      const custom = e as CustomEvent<{ muted: boolean }>;
      if (custom.detail) {
        setMuted(custom.detail.muted);
      }
    };

    window.addEventListener('mc:new-order', handleNewOrder);
    window.addEventListener('mc:play-chime', handleNewOrder);
    window.addEventListener('mc:audio-mute-change', handleMuteChange as EventListener);

    return () => {
      window.removeEventListener('mc:new-order', handleNewOrder);
      window.removeEventListener('mc:play-chime', handleNewOrder);
      window.removeEventListener('mc:audio-mute-change', handleMuteChange as EventListener);
    };
  }, []);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    setAudioMuted(next);
  }, [muted]);

  const handleTestChime = useCallback(() => {
    setIsRinging(true);
    playOrderChime(true);
    setTimeout(() => setIsRinging(false), 1200);
  }, []);

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <button
          type="button"
          onClick={toggleMute}
          title={muted ? 'Sound alerts are muted. Click to enable' : 'Sound alerts active. Click to mute'}
          className={`p-2 rounded-xl transition-all ${
            muted
              ? 'text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--line)]/30'
              : 'text-brand hover:bg-brand/10'
          } ${isRinging ? 'animate-bounce text-orchid' : ''}`}
          aria-label={muted ? 'Unmute order chimes' : 'Mute order chimes'}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {showTestButton && (
          <button
            type="button"
            onClick={handleTestChime}
            title="Preview luxury order chime"
            className="text-[11px] font-medium text-[var(--ink2)] hover:text-brand px-2 py-1 rounded-lg hover:bg-[var(--line)]/20 transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-brand" />
            <span>Test</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[var(--surface2)]/80 border border-[var(--line)] text-xs shadow-sm backdrop-blur-md ${className}`}
    >
      <button
        type="button"
        onClick={toggleMute}
        className={`flex items-center gap-1.5 font-medium transition-colors ${
          muted ? 'text-[var(--mute)] hover:text-[var(--ink)]' : 'text-brand hover:text-brand-deep'
        }`}
        title={muted ? 'Unmute order audio alert' : 'Mute order audio alert'}
      >
        {muted ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className={`w-4 h-4 ${isRinging ? 'text-orchid animate-pulse' : ''}`} />
        )}
        <span className="hidden sm:inline">{muted ? 'Alerts Muted' : 'Audio Live'}</span>
      </button>

      {showTestButton && (
        <>
          <span className="w-px h-3.5 bg-[var(--line)]" />
          <button
            type="button"
            onClick={handleTestChime}
            className="inline-flex items-center gap-1 text-[var(--ink2)] hover:text-brand transition-colors font-medium"
            title="Test procedural chime (528Hz harmonic)"
          >
            <BellRing className={`w-3.5 h-3.5 ${isRinging ? 'animate-spin text-brand' : ''}`} />
            <span>Test Chime</span>
          </button>
        </>
      )}
    </div>
  );
};
