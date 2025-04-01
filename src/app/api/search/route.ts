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
    
    // Neo4j fulltext search query
    const searchQuery = `
    CALL db.index.fulltext.queryNodes('casts', $query) YIELD node, score 
    MATCH (node)
    ORDER BY score DESC 
    LIMIT 300
    MATCH (user:Account)-[r:POSTED]-(node)
    WITH user, 
         avg(score) as avgMentionQuality, 
         sum(score) as totalMentions, 
         collect(distinct(node.text) + " | " + node.hash) as castText
    RETURN DISTINCT 
      user.username as username, 
      user.bio as bio, 
      user.pfpUrl as pfpUrl, 
      avgMentionQuality, 
      totalMentions,
      castText
    ORDER BY avgMentionQuality DESC
    `;
    
    // Execute the query
    const records = await runQuery(searchQuery, { query: cleanQuery });
    
    console.log(`Query returned ${records.length} records`);
    
    // Convert Neo4j records to plain objects
    const results = records.map(record => {
      const plainObj: Record<string, any> = {};
      record.keys.forEach(key => {
        plainObj[key] = record.get(key);
      });
      
      // Calculate a total score for sorting/ranking
      plainObj.totalScore = plainObj.avgMentionQuality * plainObj.totalMentions;
      
      return plainObj;
    });
  
    // Return results
    return NextResponse.json({ 
      query: cleanQuery, 
      results,
      totalResults: results.length
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