'use client';

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import SearchInterface from '@/components/SearchInterface';

export default function Home() {
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize the SDK at the app level
        await sdk.actions.ready();
        console.log('Farcaster SDK initialized');
        setSdkReady(true);
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
      }
    };

    initApp();
  }, []);

  // You could show a loading state while SDK initializes
  if (!sdkReady) {
    return <div>Loading application...</div>;
  }

  return <SearchInterface />;
}