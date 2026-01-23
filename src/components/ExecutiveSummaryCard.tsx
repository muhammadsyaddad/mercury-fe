import React from 'react';
import { DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';

interface ExecutiveSummaryCardProps {
  summary: string;
  lastUpdated?: Date;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({ 
  summary, 
  lastUpdated = new Date() 
}) => {
  const formatSummary = (text: string) => {
    // Split by double newlines to get paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      const trimmed = paragraph.trim();
      
      // Check if it's a section header (starts and ends with **)
      if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.includes(':')) {
        const headerText = trimmed.slice(2, -2);
        return (
          <h4 key={index} className="font-bold text-gray-900 text-base mb-2 mt-4 first:mt-0">
            {headerText}
          </h4>
        );
      }
      
      // Format paragraph with inline bold text
      const formatInlineBold = (text: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, partIndex) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2);
            return (
              <strong key={partIndex} className="font-semibold text-gray-900">
                {boldText}
              </strong>
            );
          }
          return part;
        });
      };
      
      // Regular paragraph with potential inline formatting
      return (
        <p key={index} className="text-gray-700 text-sm leading-relaxed mb-3">
          {formatInlineBold(trimmed)}
        </p>
      );
    });
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <DocumentTextIcon className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Executive Summary</h3>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <ClockIcon className="w-4 h-4" />
          <span>Updated {formatLastUpdated(lastUpdated)}</span>
        </div>
      </div>

      <div className="prose max-w-none">
        {summary ? (
          <div className="space-y-1">
            {formatSummary(summary)}
          </div>
        ) : (
          <div className="text-center py-8">
            <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Generating executive summary...</p>
          </div>
        )}
      </div>

      {/* Quick Action Items */}
      {summary && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2">Key Takeaways</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Review detailed insights above for actionable recommendations
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Monitor location performance for operational optimization
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Track predictive trends for strategic planning
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};