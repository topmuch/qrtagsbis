import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { headers } from 'next/headers';

// GET - Get single blog post by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getSession();
    
    // Only authenticated users can access
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { slug } = await params;

    // Find post
    const post = await db.blogPost.findUnique({
      where: { 
        slug,
        status: 'published',
        publishedAt: { lte: new Date() }
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Article non trouvé' },
        { status: 404 }
      );
    }

    // Track view (async, don't wait)
    trackView(post.id, user.id, user.agencyId).catch(console.error);

    // Increment view count
    await db.blogPost.update({
      where: { id: post.id },
      data: { views: { increment: 1 } }
    });

    return NextResponse.json({ post });

  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'article' },
      { status: 500 }
    );
  }
}

// Track view for analytics
async function trackView(postId: string, userId?: string, agencyId?: string | null) {
  try {
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                      headersList.get('x-real-ip') ||
                      null;
    const userAgent = headersList.get('user-agent');

    await db.blogView.create({
      data: {
        postId,
        userId: userId || null,
        agencyId: agencyId || null,
        ipAddress,
        userAgent
      }
    });
  } catch (error) {
    console.error('Error tracking blog view:', error);
  }
}
