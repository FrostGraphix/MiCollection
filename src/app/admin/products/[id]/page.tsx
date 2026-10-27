'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProductForm } from '@/components/admin/ProductForm';
import { PRODUCTS } from '@/lib/products';
import { Product } from '@/types';
import { ArrowLeft, RefreshCw, AlertCircle, Package } from 'lucide-react';

export default function EditProductPage() {
  const params = useParams();
  const idStr = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const router = useRouter();

  // Seed with static PRODUCTS data if matching
  const staticMatch = PRODUCTS.find((p) => String(p.id) === idStr);
  const [product, setProduct] = useState<Product | null>(staticMatch || null);
  const [loading, setLoading] = useState(!staticMatch);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idStr) return;

    let isMounted = true;
    const fetchLatestProduct = async () => {
      try {
        const res = await fetch(`/api/admin/products?id=${idStr}`);
        if (res.ok) {
          const data = await res.json();
          if (data.product && isMounted) {
            setProduct(data.product);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('API lookup for product failed, relying on static match if present:', e);
      }

      if (isMounted) {
        if (!staticMatch) {
          setError(`Product #${idStr} could not be located in catalog.`);
        }
        setLoading(false);
      }
    };

    fetchLatestProduct();

    return () => {
      isMounted = false;
    };
  }, [idStr, staticMatch]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand" />
        <p className="text-sm font-semibold text-[var(--mute)]">Loading product studio data...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center border border-rose-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold">Product Not Found</h2>
          <p className="text-sm text-[var(--mute)] mt-1">
            {error || `No product with identifier #${idStr} exists in the MiCollections inventory.`}
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-deep transition-all shadow-md shadow-brand/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Inventory</span>
          </Link>
        </div>
      </div>
    );
  }

  return <ProductForm mode="edit" initialProduct={product} />;
}
