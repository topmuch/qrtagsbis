'use client';

import { useState, useEffect } from 'react';

// AI Badge Component - Shows when a feature is AI-powered
export function AIBadge({ 
  tooltip = "Cette suggestion est générée par une IA légère. Vous pouvez la désactiver dans les paramètres." 
}: { 
  tooltip?: string 
}) {
  return (
    <span 
      className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full cursor-help"
      title={tooltip}
    >
      🤖 IA
    </span>
  );
}

// AI Suggestion Badge - Shows when a suggestion is AI-powered
export function AISuggestionBadge({ 
  confidence = 0.5,
  tooltip 
}: { 
  confidence?: number;
  tooltip?: string;
}) {
  const confidencePercent = Math.round(confidence * 100);
  
  return (
    <span 
      className="inline-flex items-center gap-1 px-2 py-1 bg-[#1a2238] text-[#a0a8b8] text-xs rounded-lg cursor-help"
      title={tooltip || `Confiance: ${confidencePercent}%`}
    >
      💡 IA ({confidencePercent}%)
    </span>
  );
}

// Fraud Risk Badge - Shows risk level for scans
export function FraudRiskBadge({ 
  level, 
  reasons = [],
  score 
}: { 
  level: 'low' | 'medium' | 'high';
  reasons?: string[];
  score?: number;
}) {
  const config = {
    low: { 
      label: 'Normal', 
      bgClass: 'bg-green-500/20', 
      textClass: 'text-green-400',
      icon: '✅'
    },
    medium: { 
      label: 'Suspect', 
      bgClass: 'bg-yellow-500/20', 
      textClass: 'text-yellow-400',
      icon: '⚠️'
    },
    high: { 
      label: 'Risque élevé', 
      bgClass: 'bg-red-500/20', 
      textClass: 'text-red-400',
      icon: '🚨'
    },
  };

  const { label, bgClass, textClass, icon } = config[level];
  const tooltip = reasons.length > 0 ? reasons.join('\n') : undefined;

  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-1 ${bgClass} ${textClass} text-xs rounded-full ${tooltip ? 'cursor-help' : ''}`}
      title={tooltip}
    >
      {icon} {label}
      {score !== undefined && <span className="opacity-70">({score})</span>}
    </span>
  );
}

// AI Status Indicator - Shows if AI features are enabled
export function AIStatusIndicator() {
  const [status, setStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAIStatus();
  }, []);

  const fetchAIStatus = async () => {
    try {
      const response = await fetch('/api/ai/suggestions?status=true');
      const data = await response.json();
      setStatus(data.aiStatus || {});
    } catch (error) {
      console.error('Error fetching AI status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const enabledCount = Object.values(status).filter(Boolean).length;
  const totalCount = Object.keys(status).length;

  if (enabledCount === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg">
      <span className="text-purple-300 text-sm">🤖</span>
      <span className="text-purple-300 text-xs">
        {enabledCount}/{totalCount} IA active{enabledCount > 1 ? 's' : ''}
      </span>
    </div>
  );
}

// QR Suggestion Card - Shows AI-powered QR volume suggestions
export function QRSuggestionCard({ 
  agencyId,
  onAccept 
}: { 
  agencyId?: string;
  onAccept?: (count: number) => void;
}) {
  const [suggestion, setSuggestion] = useState<{
    recommended: number;
    basedOn: string;
    confidence: number;
    breakdown: { lastYear: number; growth: number; margin: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestion();
  }, [agencyId]);

  const fetchSuggestion = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = agencyId 
        ? `/api/ai/suggestions?agencyId=${agencyId}`
        : '/api/ai/suggestions?global=true';
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.suggestion) {
        setSuggestion(data.suggestion);
      } else {
        setError('Aucune donnée historique disponible');
      }
    } catch {
      setError('Erreur lors du calcul');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-4 bg-purple-500/20 rounded w-32 mb-2"></div>
            <div className="h-3 bg-purple-500/10 rounded w-48"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !suggestion) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-xl">🤖</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-medium">Suggestion IA</span>
            <AIBadge />
          </div>
          <p className="text-[#a0a8b8] text-sm mb-3">
            Basé sur {suggestion.basedOn}, nous vous recommandons{' '}
            <span className="text-white font-bold text-lg">{suggestion.recommended}</span> QR codes
          </p>
          <div className="flex items-center gap-4 text-xs text-[#a0a8b8]">
            <span>📊 {suggestion.breakdown.lastYear} l&apos;année passée</span>
            <span className={suggestion.breakdown.growth >= 0 ? 'text-green-400' : 'text-red-400'}>
              {suggestion.breakdown.growth >= 0 ? '📈' : '📉'} {suggestion.breakdown.growth >= 0 ? '+' : ''}{suggestion.breakdown.growth}% croissance
            </span>
            <span>➕ {suggestion.breakdown.margin}% marge</span>
          </div>
          {onAccept && (
            <button
              onClick={() => onAccept(suggestion.recommended)}
              className="mt-3 px-4 py-2 bg-purple-500/30 hover:bg-purple-500/40 text-purple-200 rounded-lg text-sm transition-colors"
            >
              Appliquer cette suggestion
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Message Summary Component - Shows AI-generated summary
export function MessageSummary({ 
  content,
  maxLength = 100 
}: { 
  content: string;
  maxLength?: number;
}) {
  const [summary, setSummary] = useState<string>('');
  const [wasSummarized, setWasSummarized] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (content && content.length > maxLength) {
      summarizeContent();
    } else {
      setSummary(content);
    }
  }, [content, maxLength]);

  const summarizeContent = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content, maxLength })
      });
      const data = await response.json();
      
      if (data.success) {
        setSummary(data.summary);
        setWasSummarized(data.wasSummarized);
      } else {
        setSummary(content.substring(0, maxLength) + '...');
      }
    } catch {
      setSummary(content.substring(0, maxLength) + '...');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <span className="text-[#a0a8b8] animate-pulse">
        Résumé en cours...
      </span>
    );
  }

  return (
    <span className="text-[#a0a8b8]">
      {wasSummarized && (
        <span className="inline-flex items-center mr-1">
          <AIBadge tooltip="Résumé généré par IA" />
        </span>
      )}
      {summary}
    </span>
  );
}
