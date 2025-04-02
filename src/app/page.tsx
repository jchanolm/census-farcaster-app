'use client';

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import SearchInterface from '@/components/SearchInterface';

export default function Home() {
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Initialize the app immediately
    const initializeApp = async () => {
      if (mounted) {
        try {
          // Log the SDK context for debugging
          console.log('SDK Context:', sdk.context);
          
          // Call ready to dismiss the splash screen when the app is ready to be displayed
          // This should be called as soon as possible while avoiding content reflows
          await sdk.actions.ready();
          console.log('Farcaster SDK initialized');
        } catch (error) {
          console.error('Failed to initialize Farcaster SDK:', error);
        } finally {
          // Set ready state regardless of success or failure
          setSdkReady(true);
        }
      }
    };

    // Start initialization immediately
    initializeApp();
    
    return () => {
      mounted = false;
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
            <div className="mt-3 text-sm text-gray-500">Frame initializing.</div>
          </div>
        </div>
      )}
    </div>
  );
}