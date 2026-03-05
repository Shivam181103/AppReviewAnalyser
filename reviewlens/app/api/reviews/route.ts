import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');
    const rating = searchParams.get('rating');
    const sentiment = searchParams.get('sentiment');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let query = supabaseAdmin
      .from('reviews')
      .select(`
        *,
        apps!inner(id, name, icon_url, user_id)
      `)
      .eq('apps.user_id', user.id);

    if (appId) {
      query = query.eq('app_id', appId);
    }

    if (rating) {
      query = query.eq('rating', parseInt(rating));
    }

    if (sentiment) {
      query = query.eq('sentiment_label', sentiment);
    }

    const { data: reviews, error, count } = await query
      .order('date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
