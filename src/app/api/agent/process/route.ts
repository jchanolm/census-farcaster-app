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
Return your response as a JSON object with the following structure:
{
  "summary": "Executive summary of the search results, calling out any notable results, trends, or insights.",
  "processedResults": [
    {
      "username": "user123",
      "relevanceContext": "Detailed explanation of why this result is relevant, directly quoting text in the provided search results.,
      "isRelevant": true/false
    }
  ]
}
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
    console.log('📝 Agent API: Prompt prepared for LLM');
    
    // Call the Deepseek model API
    let modelResponse;
    let parsedResponse;
    
    try {
      console.log('🤖 Agent API: Calling LLM API...');
      // Call the Deepseek model API
      modelResponse = await fetch(process.env.DEEPSEEK_API_ENDPOINT || 'https://api.deepseek.com/v1/chat/completions', {
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
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });
      
      if (!modelResponse.ok) {
        console.log(`❌ Agent API: Model API error: ${modelResponse.status}`);
        throw new Error(`Model API error: ${modelResponse.status}`);
      }
      
      console.log('✅ Agent API: Received response from LLM API');
      const modelData = await modelResponse.json();
      
      // Extract the response content from the model's response
      const responseContent = modelData.choices[0].message.content;
      console.log('📄 Agent API: Raw response content length:', responseContent.length);
      
      // Parse the JSON string from the model
      try {
        console.log('🔍 Agent API: Parsing JSON response...');
        parsedResponse = JSON.parse(responseContent);
        console.log('✅ Agent API: Successfully parsed JSON response');
      } catch (e) {
        console.error('❌ Agent API: Failed to parse model response as JSON:', e);
        // Attempt to extract JSON if the model didn't return proper JSON
        console.log('🔄 Agent API: Attempting to extract JSON from response...');
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedResponse = JSON.parse(jsonMatch[0]);
            console.log('✅ Agent API: Successfully extracted and parsed JSON');
          } catch (jsonError) {
            console.error('❌ Agent API: Could not parse extracted JSON:', jsonError);
            throw new Error('Could not parse model response');
          }
        } else {
          console.error('❌ Agent API: No JSON-like content found in response');
          throw new Error('Could not parse model response');
        }
      }
      
    } catch (apiError) {
      console.error('❌ Agent API: API or parsing error:', apiError);
      throw new Error(`API Error: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
    }
    
    // Process the results: filter out irrelevant results and ensure all results have context
    console.log('🔍 Agent API: Processing results with agent analysis...');
    const processedResults: any[] = [];
    
    for (const result of results) {
      const agentResultData = parsedResponse.processedResults.find(
        (r: any) => r.username === result.username
      );
      
      // Only include results that have relevance context and are marked as relevant
      if (agentResultData && agentResultData.relevanceContext && agentResultData.isRelevant !== false) {
        processedResults.push({
          ...result,
          relevanceContext: agentResultData.relevanceContext,
          isRelevant: true
        });
      }
    }
    
    console.log(`✅ Agent API: Processed ${results.length} results → ${processedResults.length} relevant results`);
    if (processedResults.length === 0) {
      console.log('⚠️ Agent API: Warning - No relevant results found after processing');
    }
    
    // Return the processed response
    return NextResponse.json({
      summary: parsedResponse.summary,
      keyTakeaways: parsedResponse.keyTakeaways,
      processedResults: processedResults
    });
    
  } catch (error) {
    console.error('❌ Agent API: Processing error:', error);
    return NextResponse.json({ 
      error: 'Processing failed',
      detail: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}