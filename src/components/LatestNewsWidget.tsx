'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Calendar,
  FileText
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string;
  publishedAt: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  actualites: '📰',
  conseils: '💡',
  hajj: '🕋',
  mises_a_jour: '🚀'
};

const CATEGORY_COLORS: Record<string, string> = {
  actualites: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  conseils: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-blue-500',
  hajj: 'bg-amber-100 text-amber-700 dark:bg-blue-900/30 dark:text-blue-500',
  mises_a_jour: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
};

export default function LatestNewsWidget() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/blog?limit=3');
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-lg">📰</span>
            <h3 className="font-semibold text-slate-800 dark:text-white">Dernières actualités</h3>
          </div>
          <Link
            href="/agence/blog"
            className="text-sm text-[#2563EB] hover:underline flex items-center gap-1"
          >
            Voir tout
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Posts */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {posts.map((post) => {
            const categoryColor = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.actualites;
            const categoryIcon = CATEGORY_ICONS[post.category] || '📄';

            return (
              <Link
                key={post.id}
                href={`/agence/blog/${post.slug}`}
                className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex gap-3">
                  {/* Cover Image */}
                  {post.coverImage ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-slate-400" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Category Badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${categoryColor}`}>
                      {categoryIcon}
                    </span>

                    {/* Title */}
                    <h4 className="font-medium text-slate-800 dark:text-white text-sm mt-1 line-clamp-1">
                      {post.title}
                    </h4>

                    {/* Date */}
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(post.publishedAt)}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
