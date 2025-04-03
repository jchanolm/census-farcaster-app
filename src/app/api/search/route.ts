import { NextResponse } from 'next/server';
import { runQuery } from '@/lib/neo4j';
import OpenAI from "openai";

// Enable dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Initialize OpenAI client for embeddings
const openai = new OpenAI({
  baseURL: 'https://api.deepinfra.com/v1/openai',
  apiKey: process.env.DEEPINFRA_API_KEY,
});

/**
 * Generate embeddings using BAAI/bge-m3 model
 * @param text - The text to embed
 * @returns A vector of embeddings
 */
async function generateEmbedding(text: string) {
  try {
    // Clean the text by removing problematic characters before embedding
    const cleanedText = text.replace(/[\/\-\\]/g, ' ').trim();
    
    const embedding = await openai.embeddings.create({
      model: "BAAI/bge-m3",
      input: cleanedText,
      encoding_format: "float",
    });
    
    return embedding.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Handles the search query for Farcaster network builders using vector search
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
    // Step 1: Generate embedding for the query using BAAI/bge-m3
    console.log('Generating embedding for query using BAAI/bge-m3...');
    const queryEmbedding = await generateEmbedding(originalQuery);
    
    if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
      return NextResponse.json({ 
        error: 'Embedding generation failed', 
        details: 'Could not generate valid embeddings for the query' 
      }, { status: 500 });
    }
    
    // Step 2: Use vector search with separate queries for accounts and casts
    const combinedVectorSearchQuery = `
    // Cast search with vector similarity using embeddings
    CALL db.index.vector.queryNodes('castsEmbeddings', 250, $queryEmbedding) YIELD node as castNode, score
    WHERE score > .8
    match (account:Warpcast:RealAssNigga)-[]-(castNode)
    WITH 
      castNode.author as username,
      "https://warpcast.com/" + castNode.author as authorProfileUrl,
      account.followerCount as followerCount,
      account.bio as bio,
      account.ogInteractionsCount as fcCred,
      castNode.text as castContent,
      "https://warpcast.com/" + castNode.author + "/" + castNode.hash as castUrl,
      castNode.timestamp as timestamp,
      account.state as state,
      account.city as city,
      account.country as country,
      castNode.likesCount as likesCount,
      castNode.mentionedChannels as mentionedChannels,
      castNode.mentionedUsers as mentionedUsers,
      score,
      avg(score) * sum(score) as scorecof, 
      'cast_match' as matchType,
      NULL as profileUrl,
      NULL as pfpUrl
    WHERE castContent IS NOT NULL
    RETURN username, bio, followerCount, fcCred, state, city, country, profileUrl, pfpUrl, castContent, timestamp, likesCount, mentionedChannels, mentionedUsers, score, matchType
    ORDER BY scorecof DESC

    UNION ALL

    // Account search with fulltext search using cleaned query
    CALL db.index.fulltext.queryNodes("accounts", $effectiveQuery) YIELD node as accountNode, score 
    WHERE score > 3.5
    WITH 
      accountNode.username as username,
      "https://warpcast.com/" + accountNode.username as profileUrl,
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
      score,
      'account_match' as matchType,
      NULL as authorProfileUrl
    RETURN username, bio, followerCount, fcCred, state, city, country, profileUrl, pfpUrl, castContent, timestamp, likesCount, mentionedChannels, mentionedUsers, score, matchType
    ORDER BY score DESC
    LIMIT 2
    `;
    
    console.log('Running vector search queries...');
    const vectorResults = await runQuery(combinedVectorSearchQuery, { 
      effectiveQuery: effectiveQuery,
      queryEmbedding: queryEmbedding 
    });
    console.log(`Vector search returned ${vectorResults.length} total results`);
    
    // Process the results
    const processedResults = vectorResults.map(record => {
      const plainObj: Record<string, any> = {};
      const keys = record.keys.map(key => String(key));
      keys.forEach(key => {
        plainObj[key] = record.get(key);
      });
      return plainObj;
    });
    
    // Calculate combined score for each result
    processedResults.forEach(item => {
      // Default values if fields are missing
      const score = item.score || 0;
      const followerCount = Number(item.followerCount || 1);
      const fcCred = Number(item.fcCred || 0);
      
      // Avoid dividing by zero
      const invFollowerCount = (followerCount <= 0) ? 1 : (1 / followerCount);
      
      // Combine the scores with weighting
      item.combinedScore = 0.5 * score + 
                          0.3 * fcCred + 
                          0.2 * invFollowerCount;
    });
    
    // Split into accounts and casts
    const accountResults = processedResults
      .filter(item => item.matchType === 'account_match')
      .sort((a, b) => b.combinedScore - a.combinedScore);
      
    const castResults = processedResults
      .filter(item => item.matchType === 'cast_match')
      .sort((a, b) => b.combinedScore - a.combinedScore);
    
    console.log(`Found ${accountResults.length} account matches and ${castResults.length} cast matches`);
    
    // Final results object
    const results = {
      accounts: accountResults,
      casts: castResults,
      stats: {
        totalResults: accountResults.length + castResults.length,
        accountMatches: accountResults.length,
        castMatches: castResults.length
      }
    };
    
    // Return results
    return NextResponse.json({ 
      originalQuery: originalQuery,
      query: originalQuery, 
      results,
      totalResults: accountResults.length + castResults.length,
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