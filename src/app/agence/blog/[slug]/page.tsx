'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Eye,
  Tag,
  Share2,
  ChevronLeft
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string;
  publishedAt: string;
  views: number;
  createdAt: string;
  author?: {
    name: string | null;
    email: string;
  };
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  actualites: { label: 'Actualités', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  conseils: { label: 'Conseils', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-blue-500' },
  hajj: { label: 'Hajj 2026', color: 'bg-amber-100 text-amber-700 dark:bg-blue-900/30 dark:text-blue-500' },
  mises_a_jour: { label: 'Mises à jour', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' }
};

const CATEGORY_ICONS: Record<string, string> = {
  actualites: '📰',
  conseils: '💡',
  hajj: '🕋',
  mises_a_jour: '🚀'
};

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/blog/${slug}`);
      const data = await response.json();

      if (response.ok && data.post) {
        setPost(data.post);
      } else {
        setError(data.error || 'Article non trouvé');
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Erreur lors du chargement de l\'article');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Simple markdown to HTML converter
  const renderMarkdown = (content: string) => {
    let html = content
      // Headers
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-slate-800 dark:text-white mt-6 mb-3">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-slate-800 dark:text-white mt-5 mb-2">$1</h3>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-[#2563EB] hover:underline" target="_blank" rel="noopener">$1</a>')
      // Images
      .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" class="rounded-xl my-4 max-w-full h-auto" />')
      // Unordered lists
      .replace(/^- (.+)$/gm, '<li class="text-slate-600 dark:text-slate-300 ml-4">$1</li>')
      // Ordered lists
      .replace(/^\d+\. (.+)$/gm, '<li class="text-slate-600 dark:text-slate-300 ml-4 list-decimal">$1</li>')
      // Blockquotes
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-[#2563EB] pl-4 my-4 italic text-slate-600 dark:text-slate-400">$1</blockquote>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="text-slate-600 dark:text-slate-300 leading-relaxed my-4">')
      // Line breaks
      .replace(/\n/g, '<br />');

    return `<div class="prose prose-slate dark:prose-invert max-w-none">
      <p class="text-slate-600 dark:text-slate-300 leading-relaxed my-4">${html}</p>
    </div>`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-4">{error || 'Article non trouvé'}</p>
            <Button
              onClick={() => router.push('/agence/blog')}
              className="bg-[#2563EB] hover:bg-[#2563EB]/90 text-white rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au blog
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryInfo = CATEGORY_LABELS[post.category] || CATEGORY_LABELS.actualites;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        href="/agence/blog"
        className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-[#2563EB] dark:hover:text-[#2563EB] transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Retour au blog
      </Link>

      <article>
        {/* Cover Image */}
        {post.coverImage && (
          <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden mb-6">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          {/* Category */}
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${categoryInfo.color}`}>
            <Tag className="w-3 h-3" />
            {CATEGORY_ICONS[post.category]} {categoryInfo.label}
          </span>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mt-4">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(post.publishedAt)}
            </span>
            {post.author?.name && (
              <span>Par <strong className="text-slate-700 dark:text-slate-300">{post.author.name}</strong></span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {post.views} vues
            </span>
          </div>
        </header>

        {/* Content */}
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-6 sm:p-8">
            <div 
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
            />
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-8">
          <Button
            onClick={() => router.push('/agence/blog')}
            variant="outline"
            className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au blog
          </Button>
        </div>
      </article>
    </div>
  );
}
