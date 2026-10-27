'use client';

import React, { useState, useId, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProductArt } from '@/components/shop/ProductArt';
import { PAL } from '@/lib/products';
import { ArtType, ColorKey, Product } from '@/types';
import {
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Plus,
  Trash2,
  Sparkles,
  TrendingUp,
  Percent,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Eye,
  RefreshCw,
  Layers,
  Palette,
  Tag,
  Boxes,
  HelpCircle,
  Star,
} from 'lucide-react';

interface ProductFormProps {
  initialProduct?: Product | null;
  mode: 'create' | 'edit';
}

const ALL_ART_TYPES: { type: ArtType; label: string; group: string }[] = [
  { type: 'abaya', label: 'Abaya', group: 'Modest & Wears' },
  { type: 'dress', label: 'Dress', group: 'Modest & Wears' },
  { type: 'hoodie', label: 'Hoodie', group: 'Modest & Wears' },
  { type: 'sneaker', label: 'Sneaker', group: 'Footwear & Bags' },
  { type: 'heel', label: 'Heel', group: 'Footwear & Bags' },
  { type: 'tote', label: 'Tote Bag', group: 'Footwear & Bags' },
  { type: 'crossbody', label: 'Crossbody', group: 'Footwear & Bags' },
  { type: 'necklace', label: 'Necklace', group: 'Jewellery' },
  { type: 'earrings', label: 'Earrings', group: 'Jewellery' },
  { type: 'ring', label: 'Ring', group: 'Jewellery' },
  { type: 'watch', label: 'Smart Watch', group: 'Gadgets & Tech' },
  { type: 'ledpanel', label: 'LED Creator Panel', group: 'Gadgets & Tech' },
  { type: 'earbuds', label: 'Wireless Earbuds', group: 'Gadgets & Tech' },
  { type: 'powerbank', label: 'Power Bank', group: 'Gadgets & Tech' },
  { type: 'pot', label: 'Granite Pot', group: 'Kitchen & Living' },
  { type: 'spoons', label: 'Silicone Spoons', group: 'Kitchen & Living' },
  { type: 'bottles', label: 'Insulated Bottle', group: 'Kitchen & Living' },
  { type: 'basket', label: 'Woven Basket', group: 'Kitchen & Living' },
  { type: 'cushion', label: 'Velvet Cushion', group: 'Kitchen & Living' },
  { type: 'candles', label: 'Scented Candle', group: 'Kitchen & Living' },
  { type: 'perfume', label: 'Signature Perfume', group: 'Beauty & Care' },
  { type: 'gummies', label: 'Wellness Gummies', group: 'Beauty & Care' },
  { type: 'nailkit', label: 'Luxury Nail Kit', group: 'Beauty & Care' },
];

const CATEGORIES = [
  { id: 'women', label: 'Women (Abayas, Dresses, Skirts, Sets)' },
  { id: 'men', label: 'Men (Hoodies, Shirts, Polos, Casual)' },
  { id: 'bags-shoes', label: 'Bags & Shoes (Sneakers, Heels, Totes)' },
  { id: 'jewellery', label: 'Jewellery (Chains, Earrings, Rings)' },
  { id: 'gadgets', label: 'Gadgets (Watches, Earbuds, Lights)' },
  { id: 'kitchen-home', label: 'Kitchen & Home (Pots, Scents, Living)' },
  // Compatibility with existing data
  { id: 'wears', label: 'Wears & Apparel (Legacy Cat)' },
  { id: 'abayas', label: 'Abayas & Modest (Legacy Cat)' },
  { id: 'shoes', label: 'Shoes & Footwear (Legacy Cat)' },
  { id: 'bags', label: 'Bags & Clutches (Legacy Cat)' },
  { id: 'electronics', label: 'Electronics & Audio (Legacy Cat)' },
  { id: 'kitchen', label: 'Kitchen Utensils (Legacy Cat)' },
  { id: 'home', label: 'Household & Scents (Legacy Cat)' },
];

const COLOR_KEYS: ColorKey[] = ['violet', 'black', 'ivory', 'orchid', 'lilac', 'plum', 'gold', 'silver'];

const BADGE_PRESETS = ['Bestseller', 'Trending', 'Hot', 'New', 'Sale', 'Limited Edition', 'Top Pick'];

const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', '41', '42', 'Free Size'];

export const ProductForm: React.FC<ProductFormProps> = ({ initialProduct, mode }) => {
  const router = useRouter();

  // Form State
  const [name, setName] = useState(initialProduct?.name || '');
  const [slug, setSlug] = useState(
    initialProduct?.slug ||
      (initialProduct?.name
        ? initialProduct.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
        : '')
  );
  const [isSlugManual, setIsSlugManual] = useState(Boolean(initialProduct?.slug));
  const [cat, setCat] = useState(initialProduct?.cat || 'women');
  const [badge, setBadge] = useState(initialProduct?.badge || '');
  const [desc, setDesc] = useState(initialProduct?.desc || '');
  const [feat, setFeat] = useState<string[]>(initialProduct?.feat || ['Premium quality finish', 'Made for Abuja elegance']);
  const [newFeatInput, setNewFeatInput] = useState('');

  // Gallery & Visual Art
  const [images, setImages] = useState<string[]>(initialProduct?.images || []);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [art, setArt] = useState<ArtType>(initialProduct?.art || 'dress');
  const [artPickerOpen, setArtPickerOpen] = useState(false);
  const [artSearch, setArtSearch] = useState('');

  // Colors & Sizes
  const [colors, setColors] = useState<ColorKey[]>(
    initialProduct?.colors && initialProduct.colors.length > 0 ? initialProduct.colors : ['violet', 'black']
  );
  const [sizes, setSizes] = useState<string[]>(
    initialProduct?.sizes && initialProduct.sizes.length > 0 ? initialProduct.sizes : ['S', 'M', 'L', 'XL']
  );
  const [newSizeInput, setNewSizeInput] = useState('');

  // Pricing & COGS
  const [price, setPrice] = useState<number | string>(initialProduct?.price ?? 18500);
  const [was, setWas] = useState<number | string>(initialProduct?.was ?? '');
  const [cogs, setCogs] = useState<number | string>(
    initialProduct?.cogs ?? Math.round((initialProduct?.price ?? 18500) * 0.55)
  );

  // Inventory & Stock
  const [stock, setStock] = useState<number | string>(initialProduct?.stock ?? 15);
  const [lowStockThreshold, setLowStockThreshold] = useState<number | string>(
    initialProduct?.lowStockThreshold ?? 5
  );
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>(initialProduct?.status || 'active');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Auto-slug generator
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManual) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  // Pricing & Profit Margin Calculations
  const numPrice = Number(price) || 0;
  const numCogs = Number(cogs) || 0;
  const numWas = was !== '' && was !== null && was !== undefined ? Number(was) : null;

  const grossProfit = numPrice - numCogs;
  const marginPct = numPrice > 0 ? (grossProfit / numPrice) * 100 : 0;
  const discountPct = numWas && numWas > numPrice ? Math.round(((numWas - numPrice) / numWas) * 100) : 0;

  // Margin Health Category
  const marginHealth = useMemo(() => {
    if (grossProfit < 0) {
      return {
        label: 'Loss Maker',
        sub: 'COGS exceeds selling price',
        color: 'rose',
        bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        barColor: 'bg-rose-500',
        icon: AlertTriangle,
      };
    }
    if (marginPct >= 40) {
      return {
        label: 'Healthy Margin',
        sub: 'Optimal luxury profitability (>40%)',
        color: 'emerald',
        bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        barColor: 'bg-emerald-500',
        icon: ShieldCheck,
      };
    }
    if (marginPct >= 20) {
      return {
        label: 'Moderate Margin',
        sub: 'Viable retail markup (20% - 40%)',
        color: 'amber',
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        barColor: 'bg-amber-500',
        icon: AlertCircle,
      };
    }
    return {
      label: 'Thin Margin',
      sub: 'Low profit buffer (<20%)',
      color: 'rose',
      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      barColor: 'bg-rose-500',
      icon: AlertTriangle,
    };
  }, [grossProfit, marginPct]);

  // Gallery Handlers
  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleSetCover = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [chosen] = copy.splice(index, 1);
      return [chosen, ...copy];
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (result) {
            setImages((prev) => [...prev, result]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (result) {
            setImages((prev) => [...prev, result]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  // Color Swatches Toggle
  const toggleColor = (c: ColorKey) => {
    if (colors.includes(c)) {
      if (colors.length === 1) return; // Keep at least one color
      setColors(colors.filter((item) => item !== c));
    } else {
      setColors([...colors, c]);
    }
  };

  // Size Tag Adder
  const handleAddSize = (val: string) => {
    const clean = val.trim();
    if (!clean || sizes.includes(clean)) return;
    setSizes([...sizes, clean]);
    setNewSizeInput('');
  };

  const handleRemoveSize = (val: string) => {
    setSizes(sizes.filter((s) => s !== val));
  };

  // Features Bullet Adder
  const handleAddFeat = () => {
    const clean = newFeatInput.trim();
    if (!clean) return;
    setFeat([...feat, clean]);
    setNewFeatInput('');
  };

  const handleRemoveFeat = (index: number) => {
    setFeat(feat.filter((_, i) => i !== index));
  };

  // Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please provide a product title');
      return;
    }
    if (numPrice <= 0) {
      setErrorMessage('Selling price must be greater than ₦0');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      id: initialProduct?.id,
      name: name.trim(),
      slug: slug.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      cat,
      badge: badge.trim() || null,
      desc: desc.trim(),
      feat,
      art,
      colors,
      sizes,
      price: numPrice,
      was: numWas,
      cogs: numCogs,
      stock: Number(stock) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 5,
      status,
      images,
    };

    try {
      const res = await fetch('/api/admin/products', {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      setToast({
        type: 'success',
        message: mode === 'edit' ? 'Product updated in catalog!' : 'New product published successfully!',
      });

      // Smooth redirection to table
      setTimeout(() => {
        router.push('/admin/products');
        router.refresh();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while saving';
      setErrorMessage(msg);
      setToast({ type: 'error', message: msg });
      setIsSubmitting(false);
    }
  };

  // Filtered Art Types for the Picker
  const filteredArtTypes = useMemo(() => {
    if (!artSearch.trim()) return ALL_ART_TYPES;
    const q = artSearch.toLowerCase();
    return ALL_ART_TYPES.filter(
      (a) => a.label.toLowerCase().includes(q) || a.type.toLowerCase().includes(q) || a.group.toLowerCase().includes(q)
    );
  }, [artSearch]);

  const primaryColor = colors[0] || 'violet';

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-900/30'
              : 'bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-900/30'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/15 pb-6">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-deep dark:hover:text-brand-light transition-colors mb-2 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Back to Inventory Table</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-[var(--ink)]">
            {mode === 'edit' ? 'Edit Product' : 'Create New Product'}{' '}
            <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-brand to-orchid">
              Studio
            </span>
          </h1>
          <p className="text-sm text-[var(--mute)] mt-1">
            Configure luxury visuals, colorways, inventory thresholds, and compute profit margins in real-time.
          </p>
        </div>

        {/* Status Pill & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[var(--surface)] p-1 rounded-2xl border border-purple-500/20 shadow-inner">
            {(['active', 'draft', 'archived'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                  status === s
                    ? s === 'active'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : s === 'draft'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-zinc-600 text-white shadow-sm'
                    : 'text-[var(--mute)] hover:text-[var(--ink)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand to-orchid hover:opacity-95 shadow-md shadow-brand/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{mode === 'edit' ? 'Save Changes' : 'Publish Product'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Two Column Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Media & Core Visuals (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* SECTION A: Gallery & Visual Art Fallback */}
          <div className="p-6 rounded-3xl bg-[var(--surface)]/90 backdrop-blur-xl border border-purple-500/15 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-purple-500/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">Gallery & Image Assets</h3>
                  <p className="text-xs text-[var(--mute)]">Add multi-angle photography or fallback to custom SVG art.</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand/10 text-brand border border-brand/20">
                {images.length} Image{images.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                dragOver
                  ? 'border-brand bg-brand/5 scale-[1.01]'
                  : 'border-purple-500/25 hover:border-brand/50 bg-[var(--surface2)]/50'
              }`}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="absolute inset-0 opacity-0 cursor-pointer"
                title="Drop files or click to upload"
              />
              <div className="flex flex-col items-center justify-center gap-2 text-center pointer-events-none">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand/20 to-orchid/20 text-brand flex items-center justify-center shadow-inner">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-[var(--ink)]">
                  Drag and drop product photos here, or <span className="text-brand underline">browse</span>
                </p>
                <p className="text-xs text-[var(--mute)]">Supports PNG, JPG, WEBP &bull; Max 5MB per image</p>
              </div>
            </div>

            {/* URL Input Bar */}
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddImageUrl();
                  }
                }}
                placeholder="Or paste image URL (e.g. Unsplash or Cloud CDN)..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--surface2)] border border-purple-500/20 text-xs sm:text-sm text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-4 py-2.5 rounded-xl bg-brand text-white text-xs sm:text-sm font-medium hover:bg-brand-deep transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add URL</span>
              </button>
            </div>

            {/* Image Thumbnails Grid */}
            {images.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                  Configured Images (First is Cover)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`group relative rounded-2xl overflow-hidden aspect-square border-2 transition-all ${
                        idx === 0
                          ? 'border-brand shadow-lg shadow-brand/20'
                          : 'border-purple-500/20 hover:border-brand/40'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`Product image ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />

                      {/* Cover Badge */}
                      {idx === 0 && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-brand text-white text-[10px] font-bold uppercase tracking-wider shadow">
                          Cover
                        </div>
                      )}

                      {/* Action Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetCover(idx)}
                            className="px-2 py-1 rounded bg-white text-black text-[10px] font-bold shadow hover:bg-white/90"
                          >
                            Set Cover
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1.5 rounded-full bg-rose-500 text-white hover:bg-rose-600 shadow"
                          title="Remove image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visual SVG Art Fallback Selector */}
            <div className="pt-4 border-t border-purple-500/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand" />
                    <span>Visual SVG Art Fallback</span>
                  </h4>
                  <p className="text-xs text-[var(--mute)]">
                    Used when photography is loading, in offline mode, and on dynamic product previews.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setArtPickerOpen(!artPickerOpen)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20 transition-all flex items-center gap-1.5"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>{artPickerOpen ? 'Hide Grid' : 'Browse All 23 SVG Styles'}</span>
                </button>
              </div>

              {/* Current Art Preview Chip */}
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[var(--surface2)] border border-purple-500/15">
                <div className="w-16 h-16 rounded-xl bg-white dark:bg-[#1b1130] p-1 border border-purple-500/20 shadow-sm flex items-center justify-center flex-shrink-0">
                  <ProductArt type={art} color={primaryColor} className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm capitalize">{art} Art Model</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-[var(--mute)] mt-0.5 truncate">
                    Renders with dynamic <span className="capitalize font-medium">{primaryColor}</span> chromatic
                    gradients.
                  </p>
                </div>
              </div>

              {/* Expandable 23 Art Types Selector Grid */}
              {artPickerOpen && (
                <div className="p-4 rounded-2xl bg-[var(--surface2)]/80 border border-purple-500/20 space-y-3 animate-in fade-in duration-200">
                  <div className="relative">
                    <input
                      type="text"
                      value={artSearch}
                      onChange={(e) => setArtSearch(e.target.value)}
                      placeholder="Search art styles (e.g. abaya, sneaker, perfume, watch)..."
                      className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface)] border border-purple-500/20 text-xs text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-72 overflow-y-auto pr-1">
                    {filteredArtTypes.map((item) => {
                      const isSelected = art === item.type;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => {
                            setArt(item.type);
                            setArtPickerOpen(false);
                          }}
                          className={`p-2 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center relative ${
                            isSelected
                              ? 'bg-brand text-white shadow-md shadow-brand/30 ring-2 ring-brand'
                              : 'bg-[var(--surface)] hover:bg-[var(--surface2)] text-[var(--ink2)] border border-purple-500/10'
                          }`}
                        >
                          <div className="w-10 h-10 flex items-center justify-center">
                            <ProductArt
                              type={item.type}
                              color={isSelected ? 'ivory' : primaryColor}
                              className="w-full h-full"
                            />
                          </div>
                          <span className="text-[11px] font-medium leading-tight truncate w-full">
                            {item.label}
                          </span>
                          {isSelected && (
                            <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-white text-brand flex items-center justify-center text-[9px] font-bold">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION B: Category & Product Details */}
          <div className="p-6 rounded-3xl bg-[var(--surface)]/90 backdrop-blur-xl border border-purple-500/15 shadow-xl space-y-6">
            <div className="flex items-center gap-2.5 border-b border-purple-500/10 pb-4">
              <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold">Product Information & Badging</h3>
                <p className="text-xs text-[var(--mute)]">Category classification, slug, and description.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category Selector */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                  Storefront Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface2)] border border-purple-500/20 text-sm font-medium text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Name */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                  Product Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Royal Butterfly Nidha Abaya"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface2)] border border-purple-500/20 text-sm text-[var(--ink)] font-semibold placeholder:text-[var(--mute)] focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              {/* Slug */}
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                    URL Slug
                  </label>
                  <span className="text-[11px] text-[var(--mute)] font-mono">
                    /product/{slug || '...'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setIsSlugManual(true);
                      setSlug(e.target.value);
                    }}
                    placeholder="royal-butterfly-nidha-abaya"
                    className="flex-1 px-4 py-2 rounded-xl bg-[var(--surface2)] border border-purple-500/20 text-xs font-mono text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsSlugManual(false);
                      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }}
                    className="px-3 py-2 rounded-xl bg-[var(--surface)] text-[var(--ink2)] border border-purple-500/20 text-xs hover:text-brand transition-colors"
                    title="Regenerate from title"
                  >
                    Sync
                  </button>
                </div>
              </div>

              {/* Badge Tag */}
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                  Badge Tag (Optional)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {BADGE_PRESETS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBadge(badge === b ? '' : b)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        badge === b
                          ? 'bg-orchid text-white shadow-sm ring-2 ring-orchid/30'
                          : 'bg-[var(--surface2)] text-[var(--ink2)] border border-purple-500/15 hover:border-orchid/40'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Or custom badge..."
                    className="px-3 py-1 rounded-full bg-[var(--surface2)] border border-purple-500/20 text-xs text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-none focus:ring-1 focus:ring-orchid"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Detailed description of materials, drape, occasions, and Abuja delivery readiness..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface2)] border border-purple-500/20 text-sm text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-none focus:ring-2 focus:ring-brand resize-y"
                />
              </div>

              {/* Feature Bullet Points Manager */}
              <div className="space-y-3 sm:col-span-2 pt-2">
                <label className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider flex items-center justify-between">
                  <span>Key Features & Specifications</span>
                  <span className="text-[11px] font-normal lowercase">({feat.length} bullet points)</span>
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newFeatInput}
                    onChange={(e) => setNewFeatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeat();
                      }
                    }}
                    placeholder="Add bullet (e.g. '100% Breathable Nidha Silk')..."
                    className="flex-1 px-4 py-2 rounded-xl bg-[var(--surface2)] border border-purple-500/20 text-xs sm:text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeat}
                    className="px-4 py-2 rounded-xl bg-brand text-white text-xs sm:text-sm font-medium hover:bg-brand-deep transition-colors"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5">
                  {feat.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-[var(--surface2)] border border-purple-500/10 text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
                        <span className="truncate">{item}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeat(idx)}
                        className="p-1 rounded text-[var(--mute)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Margins, Variants & Stock (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          {/* SECTION D: Pricing & Profit Margin Calculator (Crucial) */}
          <div className="p-6 rounded-3xl bg-[var(--surface)]/90 backdrop-blur-xl border border-purple-500/20 shadow-2xl relative overflow-hidden space-y-6">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand via-orchid to-emerald-400" />

            <div className="flex items-center justify-between border-b border-purple-500/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">Pricing & Margin Studio</h3>
                  <p className="text-xs text-[var(--mute)]">Real-time profitability calculator</p>
                </div>
              </div>

              {/* Visual Health Badge */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${marginHealth.bg}`}
              >
                <marginHealth.icon className="w-3.5 h-3.5" />
                <span>{marginHealth.label}</span>
              </div>
            </div>

            {/* Inputs: Selling Price, Compare At, COGS */}
            <div className="space-y-4">
              {/* Selling Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider flex items-center justify-between">
                  <span>Selling Price (₦) <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] font-normal text-brand font-mono">Retail Base</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[var(--mute)]">
                    ₦
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    placeholder="18500"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[var(--surface2)] border border-purple-500/25 text-base font-bold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-brand font-mono"
                  />
                </div>
              </div>

              {/* Compare At (Was Price) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                    Compare At Price (₦)
                  </label>
                  {discountPct > 0 && (
                    <span className="text-[11px] font-bold text-orchid bg-orchid/10 px-2 py-0.5 rounded-full">
                      -{discountPct}% Discount
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[var(--mute)]">
                    ₦
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={was}
                    onChange={(e) => setWas(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full pl-8 pr-4 py-2 rounded-xl bg-[var(--surface2)] border border-purple-500/20 text-sm font-semibold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-brand font-mono"
                  />
                </div>
              </div>

              {/* Cost of Goods Sold (COGS) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                    Cost of Goods Sold (COGS) (₦)
                  </label>
                  <span className="text-[11px] text-[var(--mute)]">Supplier & Production</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[var(--mute)]">
                    ₦
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={cogs}
                    onChange={(e) => setCogs(e.target.value)}
                    placeholder="e.g. 9500"
                    className="w-full pl-8 pr-4 py-2 rounded-xl bg-[var(--surface2)] border border-purple-500/20 text-sm font-semibold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-brand font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Real-time Profit Calculation Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-brand/5 via-purple-500/5 to-orchid/5 border border-purple-500/20 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-[var(--surface)] border border-purple-500/10 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-[var(--mute)] tracking-wider">
                    Gross Profit / Unit
                  </span>
                  <p
                    className={`text-lg sm:text-xl font-bold font-mono mt-0.5 ${
                      grossProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    ₦{grossProfit.toLocaleString()}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[var(--surface)] border border-purple-500/10 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-[var(--mute)] tracking-wider">
                    Profit Margin %
                  </span>
                  <p
                    className={`text-lg sm:text-xl font-bold font-mono mt-0.5 ${
                      marginPct >= 40
                        ? 'text-emerald-500'
                        : marginPct >= 20
                        ? 'text-amber-500'
                        : 'text-rose-500'
                    }`}
                  >
                    {marginPct.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Visual Breakdown Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] font-medium text-[var(--mute)]">
                  <span>COGS: {numPrice > 0 ? ((numCogs / numPrice) * 100).toFixed(0) : 0}%</span>
                  <span>Profit: {marginPct > 0 ? marginPct.toFixed(0) : 0}%</span>
                </div>
                <div className="h-2.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${Math.min(100, Math.max(0, numPrice > 0 ? (numCogs / numPrice) * 100 : 0))}%` }}
                    className="bg-zinc-400 dark:bg-zinc-600 transition-all duration-300"
                    title={`COGS ₦${numCogs.toLocaleString()}`}
                  />
                  <div
                    style={{ width: `${Math.min(100, Math.max(0, marginPct))}%` }}
                    className={`${marginHealth.barColor} transition-all duration-300`}
                    title={`Profit ₦${grossProfit.toLocaleString()}`}
                  />
                </div>
              </div>

              <p className="text-[11px] text-[var(--mute)] text-center italic">{marginHealth.sub}</p>
            </div>
          </div>

          {/* SECTION C: Colorways & Sizes */}
          <div className="p-6 rounded-3xl bg-[var(--surface)]/90 backdrop-blur-xl border border-purple-500/15 shadow-xl space-y-6">
            <div className="flex items-center gap-2.5 border-b border-purple-500/10 pb-4">
              <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold">Colorways & Sizes</h3>
                <p className="text-xs text-[var(--mute)]">Luxury swatches and apparel size tags.</p>
              </div>
            </div>

            {/* 8 Colorway Swatches Selector */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider flex items-center justify-between">
                <span>Color Swatches ({colors.length} selected)</span>
                <span className="text-[11px] font-normal lowercase">click to toggle</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {COLOR_KEYS.map((k) => {
                  const def = PAL[k];
                  const isChecked = colors.includes(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => toggleColor(k)}
                      className={`p-2 rounded-xl flex items-center gap-2.5 transition-all text-left border ${
                        isChecked
                          ? 'border-brand bg-brand/10 shadow-sm'
                          : 'border-purple-500/10 bg-[var(--surface2)] hover:border-brand/30'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm border border-black/10 flex items-center justify-center text-white"
                        style={{ backgroundColor: def.main }}
                      >
                        {isChecked && (
                          <span
                            className="text-[10px] font-bold"
                            style={{ color: k === 'ivory' || k === 'silver' ? '#000' : '#fff' }}
                          >
                            ✓
                          </span>
                        )}
                      </span>
                      <span className="text-xs font-semibold capitalize truncate">{def.n}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sizes Selector & Custom Adder */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider flex items-center justify-between">
                <span>Available Sizes ({sizes.length})</span>
                <span className="text-[11px] font-normal text-brand">Apparel & Shoes</span>
              </label>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {SIZE_PRESETS.map((sz) => {
                  const hasSize = sizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => (hasSize ? handleRemoveSize(sz) : handleAddSize(sz))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        hasSize
                          ? 'bg-brand text-white shadow-sm'
                          : 'bg-[var(--surface2)] text-[var(--ink2)] border border-purple-500/15 hover:border-brand/40'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>

              {/* Custom Size Tag Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSizeInput}
                  onChange={(e) => setNewSizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSize(newSizeInput);
                    }
                  }}
                  placeholder="Custom size (e.g. 43, UK 12, Plus)..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--surface2)] border border-purple-500/20 text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <button
                  type="button"
                  onClick={() => handleAddSize(newSizeInput)}
                  className="px-3 py-1.5 rounded-xl bg-brand text-white text-xs font-medium hover:bg-brand-deep transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Active Size Tags */}
              <div className="flex flex-wrap gap-1.5">
                {sizes.map((sz) => (
                  <span
                    key={sz}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand/10 text-brand border border-brand/20 text-xs font-bold"
                  >
                    <span>{sz}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(sz)}
                      className="hover:text-rose-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION E: Inventory & Stock Management */}
          <div className="p-6 rounded-3xl bg-[var(--surface)]/90 backdrop-blur-xl border border-purple-500/15 shadow-xl space-y-5">
            <div className="flex items-center gap-2.5 border-b border-purple-500/10 pb-4">
              <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold">Inventory & Warehouse</h3>
                <p className="text-xs text-[var(--mute)]">Stock quantity and low stock threshold alerts.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                  Stock Units
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-[var(--surface2)] border border-purple-500/20 text-base font-bold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-brand font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
                  Low Stock Alert
                </label>
                <input
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-[var(--surface2)] border border-purple-500/20 text-base font-bold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-brand font-mono"
                />
              </div>
            </div>

            {/* Inventory Status Pill */}
            <div className="p-3 rounded-2xl bg-[var(--surface2)] border border-purple-500/15 flex items-center justify-between">
              <span className="text-xs text-[var(--mute)] font-medium">Real-time Stock Health</span>
              {Number(stock) === 0 ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  Out of Stock
                </span>
              ) : Number(stock) <= Number(lowStockThreshold) ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  Low Stock ({stock} units)
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  In Stock ({stock} units)
                </span>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-6 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-brand to-orchid hover:opacity-95 shadow-lg shadow-brand/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Saving to Catalog...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>{mode === 'edit' ? 'Update Product' : 'Create Product'}</span>
                </>
              )}
            </button>

            <Link
              href="/admin/products"
              className="px-5 py-3 rounded-2xl border border-purple-500/20 text-sm font-semibold text-[var(--ink2)] hover:bg-[var(--surface2)] transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};
