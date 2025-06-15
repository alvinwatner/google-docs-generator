'use client';

import { useState } from 'react';
import TemplatePicker from './TemplatePicker';

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

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        {currentStep === 'template' && (
          <TemplatePicker
            accessToken={user.accessToken}
            onTemplateSelected={(template) => {
              setSelectedTemplate(template);
              setCurrentStep('form');
            }}
            onBack={() => {
              // No back action from template step
            }}
          />
        )}

        {currentStep === 'form' && selectedTemplate && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Fill Template Variables
                </h3>
                <p className="text-gray-600">
                  Template: <span className="font-medium">{selectedTemplate.name}</span>
                </p>
              </div>
              <button
                onClick={() => setCurrentStep('template')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Change Template
              </button>
            </div>
            
            {/* Form fields will be dynamically generated based on template variables */}
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  📝 Loading template variables from <strong>{selectedTemplate.name}</strong>...
                </p>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentStep('template')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep('preview')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Preview Document
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'preview' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Document Preview
            </h3>
            <p className="text-gray-600 mb-8">
              Review your document before downloading
            </p>
            
            {/* Preview will go here */}
            <div className="border border-gray-300 rounded-lg p-8 mb-6 min-h-96 bg-gray-50">
              <p className="text-center text-gray-500">
                Google Docs preview will appear here
              </p>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentStep('form')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Back to Form
              </button>
              <button className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                Download PDF
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Save to Drive
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}