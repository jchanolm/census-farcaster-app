'use client';

import { useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';

export default function AddFrameButton() {
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddFrame = async () => {
    try {
      setIsAdding(true);
      setError(null);
      
      // Call the addFrame method
      await sdk.actions.addFrame();
      
      // If we get here, the frame was added successfully
      setAdded(true);
      console.log('Frame added successfully');
      
    } catch (err) {
      // Handle any errors
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Error adding frame:', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div>
      {!added ? (
        <button
          onClick={handleAddFrame}
          disabled={isAdding}
          className={`bg-[#0057ff] text-white px-4 py-2 rounded text-xs uppercase tracking-wider font-mono hover:bg-[#0046cc] transition-colors ${
            isAdding ? 'opacity-50' : ''
          }`}
        >
          {isAdding ? 'Adding...' : 'Add to Farcaster'}
        </button>
      ) : (
        <div className="flex items-center text-green-500 text-sm font-mono">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
          </svg>
          Added Successfully
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-red-500 text-xs">{error}</div>
      )}
    </div>
  );
}