import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Format the data for the Deepseek prompt
function formatPrompt(query: string, results: any[]) {
  return `
# TASK
You are a builder intelligence assistant analyzing search results for web3 and Farcaster profiles.
The user has searched for: "${query}"

# INSTRUCTIONS
Identify users referenced in provided search results before and explain how they are relevant to the user's query.
Tone / Style of an intelligence analyst.
- Direct, active voice
- Clear, concise neutral
- Avoid generalities, truisms, overstatement, stating the obvious
- Strong nouns/verbs, every word should have a purpose

# SEARCH RESULTS
${JSON.stringify(results, null, 2)}

# RESPONSE FORMAT
Write a plain-text intelligence-style report with the following sections:
1. EXECUTIVE SUMMARY
2. KEY INSIGHTS
3. RELEVANT SUBJECTS (including username, relevance context, and notable contributions)

Format your response as plain text rather than JSON.
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
              stream: true
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