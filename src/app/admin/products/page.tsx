'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProductArt } from '@/components/shop/ProductArt';
import { Product } from '@/types';
import {
  PlusCircle,
  Search,
  Filter,
  ArrowUpDown,
  Edit3,
  Copy,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Boxes,
  TrendingUp,
  RefreshCw,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Tag,
  Sparkles,
} from 'lucide-react';
import { useModal } from '@/context/ModalContext';

export default function AdminProductsPage() {
  const router = useRouter();
  const { confirm } = useModal();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load products from API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      setToast({ message: 'Failed to load catalog products', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Quick Action: Toggle Active / Draft
  const handleToggleStatus = async (p: Product) => {
    const nextStatus = p.status === 'active' ? 'draft' : 'active';
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, status: nextStatus }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((item) => (item.id === p.id ? { ...item, status: nextStatus } : item))
        );
        setToast({
          message: `Product marked as ${nextStatus.toUpperCase()}`,
          type: 'success',
        });
      }
    } catch {
      setToast({ message: 'Failed to update status', type: 'error' });
    }
  };

  // Quick Action: Duplicate Product
  const handleDuplicate = async (p: Product) => {
    try {
      const copyPayload = {
        name: `${p.name} (Copy)`,
        cat: p.cat,
        price: p.price,
        was: p.was,
        cogs: p.cogs,
        stock: p.stock ?? 10,
        lowStockThreshold: p.lowStockThreshold ?? 5,
        status: 'draft',
        art: p.art,
        colors: p.colors,
        sizes: p.sizes,
        badge: p.badge ? `${p.badge}` : null,
        desc: p.desc,
        feat: p.feat,
        images: p.images,
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copyPayload),
      });
      const data = await res.json();
      if (res.ok && data.product) {
        setProducts((prev) => [data.product, ...prev]);
        setToast({ message: 'Product duplicated as Draft!', type: 'success' });
      }
    } catch {
      setToast({ message: 'Failed to duplicate product', type: 'error' });
    }
  };

  // Quick Action: Delete Product
  const handleDelete = async (id: number, name: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Product',
      message: (
        <span>
          Are you sure you want to delete <strong className="text-[var(--ink)]">&ldquo;{name}&rdquo;</strong>? This cannot be undone.
        </span>
      ),
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      danger: true,
      variant: 'error',
    });

    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((item) => item.id !== id));
        setToast({ message: 'Product deleted from catalog', type: 'success' });
      }
    } catch {
      setToast({ message: 'Failed to delete product', type: 'error' });
    }
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Catalog Metrics
  const metrics = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => (p.status || 'active') === 'active').length;
    const lowStock = products.filter((p) => {
      const st = p.stock ?? 0;
      const th = p.lowStockThreshold ?? 5;
      return st > 0 && st <= th;
    }).length;
    const outOfStock = products.filter((p) => (p.stock ?? 0) === 0).length;

    // Average Margin
    const validMargins = products
      .map((p) => {
        const pr = p.price || 0;
        const cg = p.cogs ?? Math.round(pr * 0.55);
        return pr > 0 ? ((pr - cg) / pr) * 100 : 0;
      })
      .filter((m) => m > 0);

    const avgMargin =
      validMargins.length > 0
        ? validMargins.reduce((a, b) => a + b, 0) / validMargins.length
        : 45;

    return { total, active, lowStock, outOfStock, avgMargin };
  }, [products]);

  // Categories list
  const categoryOptions = [
    { id: 'all', label: 'All Categories' },
    { id: 'women', label: 'Women' },
    { id: 'men', label: 'Men' },
    { id: 'wears', label: 'Wears' },
    { id: 'abayas', label: 'Abayas' },
    { id: 'bags-shoes', label: 'Bags & Shoes' },
    { id: 'jewellery', label: 'Jewellery' },
    { id: 'gadgets', label: 'Gadgets' },
    { id: 'kitchen-home', label: 'Kitchen & Home' },
  ];

  // Filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category Filter
      if (selectedCat !== 'all') {
        const catLower = selectedCat.toLowerCase();
        const pCat = p.cat?.toLowerCase() || '';
        let matchCat = pCat === catLower;
        if (catLower === 'women' && (pCat === 'wears' || pCat === 'abayas')) matchCat = true;
        if (catLower === 'men' && pCat === 'wears') matchCat = true;
        if (catLower === 'bags-shoes' && (pCat === 'bags' || pCat === 'shoes')) matchCat = true;
        if (catLower === 'gadgets' && pCat === 'electronics') matchCat = true;
        if (catLower === 'kitchen-home' && (pCat === 'kitchen' || pCat === 'home')) matchCat = true;
        if (!matchCat) return false;
      }

      // Stock Status Filter
      if (stockFilter !== 'all') {
        const stockVal = p.stock ?? 0;
        const thresh = p.lowStockThreshold ?? 5;
        if (stockFilter === 'out_of_stock' && stockVal !== 0) return false;
        if (stockFilter === 'low_stock' && (stockVal === 0 || stockVal > thresh)) return false;
        if (stockFilter === 'in_stock' && stockVal <= thresh) return false;
      }

      // Status Filter
      if (statusFilter !== 'all') {
        if ((p.status || 'active') !== statusFilter) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = String(p.id) === q;
        const nameMatch = p.name?.toLowerCase().includes(q);
        const catMatch = p.cat?.toLowerCase().includes(q);
        const descMatch = p.desc?.toLowerCase().includes(q);
        if (!idMatch && !nameMatch && !catMatch && !descMatch) return false;
      }

      return true;
    });
  }, [products, selectedCat, stockFilter, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

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
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-[var(--ink)]">
              Product &amp; Pricing{' '}
              <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-brand to-orchid">
                Studio
              </span>
            </h1>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand/10 text-brand border border-brand/20">
              {products.length} Items
            </span>
          </div>
          <p className="text-sm text-[var(--mute)] mt-1">
            Real-time catalog control, live COGS profitability, and inventory management for MiCollections Abuja.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchProducts}
            className="p-2.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface2)] border border-purple-500/15 text-[var(--ink2)] transition-colors"
            title="Refresh Catalog Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand' : ''}`} />
          </button>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand to-orchid hover:opacity-95 shadow-md shadow-brand/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="p-4 rounded-2xl bg-[var(--surface)]/90 backdrop-blur-xl border border-purple-500/15 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
            <span>Total Catalog</span>
            <Boxes className="w-4 h-4 text-brand" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display">{metrics.total}</span>
            <span className="text-xs text-emerald-500 font-medium">{metrics.active} Active</span>
          </div>
        </div>

        {/* Average Profit Margin */}
        <div className="p-4 rounded-2xl bg-[var(--surface)]/90 backdrop-blur-xl border border-purple-500/15 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
            <span>Avg Profit Margin</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
              {metrics.avgMargin.toFixed(1)}%
            </span>
            <span className="text-xs text-[var(--mute)] font-medium">Healthy</span>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="p-4 rounded-2xl bg-[var(--surface)]/90 backdrop-blur-xl border border-purple-500/15 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
            <span>Low Stock Alert</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-amber-600 dark:text-amber-400">
              {metrics.lowStock}
            </span>
            <span className="text-xs text-[var(--mute)] font-medium">&lt; 5 units</span>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="p-4 rounded-2xl bg-[var(--surface)]/90 backdrop-blur-xl border border-purple-500/15 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">
            <span>Out of Stock</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-rose-600 dark:text-rose-400">
              {metrics.outOfStock}
            </span>
            <span className="text-xs text-rose-500 font-medium">Needs Restock</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[var(--surface)]/90 backdrop-blur-xl border border-purple-500/15 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mute)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by product name, category, or ID (#1, #12)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--surface2)] border border-purple-500/15 text-sm text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Dropdown */}
          <select
            value={selectedCat}
            onChange={(e) => {
              setSelectedCat(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-[var(--surface2)] border border-purple-500/20 text-xs font-medium text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-brand"
          >
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-[var(--surface2)] border border-purple-500/20 text-xs font-medium text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="all">All Stock Levels</option>
            <option value="in_stock">In Stock (&gt;5)</option>
            <option value="low_stock">Low Stock (≤5)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-[var(--surface2)] border border-purple-500/20 text-xs font-medium text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="draft">Draft Only</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-3xl bg-[var(--surface)]/90 backdrop-blur-xl border border-purple-500/15 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-purple-500/10 bg-[var(--surface2)]/60 text-[11px] font-bold text-[var(--mute)] uppercase tracking-wider">
                <th className="py-4 px-6">Product Details</th>
                <th className="py-4 px-4">Selling &amp; Was Price</th>
                <th className="py-4 px-4">COGS &amp; Margin</th>
                <th className="py-4 px-4">Stock Level</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10 text-sm font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[var(--mute)]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand mb-2" />
                    <span>Loading luxury catalog items...</span>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[var(--mute)]">
                    <p className="font-semibold text-base text-[var(--ink)]">No products match your filters</p>
                    <p className="text-xs mt-1">Try resetting search keywords or category filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const pr = p.price || 0;
                  const wasPr = p.was;
                  const cg = p.cogs ?? Math.round(pr * 0.55);
                  const profit = pr - cg;
                  const margin = pr > 0 ? (profit / pr) * 100 : 0;
                  const stockQty = p.stock ?? 12;
                  const lowThresh = p.lowStockThreshold ?? 5;
                  const primaryColor = p.colors?.[0] || 'violet';

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-brand/5 transition-colors group"
                    >
                      {/* Column 1: Product (Thumbnail/Art + Name + Cat + Badge) */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          {/* Visual Avatar / Cover */}
                          <div className="w-12 h-12 rounded-xl bg-[var(--surface2)] border border-purple-500/20 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                            {p.images && p.images.length > 0 ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-9 h-9 p-0.5">
                                <ProductArt type={p.art || 'dress'} color={primaryColor} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/products/${p.id}`}
                                className="font-bold text-[var(--ink)] hover:text-brand transition-colors truncate max-w-xs block"
                                title={p.name}
                              >
                                {p.name}
                              </Link>
                              {p.badge && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orchid/10 text-orchid border border-orchid/20">
                                  {p.badge}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[var(--mute)] mt-0.5">
                              <span className="font-mono text-[10px] bg-purple-500/10 px-1.5 py-0.5 rounded">
                                #{p.id}
                              </span>
                              <span className="capitalize">{p.cat}</span>
                              {p.sizes && p.sizes.length > 0 && (
                                <span>&bull; {p.sizes.join(', ')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Selling Price & Was Price */}
                      <td className="py-4 px-4 font-mono">
                        <div className="font-bold text-[var(--ink)]">
                          ₦{pr.toLocaleString()}
                        </div>
                        {wasPr && wasPr > pr ? (
                          <div className="flex items-center gap-1.5 text-xs text-[var(--mute)] mt-0.5">
                            <span className="line-through">₦{wasPr.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-orchid bg-orchid/10 px-1 rounded">
                              -{Math.round(((wasPr - pr) / wasPr) * 100)}%
                            </span>
                          </div>
                        ) : null}
                      </td>

                      {/* Column 3: COGS & Profit Margin % */}
                      <td className="py-4 px-4 font-mono">
                        <div className="text-xs text-[var(--mute)]">
                          COGS: ₦{cg.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                              margin >= 40
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : margin >= 20
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {margin.toFixed(0)}% Margin
                          </span>
                          <span className="text-[11px] text-emerald-500 font-semibold">
                            +₦{profit.toLocaleString()}
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Stock Level with Progress Bar & Alert */}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-between text-xs font-bold font-mono mb-1">
                          <span>{stockQty} units</span>
                          {stockQty === 0 ? (
                            <span className="text-[10px] text-rose-500">Out of Stock</span>
                          ) : stockQty <= lowThresh ? (
                            <span className="text-[10px] text-amber-500">Low Stock</span>
                          ) : (
                            <span className="text-[10px] text-emerald-500">In Stock</span>
                          )}
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-28 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, (stockQty / 30) * 100)}%` }}
                            className={`h-full rounded-full transition-all ${
                              stockQty === 0
                                ? 'bg-rose-500'
                                : stockQty <= lowThresh
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Column 5: Status Badge */}
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          title="Click to toggle Active / Draft"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            (p.status || 'active') === 'active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                              : (p.status || 'active') === 'draft'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                              : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/30 hover:bg-zinc-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              (p.status || 'active') === 'active'
                                ? 'bg-emerald-500 animate-pulse'
                                : (p.status || 'active') === 'draft'
                                ? 'bg-amber-500'
                                : 'bg-zinc-400'
                            }`}
                          />
                          <span className="capitalize">{p.status || 'active'}</span>
                        </button>
                      </td>

                      {/* Column 6: Quick Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          {/* Edit */}
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="p-2 rounded-xl text-[var(--ink2)] hover:text-brand hover:bg-brand/10 transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => handleDuplicate(p)}
                            className="p-2 rounded-xl text-[var(--ink2)] hover:text-orchid hover:bg-orchid/10 transition-colors"
                            title="Duplicate as Draft"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-2 rounded-xl text-[var(--ink2)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Counter Bar */}
        <div className="py-4 px-6 border-t border-purple-500/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--mute)]">
          <div>
            Showing{' '}
            <span className="font-bold text-[var(--ink)]">
              {filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-[var(--ink)]">
              {Math.min(currentPage * pageSize, filteredProducts.length)}
            </span>{' '}
            of <span className="font-bold text-[var(--ink)]">{filteredProducts.length}</span> products
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="p-2 rounded-xl bg-[var(--surface2)] border border-purple-500/15 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand/10 hover:text-brand transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 rounded-xl bg-[var(--surface2)] font-mono font-bold text-[var(--ink)]">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="p-2 rounded-xl bg-[var(--surface2)] border border-purple-500/15 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand/10 hover:text-brand transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
