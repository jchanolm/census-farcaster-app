import { sdk } from '@farcaster/frame-sdk';

// Export the SDK for use throughout the application
export default sdk;

// Initialize function to be called when your app loads
export function initializeFrameSDK() {
  // You'll call sdk.actions.ready() when your app is ready to be displayed
  // We'll implement this in the main component after UI loads
  
  // Set up event listeners for frame events
  sdk.on('frameAdded', ({ notificationDetails }) => {
    console.log('App was added to Farcaster client');
    // You can store notification details if needed
  });
  
  sdk.on('frameRemoved', () => {
    console.log('App was removed from Farcaster client');
  });
  
  return sdk;
}