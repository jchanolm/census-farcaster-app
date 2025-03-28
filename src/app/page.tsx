'use client';

import { usePrivy } from '@privy-io/react-auth';
import SearchInterface from '@/components/SearchInterface';

export default function Home() {
  const { login, ready, authenticated } = usePrivy();

  return (
    <main className="min-h-screen bg-black text-white">
      {ready && (
        authenticated ? (
          // Show search interface when authenticated
          <SearchInterface />
        ) : (
          // Show landing page when not authenticated
          <>
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
                
                <button 
                  onClick={login}
                  className="bg-[#0057ff] text-white px-8 py-3 rounded font-medium hover:bg-opacity-90 transition-all"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          </>
        )
      )}
    </main>
  );
}