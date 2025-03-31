interface ProcessedResult {
    username: string;
    relevanceContext: string;
    isRelevant: boolean;
    [key: string]: unknown;
  }
  
  interface AgentResponse {
    summary: string;
    keyTakeaways: string[];
    processedResults: ProcessedResult[];
  }
  
  /**
   * Process search results through the agent
   */
  export async function processWithAgent(query: string, results: any[]): Promise<any> {
    try {
      console.log('🔍 Agent Handler: Starting agent processing...');
      console.log(`📊 Agent Handler: Processing ${results.length} results for query: "${query}"`);
      
      // Pass raw results directly to the agent API without transformation
      const modelInput = {
        query,
        results
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
      
      // Return the raw text from the response
      const reportText = await response.text();
      return {
        reportText,
        summary: "Analysis complete",
        processedResults: []
      };
      
    } catch (error) {
      console.error('❌ Agent Handler: Error during processing:', error);
      
      // Fallback: return error message
      return {
        reportText: `Error during analysis: ${error instanceof Error ? error.message : String(error)}`,
        summary: `Error analyzing ${results.length} results.`,
        processedResults: []
      };
    }
  }