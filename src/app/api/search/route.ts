import { NextResponse } from 'next/server';
import { runQuery } from '@/lib/neo4j';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    }

    console.log(`Processing query: ${query}`);
    
    // Basic query that just returns nodes that match the query
    const basicQuery = `
      // Match from fulltext index
      CALL db.index.fulltext.queryNodes('text', $query) YIELD node, score
      WHERE (node:Account:Warpcast OR node:Cast) AND score > 0.7
      
      // Return basic node info
      RETURN 
        CASE WHEN node:Account THEN "account" ELSE "cast" END as nodeType,
        CASE WHEN node:Account THEN node.username ELSE null END as username,
        CASE WHEN node:Cast THEN node.text ELSE null END as text,
        CASE WHEN node:Account THEN node.bio ELSE null END as bio,
        score
      ORDER BY score DESC
      LIMIT 200
    `;
    
    const records = await runQuery(basicQuery, { query: query });
    
    console.log(`Query returned ${records.length} records`);
    
    // Just pass the raw data
    const results = records.map(record => ({
      nodeType: record.get('nodeType'),
      username: record.get('username'),
      text: record.get('text'),
      bio: record.get('bio'),
      score: record.get('score')
    }));
    
    // Count accounts and casts
    const accounts = results.filter(r => r.nodeType === "account").length;
    const casts = results.filter(r => r.nodeType === "cast").length;
    
    console.log(`Found ${accounts} accounts and ${casts} casts`);
    
    return NextResponse.json({ 
      query, 
      results,
      accounts,
      casts
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Processing failed', detail: error.toString() }, { status: 500 });
  }
}