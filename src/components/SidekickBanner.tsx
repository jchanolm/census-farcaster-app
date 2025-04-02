// src/components/SidekickBanner.tsx
'use client';

import React from 'react';

export default function SidekickBanner({ darkMode = true }) {
  return (
    <a
      href="https://www.sidequest.build/quotient"
      target="_blank"
      rel="noopener noreferrer"
      className={`w-full max-w-lg mx-auto flex items-center justify-center py-2 px-4 
                  ${darkMode ? 'bg-black bg-opacity-80 text-white' : 'bg-[#f2f2f5] bg-opacity-90 text-[#333]'} 
                  border ${darkMode ? 'border-gray-700' : 'border-gray-300'} 
                  rounded-md mb-6 transition-all hover:border-[#0057ff]`}
    >
      <div className="flex items-center">
        <div className="w-3 h-3 bg-[#0057ff] rounded-sm mr-2"></div>
        <span className="text-xs uppercase tracking-wider font-mono">
          Support us on Sidekick
        </span>
      </div>
    </a>
  );
}