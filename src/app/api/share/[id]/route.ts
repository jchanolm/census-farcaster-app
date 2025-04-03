import { NextResponse } from 'next/server';
import { runQuery } from '@/lib/neo4j';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 });
    }
    
    // Retrieve the shared search from Neo4j
    const getQuery = `
      MATCH (s:SharedSearch {id: $id})
      RETURN s.query as query, s.timestamp as timestamp, s.results as results, s.agentReport as agentReport
    `;
    
    const records = await runQuery(getQuery, { id });
    
    if (records.length === 0) {
      return NextResponse.json({ error: 'Shared search not found' }, { status: 404 });
    }
    
    const record = records[0];
    
    // Parse the stored JSON results
    let results;
    try {
      results = JSON.parse(record.get('results'));
    } catch (e) {
      results = { error: 'Could not parse results data' };
    }
    
    return NextResponse.json({
      query: record.get('query'),
      timestamp: record.get('timestamp'),
      results,
      agentReport: record.get('agentReport')
    });
    
  } catch (error) {
    console.error('Error retrieving shared search:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve shared search',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}