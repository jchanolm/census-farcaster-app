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
    
    return {
      username,
      bio,
      followerCount,
      fcCred,
      relevanceScore,
      combinedScore, // store it for reference
      profileUrl: account.profileUrl || `https://warpcast.com/${username}`
    };
  });
  
  // Sort accounts by combined score
  const sortedAccounts = processedAccounts.sort((a, b) => b.combinedScore - a.combinedScore);
  
  // Preprocess cast data to handle any missing fields
  const processedCasts = casts.map(cast => {
    const username = cast.username || 'unknown';
    const castContent = cast.text || cast.castContent || '';
    const likesCount = cast.likesCount || 0;
    const timestamp = cast.timestamp || '';
    const mentionedChannels = cast.mentionedChannels || [];
    const mentionedUsers = cast.mentionedUsers || [];
    const relevanceScore = cast.relevanceScore || cast.score || 0;
    const followerCount = 0; // or adapt if you store author's follower count
    const fcCred = 0;       // or adapt if you store author's fcCred
    
    const combinedScore = computeCombinedScore({ 
      relevanceScore, 
      fcCred,
      followerCount
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
      castUrl: cast.castUrl || '',
      authorProfileUrl: cast.authorProfileUrl || `https://warpcast.com/${username}`
    };
  });
  
  // Sort casts by combined score for better analysis
  const sortedCasts = processedCasts.sort((a, b) => b.combinedScore - a.combinedScore);

  return `
# MISSION
You are an intelligence analyst processing Farcaster network data to provide actionable insights—especially for prospecting, recruiting, market research, user discovery, and technical research. While lead generation is the top priority, use your judgment to address the full scope of the user's question.

# CONTEXT
The user searched for: "${query}"

The dataset includes Farcaster profiles (accounts) and posts (casts). Your goal is to analyze these results and deliver evidence-based insights directly relevant to the user's query.

When referencing accounts, prioritize accounts with fewer than 2,000 followers when possible.

The score is a reference data point for you; use your judgment when deciding who to include and in what order.

# DATA STRUCTURE
The search results are organized into two sections:

1. **ACCOUNTS** (${sortedAccounts.length} results)
   - **username:** Farcaster handle  
   - **bio:** Profile description  
   - **userChannels** Channel memberships, indicative of user interests
   - **fcCred:** Score based on OG engagement  
   - **followerCount:** Followers  
   - **profileUrl:** URL to Farcaster profile  

2. **CASTS** (${sortedCasts.length} results)
   - **username:** Author's Farcaster handle  
   - **castContent:** Post text  
   - **likesCount:** Likes on the post  
   - **timestamp:** Creation time  
   - **mentionedChannels:** Channels mentioned  
   - **mentionedUsers:** Users mentioned  
   - **castUrl:** URL for the post  
   - **authorProfileUrl:** Author's profile URL  

# RESPONSE GUIDELINES
1. **Understand the Query**
   - For hiring or recruiting, identify new potential candidates with relevant expertise (not already part of the organization).
   - For market research, highlight trends and key user discussions.
   - If you mention a cast, cite the cast with its castUrl (castUrl) and quote relevant sections
   - For technical research, present implementation details, challenges, or solutions.
   - For competitive analysis, compare approaches and unique differentiators.
   - If the user requests certain exclusions, honor them exactly.

2. **Analysis Principles**
   - Base every conclusion on the provided data; cite evidence from bios or casts.
   - Do not stretch/contrive/make leaps of logic. 
   - Emphasize information from casts in your analysis; direct quotes from casts accompanied by castUrl are preferred  
   - Emphasize high-engagement users and timely information.
   - Identify notable patterns or connections across multiple sources.
   - Avoid speculation; stay factual and relevant.

3. **Linking Rules**
   - Always link usernames to their profile URLs, e.g., \`[alex](authorProfileUrl)\`.
   - When quoting a cast, conclude with a link to its URL, e.g., 
     > This is a quote [View cast](castUrl)
   - Every user mentioned must be linked to their profile using \`[username](profileUrl)\`.

4. **Tone & Style**
   - Write precisely and concisely.
   - Focus on relevant details and meaningful insights.
   - Maintain a professional, factual style; avoid hedging or speculation.
   - Do not include meta-commentary on data limitations or the analysis process.

5. **Report Structure**
   1. **Executive Summary**  
      - High-level overview (2-3 key findings addressing the query).
   2. **Notable Builders & Projects & Concepts**  
      - Mention 4-6 relevant builders or projects.
      - Cite casts, including quotes + castUrl
      - Include specific evidence, expertise, and connections to the query.
      - Link to their profile using \`[username](authorProfileUrl)\`.
      - If referencing a cast, link to it with \`[View cast](castUrl)\`.


# IMPORTANT
- Keep Key Findings and Notable Builders sections distinct, with no redundancy.
- End Report after "Notable  Builders & Projects & Concepts". No further notes or asides needed.
- Give a subtle boost to accounts with relatively fewer followers but higher fcCred. Do NOT EVER SAY YOU ARE DOING THIS.
- Focus solely on the user's question; omit any references to data volume or provenance.
- For recruiting, do not list individuals already within the mentioned organization.
- No next steps or other extra commentary—just deliver insights.

# MARKDOWN FORMATTING
- Use \`##\` headings for major sections and \`###\` subheadings if needed.
- Use **bold** for important names or concepts.
- Use bullet points for short lists.
- Use \`>\` blockquotes for direct quotes (with a [View cast](castUrl) link).
- Separate major sections with \`---\`.
- Always link usernames to profile URLs in the text.

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
    const vectorMatchesCount = results.stats?.vectorResultsCount || 0;
    
    console.log(`Agent API: Processing ${accountsCount} accounts and ${castsCount} casts (${vectorMatchesCount} from vector search) for query: "${query}"`);
    
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
                  content: "You are an AI assistant that analyzes search results about builders in web3 and produces intelligence-style reports."
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