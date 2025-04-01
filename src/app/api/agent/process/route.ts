import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Format the data for the Deepseek prompt
function formatPrompt(query: string, results: any[]) {
  return `
# MISSION
You are an intelligence analyst processing Farcaster network data to identify relevant web3 builders and projects for lead generation and market research.

# CONTEXT
The user has searched for: "${query}"

The data contains profiles from the Farcaster network, including usernames, bios, and text from their posts (casts). Your task is to analyze this data to identify the most relevant builders and projects for the user's query.

# DATA STRUCTURE
The search results contain the following fields:
- username: The Farcaster handle of the user
- bio: User's profile description
- castText: Array of the user's recent posts
- pfp: Profile picture URL (if available)
- totalScore: Relevance score (higher is more relevant)

# RESPONSE GUIDELINES
## Tone & Style
- Stay focused on the user's query and how your analysis is resposnive to it.
- Write like an intelligence analyst: clear, direct, unpretentious
- Use active voice and strong nouns/verbs
- Be concise and precise - every word should have a purpose
- Avoid truisms, generalities, and obvious statements
- Be factual and evidence-based, not promotional
- Use crisp, professional language

## Response Format
1. **Summary** (2-3 sentences)
   - Concise overview of key patterns and insights
   - Identification of most relevant results
   - Highlight any notable trends in the data

2. **Insights, Patterns, Trends** (3-5 bullet points)
   - Most significant observations related to the query
   - Patterns, connections, or opportunities identified

3. **RELEVANT BUILDERS & Casts** (formatted list)
   Place each relevant builder / groups of related and relevant casts into a card.
   Searches for builders should be builder-focused. More open-ended queries might be more cast-focused.
   - Username with styling for emphasis, linking to user profile: https://warpcast.com/username 
   - Relevance indicator using emojis, (be consistent):
   - Brief relevance assessment (1-2 sentences)
   - Evidence from the data associated to them, i.e. bio, casts, etc (you can link to cast with https://warpcast.com/username/hash) or bio (2-3 bullet points of direct evidence)
   - Clear separation between different builders

# TECHNICAL FORMATTING
- Be crisp and inventive with your fomratting. You may use bullets, emojis, dividers, info boxes, text tables, whatever you think will be effective.
- Organize builder profiles with clear visual hierarchy.
- Insert a divider between builders 

The final output will be displayed in a card-based interface with borders separating each builder profile.

If the user's query doesn't require an extensive list of builders, that's fine. 

# DATA PAYLOAD
${JSON.stringify(results, null, 2)}
`;
}

export async function POST(request: Request) {
  try {
    console.log('🔍 Agent API: Request received');
    const { query, results } = await request.json();
    
    if (!query || !results || !Array.isArray(results)) {
      console.log('❌ Agent API: Invalid input', { query, resultsProvided: !!results, isArray: Array.isArray(results) });
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    
    console.log(`📊 Agent API: Processing ${results.length} results for query: "${query}"`);
    
    // Format the prompt for the model
    const prompt = formatPrompt(query, results);
    
    // Set up streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('🤖 Agent API: Starting LLM streaming...');
          
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
              max_tokens: 8192
            })
          });
          
          if (!response.ok) {
            throw new Error(`Model API error: ${response.status}`);
          }
          
          // Stream the response
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No stream available from API response');
          }
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          
          controller.close();
          
        } catch (error) {
          console.error('❌ Agent API streaming error:', error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          controller.enqueue(encoder.encode(`Error: ${errorMessage}`));
          controller.close();
        }
      }
    });
    
    // Return the streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
    
  } catch (error) {
    console.error('❌ Agent API: Processing error:', error);
    return NextResponse.json({ 
      error: 'Processing failed',
      detail: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}