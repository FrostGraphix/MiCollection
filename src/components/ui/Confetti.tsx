'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  trigger?: boolean;
}

export const ConfettiEffect: React.FC<ConfettiProps> = ({ trigger = true }) => {
  useEffect(() => {
    if (!trigger) return;

    const count = 200;
    const defaults = {
      origin: { y: 0.6 },
      colors: ['#7c3aed', '#a78bfa', '#c026d3', '#ddd6fe', '#ffffff', '#e3b94b'],
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, [trigger]);

  return null;
};
