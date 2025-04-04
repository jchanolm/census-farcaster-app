// components/FollowButton.tsx
'use client';

import React from 'react';

interface FollowButtonProps {
  url?: string;
  text?: string;
}

export default function FollowButton({ 
  url = "https://warpcast.com/quotient", 
  text = "FOLLOW QUOTIENT" 
}: FollowButtonProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold tracking-wide hover:bg-blue-700 transition-colors shadow-sm"
    >
      <svg 
        className="w-4 h-4 mr-2" 
        fill="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 19H5C3.9 19 3 18.1 3 17V7C3 5.9 3.9 5 5 5H21C22.1 5 23 5.9 23 7V11M15 19V13H17L21 9V19H15Z" />
      </svg>
      {text}
    </a>
  );
}