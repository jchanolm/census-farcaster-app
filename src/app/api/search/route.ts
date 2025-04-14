import { NextResponse } from 'next/server';
import { getDatabase } from '../../../lib/mongodb';

// Enable dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * Compute a combined score that gives weight to relevance, fcCred, and inverse follower count
 */
function computeCombinedScore({
  relevanceScore = 0,
  fcCred = 0,
  followerCount = 0
}) {
  // Avoid division by zero
  const invFollower = followerCount > 0 ? 1 / followerCount : 1;
  // Example weighting:
  return (0.5 * relevanceScore) + (0.3 * fcCred) + (0.2 * invFollower);
}

/**
 * Handles the search query for Farcaster network builders using MongoDB
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

    // Store original query
    const originalQuery = query.trim();
    console.log(`Processing query: ${originalQuery}`);
    
    // Remove stopwords from the query to improve search quality
    const stopwords = [
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 
      'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 'Farcaster',
      'their', 'then', 'there', 'these', 'they', 'this', 'to', 'was', 'will', 'with'
    ];
    
    // Split the query into words, filter out stopwords, and rejoin
    // Also remove problematic characters like /, -, etc.
    const cleanedQuery = originalQuery
      .toLowerCase()
      .replace(/[\/\-\\]/g, ' ')
      .split(/\s+/)
      .filter(word => !stopwords.includes(word))
      .join(' ');
    
    console.log(`Query after stopword removal: ${cleanedQuery || originalQuery}`);
    
    // Use the original query if all words were stopwords
    const effectiveQuery = cleanedQuery || originalQuery.replace(/[\/\-\\]/g, ' ');
    
    // Get database connection
    const db = await getDatabase();
    
    // // Search accounts - commented out as accounts index doesn't exist yet
    // const accountResults = await db.collection('fc-accounts')
    //   .find(
    //     { $text: { $search: effectiveQuery } },
    //     { projection: { score: { $meta: "textScore" } } }
    //   )
    //   .sort({ score: { $meta: "textScore" } })
    //   .limit(10)
    //   .toArray();
    
    // Search casts
    const castResults = await db.collection('casts')
      .find(
        { $text: { $search: effectiveQuery } },
        { projection: { score: { $meta: "textScore" } } }
      )
      .sort({ score: { $meta: "textScore" } })
      .limit(100)
      .toArray();
    
    // Since accountResults is commented out, initialize an empty array
    const accountResults = [];
    
    console.log(`Found ${accountResults.length} account matches and ${castResults.length} cast matches`);
    
    // Process account results
    const processedAccounts = accountResults.map(account => {
      const username = account.username || 'unknown';
      const bio = account.bio || '';
      const followerCount = account.followerCount || 0;
      const fcCred = account.fcCredScore || 0;
      const relevanceScore = account.score || 0;
      const fid = account.fid || 0;
      
      // Compute the combined score
      const combinedScore = computeCombinedScore({ 
        relevanceScore, 
        fcCred, 
        followerCount 
      });
      
      // Ensure profileUrl is correctly formatted
      const profileUrl = `https://warpcast.com/${username}`;
      
      return {
        username: username.startsWith('!') ? `fid:${fid}` : username,
        bio,
        followerCount,
        fcCred,
        relevanceScore,
        combinedScore,
        profileUrl,
        fid,
        channels: account.channels || []
      };
    });
    
    // Process cast results
    const processedCasts = castResults.map(cast => {
      const username = cast.author || 'unknown';
      const castContent = cast.text || '';
      const likesCount = cast.likeCount || 0;
      const timestamp = cast.timestamp || cast.createdAt || '';
      const hash = cast.hash || '';
      const authorFid = cast.authorFid || 0;
      
      // Create cast URL
      const castUrl = `https://warpcast.com/${username}/${hash}`;
      
      // Author profile URL
      const authorProfileUrl = `https://warpcast.com/${username}`;
      
      const mentionedChannels = cast.mentionedChannelIds || [];
      const mentionedUsers = cast.mentionedUsernames || [];
      const relevanceScore = cast.score || 0;
      const replyCount = cast.replyCount || 0;
      
      const combinedScore = computeCombinedScore({ 
        relevanceScore, 
        fcCred: 0,
        followerCount: 0
      });
      
      return {
        username,
        castContent,
        likesCount,
        timestamp,
        mentionedChannels,
        mentionedUsers,
        relevanceScore,
        combinedScore,
        castUrl,
        authorProfileUrl,
        hash,
        replyCount
      };
    });
    
    // Sort by combined score
    const sortedAccounts = processedAccounts.sort((a, b) => b.combinedScore - a.combinedScore);
    const sortedCasts = processedCasts.sort((a, b) => b.combinedScore - a.combinedScore);
    
    // Final results object
    const results = {
      accounts: sortedAccounts,
      casts: sortedCasts,
      stats: {
        totalResults: sortedAccounts.length + sortedCasts.length,
        accountMatches: sortedAccounts.length,
        castMatches: sortedCasts.length,
        vectorResultsCount: sortedCasts.length // maintain compatibility with existing code
      }
    };
    
    // Return results
    return NextResponse.json({ 
      originalQuery: originalQuery,
      query: originalQuery, 
      results,
      totalResults: sortedAccounts.length + sortedCasts.length,
      castMatches: sortedCasts.length,
      accountMatches: sortedAccounts.length
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