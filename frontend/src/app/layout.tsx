import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Healthcare AI - Personalized Recommendations',
  description: 'AI-Powered Personalized Healthcare Recommendation System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl tracking-tight">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                HealthAI
              </div>
              <nav className="flex gap-4">
                <a href="/login" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Sign In</a>
                <a href="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow">Get Started</a>
              </nav>
            </div>
          </header>
          <main className="flex-grow flex flex-col">
            {children}
          </main>
          <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
            <p>© {new Date().getFullYear()} Healthcare AI. All rights reserved.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
