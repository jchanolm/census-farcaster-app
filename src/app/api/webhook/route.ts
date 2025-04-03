import { NextResponse } from 'next/server';
import { runQuery } from '@/lib/neo4j';

export async function POST(request: Request) {
  try {
    // Get the raw JSON data
    const data = await request.json();
    console.log('Webhook received:', data);
    
    // The event data will be in the JSON directly
    // Handle different event types based on the event field
    if (data.event === 'frame_added') {
      // Store notification details if available
      if (data.notificationDetails) {
        await storeNotificationToken(
          data.fid,
          data.notificationDetails.token,
          data.notificationDetails.url
        );
      }
    } 
    else if (data.event === 'frame_removed') {
      // Remove user's notification tokens
      await removeNotificationTokens(data.fid);
    } 
    else if (data.event === 'notifications_enabled') {
      // Store new notification token
      if (data.notificationDetails) {
        await storeNotificationToken(
          data.fid,
          data.notificationDetails.token,
          data.notificationDetails.url
        );
      }
    } 
    else if (data.event === 'notifications_disabled') {
      // Remove user's notification tokens
      await removeNotificationTokens(data.fid);
    }
    
    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Still return 200 to avoid retry loops
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Helper function to store notification tokens in your Neo4j database
async function storeNotificationToken(fid: number, token: string, url: string) {
  const query = `
    WITH tostring($fid) as strFid
    MERGE (token:NotificationToken {token: $token, url: $url, createdDt: timestamp()})
    WITH token
    MERGE (user:Warpcast:Account {fid:strFid})
    WITH user, token
    MERGE (user)-[r:TOKEN]->(token)
    SET r.timestamp = timestamp()
  `;
  
  await runQuery(query, { fid, token, url });
}

// Helper function to remove notification tokens
async function removeNotificationTokens(fid: number) {
  const query = `
    MATCH (user:FarcasterUser {fid: $fid})-[:HAS_TOKEN]->(token:NotificationToken)
    DETACH DELETE token
  `;
  
  await runQuery(query, { fid });
}