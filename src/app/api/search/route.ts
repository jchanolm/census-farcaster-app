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
CALL db.index.fulltext.queryNodes('casts', "people building prediction marke tstuff") YIELD node, score
ORDER BY score DESC 
LIMIT 50 
WITH node as cast, score as castScore 
MATCH (cast)-[rel]-(account:Account)
WITH cast, account, castScore, collect(distinct {username: account.username, relationshipToCast: type(rel)}) as linkedAccounts
WITH account, collect({
  text: cast.text, 
  interactionsCount: cast.recastCount + cast.likeCount, 
  mentionedChannels: cast.mentionedChannelNames, 
  mentionedFids: cast.mentionedFids,  
  timestamp: cast.timestamp, 
  linkedAccounts: linkedAccounts,
  score: castScore
}) as userCasts, sum(castScore) as sumScore, max(castScore) as maxCastScore, avg(castScore) as avgCastScore
// Collect all users with their scores
WITH collect({
  username: account.username, 
  bio: account.bio, 
  fcCredScore: account.fcCredScore, 
  rewards: account.rewards, 
  twitter: account.twitter, 
  github: account.github,  
  pfpUrl: account.pfpUrl,
  relevanceScore: sumScore + avgCastScore
}) as results,
     collect(userCasts) as allCastCollections
// Flatten all cast collections into a single list of casts
UNWIND allCastCollections as castCollection
UNWIND castCollection as singleCast
WITH results, collect(DISTINCT singleCast) as allCasts
// Return the structured response
CALL db.index.fulltext.queryNodes('wcAccounts', "people building prediction marke tstuff") YIELD node, score
order by score desc limit 20 
with results, allCasts, collect({username: node.username, bio: node.bio, score: score}) as bioSearch

RETURN {
  results: results, 
  casts: allCasts,
  matchingBios: bioSearch
} as castResultSearch    
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