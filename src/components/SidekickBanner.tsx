// components/SidequestBanner.tsx
'use client';

import React from 'react';

interface SidequestBannerProps {
  darkMode?: boolean;
}

export default function SidequestBanner({ darkMode = true }: SidequestBannerProps) {
  return (
    <a
      href="https://www.sidequest.build/quotient"
      target="_blank"
      rel="noopener noreferrer"
      className={`w-full max-w-md mx-auto flex items-center justify-center py-2 px-3 
                ${darkMode ? 'bg-[#121620] text-white' : 'bg-[#f2f2f5] text-[#333]'} 
                border ${darkMode ? 'border-gray-800' : 'border-gray-300'} 
                rounded-md transition-all hover:border-blue-500 block`}
    >
      <div className="flex items-center">
        <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm mr-2"></div>
        <span className="text-xs uppercase tracking-wider font-mono">
          Support us on Sidequest
        </span>
      </div>
    </a>
  );
}