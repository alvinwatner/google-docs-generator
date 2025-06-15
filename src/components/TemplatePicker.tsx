'use client';

import { useState, useEffect } from 'react';

interface Template {
  id: string;
  name: string;
  thumbnailLink?: string;
  modifiedTime: string;
  mimeType: string;
}

interface TemplatePickerProps {
  accessToken: string;
  onTemplateSelected: (template: Template) => void;
  onBack: () => void;
}

export default function TemplatePicker({ accessToken, onTemplateSelected, onBack }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadGoogleDriveTemplates();
  }, [accessToken]);

  const loadGoogleDriveTemplates = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Search for Google Docs files in user's Drive
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?` +
        `q=mimeType='application/vnd.google-apps.document'&` +
        `fields=files(id,name,thumbnailLink,modifiedTime,mimeType)&` +
        `orderBy=modifiedTime desc&` +
        `pageSize=20`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load templates: ${response.statusText}`);
      }

      const data = await response.json();
      setTemplates(data.files || []);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Failed to load templates from Google Drive. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewTemplate = () => {
    // Open Google Docs in a new tab to create a template
    window.open('https://docs.google.com/document/create', '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-700 font-medium">Loading your Google Docs templates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Templates</h3>
          <p className="text-red-700 text-sm mb-4">{error}</p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={loadGoogleDriveTemplates}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
            >
              Try Again
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Select a Google Docs Template
          </h3>
          <p className="text-gray-600">
            Choose a document that contains variables like <code>{'{{client_name}}'}</code> or <code>{'{{project_title}}'}</code>
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={createNewTemplate}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
          >
            Create New Template
          </button>
          <button
            onClick={loadGoogleDriveTemplates}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Google Docs Found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You don&apos;t have any Google Docs in your Drive yet. Create a new document with placeholder variables to get started.
          </p>
          <button
            onClick={createNewTemplate}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Your First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onTemplateSelected(template)}
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-medium text-gray-900 truncate mb-2">
                    {template.name}
                  </h4>
                  <p className="text-sm text-gray-500 mb-2">
                    Modified {formatDate(template.modifiedTime)}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Google Docs
                    </span>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Select →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
      </div>

      {/* Template Creation Help */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <h4 className="text-lg font-medium text-blue-900 mb-3">
          💡 How to Create Templates
        </h4>
        <div className="text-blue-800 text-sm space-y-2">
          <p>1. Create a new Google Doc or select an existing one</p>
          <p>2. Add placeholder variables using double curly braces: <code className="bg-blue-100 px-1 rounded">{'{{variable_name}}'}</code></p>
          <p>3. Example: &ldquo;Dear {'{{client_name}}'}, your project {'{{project_title}}'} is ready.&rdquo;</p>
          <p>4. Save the document and refresh this page to see it in the list</p>
        </div>
      </div>
    </div>
  );
}