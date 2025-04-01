import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Quotient',
  description: '/',
  other: {
    'fc:frame': '{"version":"next","imageUrl":"https://frame.usequotient.xyz/opengraph-image.png","aspectRatio":"3:2","button":{"title":"Explore","action":{"type":"launch_frame","name":"Quotient","url":"https://frame.usequotient.xyz","splashImageUrl":"https://frame.usequotient.xyz/splash.png","splashBackgroundColor":"#000000"}}}'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="fc:frame" content='{"version":"next","imageUrl":"https://frame.usequotient.xyz/opengraph-image.png","aspectRatio":"3:2","button":{"title":"Explore","action":{"type":"launch_frame","name":"Quotient","url":"https://frame.usequotient.xyz","splashImageUrl":"https://frame.usequotient.xyz/splash.png","splashBackgroundColor":"#000000"}}}' />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}