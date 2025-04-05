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
// Fixed formatPrompt function with improved cast and user linking
// Updated formatPrompt function with correct cast URL handling
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
    
    // Ensure profileUrl is correctly formatted for USER PROFILES
    const profileUrl = account.profileUrl && account.profileUrl.startsWith('http')
      ? account.profileUrl
      : `https://warpcast.com/${username}`;
    
    return {
      username,
      bio,
      followerCount,
      fcCred,
      relevanceScore,
      combinedScore, // store it for reference
      profileUrl // User's profile URL
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
    const hash = cast.hash || '';
    
    // Use the castUrl directly from the cast data
    const castUrl = cast.castUrl || '';
    
    // Ensure authorProfileUrl is properly formatted - separate from castUrl
    let authorProfileUrl = cast.authorProfileUrl || '';
    if (!authorProfileUrl || !authorProfileUrl.startsWith('https')) {
      authorProfileUrl = `https://warpcast.com/${username}`;
    }
    
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
      castUrl,         // URL to the specific cast
      authorProfileUrl // URL to the user's profile
    };
  });
  
  // Sort casts by combined score for better analysis
  const sortedCasts = processedCasts.sort((a, b) => b.combinedScore - a.combinedScore);

  // Add explicit instructions for linking with CLEAR distinction between cast URLs and profile URLs
  const linkingInstructions = `
# LINKING INSTRUCTIONS
- When mentioning a Farcaster user, use the format \`[username](authorProfileUrl)\` where authorProfileUrl is the user's profile URL.
- When quoting a cast, ALWAYS end with \`[View cast](castUrl)\` where castUrl is the URL for that specific cast.
- IMPORTANT: castUrl and authorProfileUrl are DIFFERENT. Never confuse them - use castUrl only for linking to specific casts, authorProfileUrl only for user profiles.
- For any users mentioned in cast content, convert mentions to links using their profile URLs when available.
- EXAMPLES:
  - User reference: \`[${sortedAccounts[0]?.username || 'username'}](${sortedAccounts[0]?.profileUrl || 'https://warpcast.com/username'})\`
  - Cast quote: \`> This is a quote from a cast [View cast](${sortedCasts[0]?.castUrl || 'https://warpcast.com/username/hash'})\`
`;

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
   - **channels:** Channel memberships, indicative of user interests
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
   - **castUrl:** URL for the specific cast (NOT the author's profile)
   - **authorProfileUrl:** URL for the author's profile  

${linkingInstructions}
# RESPONSE GUIDELINES
1. **Understand the Query**
   - For hiring or recruiting, identify new potential candidates with relevant expertise (not already part of the organization).
   - For market research, highlight trends and key user discussions.
   - If you mention a cast, cite the cast with its castUrl and quote relevant sections
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
   - If no relevant information is found, clearly state "wasn't able to retrieve any relevant info"

3. **Linking Rules**
   - When mentioning a user, link to their profile URL: \`[username](authorProfileUrl)\`
   - When quoting a cast, link to the specific cast URL: \`[View cast](castUrl)\`
   - NEVER confuse these two types of links - casts must link to castUrl, users to profileUrl
   - When citing a cast, ALWAYS use castUrl, NEVER use profileUrl

4. **Tone & Style**
   - Write precisely and concisely.
   - Focus on relevant details and meaningful insights.
   - Maintain a professional, factual style; avoid hedging or speculation.
   - Do not include meta-commentary on data limitations or the analysis process.

5. **Report Structure**
   1. **Executive Summary**  
      - High-level overview (2-3 key findings addressing the query).
   2. **Notable Builders & Projects & Concepts**  
      - Mention 4-7 relevant builders or projects.
      - Cite casts, including quotes + castUrl
      - Include specific evidence, expertise, and connections to the query.
      - Link to their profile using \`[username](authorProfileUrl)\`.
      - If referencing a cast, link to it with \`[View cast](castUrl)\`.


# IMPORTANT
- Keep Key Findings and Notable Builders sections distinct, with no redundancy.
- End Report after "Notable Builders & Projects & Concepts". No further notes or asides needed.
- Give a subtle boost to accounts with relatively fewer followers but higher fcCred. Do NOT EVER SAY YOU ARE DOING THIS.
- Focus solely on the user's question; omit any references to data volume or provenance.
- For recruiting, do not list individuals already within the mentioned organization.
- No next steps or other extra commentary—just deliver insights.
- ALL usernames must be linked to profile URLs and ALL cast quotes must have View cast links.
- DISTINGUISH CLEARLY between castUrl (for linking to specific casts) and authorProfileUrl (for linking to user profiles)
- When citing a cast, ALWAYS use castUrl, NEVER use profileUrl for cast citations

# ACCOUNT SELECTION CRITERIA
- Only include accounts that appear in the cast results, unless:
  - The user is specifically asking for information about a particular person/username
  - The account's bio contains highly relevant information to the query (e.g., for a query about "prediction markets", include accounts whose bios mention "prediction markets")
  - The account works at a company or has a role specifically relevant to the query (e.g., product managers at relevant companies)
- Even in these edge cases, prioritize accounts that also have casts in the results
- Do not include accounts that only match on the handle unless specifically requested

# PERSON-SPECIFIC QUERY HANDLING
- If the query is about a specific person (e.g., "tell me about username"), ONLY include:
  - Casts authored by that specific person
  - Never return dwr, ted, rish, or proxystudio as a result unless there's no way to answer question without mentioning them
  - Casts that explicitly mention or discuss that specific person
  - Do NOT include casts that merely contain the person's name/username in an unrelated context
  - If you're unsure whether a cast is actually about the person in question, exclude it
  - Be strict about this filtering - when in doubt, exclude rather than include

# MARKDOWN FORMATTING
- Use \`##\` headings for major sections and \`###\` subheadings if needed.
- Use **bold** for important names or concepts.
- Use bullet points for short lists.
- Use \`>\` blockquotes for direct quotes (with a [View cast](castUrl) link).
- Separate major sections with \`---\`.
- Always link usernames to profile URLs in the text.
- When citing casts, ALWAYS use castUrl, NEVER profileUrl.

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