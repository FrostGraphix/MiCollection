/**
 * Visual & Motion Effects ported from original MiCollections.html
 * Includes Fly-to-Cart parabolic arc, Magnetic cursor attraction, and Toast notifications.
 */

export function flyToCart(fromElement: HTMLElement | null, imageSrc?: string) {
  if (typeof window === 'undefined' || !fromElement) return;

  const cartTarget = document.getElementById('headerCartBtn') || document.querySelector('[aria-label="Shopping cart"]');
  if (!cartTarget) return;

  const a = fromElement.getBoundingClientRect();
  const b = cartTarget.getBoundingClientRect();

  const flyer = document.createElement('div');
  flyer.className = 'fly-particle';

  const size = Math.min(a.width || 120, 140);
  Object.assign(flyer.style, {
    left: `${a.left + (a.width - size) / 2}px`,
    top: `${a.top + (a.height - size) / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '24px',
    overflow: 'hidden',
    position: 'fixed',
    zIndex: '99999',
    pointerEvents: 'none',
    boxShadow: '0 20px 40px -10px rgba(124, 58, 237, 0.6)',
  });

  if (imageSrc) {
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    flyer.appendChild(img);
  } else {
    flyer.style.background = 'linear-gradient(135deg, #7c3aed, #c026d3)';
  }

  document.body.appendChild(flyer);

  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);

  const animation = flyer.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      {
        transform: `translate(${dx * 0.45}px, ${Math.min(-80, dy * 0.45 - 80)}px) scale(0.65)`,
        opacity: 0.95,
        offset: 0.45,
      },
      {
        transform: `translate(${dx}px, ${dy}px) scale(0.12)`,
        opacity: 0.15,
      },
    ],
    {
      duration: 850,
      easing: 'cubic-bezier(0.5, 0, 0.2, 1)',
    }
  );

  animation.onfinish = () => {
    flyer.remove();
    // Trigger cart badge bump animation
    const badge = cartTarget.querySelector('.cart-badge');
    if (badge) {
      badge.classList.remove('animate-bump');
      void (badge as HTMLElement).offsetWidth;
      badge.classList.add('animate-bump');
    }
  };
}

export function initMagneticButtons() {
  if (typeof window === 'undefined') return () => {};

  const handlePointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const target = (e.target as HTMLElement)?.closest?.('.mag') as HTMLElement | null;

    document.querySelectorAll<HTMLElement>('.mag.pulled').forEach((el) => {
      if (el !== target) {
        el.style.transform = '';
        el.classList.remove('pulled');
      }
    });

    if (!target) return;
    const rect = target.getBoundingClientRect();
    target.classList.add('pulled');
    const x = (e.clientX - rect.left - rect.width / 2) * 0.18;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.28 - 2;
    target.style.transform = `translate(${x}px, ${y}px)`;
  };

  const handlePointerLeave = () => {
    document.querySelectorAll<HTMLElement>('.mag.pulled').forEach((el) => {
      el.style.transform = '';
      el.classList.remove('pulled');
    });
  };

  document.addEventListener('pointermove', handlePointerMove);
  document.addEventListener('pointerleave', handlePointerLeave);

  return () => {
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerleave', handlePointerLeave);
  };
}
