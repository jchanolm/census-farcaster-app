import { SearchResult } from '@/types/search';

/**
 * Interface for the agent's response
 */
export interface AgentResponse {
  summary: string;
  keyTakeaways: string[];
  processedResults: ProcessedSearchResult[];
}

/**
 * Interface for processed search results with additional context
 */
export interface ProcessedSearchResult extends SearchResult {
  relevanceContext: string;
  isRelevant: boolean;
}

/**
 * Process search results through the agent
 */
export async function processWithAgent(
  query: string,
  results: SearchResult[]
): Promise<AgentResponse> {
  try {
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
    
    // Call the agent API endpoint
    const response = await fetch('/api/agent/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modelInput),
    });
    
    if (!response.ok) {
      throw new Error(`Agent API responded with status: ${response.status}`);
    }
    
    const agentResponse = await response.json();
    
    // Merge the agent's analysis with our original results
    const processedResults = results.map(result => {
      const agentResultData = agentResponse.processedResults.find(
        (r: any) => r.username === result.username
      );
      
      return {
        ...result,
        relevanceContext: agentResultData?.relevanceContext || 'No context provided',
        isRelevant: agentResultData?.isRelevant ?? true
      };
    });
    
    // Filter out irrelevant results if the agent marked any as irrelevant
    const filteredResults = processedResults.filter(r => r.isRelevant);
    
    return {
      summary: agentResponse.summary,
      keyTakeaways: agentResponse.keyTakeaways,
      processedResults: filteredResults
    };
  } catch (error) {
    console.error('Agent processing error:', error);
    
    // Fallback: return original results with minimal processing
    return {
      summary: `Found ${results.length} builders matching your query.`,
      keyTakeaways: ['Error in agent processing, showing unfiltered results.'],
      processedResults: results.map(result => ({
        ...result,
        relevanceContext: 'No context available due to processing error',
        isRelevant: true
      }))
    };
  }
}