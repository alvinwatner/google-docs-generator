'use client';

import { useState, useEffect } from 'react';
import { TemplateVariable, AssetSectionVariable } from '@/utils/googleDocsUtils';
import { AssetSectionData, createDefaultAssetSection } from '@/utils/assetSectionUtils';
import AssetManager from './AssetManager';

interface VariableFormProps {
  variables: TemplateVariable[];
  assetSections: AssetSectionVariable[];
  onValuesChange: (values: Record<string, string>) => void;
  onAssetSectionChange: (data: AssetSectionData) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function VariableForm({ 
  variables, 
  assetSections,
  onValuesChange, 
  onAssetSectionChange,
  onSubmit, 
  onBack, 
  isLoading = false 
}: VariableFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [assetSectionData, setAssetSectionData] = useState<AssetSectionData>({ sections: [] });
  const [activeTab, setActiveTab] = useState<'variables' | 'assets'>('variables');

  // Initialize empty values for all variables
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    variables.forEach(variable => {
      initialValues[variable.name] = '';
    });
    setValues(initialValues);
    onValuesChange(initialValues);
  }, [variables, onValuesChange]);

  // Initialize asset sections if they exist in template
  useEffect(() => {
    if (assetSections.length > 0) {
      const initialAssetData: AssetSectionData = {
        sections: [createDefaultAssetSection()]
      };
      setAssetSectionData(initialAssetData);
      onAssetSectionChange(initialAssetData);
      setActiveTab('assets'); // Start with assets if they exist
    }
  }, [assetSections, onAssetSectionChange]);

  const handleValueChange = (variableName: string, value: string) => {
    const newValues = { ...values, [variableName]: value };
    setValues(newValues);
    onValuesChange(newValues);
    
    // Clear error when user starts typing
    if (errors[variableName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[variableName];
        return newErrors;
      });
    }
  };

  const handleAssetSectionChange = (data: AssetSectionData) => {
    setAssetSectionData(data);
    onAssetSectionChange(data);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    variables.forEach(variable => {
      const value = values[variable.name]?.trim();
      
      if (!value) {
        newErrors[variable.name] = 'This field is required';
        return;
      }
      
      // Type-specific validation
      switch (variable.type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newErrors[variable.name] = 'Please enter a valid email address';
          }
          break;
        case 'number':
          if (isNaN(Number(value))) {
            newErrors[variable.name] = 'Please enter a valid number';
          }
          break;
        case 'date':
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            newErrors[variable.name] = 'Please enter a valid date';
          }
          break;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit();
    }
  };

  const getInputType = (variableType: string): string => {
    switch (variableType) {
      case 'email': return 'email';
      case 'number': return 'number';
      case 'date': return 'date';
      default: return 'text';
    }
  };

  const getInputPlaceholder = (variable: TemplateVariable): string => {
    switch (variable.type) {
      case 'email': return 'Enter email address';
      case 'number': return 'Enter number';
      case 'date': return 'Select date';
      default: return `Enter ${variable.name.replace(/_/g, ' ')}`;
    }
  };

  if (variables.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Variables Found</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          This document doesn't contain any template variables. Add variables like <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code> to your Google Doc to make it dynamic.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Back to Templates
          </button>
          <button
            onClick={onSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Continue Anyway
          </button>
        </div>
      </div>
    );
  }

  const hasAssetSections = assetSections.length > 0;
  const hasVariables = variables.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Fill Template Data
        </h3>
        <p className="text-gray-600">
          {hasVariables && hasAssetSections ? (
            `Found ${variables.length} variable${variables.length !== 1 ? 's' : ''} and ${assetSections.length} asset section${assetSections.length !== 1 ? 's' : ''} in your template.`
          ) : hasVariables ? (
            `Found ${variables.length} variable${variables.length !== 1 ? 's' : ''} in your template.`
          ) : hasAssetSections ? (
            `Found ${assetSections.length} asset section${assetSections.length !== 1 ? 's' : ''} in your template.`
          ) : (
            'No variables or asset sections found in your template.'
          )}
        </p>
      </div>

      {/* Tabs */}
      {hasAssetSections && hasVariables && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('variables')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'variables'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Variables ({variables.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('assets')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assets'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Asset Sections ({assetSections.length})
            </button>
          </nav>
        </div>
      )}

      {/* Variables Tab */}
      {(activeTab === 'variables' || !hasAssetSections) && hasVariables && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {variables.map((variable) => (
            <div key={variable.name} className="space-y-2">
              <label htmlFor={variable.name} className="block text-sm font-medium text-gray-700">
                {variable.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {variable.type && variable.type !== 'text' && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {variable.type}
                  </span>
                )}
              </label>
              <input
                type={getInputType(variable.type || 'text')}
                id={variable.name}
                name={variable.name}
                value={values[variable.name] || ''}
                onChange={(e) => handleValueChange(variable.name, e.target.value)}
                placeholder={getInputPlaceholder(variable)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors[variable.name] 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors[variable.name] && (
                <p className="text-sm text-red-600">{errors[variable.name]}</p>
              )}
              <p className="text-xs text-gray-500">
                Replaces: <code className="bg-gray-100 px-1 rounded">{variable.placeholder}</code>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Asset Sections Tab */}
      {(activeTab === 'assets' || !hasVariables) && hasAssetSections && (
        <AssetManager
          data={assetSectionData}
          onChange={handleAssetSectionChange}
          isLoading={isLoading}
        />
      )}

      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Back to Templates
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            'Generate Preview'
          )}
        </button>
      </div>

      {/* Variable Reference Help */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h4 className="text-lg font-medium text-blue-900 mb-3">
          💡 Variable Types
        </h4>
        <div className="text-blue-800 text-sm space-y-2">
          <p><strong>Basic:</strong> <code className="bg-blue-100 px-1 rounded">{'{{name}}'}</code> - Text field</p>
          <p><strong>Typed:</strong> <code className="bg-blue-100 px-1 rounded">{'{{email:email}}'}</code> - Email validation</p>
          <p><strong>Other types:</strong> <code className="bg-blue-100 px-1 rounded">{'{{age:number}}'}</code>, <code className="bg-blue-100 px-1 rounded">{'{{date:date}}'}</code></p>
        </div>
      </div>
    </form>
  );
}