'use client';

import { useState } from 'react';

interface DocumentGeneratorProps {
  user: any;
  onSignOut: () => void;
}

export default function DocumentGenerator({ user, onSignOut }: DocumentGeneratorProps) {
  const [currentStep, setCurrentStep] = useState<'template' | 'form' | 'preview'>('template');

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
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Select a Google Docs Template
            </h3>
            <p className="text-gray-600 mb-8">
              Choose a Google Docs template that contains placeholder variables like {{`{client_name}`}} or {{`{project_title}`}}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Template selection will go here */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Browse Templates
                </h4>
                <p className="text-gray-600 text-sm mb-4">
                  Select from your Google Drive
                </p>
                <button 
                  onClick={() => setCurrentStep('form')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Browse Drive
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'form' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Fill Template Variables
            </h3>
            <p className="text-gray-600 mb-8">
              Provide values for the placeholder variables found in your template
            </p>
            
            {/* Form fields will go here */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter client name"
                />
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