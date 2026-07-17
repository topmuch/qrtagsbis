'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';

interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  linkTarget: string;
}

interface AdvertisementBannerProps {
  position?: 'top' | 'sidebar';
  className?: string;
}

export default function AdvertisementBanner({ position = 'top', className = '' }: AdvertisementBannerProps) {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const impressionTracked = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  // Auto-rotate every 8 seconds
  useEffect(() => {
    if (advertisements.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % advertisements.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [advertisements.length]);

  // Track impression when ad is displayed
  useEffect(() => {
    const currentAd = advertisements[currentIndex];
    if (currentAd && !impressionTracked.current.has(currentAd.id)) {
      trackImpression(currentAd.id);
      impressionTracked.current.add(currentAd.id);
    }
  }, [advertisements, currentIndex]);

  const fetchAdvertisements = async () => {
    try {
      const response = await fetch('/api/advertisements');
      const data = await response.json();
      
      // Filter out dismissed ads
      const activeAds = (data.advertisements || []).filter(
        (ad: Advertisement) => !dismissed.includes(ad.id)
      );
      
      setAdvertisements(activeAds);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackImpression = async (adId: string) => {
    try {
      await fetch('/api/advertisements/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advertisementId: adId,
          action: 'impression'
        })
      });
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  };

  const handleClick = async (ad: Advertisement) => {
    try {
      await fetch('/api/advertisements/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advertisementId: ad.id,
          action: 'click'
        })
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }

    if (ad.linkUrl) {
      window.open(ad.linkUrl, ad.linkTarget || '_blank');
    }
  };

  const handleDismiss = (adId: string) => {
    setDismissed(prev => [...prev, adId]);
    setAdvertisements(prev => prev.filter(ad => ad.id !== adId));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + advertisements.length) % advertisements.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % advertisements.length);
  };

  // Don't render if loading, no ads, or not visible
  if (loading || advertisements.length === 0 || !isVisible) {
    return null;
  }

  const currentAd = advertisements[currentIndex];

  // Sidebar style (for sidebar placement)
  if (position === 'sidebar') {
    return (
      <div className={`mt-4 ${className}`}>
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[#2563EB] to-[#ff9f00] shadow-lg">
          {/* Close button */}
          <button
            onClick={() => handleDismiss(currentAd.id)}
            className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3 text-white" />
          </button>

          {/* Content */}
          <div
            onClick={() => handleClick(currentAd)}
            className="cursor-pointer"
          >
            <img
              src={currentAd.imageUrl}
              alt={currentAd.title}
              className="w-full h-32 object-cover"
            />
            <div className="p-3">
              <h4 className="text-white font-semibold text-sm truncate">{currentAd.title}</h4>
              {currentAd.description && (
                <p className="text-white/80 text-xs mt-1 line-clamp-2">{currentAd.description}</p>
              )}
              {currentAd.linkUrl && (
                <div className="flex items-center gap-1 mt-2 text-white/90 text-xs">
                  <span>En savoir plus</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>

          {/* Navigation dots */}
          {advertisements.length > 1 && (
            <div className="flex justify-center gap-1.5 pb-3">
              {advertisements.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentIndex ? 'bg-white w-4' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Top banner style (default)
  return (
    <div className={`relative ${className}`}>
      <div className="relative overflow-hidden rounded-xl shadow-sm">
        {/* Close button */}
        <button
          onClick={() => handleDismiss(currentAd.id)}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors backdrop-blur-sm"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Navigation arrows */}
        {advertisements.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </>
        )}

        {/* Banner content */}
        <div
          onClick={() => handleClick(currentAd)}
          className="cursor-pointer relative"
        >
          <img
            src={currentAd.imageUrl}
            alt={currentAd.title}
            className="w-full h-24 sm:h-32 md:h-40 object-cover"
          />
          
          {/* Overlay with text */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent flex items-center">
            <div className="pl-6 pr-16">
              <h3 className="text-white font-bold text-lg sm:text-xl">{currentAd.title}</h3>
              {currentAd.description && (
                <p className="text-white/80 text-sm mt-1 hidden sm:block max-w-md truncate">
                  {currentAd.description}
                </p>
              )}
              {currentAd.linkUrl && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors">
                    Découvrir
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pagination dots */}
        {advertisements.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {advertisements.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
