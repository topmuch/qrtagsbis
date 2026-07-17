'use client';

import { useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';

interface Review {
  id: string;
  name: string;
  location: string | null;
  rating: number;
  title: string | null;
  content: string;
  language: string;
  response: string | null;
  createdAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

interface TestimonialsSectionProps {
  lang?: string;
}

export function TestimonialsSection({ lang = 'fr' }: TestimonialsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const params = new URLSearchParams({ featured: 'true', limit: '6' });
        const res = await fetch(`/api/reviews?${params}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews || []);
          setStats(data.stats || null);
        }
      } catch {
        // Silent
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  if (loading) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-[#FDFBF7]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] mb-2">
            {lang === 'ar' ? 'ماذا يقول عملاؤنا' : lang === 'en' ? 'What our customers say' : 'Ce que disent nos clients'}
          </h2>
          {stats && (
            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-5 h-5 ${s <= Math.round(stats.averageRating) ? 'fill-[#c5a643] text-[#c5a643]' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-sm text-[#1a1a1a]/70">
                {stats.averageRating.toFixed(1)}/5 — {stats.totalReviews} {lang === 'ar' ? 'تقييم' : lang === 'en' ? 'reviews' : 'avis'}
              </span>
            </div>
          )}
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white border-2 border-[#1a1a1a]/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <Quote className="w-8 h-8 text-[#c5a643]/40 mb-3" />
              {review.title && (
                <h3 className="font-bold text-[#1a1a1a] mb-2">{review.title}</h3>
              )}
              <p className="text-sm text-[#1a1a1a]/80 leading-relaxed mb-4">{review.content}</p>

              {/* Admin response */}
              {review.response && (
                <div className="bg-[#c5a643]/10 border-l-3 border-[#c5a643] rounded-r-lg p-3 mb-4">
                  <p className="text-xs font-bold text-[#1a1a1a] mb-1">QRTags</p>
                  <p className="text-xs text-[#1a1a1a]/70">{review.response}</p>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-[#1a1a1a]/10 pt-3">
                <div>
                  <p className="text-sm font-bold text-[#1a1a1a]">{review.name}</p>
                  {review.location && (
                    <p className="text-xs text-[#1a1a1a]/60">📍 {review.location}</p>
                  )}
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-[#c5a643] text-[#c5a643]' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Trust badge for landing page */
export function TrustBadge({ lang = 'fr' }: { lang?: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/reviews?limit=1');
        if (res.ok) {
          const data = await res.json();
          setCount(data.stats?.totalReviews || null);
        }
      } catch { /* silent */ }
    }
    fetchStats();
  }, []);

  return (
    <div className="inline-flex items-center gap-2 bg-[#c5a643]/20 border border-[#c5a643] rounded-full px-4 py-2">
      <Shield className="w-4 h-4 text-[#c5a643]" />
      <span className="text-xs font-bold text-[#1a1a1a]">
        {count !== null
          ? (lang === 'ar' ? `${count} تقييم موثق` : lang === 'en' ? `${count} verified reviews` : `${count} avis vérifiés`)
          : (lang === 'ar' ? 'آراء موثوقة' : lang === 'en' ? 'Trusted reviews' : 'Avis vérifiés')
        }
      </span>
    </div>
  );
}

function Shield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}