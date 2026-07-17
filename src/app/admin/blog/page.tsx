'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  X,
  Save,
  FileText,
  Globe,
  Calendar,
  Eye as EyeIcon,
  Tag,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Link as LinkIcon,
  Image as ImageIcon
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string;
  status: string;
  publishedAt: string | null;
  views: number;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name: string | null;
    email: string;
  };
  _count?: {
    blogViews: number;
  };
}

interface ApiResponse {
  posts: BlogPost[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const CATEGORIES = [
  { value: 'actualites', label: '📰 Actualités' },
  { value: 'conseils', label: '💡 Conseils' },
  { value: 'hajj', label: '🕋 Hajj 2026' },
  { value: 'mises_a_jour', label: '🚀 Mises à jour' }
];

const CATEGORY_LABELS: Record<string, string> = {
  actualites: 'Actualités',
  conseils: 'Conseils',
  hajj: 'Hajj 2026',
  mises_a_jour: 'Mises à jour'
};

export default function BlogAdminPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    coverImage: '',
    category: 'actualites',
    status: 'draft'
  });

  useEffect(() => {
    fetchPosts();
  }, [statusFilter, categoryFilter, page]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      params.append('page', String(page));
      params.append('limit', '10');

      const response = await fetch(`/api/admin/blog?${params}`);
      const result = await response.json();
      
      if (result.posts) {
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedPost(null);
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      coverImage: '',
      category: 'actualites',
      status: 'draft'
    });
    setShowModal(true);
  };

  const openEditModal = (post: BlogPost) => {
    setModalMode('edit');
    setSelectedPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      coverImage: post.coverImage || '',
      category: post.category,
      status: post.status
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      alert('Titre et contenu requis');
      return;
    }

    setSaving(true);
    try {
      const url = '/api/admin/blog';
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const body = modalMode === 'create' 
        ? formData 
        : { id: selectedPost?.id, ...formData };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      
      if (response.ok) {
        setShowModal(false);
        fetchPosts();
      } else {
        alert(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/blog?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const toggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    
    try {
      const response = await fetch('/api/admin/blog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: post.id,
          ...post,
          status: newStatus
        })
      });

      if (response.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'published') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-blue-500">
          <Globe className="w-3 h-3" />
          Publié
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
        <FileText className="w-3 h-3" />
        Brouillon
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
        <Tag className="w-3 h-3" />
        {cat?.label || category}
      </span>
    );
  };

  // Rich text editor helpers
  const insertFormat = (format: string) => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    
    let newText = '';
    switch (format) {
      case 'bold':
        newText = `**${selectedText}**`;
        break;
      case 'italic':
        newText = `*${selectedText}*`;
        break;
      case 'h2':
        newText = `\n## ${selectedText}\n`;
        break;
      case 'ul':
        newText = `\n- ${selectedText}\n`;
        break;
      case 'ol':
        newText = `\n1. ${selectedText}\n`;
        break;
      case 'quote':
        newText = `\n> ${selectedText}\n`;
        break;
      case 'link':
        newText = `[${selectedText || 'lien'}](url)`;
        break;
      case 'image':
        newText = `![${selectedText || 'image'}](url)`;
        break;
      default:
        newText = selectedText;
    }
    
    const newContent = formData.content.substring(0, start) + newText + formData.content.substring(end);
    setFormData({ ...formData, content: newContent });
  };

  // Stats
  const stats = {
    total: data?.pagination.total || 0,
    published: data?.posts.filter(p => p.status === 'published').length || 0,
    draft: data?.posts.filter(p => p.status === 'draft').length || 0,
    totalViews: data?.posts.reduce((sum, p) => sum + p.views, 0) || 0
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Blog Interne</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez les articles pour les agences partenaires</p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-[#2563EB] hover:bg-[#2563EB]/90 text-white rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvel article
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800 shadow-sm rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-500">{stats.published}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Publiés</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600 dark:text-blue-500">{stats.draft}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Brouillons</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalViews}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Vues</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="published">Publiés</SelectItem>
            <SelectItem value="draft">Brouillons</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={fetchPosts}
          variant="ghost"
          size="sm"
          className="text-slate-500 dark:text-slate-400"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
        </div>
      ) : data?.posts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 border border-slate-200 dark:border-slate-700 text-center">
          <div className="flex flex-col items-center">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400">Aucun article trouvé</p>
            <Button
              onClick={openCreateModal}
              variant="link"
              className="text-[#2563EB] mt-2"
            >
              Créer le premier article
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data?.posts.map((post) => (
              <div
                key={post.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all"
              >
                {/* Card Header with cover image */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 dark:text-white line-clamp-2">{post.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {post.excerpt || post.content.replace(/[#*`>\-\[\]]/g, '').substring(0, 80)}...
                    </p>
                  </div>
                </div>

                {/* Badges row */}
                <div className="flex items-center gap-2 mb-3">
                  {getCategoryBadge(post.category)}
                  {getStatusBadge(post.status)}
                </div>

                {/* Meta info */}
                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span>
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString('fr-FR')
                        : new Date(post.createdAt).toLocaleDateString('fr-FR')
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">✍️</span>
                    <span>{post.author?.name || 'Anonyme'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <EyeIcon className="w-3 h-3 shrink-0" />
                    <span>{post.views} vue(s)</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <Button
                    onClick={() => toggleStatus(post)}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    title={post.status === 'published' ? 'Dépublier' : 'Publier'}
                  >
                    {post.status === 'published' ? (
                      <FileText className="w-3.5 h-3.5 text-blue-600 mr-1" />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-blue-600 mr-1" />
                    )}
                    {post.status === 'published' ? 'Dépublier' : 'Publier'}
                  </Button>
                  <Button
                    onClick={() => openEditModal(post)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4 text-slate-500" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(post.id)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {((page - 1) * 10) + 1} à {Math.min(page * 10, data.pagination.total)} sur {data.pagination.total}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                >
                  Précédent
                </Button>
                <Button
                  onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  {modalMode === 'create' ? 'Nouvel article' : 'Modifier l\'article'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-5">
                {/* Title */}
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Titre *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Titre de l'article"
                    className="mt-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  />
                </div>

                {/* Cover Image */}
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Image de couverture (URL)</Label>
                  <Input
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="https://exemple.com/image.jpg"
                    className="mt-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  />
                  {formData.coverImage && (
                    <div className="mt-2 h-32 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
                      <img src={formData.coverImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Excerpt */}
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Extrait (affiché dans la liste)</Label>
                  <Textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Résumé court de l'article..."
                    rows={2}
                    className="mt-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  />
                </div>

                {/* Content with Toolbar */}
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Contenu * (Markdown)</Label>
                  
                  {/* Toolbar */}
                  <div className="flex flex-wrap gap-1 mt-2 mb-2 p-2 bg-slate-100 dark:bg-slate-700 rounded-t-xl border border-slate-200 dark:border-slate-600 border-b-0">
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormat('bold')} title="Gras">
                      <Bold className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormat('italic')} title="Italique">
                      <Italic className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormat('h2')} title="Titre">
                      <Heading2 className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormat('ul')} title="Liste">
                      <List className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormat('ol')} title="Liste numérotée">
                      <ListOrdered className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormat('quote')} title="Citation">
                      <Quote className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormat('link')} title="Lien">
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormat('image')} title="Image">
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <Textarea
                    id="content-editor"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Écrivez votre article en Markdown..."
                    rows={12}
                    className="mt-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-t-none"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Utilisez **gras**, *italique*, ## Titre, - liste, [lien](url), ![image](url)
                  </p>
                </div>

                {/* Category and Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Catégorie</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger className="mt-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Statut</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger className="mt-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="published">Publié</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="border-slate-200 dark:border-slate-700"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#2563EB] hover:bg-[#2563EB]/90 text-white"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
