import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Quotient',
  description: '/',
  other: {
    'fc:frame': '{"version":"next","imageUrl":"https://fc-search.usequotient.xyz/icon.png","aspectRatio":"3:2","button":{"title":"Explore","action":{"type":"launch_frame","name":"Explore","url":"https://fc-search.usequotient.xyz","splashImageUrl":"https://fc-search.usequotient.xyz/icon.png","splashBackgroundColor":"#000"}}}'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="fixed top-4 left-6 z-10">
          <img src="/icon.png" alt="Quotient Icon" className="h-8 w-auto" />
        </div>
        {children}
      </body>
    </html>
  );
}