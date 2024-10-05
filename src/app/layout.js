import { Inter } from 'next/font/google';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import "./globals.css";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Your App Name',
  description: 'Your app description',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex-shrink-0">
                  <Link href="/" className="text-xl font-bold text-gray-800">
                    Your App Name
                  </Link>
                </div>
                <Navigation />
              </div>
            </div>
          </header>
          <main className="flex-grow">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
