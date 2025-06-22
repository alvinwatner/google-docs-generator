'use client';

import { useState } from 'react';
import { Section } from '@/utils/sectionTableUtils';

interface SectionFormProps {
  sectionName: string;
  initialData?: Section;
  onChange: (section: Section) => void;
}

export default function SectionForm({ sectionName, initialData, onChange }: SectionFormProps) {
  const [section, setSection] = useState<Section>(
    initialData || {
      title: sectionName,
      keyValuePairs: [{ key: '', value: '' }]
    }
  );

  const handleTitleChange = (title: string) => {
    const updatedSection = { ...section, title };
    setSection(updatedSection);
    onChange(updatedSection);
  };

  const handleKeyValueChange = (index: number, field: 'key' | 'value', value: string) => {
    const updatedPairs = [...section.keyValuePairs];
    updatedPairs[index] = { 
      ...updatedPairs[index], 
      [field]: value 
    };
    
    const updatedSection = { ...section, keyValuePairs: updatedPairs };
    setSection(updatedSection);
    onChange(updatedSection);
  };

  const addKeyValuePair = () => {
    const updatedPairs = [...section.keyValuePairs, { key: '', value: '' }];
    const updatedSection = { ...section, keyValuePairs: updatedPairs };
    setSection(updatedSection);
    onChange(updatedSection);
  };

  const removeKeyValuePair = (index: number) => {
    if (section.keyValuePairs.length <= 1) {
      return; // Keep at least one pair
    }
    
    const updatedPairs = section.keyValuePairs.filter((_, i) => i !== index);
    const updatedSection = { ...section, keyValuePairs: updatedPairs };
    setSection(updatedSection);
    onChange(updatedSection);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
      <div className="mb-4">
        <label htmlFor={`section-title-${sectionName}`} className="block text-sm font-medium text-gray-700 mb-1">
          Section Title
        </label>
        <input
          type="text"
          id={`section-title-${sectionName}`}
          value={section.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          placeholder="Enter section title"
        />
      </div>
      
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Key-Value Pairs</h4>
        
        {section.keyValuePairs.map((pair, index) => (
          <div key={index} className="flex items-start space-x-2 mb-2">
            <div className="flex-1">
              <input
                type="text"
                value={pair.key}
                onChange={(e) => handleKeyValueChange(index, 'key', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Key"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={pair.value}
                onChange={(e) => handleKeyValueChange(index, 'value', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Value"
              />
            </div>
            <button
              type="button"
              onClick={() => removeKeyValuePair(index)}
              className="p-2 text-red-600 hover:text-red-800 focus:outline-none"
              aria-label="Remove pair"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addKeyValuePair}
          className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Key-Value Pair
        </button>
      </div>
    </div>
  );
}
