'use client';

import React from 'react';

export default function AddFrameButton() {
  return (
    <a
      href="https://warpcast.com/quotient"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center text-[#0057ff] px-3 py-1.5 rounded text-xs uppercase tracking-wider font-mono hover:bg-[#0057ff] hover:bg-opacity-10 transition-colors border border-[#0057ff] border-opacity-50"
    >
      <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path>
      </svg>
      FOLLOW QUOTIENT
    </a>
  );
}
