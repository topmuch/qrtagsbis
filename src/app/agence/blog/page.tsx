'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Eye,
  Tag,
  Clock,
  ChevronRight,
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
  views: number;
  author?: {
    name: string | null;
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

export default function AgencyBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      params.append('limit', '20');

      const response = await fetch(`/api/blog?${params}`);
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
      month: 'long',
      year: 'numeric'
    });
  };

  const formatReadingTime = (content: string) => {
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min de lecture`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/agence/tableau-de-bord"
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-[#2563EB] dark:hover:text-[#2563EB] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </Link>
        
        <div className="flex items-center gap-3 mt-4">
          <div className="w-12 h-12 rounded-2xl bg-[#2563EB]/20 flex items-center justify-center">
            <span className="text-2xl">📰</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Blog QRTags</h1>
            <p className="text-slate-500 dark:text-slate-400">Actualités, conseils et mises à jour</p>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button
          onClick={() => setSelectedCategory('all')}
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          className={`rounded-xl ${selectedCategory === 'all' 
            ? 'bg-[#2563EB] hover:bg-[#2563EB]/90 text-white' 
            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          Tous
        </Button>
        {Object.entries(CATEGORY_LABELS).map(([key, value]) => (
          <Button
            key={key}
            onClick={() => setSelectedCategory(key)}
            variant={selectedCategory === key ? 'default' : 'outline'}
            className={`rounded-xl ${selectedCategory === key 
              ? 'bg-[#2563EB] hover:bg-[#2563EB]/90 text-white' 
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {CATEGORY_ICONS[key]} {value.label}
          </Button>
        ))}
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">Aucun article disponible</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const categoryInfo = CATEGORY_LABELS[post.category] || CATEGORY_LABELS.actualites;
            
            return (
              <Link key={post.id} href={`/agence/blog/${post.slug}`}>
                <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl hover:shadow-md hover:border-[#2563EB]/30 transition-all cursor-pointer group">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Cover Image */}
                      {post.coverImage && (
                        <div className="sm:w-48 h-40 sm:h-auto flex-shrink-0 overflow-hidden rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none">
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="flex-1 p-5">
                        {/* Category Badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${categoryInfo.color}`}>
                          <Tag className="w-3 h-3" />
                          {categoryInfo.label}
                        </span>

                        {/* Title */}
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mt-2 group-hover:text-[#2563EB] transition-colors">
                          {post.title}
                        </h2>

                        {/* Excerpt */}
                        {post.excerpt && (
                          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-4 mt-4 text-xs text-slate-400 dark:text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(post.publishedAt)}
                          </span>
                          {post.author?.name && (
                            <span>Par {post.author.name}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.views} vues
                          </span>
                        </div>

                        {/* Read More */}
                        <div className="flex items-center gap-1 text-[#2563EB] text-sm mt-3 font-medium">
                          Lire l'article
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
