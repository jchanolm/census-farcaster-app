'use client';

import React from 'react';

export default function AddFrameButton() {
  return (
    <a
      href="https://warpcast.com/quotient"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center bg-[#0057ff] text-white px-4 py-2 rounded-md text-sm uppercase tracking-wider font-mono hover:bg-[#0066ff] transition-colors border border-[#0057ff] shadow-md font-semibold"
    >
      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path>
      </svg>
      FOLLOW QUOTIENT
    </a>
  );
}
