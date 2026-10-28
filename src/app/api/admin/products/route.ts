import { NextResponse } from 'next/server';
import { PRODUCTS, CATS } from '@/lib/products';
import { Product } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Global cache to maintain product state across requests in the server instance
const getProductsStore = (): Product[] => {
  const g = globalThis as unknown as { __adminProducts?: Product[] };
  if (!g.__adminProducts) {
    g.__adminProducts = PRODUCTS.map((p, idx) => ({
      ...p,
      cogs: p.cogs ?? Math.round(p.price * 0.55),
      stock: p.stock ?? (idx % 7 === 0 ? 3 : idx % 11 === 0 ? 0 : 18 + (idx * 3) % 40),
      lowStockThreshold: p.lowStockThreshold ?? 5,
      status: p.status ?? (idx === 4 ? 'draft' : 'active'),
      slug:
        p.slug ??
        p.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      createdAt: p.createdAt ?? new Date(Date.now() - idx * 86400000).toISOString(),
      updatedAt: p.updatedAt ?? new Date().toISOString(),
    }));
  }
  return g.__adminProducts;
};

// Map raw Supabase database row to Product type
function mapSupabaseProduct(p: any): Product {
  const price = Number(p.price) || 0;
  return {
    id: Number(p.id),
    name: p.name || 'Untitled Product',
    slug:
      p.slug ||
      (p.name
        ? p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : `product-${p.id}`),
    cat: p.cat || 'wears',
    price,
    was: p.was !== null && p.was !== undefined && p.was !== '' ? Number(p.was) : null,
    cogs: p.cogs !== undefined && p.cogs !== null ? Number(p.cogs) : Math.round(price * 0.55),
    stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 15,
    lowStockThreshold: p.low_stock_threshold ?? p.lowStockThreshold ?? 5,
    status: (p.status as any) || (p.is_active === false ? 'draft' : 'active'),
    art: p.art || 'dress',
    colors: Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : ['violet'],
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    badge: p.badge || null,
    desc: p.desc || '',
    feat: Array.isArray(p.feat) ? p.feat : [],
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [],
    createdAt: p.created_at || p.createdAt || new Date().toISOString(),
    updatedAt: p.updated_at || p.updatedAt || new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cat = searchParams.get('cat');
    const search = searchParams.get('search') || searchParams.get('q');
    const status = searchParams.get('status');
    const idParam = searchParams.get('id');

    // 1. Try Supabase products table first if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();

        // Single item query
        if (idParam) {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', idParam)
            .single();

          if (!error && data) {
            return NextResponse.json({ product: mapSupabaseProduct(data) });
          }
        } else {
          // Fetch all products from Supabase
          let query = supabase.from('products').select('*');

          // Category filter
          if (cat && cat !== 'all') {
            const catLower = cat.toLowerCase();
            if (catLower === 'women') {
              query = query.in('cat', ['women', 'wears', 'abayas']);
            } else if (catLower === 'men') {
              query = query.in('cat', ['men', 'wears']);
            } else if (catLower === 'bags-shoes') {
              query = query.in('cat', ['bags-shoes', 'bags', 'shoes']);
            } else if (catLower === 'gadgets') {
              query = query.in('cat', ['gadgets', 'electronics']);
            } else if (catLower === 'kitchen-home') {
              query = query.in('cat', ['kitchen-home', 'kitchen', 'home']);
            } else {
              query = query.eq('cat', cat);
            }
          }

          // Status filter at DB level if applicable
          if (status && status !== 'all') {
            const sLower = status.toLowerCase();
            if (sLower === 'active') {
              query = query.eq('is_active', true);
            } else if (sLower === 'draft' || sLower === 'archived') {
              query = query.eq('is_active', false);
            }
          }

          // Search query filter at DB level
          if (search && search.trim()) {
            const qTrim = search.trim();
            if (!isNaN(Number(qTrim))) {
              query = query.or(`id.eq.${qTrim},name.ilike.%${qTrim}%,cat.ilike.%${qTrim}%`);
            } else {
              query = query.or(`name.ilike.%${qTrim}%,cat.ilike.%${qTrim}%`);
            }
          }

          const { data, error } = await query.order('id', { ascending: false });

          if (!error && data && data.length > 0) {
            let mapped = data.map(mapSupabaseProduct);

            // Apply stock filters in JS if requested
            if (status && status !== 'all') {
              const sLower = status.toLowerCase();
              if (sLower === 'in_stock') {
                mapped = mapped.filter((p) => (p.stock ?? 0) > (p.lowStockThreshold ?? 5));
              } else if (sLower === 'low_stock') {
                mapped = mapped.filter((p) => {
                  const stock = p.stock ?? 0;
                  const thresh = p.lowStockThreshold ?? 5;
                  return stock > 0 && stock <= thresh;
                });
              } else if (sLower === 'out_of_stock') {
                mapped = mapped.filter((p) => (p.stock ?? 0) === 0);
              }
            }

            // Client-side text filter refinement
            if (search && search.trim()) {
              const qLower = search.trim().toLowerCase();
              mapped = mapped.filter((p) => {
                const idMatch = String(p.id) === qLower;
                const nameMatch = p.name?.toLowerCase().includes(qLower);
                const catMatch = p.cat?.toLowerCase().includes(qLower);
                const descMatch = p.desc?.toLowerCase().includes(qLower);
                return idMatch || nameMatch || catMatch || descMatch;
              });
            }

            return NextResponse.json({
              products: mapped,
              total: mapped.length,
              categories: CATS,
            });
          }
        }
      } catch (e) {
        console.warn('Supabase admin products GET error, falling back to local store:', e);
      }
    }

    // 2. Fall back seamlessly to getProductsStore()
    const store = getProductsStore();

    // Single item query fallback
    if (idParam) {
      const single = store.find((p) => String(p.id) === String(idParam));
      if (!single) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ product: single });
    }

    let results = [...store];

    // Filter by Category
    if (cat && cat !== 'all') {
      const catLower = cat.toLowerCase();
      results = results.filter((p) => {
        const pCat = p.cat?.toLowerCase() || '';
        if (pCat === catLower) return true;
        // Friendly mappings between Domain 3 category names and original CATS
        if (catLower === 'women' && (pCat === 'wears' || pCat === 'abayas')) return true;
        if (catLower === 'men' && pCat === 'wears') return true;
        if (catLower === 'bags-shoes' && (pCat === 'bags' || pCat === 'shoes')) return true;
        if (catLower === 'gadgets' && pCat === 'electronics') return true;
        if (catLower === 'kitchen-home' && (pCat === 'kitchen' || pCat === 'home')) return true;
        return false;
      });
    }

    // Filter by Status / Stock
    if (status && status !== 'all') {
      const sLower = status.toLowerCase();
      if (sLower === 'active' || sLower === 'draft' || sLower === 'archived') {
        results = results.filter((p) => (p.status || 'active') === sLower);
      } else if (sLower === 'in_stock') {
        results = results.filter((p) => (p.stock ?? 0) > (p.lowStockThreshold ?? 5));
      } else if (sLower === 'low_stock') {
        results = results.filter((p) => {
          const stock = p.stock ?? 0;
          const thresh = p.lowStockThreshold ?? 5;
          return stock > 0 && stock <= thresh;
        });
      } else if (sLower === 'out_of_stock') {
        results = results.filter((p) => (p.stock ?? 0) === 0);
      }
    }

    // Filter by Search Query
    if (search && search.trim()) {
      const qLower = search.trim().toLowerCase();
      results = results.filter((p) => {
        const idMatch = String(p.id) === qLower;
        const nameMatch = p.name?.toLowerCase().includes(qLower);
        const catMatch = p.cat?.toLowerCase().includes(qLower);
        const descMatch = p.desc?.toLowerCase().includes(qLower);
        return idMatch || nameMatch || catMatch || descMatch;
      });
    }

    return NextResponse.json({
      products: results,
      total: results.length,
      categories: CATS,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/products:', error);
    return NextResponse.json({ error: 'Failed to retrieve products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || body.price === undefined) {
      return NextResponse.json(
        { error: 'Product name and price are required' },
        { status: 400 }
      );
    }

    const store = getProductsStore();
    const newId = store.length > 0 ? Math.max(...store.map((p) => p.id)) + 1 : 1;

    const baseSlug =
      body.slug ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const newProduct: Product = {
      id: newId,
      name: body.name.trim(),
      slug: baseSlug,
      cat: body.cat || 'wears',
      price: Number(body.price) || 0,
      was: body.was !== undefined && body.was !== null && body.was !== '' ? Number(body.was) : null,
      cogs: body.cogs !== undefined && body.cogs !== null && body.cogs !== '' ? Number(body.cogs) : Math.round(Number(body.price) * 0.55),
      stock: body.stock !== undefined ? Number(body.stock) : 10,
      lowStockThreshold: body.lowStockThreshold !== undefined ? Number(body.lowStockThreshold) : 5,
      status: body.status || 'active',
      art: body.art || 'dress',
      colors: Array.isArray(body.colors) && body.colors.length > 0 ? body.colors : ['violet'],
      sizes: Array.isArray(body.sizes) ? body.sizes : [],
      badge: body.badge?.trim() || null,
      desc: body.desc?.trim() || '',
      feat: Array.isArray(body.feat) ? body.feat.filter(Boolean) : [],
      images: Array.isArray(body.images) ? body.images.filter(Boolean) : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Prepend new product to the global store
    store.unshift(newProduct);

    // Insert newly created product into Supabase products table using createAdminClient()
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        const dbPayload: any = {
          id: newProduct.id,
          name: newProduct.name,
          cat: newProduct.cat,
          price: newProduct.price,
          was: newProduct.was,
          art: newProduct.art,
          colors: newProduct.colors,
          sizes: newProduct.sizes,
          badge: newProduct.badge,
          desc: newProduct.desc,
          feat: newProduct.feat,
          is_active: newProduct.status !== 'draft' && newProduct.status !== 'archived',
        };

        const { error: insertError } = await supabase.from('products').insert(dbPayload);
        if (insertError) {
          console.warn('Supabase product insert warning:', insertError);
        }
      } catch (err) {
        console.warn('Supabase product insert error:', err);
      }
    }

    return NextResponse.json(
      { success: true, message: 'Product created successfully', product: newProduct },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/admin/products:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = Number(body.id);

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required for update' }, { status: 400 });
    }

    const store = getProductsStore();
    const index = store.findIndex((p) => p.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const existing = store[index];
    const updatedProduct: Product = {
      ...existing,
      name: body.name !== undefined ? body.name.trim() : existing.name,
      slug:
        body.slug !== undefined
          ? body.slug
          : existing.slug ||
            existing.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, ''),
      cat: body.cat !== undefined ? body.cat : existing.cat,
      price: body.price !== undefined ? Number(body.price) : existing.price,
      was: body.was !== undefined ? (body.was === null || body.was === '' ? null : Number(body.was)) : existing.was,
      cogs: body.cogs !== undefined ? Number(body.cogs) : existing.cogs,
      stock: body.stock !== undefined ? Number(body.stock) : existing.stock,
      lowStockThreshold:
        body.lowStockThreshold !== undefined ? Number(body.lowStockThreshold) : existing.lowStockThreshold,
      status: body.status !== undefined ? body.status : existing.status,
      art: body.art !== undefined ? body.art : existing.art,
      colors: Array.isArray(body.colors) ? body.colors : existing.colors,
      sizes: Array.isArray(body.sizes) ? body.sizes : existing.sizes,
      badge: body.badge !== undefined ? (body.badge ? body.badge.trim() : null) : existing.badge,
      desc: body.desc !== undefined ? body.desc.trim() : existing.desc,
      feat: Array.isArray(body.feat) ? body.feat.filter(Boolean) : existing.feat,
      images: Array.isArray(body.images) ? body.images.filter(Boolean) : existing.images,
      updatedAt: new Date().toISOString(),
    };

    store[index] = updatedProduct;

    // Update existing product in Supabase products table using createAdminClient()
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        const updatePayload: Record<string, any> = {};
        if (body.name !== undefined) updatePayload.name = updatedProduct.name;
        if (body.cat !== undefined) updatePayload.cat = updatedProduct.cat;
        if (body.price !== undefined) updatePayload.price = updatedProduct.price;
        if (body.was !== undefined) updatePayload.was = updatedProduct.was;
        if (body.art !== undefined) updatePayload.art = updatedProduct.art;
        if (Array.isArray(body.colors)) updatePayload.colors = updatedProduct.colors;
        if (Array.isArray(body.sizes)) updatePayload.sizes = updatedProduct.sizes;
        if (body.badge !== undefined) updatePayload.badge = updatedProduct.badge;
        if (body.desc !== undefined) updatePayload.desc = updatedProduct.desc;
        if (Array.isArray(body.feat)) updatePayload.feat = updatedProduct.feat;
        if (body.status !== undefined) {
          updatePayload.is_active = body.status === 'active';
        }

        const { error: updateError } = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', id);

        if (updateError) {
          console.warn('Supabase product update warning:', updateError);
        }
      } catch (err) {
        console.warn('Supabase product update error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/products:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required for deletion' }, { status: 400 });
    }

    const numId = Number(id);
    const store = getProductsStore();
    const index = store.findIndex((p) => p.id === numId);

    if (index === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const removed = store.splice(index, 1)[0];

    // Remove product from Supabase products table (or set is_active = false)
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        // Try removing the product row
        const { error: deleteError } = await supabase.from('products').delete().eq('id', numId);
        if (deleteError) {
          // If foreign key constraint or policy prevents deletion, soft delete
          await supabase.from('products').update({ is_active: false }).eq('id', numId);
        }
      } catch (err) {
        console.warn('Supabase product deletion error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
      deletedId: removed.id,
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/products:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
