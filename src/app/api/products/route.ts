import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { PRODUCTS, CATS } from '@/lib/products';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cat = searchParams.get('cat');
  const q = searchParams.get('q');

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      let query = supabase.from('products').select('*').eq('is_active', true);

      if (cat && cat !== 'all') {
        query = query.eq('cat', cat);
      }
      if (q) {
        query = query.ilike('name', `%${q}%`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return NextResponse.json({ products: data, categories: CATS });
      }
    } catch (e) {
      console.warn('Supabase product query error, falling back to static:', e);
    }
  }

  // Fallback to static catalog data
  let result = PRODUCTS;
  if (cat && cat !== 'all') {
    result = result.filter((p) => p.cat === cat);
  }
  if (q) {
    result = result.filter((p) =>
      `${p.name} ${p.desc}`.toLowerCase().includes(q.toLowerCase())
    );
  }

  return NextResponse.json({ products: result, categories: CATS });
}
