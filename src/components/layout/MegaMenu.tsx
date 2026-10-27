'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CATS, PRODUCTS } from '@/lib/products';
import { ProductArt } from '@/components/shop/ProductArt';
import { ArrowRight } from 'lucide-react';

interface MegaMenuProps {
  onClose?: () => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ onClose }) => {
  const pathname = usePathname();
  const [activeCat, setActiveCat] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setActiveCat(params.get('cat'));
    }
  }, [pathname]);

  return (
    <div
      role="region"
      aria-label="Shop categories menu"
      className="absolute left-4 right-4 top-[calc(100%+12px)] p-5 md:p-6 rounded-3xl bg-[var(--surface)]/95 backdrop-blur-2xl border border-[var(--line)] shadow-2xl z-50 animate-dropdown-in before:absolute before:-top-4 before:left-0 before:right-0 before:h-4 before:content-[''] transition-all"
      style={{
        boxShadow:
          '0 30px 70px -20px rgba(76, 29, 149, 0.25), 0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 0 0 1px var(--line)',
      }}
    >
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Category Grid: 2 rows of 4 columns with generous column width so all category names are written out in full */}
        <div className="lg:col-span-8 xl:col-span-9 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
          {CATS.map((cat) => {
            const count = PRODUCTS.filter((p) => p.cat === cat.id).length;
            const isSelected = pathname === '/shop' && activeCat === cat.id;
            return (
              <Link
                key={cat.id}
                href={`/shop?cat=${cat.id}`}
                onClick={onClose}
                className={`group relative flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-2xl border transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-sm ${
                  isSelected
                    ? 'bg-[var(--pill)] border-brand/35 shadow-sm'
                    : 'border-transparent hover:border-brand/20 hover:bg-[var(--pill)]'
                }`}
              >
                {/* Art Thumbnail */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0 bg-[var(--surface2)] border border-[var(--line)] group-hover:border-brand/40 group-hover:bg-brand/10 group-hover:shadow-md transition-all duration-300 flex items-center justify-center relative">
                  <div className="w-full h-full transform transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-3">
                    <ProductArt type={cat.art[0]} color={cat.cols[0]} view={0} />
                  </div>
                </div>

                {/* Details: Completely written out in full, no truncation or ellipses */}
                <div className="min-w-0 flex-1">
                  <strong className="block font-display text-sm font-semibold text-[var(--ink)] group-hover:text-brand transition-colors duration-200 leading-snug break-words whitespace-normal">
                    {cat.name}
                  </strong>
                  <small className="block text-xs text-[var(--mute)] group-hover:text-brand-deep/80 dark:group-hover:text-brand-light/80 transition-colors duration-200 mt-0.5">
                    {count} items
                  </small>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Featured Promo Card */}
        <div className="lg:col-span-4 xl:col-span-3">
          <Link
            href="/product/16"
            onClick={onClose}
            className="group/card relative rounded-2xl p-5 bg-gradient-to-br from-[#2e0b5f] via-[#200742] to-[#110324] text-white overflow-hidden flex flex-col justify-end h-full min-h-[200px] border border-purple-800/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-900/50 hover:border-purple-500/50 cursor-pointer"
          >
            {/* Subtle Ambient Radial Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-white/5 opacity-60 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Floating Watch Artwork with Dynamic Hover Rotation & Scale */}
            <div className="absolute right-[-10px] top-[-10px] w-44 h-44 opacity-95 rotate-12 pointer-events-none transition-all duration-500 ease-out group-hover/card:scale-110 group-hover/card:rotate-6 group-hover/card:-translate-y-2 group-hover/card:translate-x-1">
              <ProductArt type="watch" color="violet" view="bare" />
            </div>

            <div className="relative z-10">
              {/* Live Indicator Badge */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] tracking-widest font-semibold uppercase text-purple-200">
                  Popular Right Now
                </span>
              </div>

              <strong className="block font-display text-xl font-bold mb-3 tracking-tight text-white group-hover/card:text-purple-100 transition-colors">
                Ultra 2 Smart Watch
              </strong>

              <span className="inline-flex items-center gap-2 text-xs font-semibold py-2 px-4 rounded-full bg-white text-[#2e1065] shadow-md group-hover/card:bg-purple-100 group-hover/card:shadow-lg transition-all duration-200">
                Shop now
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/card:translate-x-1" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
