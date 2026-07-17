'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { Activity, Database, AlertTriangle, RefreshCw, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface DiagnosticCheck {
  name: string;
  status: 'ok' | 'warn' | 'error';
  detail: string;
  latencyMs?: number;
}

interface DiagnosticResult {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  checks: DiagnosticCheck[];
}

interface SystemLog {
  id: string;
  level: string;
  message: string;
  source: string;
  metadata: string | null;
  createdAt: string;
}

export default function MonitoringPage() {
  const { t } = useTranslation();
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [page, setPage] = useState(1);

  const runDiagnostic = useCallback(async () => {
    setLoading(true);
    setDiagnosticError(null);
    try {
      const res = await fetch('/api/admin/diagnostic');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setDiagnosticError(err.error || `Erreur HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      if (data.status && data.checks) {
        setDiagnostic(data);
      } else {
        setDiagnosticError('Réponse inattendue du serveur.');
      }
    } catch (err) {
      setDiagnosticError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (filterLevel) params.set('level', filterLevel);
      if (filterSource) params.set('source', filterSource);
      const res = await fetch(`/api/admin/system-logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalLogs(data.pagination?.total || 0);
    } catch {
      // ignore
    }
  }, [page, filterLevel, filterSource]);

  const purgeLogs = async () => {
    if (!confirm('Supprimer tous les logs de plus de 30 jours ?')) return;
    try {
      const res = await fetch('/api/admin/system-logs', { method: 'DELETE' });
      const data = await res.json();
      alert(data.message);
      fetchLogs();
    } catch {
      alert('Erreur lors de la purge');
    }
  };

  useEffect(() => { runDiagnostic(); }, [runDiagnostic]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    let cancelled = false;
    const tick = async () => {
      setRefreshing(true);
      try {
        await Promise.all([runDiagnostic(), fetchLogs()]);
      } catch (err) {
        console.error('Auto-refresh error:', err);
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    };
    // Run immediately on toggle
    tick();
    const interval = setInterval(tick, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [autoRefresh, runDiagnostic, fetchLogs]);

  const statusColors: Record<string, string> = {
    healthy: 'bg-green-100 text-green-800 border-green-200',
    degraded: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  };

  const levelColors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-800',
    warn: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    fatal: 'bg-purple-100 text-purple-800',
  };

  const levelBg: Record<string, string> = {
    info: 'border-l-blue-400',
    warn: 'border-l-yellow-400',
    error: 'border-l-red-400',
    fatal: 'border-l-purple-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoring</h1>
          <p className="text-gray-500 text-sm">Diagnostic système et logs centralisés</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            {autoRefresh ? `Auto-refresh ON (30s)` : 'Auto-refresh'}
          </Button>
          <Button onClick={runDiagnostic} disabled={loading} size="sm">
            <Activity className={`w-4 h-4 mr-1 ${loading ? 'animate-pulse' : ''}`} />
            {loading ? 'Analyse...' : 'Lancer diagnostic'}
          </Button>
        </div>
      </div>

      {/* Diagnostic Error */}
      {diagnosticError && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <p className="font-medium">Erreur de diagnostic</p>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{diagnosticError}</p>
          </CardContent>
        </Card>
      )}

      {/* Diagnostic Result */}
      {diagnostic && (
        <Card className={statusColors[diagnostic.status] + ' border'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Status: {diagnostic.status.toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {diagnostic.checks.map((check, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{check.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{check.detail}</span>
                    <Badge variant={
                      check.status === 'ok' ? 'default' : 
                      check.status === 'warn' ? 'secondary' : 'destructive'
                    }>
                      {check.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Dernière vérification: {new Date(diagnostic.timestamp).toLocaleString('fr-FR')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Database className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{totalLogs}</p>
            <p className="text-xs text-gray-500">Logs totaux</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="text-2xl font-bold">{logs.filter(l => l.level === 'error').length}</p>
            <p className="text-xs text-gray-500">Erreurs (cette page)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{logs.filter(l => l.level === 'fatal').length}</p>
            <p className="text-xs text-gray-500">Fatals (cette page)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="w-8 h-8 mx-auto mb-2 text-green-500 font-bold text-lg">✓</div>
            <p className="text-2xl font-bold">{logs.filter(l => l.level === 'info').length}</p>
            <p className="text-xs text-gray-500">Info (cette page)</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Logs système</CardTitle>
            <Button variant="outline" size="sm" onClick={purgeLogs}>
              <Trash2 className="w-4 h-4 mr-1" />
              Purge 30j
            </Button>
          </div>
          <div className="flex gap-2 mt-3">
            <select
              value={filterLevel}
              onChange={(e) => { setFilterLevel(e.target.value); setPage(1); }}
              className="text-sm border rounded-md px-2 py-1"
            >
              <option value="">Tous niveaux</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
              <option value="fatal">Fatal</option>
            </select>
            <input
              value={filterSource}
              onChange={(e) => { setFilterSource(e.target.value); setPage(1); }}
              placeholder="Filtrer par source..."
              className="text-sm border rounded-md px-2 py-1 flex-1"
            />
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Aucun log trouvé</p>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`border-l-4 ${levelBg[log.level] || 'border-l-gray-300'} bg-gray-50 rounded-r-lg px-3 py-2`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${levelColors[log.level]}`}>
                      {log.level}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{log.source}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(log.createdAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 mt-0.5">{log.message}</p>
                  {log.metadata && (
                    <details className="mt-1">
                      <summary className="text-xs text-gray-400 cursor-pointer">Metadata</summary>
                      <pre className="text-xs text-gray-500 bg-gray-100 p-2 mt-1 rounded overflow-x-auto max-h-32">
                        {log.metadata}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500">{totalLogs} logs au total</p>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Préc.</Button>
              <span className="px-3 py-1 text-sm">Page {page}</span>
              <Button size="sm" variant="outline" onClick={() => setPage(page + 1)}>Suiv.</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
