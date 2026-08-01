import { api } from '@/lib/api';
import { Dashboard } from '@/components/dashboard';

export const revalidate = 0;

export default async function Home() {
  const [health, jobs, deadLetter] = await Promise.allSettled([
    api.getHealth(),
    api.getJobs(undefined, 1, 20),
    api.getDeadLetterJobs(),
  ]);

  return (
    <Dashboard
      initialHealth={health.status === 'fulfilled' ? health.value : null}
      initialJobs={jobs.status === 'fulfilled' ? jobs.value : null}
      initialDeadLetter={deadLetter.status === 'fulfilled' ? deadLetter.value : null}
    />
  );
}
