'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface Props {
  token: string;
  onCreated: () => void;
}

const PRIORITIES = ['high', 'normal', 'low'];

export function CreateJobModal({ token, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    type: 'email',
    payload: '{"to":"user@example.com","subject":"Hello"}',
    priority: 'normal',
    delay: '',
    maxAttempts: '3',
    runAt: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(form.payload);
    } catch {
      setError('Payload must be valid JSON');
      return;
    }

    setLoading(true);
    try {
      await api.createJob(token, {
        type: form.type,
        payload,
        priority: form.priority,
        ...(form.delay ? { delay: Number(form.delay) } : {}),
        maxAttempts: Number(form.maxAttempts),
        ...(form.runAt ? { runAt: new Date(form.runAt).toISOString() } : {}),
      });
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, node: React.ReactNode) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      {node}
    </div>
  );

  const inputCls = "w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-ring";

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        + Create Job
      </Button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)} />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-background border rounded-xl shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Create Job</h2>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {field('Job Type', (
            <input className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="email, sms, report…" required />
          ))}

          {field('Payload (JSON)', (
            <textarea
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring font-mono min-h-[80px] resize-y"
              value={form.payload}
              onChange={e => setForm(f => ({ ...f, payload: e.target.value }))}
              required
            />
          ))}

          <div className="grid grid-cols-2 gap-3">
            {field('Priority', (
              <select className={inputCls} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            ))}

            {field('Max Attempts', (
              <input className={inputCls} type="number" min={1} max={10} value={form.maxAttempts} onChange={e => setForm(f => ({ ...f, maxAttempts: e.target.value }))} />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('Delay (ms)', (
              <input className={inputCls} type="number" min={0} value={form.delay} onChange={e => setForm(f => ({ ...f, delay: e.target.value }))} placeholder="0" />
            ))}

            {field('Run At (optional)', (
              <input className={inputCls} type="datetime-local" value={form.runAt} onChange={e => setForm(f => ({ ...f, runAt: e.target.value }))} />
            ))}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Creating…' : 'Create Job'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </div>
    </>
  );
}
