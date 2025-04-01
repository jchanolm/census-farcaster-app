import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Image from 'next/image';

const inter = Inter({ subsets: ['latin'] });

// Remove the fc:frame from metadata since we're adding it directly in the head
export const metadata: Metadata = {
  title: 'Quotient',
  description: '/',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Make sure this is a complete meta tag with proper JSON format */}
        <meta name='fc:frame' content='{"version":"next","imageUrl":"https://farcaster.usequotient.xyz/opengraph-image.png","aspectRatio":"3:2","button":{"title":"Explore","action":{"type":"launch_frame","name":"Explore","url":"https://farcaster.usequotient.xyz","splashImageUrl":"https://farcaster.usequotient.xyz/splash.png","splashBackgroundColor":"#000"}}}' />
      </head>
      <body className={inter.className}>
        <div className="fixed top-4 left-6 z-10">
          <img src="/icon.png" alt="Quotient Icon" className="h-8 w-auto" />
        </div>
        {children}
      </body>
    </html>
  );
}