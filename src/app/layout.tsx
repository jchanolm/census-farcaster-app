import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

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
        <meta name="fc:frame" content='{"version":"next","imageUrl":"https://frame.usequotient.xyz/opengraph-image.png","aspectRatio":"3:2","button":{"title":"Explore","action":{"type":"launch_frame","name":"Explore","url":"https://frame.usequotient.xyz","splashImageUrl":"https://frame.usequotient.xyz/splash.png","splashBackgroundColor":"#000"}}}' />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}