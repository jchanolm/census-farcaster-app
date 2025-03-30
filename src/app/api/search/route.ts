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
    
    // The new enhanced search query with fulltext and builder credibility metrics
    const enhancedQuery = `
      // Match accounts directly from the fulltext index
      CALL db.index.fulltext.queryNodes('text', $query) YIELD node, score as directScore
      WHERE (node:Account:Warpcast OR node:Cast) AND directScore > 0.75
      
      // Handle both account and cast nodes
      WITH CASE 
             WHEN node:Account THEN node
             WHEN node:Cast THEN null
           END as account,
           CASE 
             WHEN node:Cast THEN node
             ELSE null
           END as cast,
           directScore
           
      // For cast nodes, find the connected account
      WITH account, 
           CASE WHEN cast IS NOT NULL 
                THEN [(cast)<-[:POSTED]-(a:Account) | a][0] 
                ELSE null 
           END as castAccount,
           cast, 
           directScore
           
      // Combine account results (either direct or via cast)
      WITH COALESCE(account, castAccount) as combinedAccount,
           account IS NOT NULL as isDirectAccount,
           cast,
           directScore
      WHERE combinedAccount IS NOT NULL 
      
      // Group by account and calculate total scores with normalization
      WITH combinedAccount as account,
           SUM(CASE WHEN isDirectAccount THEN directScore * 0.3 ELSE 0 END) as accountScore,
           CASE 
             WHEN COUNT(CASE WHEN NOT isDirectAccount THEN cast END) > 0
             THEN AVG(CASE WHEN NOT isDirectAccount THEN directScore ELSE 0 END)
             ELSE 0
           END * 0.7 as castsScore
           
      // Calculate final score combining both components
      WITH account, 
           accountScore + castsScore as totalScore
           
      // Gather related account information
      OPTIONAL MATCH (account)-[:ACCOUNT]-(other:Account)
      
      // Gather builder credibility metrics
      OPTIONAL MATCH (account)-[:ACCOUNT]-(:Wallet)-[reward:REWARDS]-()
      OPTIONAL MATCH (account)-[:ACCOUNT]-(:Wallet)-[deploy:DEPLOYED]-()
      OPTIONAL MATCH (account)-[:CREATED]-(frame:Frame)
      OPTIONAL MATCH (account)-[:LEAD]-(channel:Channel)
      
      WITH 
           account, 
           totalScore, 
           collect(distinct({
             username: CASE WHEN other.platform = 'wallet' THEN other.address ELSE other.username END, 
             platform: other.platform 
           })) as accounts, 
           sum(tofloat(reward.value)) as farcaster_rewards_received, 
           count(distinct(deploy)) as smartContractsDeployed, 
           count(frame) as countFramesDeployed, 
           collect(distinct(channel.name)) as channels_moderated
           
      // Return the results
      RETURN 
        account.username as username, 
        account.bio as bio, 
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
        END as location, 
        accounts, 
        farcaster_rewards_received,
        smartContractsDeployed,
        countFramesDeployed,
        channels_moderated,
        totalScore as score,
        account.pfpUrl as pfpUrl
      ORDER BY score DESC
      LIMIT 20
    `;
    
    const records = await runQuery(enhancedQuery, { 
      query: query
    });
    
    // Format enhanced results for display
    const results = records.map(record => ({
      username: record.get('username'),
      bio: record.get('bio'),
      location: record.get('location'),
      accounts: record.get('accounts') || [],
      pfpUrl: record.get('pfpUrl'),
      builderCreds: {
        farcasterRewards: record.get('farcaster_rewards_received') || 0,
        smartContracts: record.get('smartContractsDeployed') || 0,
        framesDeployed: record.get('countFramesDeployed') || 0,
        channelsModerated: record.get('channels_moderated') || []
      },
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