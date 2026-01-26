import React, { useState } from 'react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { executiveAnalyticsApi } from '../services/executiveAnalyticsApi';
import toast from 'react-hot-toast';

interface PDFExportButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const PDFExportButton: React.FC<PDFExportButtonProps> = ({
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (isExporting || disabled) return;

    setIsExporting(true);
    const loadingToast = toast.loading('Generating executive analytics report...');

    try {
      const pdfBlob = await executiveAnalyticsApi.exportPDFReport();
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current timestamp
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '');
      link.download = `Executive_Analytics_Report_${timestamp}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      
      toast.success('Executive report downloaded successfully!', {
        id: loadingToast,
        duration: 4000,
      });
      
    } catch (error: any) {
      console.error('PDF export error:', error);
      
      let errorMessage = 'Failed to generate PDF report';
      if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to export reports';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error occurred while generating report';
      }
      
      toast.error(errorMessage, {
        id: loadingToast,
        duration: 5000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Dynamic styling based on variant and size
  const getButtonStyles = () => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-lg hover:shadow-xl',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 shadow-md hover:shadow-lg',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-500'
    };
    
    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    
    return `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;
  };

  const getIconSize = () => {
    const sizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };
    return sizes[size];
  };

  return (
    <button
      onClick={handleExportPDF}
      disabled={isExporting || disabled}
      className={getButtonStyles()}
      title="Export Executive Analytics Report as PDF"
    >
      {isExporting ? (
        <>
          <div className={`animate-spin rounded-full border-2 border-current border-t-transparent mr-2 ${getIconSize()}`} />
          Generating...
        </>
      ) : (
        <>
          <DocumentArrowDownIcon className={`mr-2 ${getIconSize()}`} />
          Export PDF Report
        </>
      )}
    </button>
  );
};

export default PDFExportButton;