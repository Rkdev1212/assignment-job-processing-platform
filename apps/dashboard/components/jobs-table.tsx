'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api, type Job } from '@/lib/api';

const STATUS_STYLES: Record<string, string> = {
  QUEUED: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30',
  PROCESSING: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  COMPLETED: 'bg-green-500/15 text-green-600 border-green-500/30',
  FAILED: 'bg-red-500/15 text-red-600 border-red-500/30',
  RETRYING: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  DEAD_LETTER: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
  CANCELLED: 'bg-gray-500/15 text-gray-500 border-gray-500/30',
};

const CANCELLABLE = new Set(['QUEUED', 'RETRYING']);

interface Props {
  jobs: Job[];
  token?: string;
  onCancelled?: () => void;
}

export function JobsTable({ jobs, token, onCancelled }: Props) {
  const [cancelling, setCancelling] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    if (!token) return;
    setCancelling(id);
    try {
      await api.cancelJob(token, id);
      onCancelled?.();
    } catch (e) {
      console.error('Cancel failed', e);
    } finally {
      setCancelling(null);
    }
  };

  if (jobs.length === 0) {
    return <div className="text-center py-12 text-muted-foreground text-sm">No jobs found</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Attempts</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Error</TableHead>
            {token && <TableHead></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map(job => (
            <TableRow key={job.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">{job.id.slice(0, 8)}…</TableCell>
              <TableCell className="font-medium">{job.type}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[job.status] ?? ''}`}>
                  {job.status}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {job.priority >= 8 ? 'HIGH' : job.priority >= 4 ? 'NORMAL' : 'LOW'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{job.attempts}/{job.maxAttempts}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {job.executionTime ? `${job.executionTime}ms` : '—'}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(job.createdAt).toLocaleTimeString()}
              </TableCell>
              <TableCell className="text-xs text-red-400 max-w-[160px] truncate">
                {job.lastError ?? '—'}
              </TableCell>
              {token && (
                <TableCell>
                  {CANCELLABLE.has(job.status) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 h-7 px-2"
                      disabled={cancelling === job.id}
                      onClick={() => handleCancel(job.id)}
                    >
                      {cancelling === job.id ? '…' : 'Cancel'}
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
