'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import ReactMarkdown from 'react-markdown';

interface AgentReportProps {
  report: string;
  darkMode: boolean;
  isLoading: boolean;
}

/**
 * Extract all usernames from search results
 */
function ensureProfileLinks(markdown: string): string {
  if (!markdown) return '';
  
  // Replace @username patterns that aren't already in links
  const processedText = markdown.replace(
    /(?<!\[)@([a-zA-Z0-9_]+)(?!\])/g, 
    '[@$1](https://warpcast.com/$1)'
  );
  
  return processedText;
}

export default function AgentReport({ report, darkMode, isLoading }: AgentReportProps) {
  if (isLoading) {
    return (
      <div className={`${darkMode ? 'bg-[#121620]' : 'bg-white'} rounded-lg border ${darkMode ? 'border-[#2a3343]' : 'border-gray-200'} p-5 shadow-sm mb-6 w-full`}>
        <div className="flex items-center mb-3">
          <div className="w-4 h-4 mr-2 rounded-full bg-blue-500 animate-pulse"></div>
          <div className={`text-xs uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'} font-semibold font-mono`}>
            ANALYSIS
          </div>
        </div>
        
        <div className="my-6 flex flex-col items-center py-4">
          <div className="flex space-x-2 justify-center mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-100"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-200"></div>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Generating report...
          </p>
        </div>
      </div>
    );
  }
  
  if (!report) return null;
  
  // Use higher contrast text colors based on dark mode
  const headerColor = darkMode ? 'text-blue-300' : 'text-blue-700';
  const accentColor = darkMode ? 'text-blue-200' : 'text-blue-700';
  
  // Custom renderer for React Markdown components
  const components = {
    // Headings
    h1: ({node, ...props}) => <h1 className={`${headerColor} font-mono text-lg uppercase tracking-wider font-medium my-4`} {...props} />,
    h2: ({node, ...props}) => <h2 className={`${headerColor} font-mono text-md uppercase tracking-wider font-medium my-3`} {...props} />,
    h3: ({node, ...props}) => <h3 className={`${headerColor} font-mono text-sm uppercase tracking-wider font-medium my-3`} {...props} />,
    
    // Links (for @username mentions)
    a: ({node, ...props}) => {
      // Check if this is a username mention
      if (props.href?.startsWith('https://warpcast.com/')) {
        return (
          <a 
            className={`${accentColor} font-mono hover:underline inline-flex items-center`}
            target="_blank" 
            rel="noopener noreferrer" 
            {...props}
          >
            {props.children}
            <svg className="w-3 h-3 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
          </a>
        );
      }
      return <a className={`${accentColor} hover:underline`} target="_blank" rel="noopener noreferrer" {...props} />;
    },
    
    // Lists with custom styling
    li: ({node, ...props}) => {
      return (
        <li className="flex items-start mb-2">
          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${darkMode ? 'bg-blue-900 bg-opacity-40 text-blue-300' : 'bg-blue-100 text-blue-700'} text-xs font-medium mr-3 flex-shrink-0`}>•</span>
          <span>{props.children}</span>
        </li>
      );
    },
    
    // Add horizontal rule styling
    hr: ({node, ...props}) => <hr className={`my-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'}`} {...props} />,
    
    // Custom paragraphs
    p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
    
    // Bold text
    strong: ({node, ...props}) => <strong className={`${accentColor} font-semibold`} {...props} />,
    
    // Code blocks with syntax highlighting
    code: ({node, inline, className, children, ...props}) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={atomDark}
          language={match[1]}
          PreTag="div"
          className="rounded-md my-3"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={`${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'} px-1 py-0.5 rounded text-sm`} {...props}>
          {children}
        </code>
      );
    },
    
    // Blockquotes
    blockquote: ({node, ...props}) => (
      <blockquote className={`border-l-4 ${darkMode ? 'border-gray-700 bg-gray-800 bg-opacity-50' : 'border-gray-300 bg-gray-100 bg-opacity-50'} pl-4 py-2 my-3 rounded-r`} {...props} />
    ),
  };
  
  // Process username mentions before passing to ReactMarkdown
  const processedReport = ensureProfileLinks(report);
  
  return (
    <div className={`${darkMode ? 'bg-[#121620]' : 'bg-white'} rounded-lg border ${darkMode ? 'border-[#2a3343]' :'border-gray-200'} p-5 shadow-sm mb-6 w-full`}>
      <div className="flex items-center mb-5">
        <div className="w-4 h-4 mr-2 bg-blue-500 rounded-sm"></div>
        <div className={`text-xs uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'} font-semibold font-mono`}>
          FINDINGS
        </div>
      </div>
      
      <div className={`text-sm ${darkMode ? 'text-gray-100' : 'text-gray-800'} font-sans leading-relaxed`}>
        <ReactMarkdown 
          components={components}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
        >
          {processedReport}
        </ReactMarkdown>
      </div>
    </div>
  );
}