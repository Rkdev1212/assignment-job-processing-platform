const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://assignment-job-processing-platform.onrender.com/api/v1';

export interface Job {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: 'QUEUED' | 'PROCESSING' | 'RETRYING' | 'COMPLETED' | 'FAILED' | 'DEAD_LETTER' | 'CANCELLED';
  priority: number;
  attempts: number;
  maxAttempts: number;
  delay: number;
  runAt: string | null;
  workerId: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  executionTime: number | null;
  lastError: string | null;
  correlationId: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueueStatus {
  isPaused: boolean;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface HealthCheck {
  status: string;
  timestamp: string;
  responseTime: string;
  uptime: number;
  checks: {
    database: { status: string };
    redis: { status: string };
    queue: { status: string; isPaused: boolean; waiting: number; active: number };
  };
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const api = {
  getJobs: (status?: string, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sortBy: 'createdAt', order: 'desc' });
    if (status) params.set('status', status);
    return fetchApi<PaginatedResponse<Job>>(`/jobs?${params}`);
  },
  getHealth: () => fetchApi<HealthCheck>('/health'),
  getQueueStatus: (token: string) =>
    fetchApi<QueueStatus>('/queue/status', { headers: { Authorization: `Bearer ${token}` } }),
  getDeadLetterJobs: (page = 1) =>
    fetchApi<PaginatedResponse<Job>>(`/jobs/dead-letter?page=${page}&limit=20`),
  generateToken: (username: string) =>
    fetchApi<{ token: string }>('/auth/token', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),
  pauseQueue: (token: string) =>
    fetchApi('/queue/pause', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }),
  resumeQueue: (token: string) =>
    fetchApi('/queue/resume', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }),
};
