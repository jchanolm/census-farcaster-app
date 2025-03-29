/* eslint-disable */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  const handleConnect = () => {
    router.push('/search');
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="fixed top-0 left-0 right-0 flex justify-between items-center px-6 md:px-14 py-5 z-50 bg-gradient-to-b from-black/90 to-transparent">
        <div className="text-xl font-bold tracking-wider">QUOTIENT</div>
      </header>
      
      <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
        <div className="max-w-[90%] md:max-w-[650px] z-10 px-4">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
            Understand Onchain
            <span className="text-[#0057ff]"> Builders</span>
          </h1>
          
          <p className="text-lg text-[#aaa] mb-8">
            Use our advanced search interface to find and connect with on-chain builders.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              className="bg-[#0057ff] text-white px-8 py-3 rounded font-medium hover:bg-opacity-90 transition-all"
            >
              Enter
            </button>
            
            <button 
              onClick={handleConnect}
              className="border border-[#0057ff] text-[#0057ff] px-8 py-3 rounded font-medium hover:bg-[#0057ff] hover:text-white transition-all flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M16 12H8" />
                <path d="M12 8l-4 4 4 4" />
              </svg>
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}