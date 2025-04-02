import { NextResponse } from 'next/server';
import { runQuery } from '@/lib/neo4j';
import OpenAI from "openai";

// Enable dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Initialize OpenAI client for DeepInfra
const openai = new OpenAI({
  baseURL: 'https://api.deepinfra.com/v1/openai',
  apiKey: process.env.DEEPINFRA_API_KEY,
});

// Function to generate embeddings using DeepInfra's BGE-M3 API
async function generateQueryEmbedding(query: string): Promise<number[]> {
  try {
    const embedding = await openai.embeddings.create({
      model: "BAAI/bge-m3",
      input: query,
      encoding_format: "float",
    });
    
    if (!embedding.data || !embedding.data[0] || !embedding.data[0].embedding) {
      console.error('Invalid embedding response:', embedding);
      throw new Error('Failed to get valid embedding from API');
    }
    
    console.log(`Generated embedding with ${embedding.usage.prompt_tokens} tokens`);
    return embedding.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate query embedding');
  }
}

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
    
    // Generate embedding for the query
    console.log('Generating embedding for query...');
    const queryEmbedding = await generateQueryEmbedding(cleanQuery);
    console.log('Embedding generated successfully');
    
    // Vector search query for casts - replacing the fulltext search
    const vectorCastsQuery = `
    CALL db.index.vector.queryNodes('baseEmbedding', 300, $queryEmbedding)
    YIELD node as user, score
    WHERE (user:Account:RealAssNigga) AND score > 0.7
    MATCH (user)-[r:POSTED]->(cast)
    WITH user, score, collect(distinct("this is a cast/post by user " + user.username + 
        "here is post/cast text: " + cast.text + "end cast." + " timestamp" + 
        cast.timestamp + " likes: " + cast.likesCount + "and it mentions channels:" + 
        cast.mentionedChannels)) as castText
    RETURN DISTINCT 
        user.username as username,
        user.bio as bio,
        user.ogInteractionsCount as fcCredScore,
        user.followerCount as followerCount,
        user.city as city,
        user.country as country,
        score as avgMentionQuality,
        castText,
        'cast_match' as matchType
    ORDER BY score DESC
    `;
    
    // Keep the existing accounts search query for now
    // This could also be converted to vector search if needed
    const accountsSearchQuery = `
    CALL db.index.fulltext.queryNodes('wcAccounts', $cleanQuery) YIELD node, score
    WHERE score > 100
    ORDER BY score DESC 
    LIMIT 7
    RETURN 
      node.username as username,
      node.bio as bio,
      node.followerCount as followerCount,
      node.ogInteractionsCount as fcCred,
      node.state as state,
      node.city as city,
      node.country as country,
      node.pfpUrl as pfpUrl,
      score as avgMentionQuality,
      [] as castText,
      'account_match' as matchType
    `;
    
    // Execute the queries
    console.log('Running vector casts query...');
    const castsRecords = await runQuery(vectorCastsQuery, { queryEmbedding });
    console.log(`Vector casts query returned ${castsRecords.length} records`);
    
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
      originalQuery: query,
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