'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobsTable } from '@/components/jobs-table';
import { CreateJobModal } from '@/components/create-job-modal';
import { ColdStartBanner } from '@/components/cold-start-banner';
import { api, type Job, type PaginatedResponse, type HealthCheck } from '@/lib/api';

interface Props {
  initialHealth: HealthCheck | null;
  initialJobs: PaginatedResponse<Job> | null;
  initialDeadLetter: PaginatedResponse<Job> | null;
}

const STATUS_FILTERS = ['ALL', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING', 'CANCELLED'];

export function Dashboard({ initialHealth, initialJobs, initialDeadLetter }: Props) {
  const [health, setHealth] = useState(initialHealth);
  const [jobs, setJobs] = useState(initialJobs);
  const [deadLetter, setDeadLetter] = useState(initialDeadLetter);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  const [token, setToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [apiDown, setApiDown] = useState(!initialHealth);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [h, j, dl] = await Promise.allSettled([
        api.getHealth(),
        api.getJobs(statusFilter === 'ALL' ? undefined : statusFilter),
        api.getDeadLetterJobs(),
      ]);
      const healthOk = h.status === 'fulfilled';
      setApiDown(!healthOk);
      if (healthOk) setHealth(h.value);
      if (j.status === 'fulfilled') setJobs(j.value);
      if (dl.status === 'fulfilled') setDeadLetter(dl.value);
      setLastRefresh(new Date());

      // If API was down and is now up, clear retry timer
      if (healthOk && retryRef.current) {
        clearTimeout(retryRef.current);
        retryRef.current = null;
      }
    } catch {
      setApiDown(true);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusFilter]);

  // Auto retry when API is down — poll every 8s
  useEffect(() => {
    if (!apiDown) return;
    retryRef.current = setTimeout(() => refresh(true), 8000);
    return () => { if (retryRef.current) clearTimeout(retryRef.current); };
  }, [apiDown, refresh]);

  useEffect(() => { refresh(); }, [statusFilter, refresh]);

  // Auto-refresh every 10s when healthy
  useEffect(() => {
    if (apiDown) return;
    const interval = setInterval(() => refresh(true), 10000);
    return () => clearInterval(interval);
  }, [refresh, apiDown]);

  const handleQueueToggle = async () => {
    if (!token) return;
    setQueueLoading(true);
    try {
      if (health?.checks.queue.isPaused) {
        await api.resumeQueue(token);
      } else {
        await api.pauseQueue(token);
      }
      await refresh();
    } finally {
      setQueueLoading(false);
    }
  };

  const handleGetToken = async () => {
    if (!tokenInput.trim()) return;
    try {
      const res = await api.generateToken(tokenInput.trim());
      setToken(res.token);
      setTokenInput('');
    } catch {
      alert('Failed to generate token — API may still be starting up.');
    }
  };

  const allJobs = jobs?.data ?? [];
  const counts = {
    queued: allJobs.filter(j => j.status === 'QUEUED').length,
    processing: allJobs.filter(j => j.status === 'PROCESSING').length,
    completed: allJobs.filter(j => j.status === 'COMPLETED').length,
    failed: allJobs.filter(j => j.status === 'FAILED').length,
  };

  const isHealthy = health?.status === 'healthy';

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Cold start banner */}
      <ColdStartBanner isApiDown={apiDown} retryIn={60} onRetry={() => refresh()} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Job Monitor</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            {apiDown ? 'Waiting for API…' : `Updated ${lastRefresh.toLocaleTimeString()} · refreshes every 10s`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={isHealthy ? 'default' : apiDown ? 'outline' : 'destructive'} className="text-xs px-2 py-1">
            {apiDown ? '○ Starting…' : isHealthy ? '● Healthy' : '● Unhealthy'}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refresh()} disabled={loading} className="h-8 text-xs">
            {loading ? 'Refreshing…' : '↺ Refresh'}
          </Button>
          {token && <CreateJobModal token={token} onCreated={() => refresh()} />}
        </div>
      </div>

      {/* Stats — 2 col mobile, 4 col desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Queued" value={counts.queued} color="text-yellow-500" loading={apiDown} />
        <StatCard label="Processing" value={counts.processing} color="text-blue-500" loading={apiDown} />
        <StatCard label="Completed" value={counts.completed} color="text-green-500" loading={apiDown} />
        <StatCard label="Failed" value={counts.failed} color="text-red-500" loading={apiDown} />
      </div>

      {/* Health + Auth — stack on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Health card */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">System Health</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {health ? (
              <>
                <HealthRow label="Database" status={health.checks.database.status} error={health.checks.database.error} />
                <HealthRow label="Redis" status={health.checks.redis.status} error={health.checks.redis.error} />
                <HealthRow label="Queue" status={health.checks.queue.status} error={health.checks.queue.error} />
                <div className="grid grid-cols-2 gap-x-4 pt-1">
                  <div className="text-xs text-muted-foreground">Response: <span className="text-foreground">{health.responseTime}</span></div>
                  <div className="text-xs text-muted-foreground">Uptime: <span className="text-foreground">{Math.round(health.uptime / 60)}m</span></div>
                  <div className="text-xs text-muted-foreground col-span-2 mt-1">Waiting: <span className="text-foreground">{health.checks.queue.waiting}</span> · Active: <span className="text-foreground">{health.checks.queue.active}</span></div>
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                <p className="text-xs text-muted-foreground pt-1">Waiting for API to respond…</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auth + Queue control */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Auth & Queue Control</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {!token ? (
              <>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter any username to get a demo JWT. Required for creating/cancelling jobs and controlling the queue.
                </p>
                <div className="flex gap-2">
                  <input
                    className="flex-1 h-8 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                    placeholder="e.g. testuser"
                    value={tokenInput}
                    onChange={e => setTokenInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGetToken()}
                  />
                  <Button size="sm" onClick={handleGetToken} className="h-8 text-xs shrink-0">
                    Get Token
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-green-600 font-medium">✓ Authenticated — full control enabled</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">Queue</span>
                    <Badge variant={health?.checks.queue.isPaused ? 'secondary' : 'default'} className="text-xs">
                      {health?.checks.queue.isPaused ? 'Paused' : 'Running'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Waiting / Active</span>
                    <span>{health?.checks.queue.waiting ?? '—'} / {health?.checks.queue.active ?? '—'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={health?.checks.queue.isPaused ? 'default' : 'outline'}
                    onClick={handleQueueToggle}
                    disabled={queueLoading || !health}
                    className="flex-1 h-8 text-xs"
                  >
                    {queueLoading ? 'Working…' : health?.checks.queue.isPaused ? '▶ Resume Queue' : '⏸ Pause Queue'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setToken('')} className="h-8 text-xs text-muted-foreground">
                    Sign out
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Jobs tabs */}
      <Tabs defaultValue="jobs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between mb-3">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="jobs" className="flex-1 sm:flex-none">
              Jobs <span className="ml-1.5 text-xs opacity-70">({jobs?.total ?? 0})</span>
            </TabsTrigger>
            <TabsTrigger value="dead-letter" className="flex-1 sm:flex-none">
              Dead Letter <span className="ml-1.5 text-xs opacity-70">({deadLetter?.total ?? 0})</span>
            </TabsTrigger>
          </TabsList>
          {!token && !apiDown && (
            <p className="text-xs text-muted-foreground">Get a token above to create or cancel jobs</p>
          )}
        </div>

        <TabsContent value="jobs" className="space-y-3">
          {/* Status filter — scrollable on mobile */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {STATUS_FILTERS.map(s => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? 'default' : 'outline'}
                onClick={() => setStatusFilter(s)}
                className="h-7 text-xs shrink-0 px-2.5"
              >
                {s}
              </Button>
            ))}
          </div>
          <JobsTable jobs={allJobs} token={token} onCancelled={() => refresh()} />
        </TabsContent>

        <TabsContent value="dead-letter">
          <JobsTable jobs={deadLetter?.data ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value, color, loading }: { label: string; value: number; color: string; loading?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4 sm:pt-6">
        {loading ? (
          <div className="h-8 bg-muted animate-pulse rounded w-12 mb-1" />
        ) : (
          <div className={`text-2xl sm:text-3xl font-bold ${color}`}>{value}</div>
        )}
        <div className="text-xs sm:text-sm text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}

function HealthRow({ label, status, error }: { label: string; status: string; error?: string }) {
  const isHealthy = status === 'healthy';
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm text-muted-foreground">{label}</span>
        <Badge variant={isHealthy ? 'default' : 'destructive'} className="text-xs">
          {status}
        </Badge>
      </div>
      {!isHealthy && error && (
        <p className="text-xs text-red-400 leading-snug pl-1 break-words">
          {error.length > 120 ? error.slice(0, 120) + '…' : error}
        </p>
      )}
    </div>
  );
}
