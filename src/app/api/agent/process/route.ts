import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Format the data for the AI prompt
function formatPrompt(query: string, results: any[]) {
  return `
# MISSION
You are an intelligence analyst processing Farcaster network data to provide actionable insights for onchain builders. Your analysis will support market research, user discovery, technical research, prospecting, and recruiting efforts.

# CONTEXT
The user has searched for: "${query}"

The data contains profiles and posts from the Farcaster network. Your task is to analyze this information to deliver precise, evidence-based insights directly addressing the user's query.

# DATA STRUCTURE
The search results contain:
- username: Farcaster handle
- bio: Profile description including fcCredScore (1000=good, 5000=great, 10000=exceptional) and followerCount
- castText: User posts with engagement metrics (likesCount, etc.)

# RESPONSE GUIDELINES
## Understanding User Intent
- For prospecting/recruiting queries: Identify specific builders with relevant expertise and projects
- For market research queries: Highlight trends, sentiment, and key discussions
- For technical research: Focus on implementation details, challenges, and solutions
- For competitive analysis: Compare approaches and highlight differentiators

## Analysis Principles
- Ground all assertions in the provided data
- Cite specific evidence from bios and casts
- Prioritize high-engagement content and high-credibility users
- Identify patterns and connections across multiple sources
- Highlight timely and emerging information

## Tone & Style
- Write with precision and confidence
- Use clear, direct language without hedging or uncertainty
- Maintain professional, analytical tone throughout
- Be concise and information-dense
- Avoid generic observations or obvious statements
- Present factual analysis, not speculation

## Report Structure
1. **Executive Summary**
   - Concise overview of key findings directly addressing the query
   - 2-3 most significant insights with immediate relevance
   
2. **Key Findings**
   - Organized by theme or significance
   - Each finding supported by specific evidence
   - Highlight unexpected patterns or notable contradictions
   
3. **Relevant Builders & Projects**
   - For each builder/project:
     - Clear relevance to the query
     - Specific contributions or expertise
     - Supporting evidence from bio or casts
     - Current focus and notable connections
   
4. **Strategic Implications** (when appropriate)
   - Actionable takeaways
   - Emerging opportunities
   - Potential challenges or considerations

# MARKDOWN FORMATTING
- Use ## for main sections and ### for subsections
- Use **bold** for key names, projects, and critical concepts
- Use bullet lists for related points and supporting evidence
- Use > blockquotes for direct quotes from casts
- Use horizontal rules (---) to separate major sections
- Format links as [Username](https://warpcast.com/username)
- Link to specific casts as [View cast](https://warpcast.com/username/hash)
- Maintain consistent formatting throughout

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