'use client';

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import SearchInterface from '@/components/SearchInterface';

export default function Home() {
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    // Set up a flag to prevent multiple initializations
    let mounted = true;

    // Wait for the DOM to be fully rendered
    const timer = setTimeout(async () => {
      if (mounted) {
        try {
          // Now call ready() when UI is ready
          await sdk.actions.ready();
          console.log('Farcaster SDK initialized');
          setSdkReady(true);
        } catch (error) {
          console.error('Failed to initialize Farcaster SDK:', error);
        }
      }
    }, 100); // Small delay to ensure UI is ready

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div>
      {sdkReady ? (
        <SearchInterface />
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="mb-4 text-lg font-medium">Loading Quotient</div>
            {/* Spinner */}
            <div className="flex justify-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0057ff] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                  Loading...
                </span>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-500">Please wait while we initialize the app</div>
          </div>
        </div>
      )}
    </div>
  );
}