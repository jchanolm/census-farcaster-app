/**
 * Process search results through the agent
 */
export async function processWithAgent(query, results) {
    try {
      console.log('🔍 Agent Handler: Starting agent processing...');
      console.log(`📊 Agent Handler: Processing ${results.length} results for query: "${query}"`);
      
      // Prepare data for the model
      const modelInput = {
        query,
        results: results.map(r => ({
          username: r.username,
          bio: r.bio,
          location: r.location || 'Unknown',
          accounts: r.accounts,
          builderCreds: r.builderCreds
        }))
      };
      
      console.log('🚀 Agent Handler: Sending request to agent API...');
      // Call the agent API endpoint
      const response = await fetch('/api/agent/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modelInput),
      });
      
      if (!response.ok) {
        console.error(`❌ Agent Handler: API responded with status: ${response.status}`);
        throw new Error(`Agent API responded with status: ${response.status}`);
      }
      
      console.log('✅ Agent Handler: Received response from agent API');
      // The API handles filtering of irrelevant results
      const agentResponse = await response.json();
      console.log(`📈 Agent Handler: Received ${agentResponse.processedResults?.length || 0} processed results`);
      
      return agentResponse;
    } catch (error) {
      console.error('❌ Agent Handler: Error during processing:', error);
      
      // Fallback: return empty results with error message
      return {
        summary: `Found ${results.length} builders matching your query, but error in processing.`,
        keyTakeaways: ['Error in agent processing, cannot show results.'],
        processedResults: [] // Return empty array on error
      };
    }
  }