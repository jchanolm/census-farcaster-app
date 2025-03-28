import { getFrameFlattened } from 'frames.js';
import type { Frame } from 'frames.js';

interface FrameMetadataParams {
  title: string;
  description: string;
  image: {
    url: string;
    width: number;
    height: number;
  };
  buttons: Array<{ label: string }>;
  postUrl: string;
}

export function getFrameMetadata(params: FrameMetadataParams) {
  const frame: Frame = {
    version: 'vNext',
    image: params.image.url,
    buttons: params.buttons,
    postUrl: params.postUrl,
  };

  return getFrameFlattened(frame);
}

// Function to generate placeholder ETH addresses
export function generateHexAddress() {
  const chars = '0123456789abcdef';
  let hex = '0x';
  const length = 40; // Standard ETH address length
  
  for (let i = 0; i < length; i++) {
    hex += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return hex;
}

// Function to truncate an address
export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}