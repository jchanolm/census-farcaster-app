import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Format the data for the AI prompt
function formatPrompt(query: string, results: any) {
  // Ensure results structure exists with defaults
  const { accounts = [], casts = [] } = results;
  
  // Preprocess cast data to handle any missing fields
  const processedCasts = casts.map(cast => ({
    username: cast.username || 'unknown',
    castContent: cast.castContent || '',
    likesCount: cast.likesCount || 0,
    timestamp: cast.timestamp || '',
    mentionedChannels: cast.mentionedChannels || [],
    mentionedUsers: cast.mentionedUsers || [],
    relevanceScore: cast.relevanceScore || 0,
    isVectorMatch: cast.isVectorMatch || false,
    castUrl: cast.castUrl || ''
  }));
  
  // Sort casts by relevance score for better analysis
  const sortedCasts = processedCasts.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  // Preprocess account data
  const processedAccounts = accounts.map(account => ({
    username: account.username || 'unknown',
    bio: account.bio || '',
    followerCount: account.followerCount || 0,
    fcCred: account.fcCred || account.fcCredScore || 0,
    relevanceScore: account.relevanceScore || 0,
    isVectorMatch: account.isVectorMatch || false,
    profileUrl: account.profileUrl || ''
  }));
  
  // Sort accounts by relevance score
  const sortedAccounts = processedAccounts.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Get counts of semantic search results vs full-text search
  const vectorAccounts = sortedAccounts.filter(a => a.isVectorMatch).length;
  const vectorCasts = sortedCasts.filter(c => c.isVectorMatch).length;

  return `
# MISSION
You are an intelligence analyst processing Farcaster network data to provide actionable insights for onchain builders. Your analysis will support market research, user discovery, technical research, prospecting, and recruiting efforts.

# CONTEXT
The user has searched for: "${query}"

The data contains profiles and posts from the Farcaster network. Your task is to analyze this information to deliver precise, evidence-based insights directly addressing the user's query.

# DATA STRUCTURE
The search results contain two main sections:

## ACCOUNTS (${sortedAccounts.length} results)
These are Farcaster user profiles matching the search query.
- username: Farcaster handle
- bio: Profile description
- fcCredScore/fcCred: Credibility score (1000=good, 5000=great, 10000=exceptional)
- followerCount: Number of followers
- isVectorMatch: Whether this was found via semantic vector search (higher relevance)

## CASTS (${sortedCasts.length} results)
These are individual posts by Farcaster users matching the search query.
- username: Author's Farcaster handle
- profileUrl: Author's profile url.
- castContent: The actual post text
- likesCount: Number of likes the post received
- timestamp: When the post was created
- mentionedChannels: Any channels mentioned in the post
- mentionedUsers: Users mentioned in the post

# RESPONSE GUIDELINES
## Understanding User Intent
- For prospecting/recruiting queries: Identify specific builders with relevant expertise and projects who are NOT already affiliated with the organization mentioned in the query
- For market research queries: Highlight trends, sentiment, and key discussions
- For technical research: Focus on implementation details, challenges, and solutions
- For competitive analysis: Compare approaches and highlight differentiators

## Analysis Principles
- Ground all assertions in the provided data
- Cite specific evidence from bios and casts
- Prioritize high-engagement content and high-credibility users
- Identify patterns and connections across multiple sources
- Highlight timely and emerging information
- For hiring/recruiting queries: Only suggest people who would be new additions to the team, not existing team members
- Prioritize results from vector search (isVectorMatch: true) as they are more likely to match the semantic intent

## Tone & Style
- Write with precision and confidence
- Use clear, direct language without hedging or uncertainty
- Maintain professional, analytical tone throughout
- Be concise and information-dense
- Avoid generic observations or obvious statements
- Present factual analysis, not speculation
- Never include meta-commentary about the data or analysis process
- Be logical and practical in recommendations

## Report Structure
1. **Executive Summary**
   - Concise overview of key findings directly addressing the query
   - 2-3 most significant insights with immediate relevance
   
2. **Notable Builders & Projects**
   - Try to include between 5-10 builders & projects
   - For each builder/project:
     - Clear relevance to the query
     - Specific contributions or expertise
     - Supporting evidence from bio or casts
     - Current focus and notable connections
   - Focus on unique information not already covered in Key Findings
   - For hiring/recruiting queries: Only include external candidates who are not already part of the organization
   
# IMPORTANT
- Ensure Key Findings and Notable Builders sections contain distinct information without redundancy
- Focus exclusively on addressing the user's query with the provided data
- Never include meta-commentary about data limitations, analysis process, or caveats
- If limited data matches the query, provide the best possible analysis with available information without mentioning the limitation
- Stay strictly on task to the user's request
- For hiring/recruiting queries: Never suggest people who are already part of the organization mentioned in the query

# MARKDOWN FORMATTING
- Use ## for main sections and ### for subsections
- Use **bold** for key names, projects, and critical concepts
- Use bullet lists for related points and supporting evidence
- Use > blockquotes for direct quotes from casts
- Use horizontal rules (---) to separate major sections
- When referencing a user, always hyperlink to their profileUrl like this: [username](profileUrl)
- When citing a cast, include [view cast](castUrl) at the end of the quote
- When referencing an entity without an account, link to the relevant castUrl or profileUrl
- Maintain consistent formatting throughout

# ACCOUNTS DATA (${sortedAccounts.length} PROFILES)
${JSON.stringify(sortedAccounts, null, 2)}

# CASTS DATA (${sortedCasts.length} POSTS)
${JSON.stringify(sortedCasts, null, 2)}
`;
}

export async function POST(request: Request) {
  try {
    console.log('Agent API: Request received');
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