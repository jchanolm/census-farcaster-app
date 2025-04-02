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
    const { cleanQuery, originalQuery } = sanitizeQuery(query);
    console.log(`Processing sanitized query: ${cleanQuery}`);
    
    // Combined query using UNION to merge accounts and casts results
    const combinedSearchQuery = `
    // Account search query
    CALL db.index.fulltext.queryNodes('wcAccounts', $cleanQuery) YIELD node as accountNode, score as accountScore
    WHERE accountScore > 4
    WITH 
      accountNode.username as username,
      accountNode.bio as bio,
      accountNode.followerCount as followerCount,
      accountNode.ogInteractionsCount as fcCred,
      accountNode.state as state,
      accountNode.city as city,
      accountNode.country as country,
      accountNode.pfpUrl as pfpUrl,
      NULL as castContent,
      NULL as timestamp,
      NULL as likesCount,
      NULL as mentionedChannels,
      NULL as mentionedUsers,
      accountScore as relevanceScore,
      'account_match' as matchType
    RETURN username, bio, followerCount, fcCred, state, city, country, pfpUrl, castContent, timestamp, likesCount, mentionedChannels, mentionedUsers, relevanceScore, matchType
    ORDER BY relevanceScore DESC
    LIMIT 10

    UNION ALL

    // Cast search query
    CALL db.index.fulltext.queryNodes('casts', $cleanQuery) YIELD node as castNode, score as castScore 
    WHERE castScore > 3 
    WITH 
      castNode.author as username,
      castNode.bio as bio,
      NULL as followerCount,
      NULL as fcCred,
      NULL as state,
      NULL as city,
      NULL as country,
      NULL as pfpUrl,
      castNode.text as castContent,
      castNode.timestamp as timestamp,
      castNode.likesCount as likesCount,
      castNode.mentionedChannels as mentionedChannels,
      castNode.mentionedUsers as mentionedUsers,
      castScore as relevanceScore,
      'cast_match' as matchType
    WHERE castContent IS NOT NULL
    RETURN username, bio, followerCount, fcCred, state, city, country, pfpUrl, castContent, timestamp, likesCount, mentionedChannels, mentionedUsers, relevanceScore, matchType
    ORDER BY relevanceScore DESC
    LIMIT 200
    `;
    
    // Execute the combined query
    console.log('Running combined search query...');
    const searchResults = await runQuery(combinedSearchQuery, { cleanQuery });
    console.log(`Combined query returned ${searchResults.length} records`);
    
    // Process the results into the format expected by the frontend
    const processedResults = searchResults.map(record => {
      const plainObj: Record<string, any> = {};
      const keys = record.keys.map(key => String(key));
      keys.forEach(key => {
        plainObj[key] = record.get(key);
      });
      // Assign different weight multipliers based on match type
      plainObj.totalScore = plainObj.relevanceScore * (plainObj.matchType === 'account_match' ? 15 : 10);
      return plainObj;
    });
    
    // Split into accounts and casts
    const accountResults = processedResults.filter(item => item.matchType === 'account_match');
    const castResults = processedResults.filter(item => item.matchType === 'cast_match');
    
    // Organize results into a structured format for the agent
    const results = {
      accounts: accountResults,
      casts: castResults,
      stats: {
        totalResults: processedResults.length,
        accountMatches: accountResults.length,
        castMatches: castResults.length
      }
    };
  
    // Return results
    return NextResponse.json({ 
      originalQuery: originalQuery,
      query: cleanQuery, 
      results,
      totalResults: processedResults.length,
      castMatches: castResults.length,
      accountMatches: accountResults.length
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