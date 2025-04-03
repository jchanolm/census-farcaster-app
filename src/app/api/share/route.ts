import { NextResponse } from 'next/server';
import { runQuery } from '@/lib/neo4j';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { query, results, agentReport } = await request.json();
    
    if (!query || !agentReport) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }
    
    // Generate a simple unique ID (8 characters)
    const shareId = crypto.randomBytes(4).toString('hex');
    
    // Store in Neo4j database
    const storeQuery = `
      CREATE (s:SharedSearch {
        id: $shareId,
        query: $query,
        timestamp: datetime(),
        results: $results,
        agentReport: $agentReport
      })
      RETURN s.id as id
    `;
    
    await runQuery(storeQuery, {
      shareId,
      query,
      results: JSON.stringify(results),
      agentReport
    });
    
    // Return the share ID
    return NextResponse.json({ 
      id: shareId
    });
    
  } catch (error) {
    console.error('Share error:', error);
    return NextResponse.json({ 
      error: 'Failed to create share link',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}