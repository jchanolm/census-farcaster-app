import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Format the data for the AI prompt
function formatPrompt(query: string, results: any[]) {
  return `
# MISSION
You are an intelligence analyst processing Farcaster network data to identify relevant web3 builders and projects for lead generation and market research.

# CONTEXT
The user has searched for: "${query}"

The data contains profiles from the Farcaster network, including usernames, bios, and text from their posts (casts). Your task is to analyze this data to identify the most relevant builders and projects for the user's query.

Avoid contrivances and leaps of logic.

# DATA STRUCTURE
The search results contain the following fields:
- username: The Farcaster handle of the user
- bio: User's profile description, including their fcCredScore (1000 is good, 5000 is great 10000 is exceptional) calculated based off of incoming engagement by OG users) and followerCount. 
- castText: Casts with information about the user's relevance. They also have useful metadata (i.e. likesCount). Draw heavily on these casts.

When you give an answer start with a paragraph quoting from casts you received.


# RESPONSE GUIDELINES
## Understanding User Intent
- For specific prospecting queries (e.g., "solidity developers working on L2s"), focus on identifying specific builders and their relevant work
- For open-ended queries (e.g., "what's happening with NFTs"), adopt a more exploratory approach that identifies trends and discussions
- Adapt your format based on query intent - builder-focused for prospecting, content-focused for trend analysis

## Tone & Style
- Write like an intelligence analyst: clear, direct, unpretentious
- Use full sentences
- Use active voice and strong, specific nouns/verbs
- Be concise - every word should have a purpose
- Avoid generic observations, truisms, and obvious statements
- Be factual and evidence-based, not promotional
- Use crisp, professional language
- When quoting casts, be selective - choose only the most revealing excerpts

## Response Format
1. **Summary + Key Insights**
   - Concise overview of key patterns directly relevant to the query
   - Highlight what's most notable/actionable for the user
   - Avoid generic statements that could apply to any query
   - Focus on unexpected connections, emerging patterns, or actionable intelligence
   - Each insight should provide a genuinely new perspective the user couldn't easily infer

3. **Relevant Builders & Projects**
   - For builder-focused searches:
     - Username with styling for emphasis, linking to user profile: https://warpcast.com/username 
     - You may extract + reference entities who you find in the text of casts/posts even if we don't have Account records for them.
     - Clear relevance assessment (WHY this person matters for the query)
     - Evidence from specific bio elements or cast content that demonstrates relevance
     - Link directly to their most pertinent casts: https://warpcast.com/username/hash
   
   - For trend/topic searches:
     - Organize by sub-topics or viewpoints rather than just listing builders
     - Group related casts to show conversation threads or competing perspectives
     - Highlight timestamp patterns if timing is relevant (e.g., recent surge in discussion)

# MARKDOWN FORMATTING GUIDELINES
- Use headings (##, ###) for clear section organization
- Use bold (**text**) for key names and important concepts
- Use bullet points for insights and key points
- Use horizontal rules (---) to separate major sections
- Do NOT use emojis or icons
- Maintain professional formatting throughout
- Links should be formatted as [Username](https://warpcast.com/username)

# DATA PAYLOAD
${JSON.stringify(results, null, 2)}
`;
}

export async function POST(request: Request) {
  try {
    console.log('Agent API: Request received');
    const { originalQuery, query, results } = await request.json();
    
    if (!query || !results || !Array.isArray(results)) {
      console.log('Agent API: Invalid input', { query, resultsProvided: !!results, isArray: Array.isArray(results) });
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    
    console.log(`Agent API: Processing ${results.length} results for query: "${query}"`);
    
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