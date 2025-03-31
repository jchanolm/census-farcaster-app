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
    CALL db.index.fulltext.queryNodes('text', $query) YIELD node , score 
    ORDER BY score DESC 
    LIMIT 100
    MATCH (user:RealAssNigga:Account)-[r:POSTED]-(node)
    WITH user, sum(score) as totalScore, collect(distinct(node.text)) as castText
    return distinct user.username as username, user.bio as bio, user.fcRewardsEarned as fcRewardsEarned,
    user.fcCredScore as fcCredScore, user.twitter as twitter, user.github as github, user.dune as dune,
    castText, totalScore order by totalScore desc\    `;
    
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
    return NextResponse.json({ error: 'Processing failed', detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}