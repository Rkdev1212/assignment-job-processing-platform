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
      setForm(f => ({ ...f, delay: '', runAt: '' }));
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-ring";

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)} className="h-8 text-xs">
        + Create Job
      </Button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)} />

      {/* Modal — full screen on mobile, centered card on desktop */}
      <div className="fixed inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:w-full sm:max-w-md bg-background sm:border sm:rounded-xl shadow-xl flex flex-col overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b sticky top-0 bg-background z-10">
          <h2 className="font-semibold text-base sm:text-lg">Create Job</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground text-2xl leading-none w-8 h-8 flex items-center justify-center rounded hover:bg-muted"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 px-4 sm:px-6 py-4 space-y-4">
          <Field label="Job Type">
            <input
              className={inputCls}
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              placeholder="email, sms, report…"
              required
            />
          </Field>

          <Field label="Payload (JSON)">
            <textarea
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring font-mono min-h-[80px] resize-y"
              value={form.payload}
              onChange={e => setForm(f => ({ ...f, payload: e.target.value }))}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <select
                className={inputCls}
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Max Attempts">
              <input
                className={inputCls}
                type="number"
                min={1}
                max={10}
                value={form.maxAttempts}
                onChange={e => setForm(f => ({ ...f, maxAttempts: e.target.value }))}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Delay (ms)">
              <input
                className={inputCls}
                type="number"
                min={0}
                value={form.delay}
                onChange={e => setForm(f => ({ ...f, delay: e.target.value }))}
                placeholder="0 = immediate"
              />
            </Field>
            <Field label="Run At (scheduled)">
              <input
                className={inputCls}
                type="datetime-local"
                value={form.runAt}
                onChange={e => setForm(f => ({ ...f, runAt: e.target.value }))}
              />
            </Field>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-500/10 rounded px-3 py-2">{error}</p>}

          <div className="flex gap-2 pb-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Creating…' : 'Create Job'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
