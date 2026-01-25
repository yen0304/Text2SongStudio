import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBar } from '@/components/layout/StatusBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Text2Song Studio',
  description: 'Human-in-the-loop text-to-music generation platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
            <StatusBar />
          </div>
        </div>
      </body>
    </html>
  );
}
