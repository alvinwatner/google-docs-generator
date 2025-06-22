'use client';

import { useState } from 'react';
import TemplatePicker from './TemplatePicker';
import VariableForm from './VariableForm';
import DocumentPreview from './DocumentPreview';
import { fetchDocumentContent, replaceVariables, type DocumentContent } from '@/utils/googleDocsUtils';
import { AssetSectionData } from '@/utils/assetSectionUtils';

interface Template {
  id: string;
  name: string;
  thumbnailLink?: string;
  modifiedTime: string;
  mimeType: string;
}

interface DocumentGeneratorProps {
  user: any;
  onSignOut: () => void;
}

export default function DocumentGenerator({ user, onSignOut }: DocumentGeneratorProps) {
  const [currentStep, setCurrentStep] = useState<'template' | 'form' | 'preview'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [documentContent, setDocumentContent] = useState<DocumentContent | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [assetSectionData, setAssetSectionData] = useState<AssetSectionData>({ sections: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSignOut = () => {
    // Clear stored tokens
    localStorage.removeItem('google_access_token');
    
    // Revoke Google tokens
    if (user.accessToken) {
      fetch(`https://oauth2.googleapis.com/revoke?token=${user.accessToken}`, {
        method: 'POST',
      });
    }
    
    onSignOut();
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with user info */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src={user.picture} 
              alt={user.name}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Welcome, {user.name}
              </h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Step Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-8">
          {[
            { key: 'template', label: 'Select Template', number: 1 },
            { key: 'form', label: 'Fill Form', number: 2 },
            { key: 'preview', label: 'Preview & Export', number: 3 },
          ].map((step) => (
            <div key={step.key} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step.number}
              </div>
              <span className={`ml-3 text-sm font-medium ${
                currentStep === step.key ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-700 font-medium">Loading template content...</span>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Template</h3>
            <p className="text-red-700 text-sm mb-6">{error}</p>
            <button
              onClick={() => {
                setError('');
                setCurrentStep('template');
              }}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Back to Templates
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow-sm p-8">
        {currentStep === 'template' && (
          <TemplatePicker
            accessToken={user.accessToken}
            onTemplateSelected={async (template) => {
              setSelectedTemplate(template);
              setIsLoading(true);
              setError('');
              
              try {
                const content = await fetchDocumentContent(template.id, user.accessToken);
                setDocumentContent(content);
                setCurrentStep('form');
              } catch (err) {
                console.error('Error fetching document content:', err);
                setError('Failed to load template content. Please try again.');
              } finally {
                setIsLoading(false);
              }
            }}
            onBack={() => {
              // No back action from template step
            }}
          />
        )}

        {currentStep === 'form' && selectedTemplate && documentContent && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {documentContent.title}
                </h3>
                <p className="text-gray-600">
                  Template: <span className="font-medium">{selectedTemplate.name}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setCurrentStep('template');
                  setDocumentContent(null);
                  setVariableValues({});
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Change Template
              </button>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            
            <VariableForm
              variables={documentContent.variables}
              assetSections={documentContent.assetSections}
              onValuesChange={setVariableValues}
              onAssetSectionChange={setAssetSectionData}
              onSubmit={() => setCurrentStep('preview')}
              onBack={() => {
                setCurrentStep('template');
                setDocumentContent(null);
                setVariableValues({});
                setAssetSectionData({ sections: [] });
              }}
              isLoading={isLoading}
            />
          </div>
        )}

        {currentStep === 'preview' && selectedTemplate && documentContent && (
          <DocumentPreview
            title={documentContent.title}
            templateDocId={selectedTemplate.id}
            originalContent={documentContent.content}
            previewContent={replaceVariables(documentContent.content, variableValues)}
            values={variableValues}
            assetSectionData={assetSectionData}
            accessToken={user.accessToken}
            onBack={() => setCurrentStep('form')}
          />
        )}
        </div>
      )}
    </div>
  );
}