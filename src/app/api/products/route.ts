import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { PRODUCTS, CATS, byId } from '@/lib/products';
import { Product, Category } from '@/types';

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cat = searchParams.get('cat');
  const q = searchParams.get('q') || searchParams.get('search');
  const sort = searchParams.get('sort');
  const minPriceParam = searchParams.get('minPrice') || searchParams.get('min');
  const maxPriceParam = searchParams.get('maxPrice') || searchParams.get('max');

  const minPrice = minPriceParam !== null ? Number(minPriceParam) : undefined;
  const maxPrice = maxPriceParam !== null ? Number(maxPriceParam) : undefined;

  let categories: Category[] = CATS;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();

      // Query categories from Supabase
      try {
        const { data: dbCategories, error: catError } = await supabase
          .from('categories')
          .select('*');

        if (!catError && dbCategories && dbCategories.length > 0) {
          categories = dbCategories.map((c: any) => ({
            id: c.id,
            name: c.name,
            blurb: c.blurb || '',
            art: Array.isArray(c.art) ? c.art : ['dress'],
            cols: Array.isArray(c.cols) ? c.cols : Array.isArray(c.colors) ? c.colors : ['violet'],
            image: c.image || CATS.find((catItem) => catItem.id === c.id)?.image,
          }));
        }
      } catch (catErr) {
        console.warn('Could not query categories from Supabase, using static CATS:', catErr);
      }

      // Query products from Supabase with is_active = true
      let query = supabase.from('products').select('*').eq('is_active', true);

      if (cat && cat !== 'all') {
        query = query.eq('cat', cat);
      }
      if (minPrice !== undefined && !isNaN(minPrice)) {
        query = query.gte('price', minPrice);
      }
      if (maxPrice !== undefined && !isNaN(maxPrice)) {
        query = query.lte('price', maxPrice);
      }

      // Apply sorting
      if (sort === 'low' || sort === 'price-asc') {
        query = query.order('price', { ascending: true });
      } else if (sort === 'high' || sort === 'price-desc') {
        query = query.order('price', { ascending: false });
      } else if (sort === 'az' || sort === 'name-asc') {
        query = query.order('name', { ascending: true });
      } else if (sort === 'za' || sort === 'name-desc') {
        query = query.order('name', { ascending: false });
      } else if (sort === 'newest') {
        query = query.order('created_at', { ascending: false, nullsFirst: false });
      } else {
        query = query.order('id', { ascending: true });
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        let products: Product[] = data.map(formatDbProduct);

        // Apply search keyword filter if provided
        if (q && q.trim()) {
          const queryLower = q.trim().toLowerCase();
          products = products.filter((p) =>
            `${p.name} ${p.desc} ${p.cat}`.toLowerCase().includes(queryLower)
          );
        }

        return NextResponse.json({
          products,
          categories,
          total: products.length,
        });
      }
    } catch (e) {
      console.warn('Supabase product query error, falling back to static:', e);
    }
  }

  // Fallback to static catalog data (including any created in admin memory)
  const store: Product[] =
    (globalThis as unknown as { __adminProducts?: Product[] }).__adminProducts || PRODUCTS;

  // Ensure is_active = true condition is applied in fallback
  let result = store.filter((p) => (p as any).is_active !== false && p.status !== 'draft' && p.status !== 'archived');

  if (cat && cat !== 'all') {
    const catLower = cat.toLowerCase();
    result = result.filter((p) => p.cat?.toLowerCase() === catLower);
  }

  if (minPrice !== undefined && !isNaN(minPrice)) {
    result = result.filter((p) => p.price >= minPrice);
  }

  if (maxPrice !== undefined && !isNaN(maxPrice)) {
    result = result.filter((p) => p.price <= maxPrice);
  }

  if (q && q.trim()) {
    const queryLower = q.trim().toLowerCase();
    result = result.filter((p) =>
      `${p.name} ${p.desc} ${p.cat}`.toLowerCase().includes(queryLower)
    );
  }

  if (sort === 'low' || sort === 'price-asc') {
    result = [...result].sort((a, b) => a.price - b.price);
  } else if (sort === 'high' || sort === 'price-desc') {
    result = [...result].sort((a, b) => b.price - a.price);
  } else if (sort === 'az' || sort === 'name-asc') {
    result = [...result].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'za' || sort === 'name-desc') {
    result = [...result].sort((a, b) => b.name.localeCompare(a.name));
  }

  return NextResponse.json({
    products: result,
    categories,
    total: result.length,
  });
}
