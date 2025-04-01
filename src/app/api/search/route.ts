import { NextResponse } from 'next/server';
import { runQuery } from '@/lib/neo4j';

// Enable dynamic rendering for this route
export const dynamic = 'force-dynamic';

function sanitizeQuery(query: string): { 
  originalQuery: string; 
  cleanQuery: string; 
} {
  // Handle null or undefined input
  if (!query || typeof query !== 'string') {
    return { 
      originalQuery: '', 
      cleanQuery: '' 
    };
  }

  // Remove special characters that can break Lucene parsing
  const sanitized = query
  .replace(/[\/\*\+\-\&\|\!\(\)\{\}\[\]\^"~\?:\\/]/g, ' ') // Remove special characters
  .replace(/\s+/g, ' ') // Collapse multiple spaces
  .replace(/\bbuild\w*\b/gi, '') // Remove 'build' and words starting with 'build'
  .replace(/\bfarcaster\b/gi, '') // Remove 'farcaster'
  .replace(/\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by)\b/gi, '') // Remove common stop words
  .trim(); // Trim leading/trailing whitespace
  // Limit query length to prevent excessive processing
  return { 
    originalQuery: query, 
    cleanQuery: sanitized
  };
}

/**
 * Handles the search query for Farcaster network builders
 * @param request - The incoming HTTP request
 * @returns JSON response with search results or error
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const { query } = await request.json();
    
    // Validate query input
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ 
        error: 'Invalid query', 
        details: 'Query must be a non-empty string' 
      }, { status: 400 });
    }

    // Sanitize the query
    const { cleanQuery } = sanitizeQuery(query);
    console.log(`Processing sanitized query: ${cleanQuery}`);
    
    // Neo4j fulltext search query for casts
    const castsSearchQuery = `
    CALL db.index.fulltext.queryNodes('casts', $cleanQuery) YIELD node, score 
    WHERE score > 3
    MATCH (node)
    ORDER BY score DESC 
    LIMIT 200
    MATCH (user:Account:RealAssNigga)-[r:POSTED]->(node)
    WITH user, 
         avg(score) as avgMentionQuality, 
         collect(distinct(node.text) + " |hash: " + node.hash + "|channels" + node.mentionedChannels) as castText
    RETURN DISTINCT 
      user.username as username, 
      user.bio as bio, 
      user.pfpUrl as pfpUrl, 
      avgMentionQuality, 
      castText,
      'cast_match' as matchType
    ORDER BY avgMentionQuality DESC
    `;
    
    // Neo4j fulltext search query for wcAccounts
    const accountsSearchQuery = `
    CALL db.index.fulltext.queryNodes('wcAccounts', $cleanQuery) YIELD node, score
    WHERE score > 5
    ORDER BY score DESC 
    LIMIT 5
    RETURN 
      node.username as username,
      node.bio as bio,
      node.pfpUrl as pfpUrl,
      score as avgMentionQuality,
      [] as castText,
      'account_match' as matchType
    `;
    
    // Execute the queries
    console.log('Running casts query...');
    const castsRecords = await runQuery(castsSearchQuery, { cleanQuery });
    console.log(`Casts query returned ${castsRecords.length} records`);
    
    console.log('Running accounts query...');
    const accountsRecords = await runQuery(accountsSearchQuery, { cleanQuery });
    console.log(`Accounts query returned ${accountsRecords.length} records`);
    
    // Process all records - putting account matches first
    const allRecords = [...accountsRecords, ...castsRecords];
    
    // Convert Neo4j records to plain objects
    const results = allRecords.map(record => {
      const plainObj: Record<string, any> = {};
      
      // Fix for the Symbol issue - convert record keys to strings
      const keys = record.keys.map(key => String(key));
      
      // Now use the string keys
      keys.forEach(key => {
        plainObj[key] = record.get(key);
      });
      
      // For cast_match records, calculate totalScore
      if (plainObj.matchType === 'cast_match') {
        // Calculate a total score for sorting/ranking
        plainObj.totalScore = plainObj.avgMentionQuality * 10; // Weight factor
      } else {
        // For account_match, use avgMentionQuality as totalScore
        plainObj.totalScore = plainObj.avgMentionQuality * 15; // Higher weight for direct matches
      }
      
      return plainObj;
    });
    
    // Sort by totalScore
    results.sort((a, b) => b.totalScore - a.totalScore);
  
    // Return results
    return NextResponse.json({ 
      originalQuery: query,  // Add this line
      query: cleanQuery, 
      results,
      totalResults: results.length,
      castMatches: castsRecords.length,
      accountMatches: accountsRecords.length
        });
    
  } catch (error) {
    // Comprehensive error logging and handling
    console.error('Search Query Error:', error);
    
    // Determine error response based on error type
    const errorResponse = {
      error: 'Search processing failed',
      details: error instanceof Error ? error.message : String(error)
    };

    // Return appropriate error status
    return NextResponse.json(errorResponse, { 
      status: error instanceof Error && 'status' in error ? (error as any).status : 500 
    });
  }
}