'use client';

import { useState } from 'react';
import { 
  AssetSection, 
  AssetSectionData, 
  createDefaultAssetSection,
  validateAssetSection 
} from '@/utils/assetSectionUtils';
import FieldEditor from './FieldEditor';

interface AssetManagerProps {
  data: AssetSectionData;
  onChange: (data: AssetSectionData) => void;
  isLoading?: boolean;
}

export default function AssetManager({ data, onChange, isLoading = false }: AssetManagerProps) {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const handleAddSection = () => {
    const newSection = createDefaultAssetSection();
    const newData = {
      ...data,
      sections: [...data.sections, newSection]
    };
    onChange(newData);
    
    // Auto-expand the new section
    setExpandedSections(prev => new Set([...prev, newSection.id]));
  };

  const handleRemoveSection = (sectionId: string) => {
    const newData = {
      ...data,
      sections: data.sections.filter(section => section.id !== sectionId)
    };
    onChange(newData);
    
    // Remove from expanded sections
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(sectionId);
      return newSet;
    });
    
    // Clear errors for removed section
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[sectionId];
      return newErrors;
    });
  };

  const handleSectionChange = (updatedSection: AssetSection) => {
    const newData = {
      ...data,
      sections: data.sections.map(section => 
        section.id === updatedSection.id ? updatedSection : section
      )
    };
    onChange(newData);
    
    // Validate and update errors
    const sectionErrors = validateAssetSection(updatedSection);
    setErrors(prev => ({
      ...prev,
      [updatedSection.id]: sectionErrors
    }));
  };

  const toggleSectionExpansion = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const duplicateSection = (section: AssetSection) => {
    const duplicatedSection: AssetSection = {
      ...section,
      id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${section.title} (Copy)`,
      fields: section.fields.map(field => ({
        ...field,
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }))
    };
    
    const newData = {
      ...data,
      sections: [...data.sections, duplicatedSection]
    };
    onChange(newData);
    
    // Auto-expand the duplicated section
    setExpandedSections(prev => new Set([...prev, duplicatedSection.id]));
  };

  const getTotalErrors = () => {
    return Object.values(errors).flat().length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Asset Sections</h3>
          <p className="text-gray-600 mt-1">
            Manage property/asset sections with professional formatting
          </p>
          {getTotalErrors() > 0 && (
            <p className="text-red-600 text-sm mt-2">
              ⚠️ {getTotalErrors()} validation error{getTotalErrors() !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
        
        <button
          type="button"
          onClick={handleAddSection}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Asset Section
        </button>
      </div>

      {data.sections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="max-w-md mx-auto">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Asset Sections</h4>
            <p className="text-gray-600 mb-4">
              Add your first asset section to define property details with professional formatting.
            </p>
            <button
              type="button"
              onClick={handleAddSection}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add First Section
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {data.sections.map((section, index) => {
            const isExpanded = expandedSections.has(section.id);
            const sectionErrors = errors[section.id] || [];
            
            return (
              <div 
                key={section.id} 
                className={`border rounded-lg overflow-hidden ${
                  sectionErrors.length > 0 ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}
              >
                {/* Section Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => toggleSectionExpansion(section.id)}
                        className="flex items-center text-gray-700 hover:text-gray-900"
                      >
                        <svg 
                          className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {section.title || `Asset Section ${index + 1}`}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
                          {sectionErrors.length > 0 && (
                            <span className="text-red-600 ml-2">
                              • {sectionErrors.length} error{sectionErrors.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => duplicateSection(section)}
                        disabled={isLoading}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
                        title="Duplicate section"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(section.id)}
                        disabled={isLoading || data.sections.length === 1}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
                        title="Remove section"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {sectionErrors.length > 0 && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-md">
                      <p className="text-sm font-medium text-red-800 mb-1">Validation Errors:</p>
                      <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                        {sectionErrors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {/* Section Content */}
                {isExpanded && (
                  <div className="p-6">
                    <FieldEditor
                      section={section}
                      onChange={handleSectionChange}
                      isLoading={isLoading}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Asset Section Instructions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h4 className="text-lg font-medium text-blue-900 mb-3">
          💡 How Asset Sections Work
        </h4>
        <div className="text-blue-800 text-sm space-y-2">
          <p><strong>Professional Formatting:</strong> Each section creates a perfectly aligned table with colon spacing.</p>
          <p><strong>Multiple Assets:</strong> Add multiple sections for different properties or assets.</p>
          <p><strong>Custom Fields:</strong> Add, remove, or reorder key-value pairs within each section.</p>
          <p><strong>Template Integration:</strong> Use <code className="bg-blue-100 px-1 rounded">{'{{#ASSET_SECTION:name}}'}</code> markers in your Google Docs template.</p>
        </div>
      </div>
    </div>
  );
}