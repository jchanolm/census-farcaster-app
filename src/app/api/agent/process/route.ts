import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Compute a combined score that gives weight to relevance, fcCred, and inverse follower count
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

// Format the data for the AI prompt
function formatPrompt(query: string, results: any) {
  // Ensure results structure exists with defaults
  const { accounts = [], casts = [] } = results;
  
  // Preprocess account data
  const processedAccounts = accounts.map(account => {
    const username = account.username || 'unknown';
    const bio = account.bio || '';
    const followerCount = account.followerCount || 0;
    const fcCred = account.fcCred || account.fcCredScore || 0;
    const relevanceScore = account.relevanceScore || account.score || 0;
    
    // Compute the new combined score
    const combinedScore = computeCombinedScore({ 
      relevanceScore, 
      fcCred, 
      followerCount 
    });
    
    // Generate profile URL (not from data)
    const profileUrl = `https://warpcast.com/${username}`;
    
    return {
      username,
      bio,
      followerCount,
      followingCount: account.followingCount || 0,
      fcCred,
      relevanceScore,
      combinedScore, // store it for reference
      profileUrl, // User's profile URL
      channels: account.channels || [],
      country: account.country || null,
      city: account.city || null,
      state: account.state || null,
      ogLikesCount: account.ogLikesCount || 0,
      ogRecastsCount: account.ogRecastsCount || 0,
      ogFollowsCount: account.ogFollowsCount || 0,
      isLegit: account.isLegit || false
    };
  });
  
  // Sort accounts by combined score
  const sortedAccounts = processedAccounts.sort((a, b) => b.combinedScore - a.combinedScore);
  
  // Preprocess cast data to handle any missing fields
  const processedCasts = casts.map(cast => {
    const username = cast.username || cast.author || 'unknown';
    const castContent = cast.text || cast.castContent || '';
    const likesCount = cast.likesCount || cast.likeCount || 0;
    const timestamp = cast.timestamp || '';
    const hash = cast.hash || '';
    
    // Generate cast URL (not from data)
    const castUrl = `https://warpcast.com/${username}/${hash}`;
    
    // Generate author profile URL
    const authorProfileUrl = `https://warpcast.com/${username}`;
    
    const mentionedChannels = cast.mentionedChannels || cast.mentionedChannelIds || [];
    const mentionedUsers = cast.mentionedUsers || cast.mentionedUsernames || [];
    const relevanceScore = cast.relevanceScore || cast.score || 0;
    
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
      castUrl,         // URL to the specific cast
      authorProfileUrl // URL to the user's profile
    };
  });
  
  // Sort casts by combined score for better analysis
  const sortedCasts = processedCasts.sort((a, b) => b.combinedScore - a.combinedScore);

  return `
# MISSION
You are analyzing Farcaster network data to provide the best possible answer to the user's query.

# CONTEXT
The user searched for: "${query}"

You are receiving context relevant to user's search, including Farcaster profiles (accounts) and posts (casts). Your goal is to analyze these results and deliver the most helpful and complete response directly addressing the query.

# DATA STRUCTURE
The search results include:
- ${sortedAccounts.length} Farcaster user profiles
- ${sortedCasts.length} Farcaster casts (posts)

# AVAILABLE DATA FIELDS
For each account, you have access to:
- username, bio, follower/following counts
- fcCred (a measure of reputation/influence)
- channels they participate in
- location data (country, city, state)
- engagement metrics (likes, recasts, follows)
- verification status (isLegit)

For each cast (post), you have access to:
- username of author
- full cast content
- engagement metrics (likes count)
- timestamp
- mentioned channels and users
- relevance to the query

# RESPONSE GUIDELINES
1. Provide a direct, helpful answer to the user's query based only on the provided search results.
2. Reference specific evidence from the search results to support your answer.
3. Quote relevant casts when they provide useful information.
4. Mention relevant Farcaster users when appropriate.
5. When mentioning users, link to their profiles using: [username](https://warpcast.com/username)
6. When quoting casts, include a link to the cast: [View cast](castUrl)
7. Focus on providing substantive information rather than just listing users.
8. Don't make assertions about the entire dataset - only analyze what's in the provided results.
9. If the results are limited, acknowledge this and provide the best answer possible with available data.

# SPECIAL INSTRUCTIONS FOR USER-SPECIFIC QUERIES
If the query appears to be about a specific Farcaster user (e.g., "who is username", "about username", or just "username"):
1. Focus your response primarily on that user's account details
2. Include casts created by that user (where their username is the author)
3. Include casts that directly reference or mention that user
4. Structure your response as a user profile with:
   - Brief intro based on bio and profile information
   - Key topics they discuss
   - Notable posts or insights (with direct quotes)
   - Any projects or work they mention
   - Brief summary of their Farcaster presence (engagement, followers, etc.)

# FORMATTING
- Use markdown formatting to structure your response.
- Use blockquotes (>) for cast quotes.
- Bold important concepts or findings.
- Keep your response focused and concise while being comprehensive.
- If no relevant information is found, clearly state that you weren't able to find relevant information.
- Write in a professional, analytical tone.

---

## ACCOUNTS DATA (${sortedAccounts.length} PROFILES)
\`\`\`json
${JSON.stringify(sortedAccounts, null, 2)}
\`\`\`

## CASTS DATA (${sortedCasts.length} POSTS)
\`\`\`json
${JSON.stringify(sortedCasts, null, 2)}
\`\`\`
`;
}

export async function POST(request: Request) {
  try {
    console.log('Agent API: Request received!');
    const { originalQuery, query, results } = await request.json();
    
    if (!query || !results) {
      console.log('Agent API: Invalid input', { query, resultsProvided: !!results });
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    
    // Log structured data format
    const accountsCount = results.accounts?.length || 0;
    const castsCount = results.casts?.length || 0;
    
    console.log(`Agent API: Processing ${accountsCount} accounts and ${castsCount} casts for query: "${query}"`);
    
    // Format the prompt for the model using the original or processed query
    const prompt = formatPrompt(originalQuery || query, results);
    
    // Set up streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let keepAliveInterval: NodeJS.Timeout | null = null;
        
        try {
          console.log('Agent API: Starting LLM streaming...');
          
          // Set up a keepalive interval to prevent connection timeouts
          keepAliveInterval = setInterval(() => {
            try {
              controller.enqueue(encoder.encode("data: :keep-alive\n\n"));
            } catch (e) {
              if (keepAliveInterval) clearInterval(keepAliveInterval);
            }
          }, 15000); // Send keepalive every 15 seconds
          
          // Call the Deepseek API with streaming enabled
          const response = await fetch(process.env.DEEPSEEK_API_ENDPOINT || 'https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                {
                  role: "system",
                  content: "You are an AI assistant that analyzes search results about Farcaster users and content to produce helpful, focused responses."
                },
                {
                  role: "user", 
                  content: prompt
                }
              ],
              temperature: 0.1,
              stream: true,
              max_tokens: 8000
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Model API error (${response.status}):`, errorText);
            throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
          }
          
          // Stream the response
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No stream available from API response');
          }
          
          let buffer = '';
          const decoder = new TextDecoder();
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Decode and process the chunk
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // Process complete SSE messages
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || ''; // Keep the last potentially incomplete chunk
            
            for (const line of lines) {
              if (!line.trim() || line.includes('[DONE]')) continue;
              
              // Skip keepalive messages
              if (line.includes(":keep-alive")) continue;
              
              // Forward the chunk to the client
              controller.enqueue(encoder.encode(line + '\n\n'));
              
              // Force flush the data
              await new Promise(resolve => setTimeout(resolve, 0));
            }
          }
          
          // Send [DONE] marker
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          
          if (keepAliveInterval) {
            clearInterval(keepAliveInterval);
            keepAliveInterval = null;
          }
          
          controller.close();
          console.log('Agent API: Stream completed successfully');
          
        } catch (error) {
          console.error('Agent API streaming error:', error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Send error message to client
          controller.enqueue(encoder.encode(`data: {"error":true,"message":"${errorMessage}"}\n\n`));
          
          if (keepAliveInterval) {
            clearInterval(keepAliveInterval);
            keepAliveInterval = null;
          }
          
          controller.close();
        }
      }
    });
    
    // Return the streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      }
    });
    
  } catch (error) {
    console.error('Agent API: Processing error:', error);
    return NextResponse.json({ 
      error: 'Processing failed',
      detail: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}