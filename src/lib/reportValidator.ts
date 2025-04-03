// Add this to a new file: src/lib/reportValidator.ts

/**
 * Utility to validate and enhance profile links in reports
 */

/**
 * Check for usernames in the report that should be linked but aren't
 * @param report - The markdown report text
 * @param knownUsernames - Array of usernames from the search results
 * @returns Enhanced report with proper links
 */
export function validateProfileLinks(report: string, knownUsernames: string[]): string {
    if (!report || !knownUsernames.length) return report;
    
    let enhancedReport = report;
    
    // First, handle @username patterns that aren't already in links
    enhancedReport = enhancedReport.replace(
      /(?<!\[)@([a-zA-Z0-9_]+)(?!\])/g, 
      '[@$1](https://warpcast.com/$1)'
    );
    
    // Create a regex pattern that will match whole words that are usernames
    // but only if they're not already part of a markdown link
    knownUsernames.forEach(username => {
      if (!username || username.length < 3) return; // Skip short usernames to avoid false positives
      
      // Match standalone username mention that isn't already in a link
      // This looks for the username as a whole word, not part of another word
      const standalonePattern = new RegExp(`\\b(?<!\\[)${username}\\b(?!\\])`, 'gi');
      
      // Replace standalone mentions with proper links
      // We exclude cases where it's in code blocks
      let inCodeBlock = false;
      const lines = enhancedReport.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        // Skip code blocks
        if (lines[i].startsWith('```')) {
          inCodeBlock = !inCodeBlock;
          continue;
        }
        
        if (!inCodeBlock && !lines[i].startsWith('    ')) {
          // Only replace if the line doesn't already contain a link to this username
          if (!lines[i].includes(`[${username}](https://warpcast.com/${username})`)) {
            lines[i] = lines[i].replace(standalonePattern, `[${username}](https://warpcast.com/${username})`);
          }
        }
      }
      
      enhancedReport = lines.join('\n');
    });
    
    return enhancedReport;
  }
  
  /**
   * Extract all usernames mentioned in the search results
   * @param results - The search results object
   * @returns Array of usernames
   */
  export function extractUsernames(results: any): string[] {
    const usernames: string[] = [];
    
    // Extract usernames from accounts
    if (results?.accounts && Array.isArray(results.accounts)) {
      results.accounts.forEach(account => {
        if (account.username) usernames.push(account.username);
      });
    }
    
    // Extract usernames from casts
    if (results?.casts && Array.isArray(results.casts)) {
      results.casts.forEach(cast => {
        if (cast.username) usernames.push(cast.username);
        
        // Also extract mentioned users from casts
        if (cast.mentionedUsers && Array.isArray(cast.mentionedUsers)) {
          cast.mentionedUsers.forEach(user => {
            if (typeof user === 'string') usernames.push(user);
          });
        }
      });
    }
    
    // Remove duplicates
    return Array.from(new Set(usernames));
  }