import { NextResponse } from 'next/server';
import { runQuery } from '@/lib/neo4j';

// Enable dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * Sanitizes the input query to prevent Lucene parsing errors
 * @param query - The raw input query
 * @returns A cleaned and safe query string
 */
function sanitizeQuery(query: string): string {
  // Remove special characters that can break Lucene parsing
  const sanitized = query
    .replace(/[\/\*\+\-\&\|\!\(\)\{\}\[\]\^"~\?:\\/]/g, ' ') // Remove special characters
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim(); // Trim leading/trailing whitespace

  // Limit query length to prevent excessive processing
  return sanitized.slice(0, 100);
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
    const cleanQuery = sanitizeQuery(query);
    console.log(`Processing sanitized query: ${cleanQuery}`);
    
    // Neo4j fulltext search query for casts
    const castsSearchQuery = `
    CALL db.index.fulltext.queryNodes('casts', $query) YIELD node, score 
    WHERE score > .8
    MATCH (node)
    ORDER BY score DESC 
    LIMIT 150
    MATCH (user:Account)-[r:POSTED]-(node)
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
    CALL db.index.fulltext.queryNodes('wcAccounts', $query) YIELD node, score
    WHERE score > 0.8
    ORDER BY score DESC 
    LIMIT 10
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
    const castsRecords = await runQuery(castsSearchQuery, { query: cleanQuery });
    console.log(`Casts query returned ${castsRecords.length} records`);
    
    console.log('Running accounts query...');
    const accountsRecords = await runQuery(accountsSearchQuery, { query: cleanQuery });
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