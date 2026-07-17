import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET - List published blog posts for agencies
export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    
    // Only authenticated users can access
    if (!user) {
      return NextResponse.json({ posts: [] });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build where clause - only published posts
    const where: Record<string, unknown> = {
      status: 'published',
      publishedAt: { lte: new Date() }
    };
    
    if (category && category !== 'all') {
      where.category = category;
    }

    // Get total count
    const total = await db.blogPost.count({ where });

    // Get posts
    const posts = await db.blogPost.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        category: true,
        publishedAt: true,
        views: true,
        createdAt: true,
        author: {
          select: { name: true }
        }
      },
      orderBy: [
        { publishedAt: 'desc' }
      ],
      skip,
      take: limit
    });

    return NextResponse.json({
      posts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ posts: [] });
  }
}
