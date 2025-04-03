'use client';

import React from 'react';
import { sdk } from '@farcaster/frame-sdk';

export default function AddMiniAppButton() {
  const handleAddFrame = async () => {
    try {
      await sdk.actions.addFrame();
      console.log('App was added successfully');
    } catch (error) {
      console.error('Failed to add frame:', error);
      // Fallback to opening the profile if the addFrame action fails
      window.open('https://warpcast.com/quotient', '_blank');
    }
  };

  return (
    <button
      onClick={handleAddFrame}
      className="flex items-center bg-[#0057ff] text-white px-4 py-2 rounded-md text-sm uppercase tracking-wider font-mono hover:bg-[#0066ff] transition-colors border border-[#0057ff] shadow-md font-semibold"
    >
      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"></path>
      </svg>
      ADD APP
    </button>
  );
}