import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AsyncFlow Dashboard',
  description: 'Job Processing Platform Monitor',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.className} bg-background text-foreground min-h-screen`}>
        <header className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">AF</div>
            <span className="font-semibold text-lg">AsyncFlow</span>
            <span className="text-muted-foreground text-sm">Job Processing Dashboard</span>
          </div>
          <a
            href="https://assignment-job-processing-platform.onrender.com/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Swagger API →
          </a>
        </header>
        <main className="container mx-auto px-6 py-8 max-w-7xl">{children}</main>
      </body>
    </html>
  );
}
