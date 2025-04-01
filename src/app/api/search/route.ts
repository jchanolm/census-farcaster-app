import { NextResponse } from 'next/server';
import { runQuery } from '@/lib/neo4j';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    }

    console.log(`Processing query: ${query}`);
    
    // Basic query that just returns nodes that match the query
    const basicQuery = `
      // Match from fulltext index
    CALL db.index.fulltext.queryNodes('casts', $query) YIELD node , score 
    MATCH (node)
    ORDER BY score DESC 
    LIMIT 300
    MATCH (user:RealAssNigga:Account)-[r:POSTED]-(node)
    WITH user, avg(score) as avgMentionQuality, sum(score) as totalMentions, collect(distinct(node.text) + " | " + node.hash) as castText
    return distinct user.username as username, user.bio as bio, user.pfpUrl as pfpUrl, avgMentionQuality, totalMentions
    order by avgMentionQuality desc\    `;
    
    const records = await runQuery(basicQuery, { query: query });
    
    console.log(`Query returned ${records.length} records`);
    
    // Convert Neo4j records to plain objects that can be serialized
    const results = records.map(record => {
      // Convert the Neo4j Record to a plain object with all properties
      const plainObj = {};
      record.keys.forEach(key => {
        plainObj[key] = record.get(key);
      });
      return plainObj;
    });
  
    return NextResponse.json({ 
      query, 
      results
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Processing failed', detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}