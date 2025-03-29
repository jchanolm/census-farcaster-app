import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/neo4j';

export const dynamic = 'force-dynamic';

// Read from environment variable
const DEEPINFRA_API_KEY = process.env.DEEPINFRA_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    }

    console.log(`Processing query: ${query}`);
    
    // Call DeepInfra API to generate BGE-M3 embeddings
    const response = await fetch('https://api.deepinfra.com/v1/openai/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPINFRA_API_KEY}`
      },
      body: JSON.stringify({
        input: query,
        model: 'BAAI/bge-m3',
        encoding_format: 'float'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepInfra API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;
    
    // Search Neo4j with vector search
    const vectorQuery = `
      // Use only full-text search instead of vector search
      CALL db.index.fulltext.queryNodes('aggroText', $query) 
      YIELD node AS account, score
      WHERE score > 0.7 // Threshold for fulltext search relevance
      
      RETURN DISTINCT account.username as username, account.mentionedProfiles as affiliations, account.bio as bio, 
        CASE 
          WHEN account.city IS NOT NULL THEN 
            TRIM(COALESCE(account.city + ', ', '') + 
                 COALESCE(account.state + ', ', '') + 
                 COALESCE(account.country, ''))
          WHEN account.state IS NOT NULL THEN 
            TRIM(COALESCE(account.state + ', ', '') + 
                 COALESCE(account.country, ''))
          WHEN account.country IS NOT NULL THEN account.country
          ELSE NULL
        END as location, score
      ORDER BY score DESC
      LIMIT 20
    `;
    
    const records = await runQuery(vectorQuery, { 
      query: query,
      embedding: embedding, 
      limit: 5 
    });
    
    // Format results for display
    const results = records.map(record => ({
      username: record.get('username'),
      bio: record.get('bio'),
      location: record.get('location'),
      affiliations: record.get('affiliations'),
      score: record.get('score')
    }));
    
    
    return NextResponse.json({ 
      query, 
      results,
      embedding,
      recordCount: records.length
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}