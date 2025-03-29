'use client';

import { useSearchParams } from 'next/navigation';
import Head from 'next/head';

export default function SharePage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || 'builders';
  
  return (
    <>
      <Head>
        {/* Regular Open Graph tags */}
        <title>Quotient - Builder Intelligence</title>
        <meta name="description" content={`Search results for ${query} on Quotient`} />
        <meta property="og:title" content="Quotient - Builder Intelligence" />
        <meta property="og:description" content={`Search results for ${query} on Quotient`} />
        <meta property="og:image" content={`https://your-domain.com/api/og?query=${encodeURIComponent(query)}`} />
      </Head>

      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Quotient Builder Search</h1>
        <p className="text-lg mb-8">Discover on-chain builders matching: <strong>{query}</strong></p>
        <p>This page is optimized for sharing.</p>
      </div>
    </>
  );
}