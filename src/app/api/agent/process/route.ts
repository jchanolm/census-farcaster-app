import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Format the data for the Deepseek prompt
function formatPrompt(query, results) {
  return `
# TASK
You are a builder intelligence assistant analyzing search results for web3 profiles.
The user has searched for: "${query}"

# INSTRUCTIONS
1. Analyze the provided search results and determine their relevance to the query
2. Write a concise summary (1-2 sentences) of the overall result set
3. List 2-3 key takeaways from the search results (max 10 words each)
4. For each result, provide:
   - A very brief relevance context explaining why this result is relevant to the query (max 20 words)
   - A boolean indicating if the result is truly relevant (mark irrelevant results as false)

Your analysis must be extremely concise, plain, direct, and in a neutral intelligence analyst tone. 
Use no wasted or unnecessary words. If a short answer suffices, it's preferred.

# SEARCH RESULTS
${JSON.stringify(results, null, 2)}

# RESPONSE FORMAT
Return your response as a JSON object with the following structure:
{
  "summary": "Overall summary of the results",
  "keyTakeaways": ["Key point 1", "Key point 2"],
  "processedResults": [
    {
      "username": "user123",
      "relevanceContext": "Why this result is relevant",
      "isRelevant": true/false
    }
  ]
}
`;
}

export async function POST(request) {
  try {
    const { query, results } = await request.json();
    
    if (!query || !results || !Array.isArray(results)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    
    console.log(`Processing ${results.length} results for query: ${query}`);
    
    // Format the prompt for the model
    const prompt = formatPrompt(query, results);
    
    // OPTION 1: Call the Deepseek model API directly
    // You'll need to add your Deepseek API key to your environment variables
    // DEEPSEEK_API_KEY and DEEPSEEK_API_ENDPOINT
    const modelResponse = await fetch(process.env.DEEPSEEK_API_ENDPOINT || 'https://api.deepseek.com/v1/chat/completions', {
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
            content: "You are an AI assistant that analyzes search results about builders in web3 and provides concise insights."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });
    
    if (!modelResponse.ok) {
      const errorText = await modelResponse.text();
      console.error('Model API error:', errorText);
      throw new Error(`Model API error: ${modelResponse.status}`);
    }
    
    const modelData = await modelResponse.json();
    
    // Extract the response content from the model's response
    const responseContent = modelData.choices[0].message.content;
    
    // Parse the JSON string from the model
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (e) {
      console.error('Failed to parse model response as JSON:', e);
      // Attempt to extract JSON if the model didn't return proper JSON
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error('Could not parse model response');
        }
      } else {
        throw new Error('Could not parse model response');
      }
    }
    
    return NextResponse.json(parsedResponse);
    
  } catch (error) {
    console.error('Agent processing error:', error);
    return NextResponse.json({ 
      error: 'Processing failed',
      detail: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}