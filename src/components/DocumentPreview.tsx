'use client';

import { useState, useEffect } from 'react';
import { createFormattedDocument, getDocumentAsHtml } from '@/utils/advancedDocsUtils';
import { Section } from '@/utils/sectionTableUtils';

interface DocumentPreviewProps {
  title: string;
  templateDocId: string;
  originalContent: string;
  previewContent: string;
  values: Record<string, string>;
  sectionValues: Record<string, Section>;
  accessToken: string;
  onBack: () => void;
}

export default function DocumentPreview({ 
  title, 
  templateDocId,
  originalContent, 
  previewContent, 
  values, 
  sectionValues,
  accessToken, 
  onBack 
}: DocumentPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [generatedDocUrl, setGeneratedDocUrl] = useState<string>('');
  const [formattedPreview, setFormattedPreview] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Generate formatted preview when component loads
  useEffect(() => {
    const generatePreview = async () => {
      if (Object.keys(values).length === 0 && Object.keys(sectionValues).length === 0) return;
      
      setIsLoadingPreview(true);
      try {
        const tempTitle = `${title} - Preview ${Date.now()}`;
        const { documentId, previewHtml } = await createFormattedDocument(
          templateDocId,
          tempTitle,
          values,
          accessToken
        );
        
        // Process section variables if any exist
        if (Object.keys(sectionValues).length > 0) {
          console.log('Processing section variables for preview:', sectionValues);
          
          try {
            const sectionsResponse = await fetch('/api/docs/sections', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                documentId,
                accessToken,
                sections: sectionValues,
              }),
            });
            
            const responseData = await sectionsResponse.json();
            console.log('Preview sections API response:', responseData);
            
            if (!sectionsResponse.ok) {
              throw new Error(`Failed to replace section variables in preview: ${JSON.stringify(responseData)}`);
            }
            
            // Get the updated HTML after section processing
            const updatedPreviewHtml = await getDocumentAsHtml(documentId, accessToken);
            setFormattedPreview(updatedPreviewHtml);
          } catch (sectionError) {
            console.error('Error processing section variables in preview:', sectionError);
            setFormattedPreview(previewHtml); // Use preview without sections
          }
        } else {
          setFormattedPreview(previewHtml);
        }
        
        // Clean up the temporary preview document
        // Note: In production, you might want to keep this for faster re-generation
        // or implement a cleanup mechanism
        
      } catch (err) {
        console.error('Error generating preview:', err);
        setError('Failed to generate formatted preview. Using basic preview.');
        // Fallback to basic preview if formatted preview fails
        setFormattedPreview('');
      } finally {
        setIsLoadingPreview(false);
      }
    };

    generatePreview();
  }, [templateDocId, values, sectionValues, accessToken, title]);

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      setError('');
      
      // Create a formatted document with the filled content
      const newTitle = `${title} - Generated ${new Date().toLocaleDateString()}`;
      const { documentId } = await createFormattedDocument(
        templateDocId,
        newTitle,
        values,
        accessToken
      );
      
      // Replace section variables with tables
      if (Object.keys(sectionValues).length > 0) {
        console.log('Processing section variables:', sectionValues);
        console.log('Document ID for sections:', documentId);
        
        try {
          const sectionsResponse = await fetch('/api/docs/sections', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              documentId,
              accessToken,
              sections: sectionValues,
            }),
          });
          
          const responseData = await sectionsResponse.json();
          console.log('Sections API response:', responseData);
          
          if (!sectionsResponse.ok) {
            throw new Error(`Failed to replace section variables with tables: ${JSON.stringify(responseData)}`);
          }
        } catch (error) {
          console.error('Error processing section tables:', error);
          throw error;
        }
      } else {
        console.log('No section values to process');
      }
      
      // Export as PDF
      const pdfUrl = `https://docs.googleapis.com/v1/documents/${documentId}/export?format=pdf`;
      
      // Create download link with authorization
      const response = await fetch(pdfUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${newTitle}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToDrive = async () => {
    try {
      setIsGenerating(true);
      setError('');
      
      // Create a formatted document with the filled content
      const newTitle = `${title} - Generated ${new Date().toLocaleDateString()}`;
      const { documentId } = await createFormattedDocument(
        templateDocId,
        newTitle,
        values,
        accessToken
      );
      
      const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;
      setGeneratedDocUrl(docUrl);
      
      // Open the new document in a new tab
      window.open(docUrl, '_blank');
      
    } catch (err) {
      console.error('Error saving to Drive:', err);
      setError('Failed to save to Google Drive. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Format content for display with proper line breaks
  const formatContentForDisplay = (content: string): string => {
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Document Preview
          </h3>
          <p className="text-gray-600">
            Review your document before downloading or saving to Drive
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Template: <span className="font-medium">{title}</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {generatedDocUrl && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 text-sm">
            ✅ Document saved to Google Drive! 
            <a 
              href={generatedDocUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-2 underline hover:text-green-900"
            >
              Open in Google Docs
            </a>
          </p>
        </div>
      )}

      {/* Document Preview */}
      <div className="border border-gray-300 rounded-lg mb-6 bg-white shadow-sm">
        {/* Document Header */}
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
          <h4 className="text-lg font-semibold text-gray-900">
            {title} - Preview
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            {Object.keys(values).length} variable{Object.keys(values).length !== 1 ? 's' : ''} filled
          </p>
        </div>
        
        {/* Document Content */}
        <div className="p-8 min-h-96 max-h-96 overflow-y-auto">
          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Generating formatted preview...</span>
              </div>
            </div>
          ) : formattedPreview ? (
            <div 
              className="prose prose-sm max-w-none leading-relaxed text-gray-900"
              dangerouslySetInnerHTML={{ 
                __html: formattedPreview
              }}
            />
          ) : (
            <div 
              className="prose prose-sm max-w-none leading-relaxed text-gray-900"
              dangerouslySetInnerHTML={{ 
                __html: formatContentForDisplay(previewContent || 'No content available') 
              }}
            />
          )}
        </div>
        
        {/* Variable Summary */}
        {Object.keys(values).length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Variables Used:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(values).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {`{{${key}}}`}
                  </code>
                  <span className="text-sm text-gray-600">→</span>
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {value || '(empty)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          disabled={isGenerating}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Back to Form
        </button>
        
        <div className="flex space-x-4">
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </>
            )}
          </button>
          
          <button
            onClick={handleSaveToDrive}
            disabled={isGenerating}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Save to Drive
              </>
            )}
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h4 className="text-lg font-medium text-blue-900 mb-3">
          📄 Export Options
        </h4>
        <div className="text-blue-800 text-sm space-y-2">
          <p><strong>Download PDF:</strong> Creates a PDF file and downloads it to your computer</p>
          <p><strong>Save to Drive:</strong> Creates a new Google Doc in your Drive with the filled content</p>
          <p><strong>Note:</strong> Both options create a new document - your original template remains unchanged</p>
        </div>
      </div>
    </div>
  );
}