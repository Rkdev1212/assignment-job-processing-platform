import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AsyncFlow Dashboard',
  description: 'Job Processing Platform Monitor',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.className} bg-background text-foreground min-h-screen`}>
        <header className="border-b px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 bg-background/95 backdrop-blur">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs sm:text-sm">AF</div>
            <span className="font-semibold text-base sm:text-lg truncate">AsyncFlow</span>
            <span className="text-muted-foreground text-xs sm:text-sm hidden sm:block">Job Processing Dashboard</span>
          </div>
          <a
            href="https://assignment-job-processing-platform.onrender.com/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2"
          >
            API Docs →
          </a>
        </header>
        <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl">{children}</main>
      </body>
    </html>
  );
}
