'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobsTable } from '@/components/jobs-table';
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

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [h, j, dl] = await Promise.allSettled([
        api.getHealth(),
        api.getJobs(statusFilter === 'ALL' ? undefined : statusFilter),
        api.getDeadLetterJobs(),
      ]);
      if (h.status === 'fulfilled') setHealth(h.value);
      if (j.status === 'fulfilled') setJobs(j.value);
      if (dl.status === 'fulfilled') setDeadLetter(dl.value);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    refresh();
  }, [statusFilter, refresh]);

  // Auto-refresh every 10s
  useEffect(() => {
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

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
    const res = await api.generateToken(tokenInput.trim());
    setToken(res.token);
  };

  const counts = {
    queued: jobs?.data.filter(j => j.status === 'QUEUED').length ?? 0,
    processing: jobs?.data.filter(j => j.status === 'PROCESSING').length ?? 0,
    completed: jobs?.data.filter(j => j.status === 'COMPLETED').length ?? 0,
    failed: jobs?.data.filter(j => j.status === 'FAILED').length ?? 0,
  };

  const isHealthy = health?.status === 'healthy';

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job Monitor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()} · Auto-refreshes every 10s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isHealthy ? 'default' : 'destructive'} className="text-sm px-3 py-1">
            {isHealthy ? '● Healthy' : '● Unhealthy'}
          </Badge>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Queued" value={counts.queued} color="text-yellow-500" />
        <StatCard label="Processing" value={counts.processing} color="text-blue-500" />
        <StatCard label="Completed" value={counts.completed} color="text-green-500" />
        <StatCard label="Failed" value={counts.failed} color="text-red-500" />
      </div>

      {/* Health + Queue controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">System Health</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {health ? (
              <>
                <HealthRow label="Database" status={health.checks.database.status} />
                <HealthRow label="Redis" status={health.checks.redis.status} />
                <HealthRow label="Queue" status={health.checks.queue.status} />
                <div className="text-xs text-muted-foreground pt-2">
                  Response time: {health.responseTime} · Uptime: {Math.round(health.uptime / 60)}m
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Unable to reach API (cold start?)</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Queue Control</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={health?.checks.queue.isPaused ? 'secondary' : 'default'}>{health?.checks.queue.isPaused ? 'Paused' : 'Running'}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Waiting</span><span>{health?.checks.queue.waiting ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Active</span><span>{health?.checks.queue.active ?? '—'}</span></div>
            </div>
            {token ? (
              <Button size="sm" variant={health?.checks.queue.isPaused ? 'default' : 'outline'} onClick={handleQueueToggle} disabled={queueLoading} className="w-full">
                {queueLoading ? 'Working…' : health?.checks.queue.isPaused ? 'Resume Queue' : 'Pause Queue'}
              </Button>
            ) : (
              <div className="flex gap-2">
                <input
                  className="flex-1 h-8 rounded-md border bg-transparent px-3 text-sm outline-none"
                  placeholder="Username for token"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGetToken()}
                />
                <Button size="sm" onClick={handleGetToken}>Get Token</Button>
              </div>
            )}
            {token && <p className="text-xs text-green-600">✓ Token set — queue control enabled</p>}
          </CardContent>
        </Card>
      </div>

      {/* Jobs tabs */}
      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs">Jobs ({jobs?.total ?? 0})</TabsTrigger>
          <TabsTrigger value="dead-letter">Dead Letter ({deadLetter?.total ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map(s => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? 'default' : 'outline'}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </Button>
            ))}
          </div>
          <JobsTable jobs={jobs?.data ?? []} />
        </TabsContent>

        <TabsContent value="dead-letter">
          <JobsTable jobs={deadLetter?.data ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        <div className="text-sm text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}

function HealthRow({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant={status === 'healthy' ? 'default' : 'destructive'} className="text-xs">
        {status}
      </Badge>
    </div>
  );
}
