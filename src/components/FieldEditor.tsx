'use client';

import { useState } from 'react';
import { AssetSection, AssetField } from '@/utils/assetSectionUtils';

interface FieldEditorProps {
  section: AssetSection;
  onChange: (section: AssetSection) => void;
  isLoading?: boolean;
}

export default function FieldEditor({ section, onChange, isLoading = false }: FieldEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleTitleChange = (title: string) => {
    onChange({
      ...section,
      title
    });
  };

  const handleFieldChange = (fieldId: string, key: string, value: string) => {
    const updatedFields = section.fields.map(field =>
      field.id === fieldId ? { ...field, [key]: value } : field
    );
    
    onChange({
      ...section,
      fields: updatedFields
    });
  };

  const handleAddField = () => {
    const newField: AssetField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      key: '',
      value: ''
    };
    
    onChange({
      ...section,
      fields: [...section.fields, newField]
    });
  };

  const handleRemoveField = (fieldId: string) => {
    if (section.fields.length <= 1) return; // Prevent removing all fields
    
    onChange({
      ...section,
      fields: section.fields.filter(field => field.id !== fieldId)
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newFields = [...section.fields];
    const draggedField = newFields[draggedIndex];
    
    // Remove the dragged field
    newFields.splice(draggedIndex, 1);
    
    // Insert at new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newFields.splice(insertIndex, 0, draggedField);
    
    onChange({
      ...section,
      fields: newFields
    });
    
    setDraggedIndex(null);
  };

  const duplicateField = (field: AssetField) => {
    const duplicatedField: AssetField = {
      ...field,
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      key: field.key ? `${field.key} (Copy)` : ''
    };
    
    const fieldIndex = section.fields.findIndex(f => f.id === field.id);
    const newFields = [...section.fields];
    newFields.splice(fieldIndex + 1, 0, duplicatedField);
    
    onChange({
      ...section,
      fields: newFields
    });
  };

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const currentIndex = section.fields.findIndex(field => field.id === fieldId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= section.fields.length) return;
    
    const newFields = [...section.fields];
    const [movedField] = newFields.splice(currentIndex, 1);
    newFields.splice(newIndex, 0, movedField);
    
    onChange({
      ...section,
      fields: newFields
    });
  };

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div>
        <label htmlFor={`title-${section.id}`} className="block text-sm font-medium text-gray-700 mb-2">
          Section Title
        </label>
        <input
          type="text"
          id={`title-${section.id}`}
          value={section.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g., Tanah dan Bangunan Rumah Tinggal"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-1">
          This title will be centered and bold in the final document
        </p>
      </div>

      {/* Fields */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Key-Value Fields ({section.fields.length})
          </label>
          <button
            type="button"
            onClick={handleAddField}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Field
          </button>
        </div>

        <div className="space-y-3">
          {section.fields.map((field, index) => (
            <div
              key={field.id}
              draggable={!isLoading}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors ${
                draggedIndex === index ? 'opacity-50' : ''
              } ${isLoading ? 'cursor-not-allowed' : 'cursor-move'}`}
            >
              <div className="flex items-start space-x-3">
                {/* Drag Handle */}
                <div className="flex-shrink-0 mt-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>

                {/* Field Inputs */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Key (Left Column)
                    </label>
                    <input
                      type="text"
                      value={field.key}
                      onChange={(e) => handleFieldChange(field.id, 'key', e.target.value)}
                      placeholder="e.g., Tanah"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Value (Right Column)
                    </label>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => handleFieldChange(field.id, 'value', e.target.value)}
                      placeholder="e.g., SHM No. 119 atas nama Rico Rusli..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Field Actions */}
                <div className="flex-shrink-0 flex flex-col space-y-1">
                  {/* Move Up */}
                  <button
                    type="button"
                    onClick={() => moveField(field.id, 'up')}
                    disabled={isLoading || index === 0}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    onClick={() => moveField(field.id, 'down')}
                    disabled={isLoading || index === section.fields.length - 1}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Duplicate */}
                  <button
                    type="button"
                    onClick={() => duplicateField(field)}
                    disabled={isLoading}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50"
                    title="Duplicate field"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => handleRemoveField(field.id)}
                    disabled={isLoading || section.fields.length <= 1}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove field"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Field Preview */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Preview in document:</p>
                <div className="bg-gray-50 p-2 rounded text-sm font-mono">
                  <span className="font-bold">{field.key || '(Key)'}</span>
                  <span className="mx-2">:</span>
                  <span>{field.value || '(Value)'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {section.fields.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-600 mb-4">No fields added yet</p>
            <button
              type="button"
              onClick={handleAddField}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add First Field
            </button>
          </div>
        )}
      </div>

      {/* Field Instructions */}
      <div className="bg-yellow-50 rounded-lg p-4">
        <h5 className="text-sm font-medium text-yellow-800 mb-2">💡 Field Tips</h5>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>• <strong>Key:</strong> The label (e.g., "Tanah", "Bangunan")</li>
          <li>• <strong>Value:</strong> The content (e.g., "SHM No. 119 atas nama...")</li>
          <li>• <strong>Drag & Drop:</strong> Reorder fields by dragging the handle</li>
          <li>• <strong>Colon Alignment:</strong> The colon (:) will be perfectly aligned in the final document</li>
        </ul>
      </div>
    </div>
  );
}