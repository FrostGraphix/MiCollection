import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { PRODUCTS, byId } from '@/lib/products';
import { Product } from '@/types';

function formatDbProduct(row: any): Product {
  const staticMatch = byId(Number(row.id));
  return {
    id: Number(row.id),
    name: row.name || 'Untitled Product',
    cat: row.cat || 'wears',
    price: Number(row.price) || 0,
    was: row.was !== null && row.was !== undefined && row.was !== '' ? Number(row.was) : null,
    art: row.art || staticMatch?.art || 'dress',
    colors: Array.isArray(row.colors) && row.colors.length > 0 ? row.colors : (staticMatch?.colors || ['violet']),
    sizes: Array.isArray(row.sizes) ? row.sizes : (staticMatch?.sizes || []),
    badge: row.badge ?? staticMatch?.badge ?? null,
    desc: row.desc ?? staticMatch?.desc ?? '',
    feat: Array.isArray(row.feat) && row.feat.length > 0 ? row.feat : (staticMatch?.feat || []),
    images: Array.isArray(row.images) && row.images.length > 0
      ? row.images
      : (staticMatch?.images || []),
    stock: row.stock !== undefined ? Number(row.stock) : (staticMatch?.stock ?? 10),
    cogs: row.cogs !== undefined ? Number(row.cogs) : staticMatch?.cogs,
    lowStockThreshold: row.lowStockThreshold !== undefined ? Number(row.lowStockThreshold) : staticMatch?.lowStockThreshold,
    status: row.status || (row.is_active === false ? 'draft' : 'active'),
    slug: row.slug || staticMatch?.slug,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
  };
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const idParam = params.id;
  const numId = Number(idParam);

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      let query = supabase.from('products').select('*');

      if (!isNaN(numId)) {
        query = query.or(`id.eq.${numId},id.eq.${idParam}`);
      } else {
        query = query.eq('id', idParam);
      }

      const { data, error } = await query.maybeSingle();

      if (!error && data && data.is_active !== false) {
        const product = formatDbProduct(data);

        // Fetch related products (e.g. 4 from same category)
        let relatedProducts: Product[] = [];
        try {
          const { data: relatedData, error: relError } = await supabase
            .from('products')
            .select('*')
            .eq('cat', product.cat)
            .neq('id', product.id)
            .eq('is_active', true)
            .limit(4);

          if (!relError && relatedData && relatedData.length > 0) {
            relatedProducts = relatedData.map(formatDbProduct);
          }
        } catch (relErr) {
          console.warn('Could not query related products from Supabase:', relErr);
        }

        // If fewer than 4 related from DB, supplement from static PRODUCTS
        if (relatedProducts.length < 4) {
          const existingIds = new Set([String(product.id), ...relatedProducts.map((p) => String(p.id))]);
          const extraRelated = PRODUCTS.filter(
            (p) => p.cat === product.cat && !existingIds.has(String(p.id))
          ).slice(0, 4 - relatedProducts.length);
          relatedProducts = [...relatedProducts, ...extraRelated];
        }

        return NextResponse.json({
          product,
          related: relatedProducts,
          relatedProducts,
        });
      }
    } catch (e) {
      console.warn('Supabase product query error for ID ' + idParam + ', falling back to static:', e);
    }
  }

  // Fallback to static PRODUCTS / in-memory admin products
  const store: Product[] =
    (globalThis as unknown as { __adminProducts?: Product[] }).__adminProducts || PRODUCTS;

  const fallbackProduct =
    store.find((p) => String(p.id) === String(idParam)) || (!isNaN(numId) ? byId(numId) : undefined);

  if (!fallbackProduct) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const related = store
    .filter(
      (p) =>
        p.cat === fallbackProduct.cat &&
        String(p.id) !== String(fallbackProduct.id) &&
        p.status !== 'draft' &&
        p.status !== 'archived' &&
        (p as any).is_active !== false
    )
    .slice(0, 4);

  return NextResponse.json({
    product: fallbackProduct,
    related,
    relatedProducts: related,
  });
}
