// Utility functions for working with Google Docs API
import { AssetSectionVariable, parseAssetSections } from './assetSectionUtils';

export interface TemplateVariable {
  name: string;
  placeholder: string; // The full {{variable_name}} text
  type?: 'text' | 'number' | 'date' | 'email';
}

export interface DocumentContent {
  title: string;
  content: string;
  variables: TemplateVariable[];
  assetSections: AssetSectionVariable[];
}

/**
 * Fetch Google Doc content using Google Docs API
 */
export async function fetchDocumentContent(documentId: string, accessToken: string): Promise<DocumentContent> {
  try {
    const response = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`);
    }

    const doc = await response.json();
    const content = extractTextFromDocument(doc);
    const variables = extractVariables(content);
    const assetSections = parseAssetSections(content);

    return {
      title: doc.title || 'Untitled Document',
      content,
      variables,
      assetSections
    };
  } catch (error) {
    console.error('Error fetching document content:', error);
    throw error;
  }
}

/**
 * Extract plain text content from Google Docs document structure
 */
function extractTextFromDocument(doc: any): string {
  let text = '';
  
  if (doc.body && doc.body.content) {
    for (const element of doc.body.content) {
      if (element.paragraph) {
        for (const paragraphElement of element.paragraph.elements || []) {
          if (paragraphElement.textRun) {
            text += paragraphElement.textRun.content || '';
          }
        }
      } else if (element.table) {
        // Handle tables
        for (const row of element.table.tableRows || []) {
          for (const cell of row.tableCells || []) {
            for (const cellContent of cell.content || []) {
              if (cellContent.paragraph) {
                for (const paragraphElement of cellContent.paragraph.elements || []) {
                  if (paragraphElement.textRun) {
                    text += paragraphElement.textRun.content || '';
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  return text;
}

/**
 * Extract template variables from document content
 * Looks for patterns like {{variable_name}} or {{variable_name:type}}
 * Excludes asset section markers AND variables inside asset sections
 */
function extractVariables(content: string): TemplateVariable[] {
  // First, remove all asset section blocks to avoid extracting their internal variables
  let contentWithoutAssetSections = content;
  const assetSectionRegex = /\{\{#ASSET_SECTION:[^}]+\}\}[\s\S]*?\{\{\/#ASSET_SECTION:[^}]+\}\}/g;
  contentWithoutAssetSections = contentWithoutAssetSections.replace(assetSectionRegex, '');
  
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables: TemplateVariable[] = [];
  const seen = new Set<string>();
  
  let match;
  while ((match = variableRegex.exec(contentWithoutAssetSections)) !== null) {
    const fullMatch = match[0]; // {{variable_name}}
    const variableContent = match[1].trim(); // variable_name or variable_name:type
    
    // Skip any remaining asset section markers (safety check)
    if (variableContent.startsWith('#ASSET_SECTION:') || variableContent.startsWith('/#ASSET_SECTION:')) {
      continue;
    }
    
    // Check if variable has type specification
    const [name, type] = variableContent.split(':').map(s => s.trim());
    
    // Only add unique variables
    if (!seen.has(name)) {
      seen.add(name);
      variables.push({
        name,
        placeholder: fullMatch,
        type: (type as 'text' | 'number' | 'date' | 'email') || 'text'
      });
    }
  }
  
  return variables;
}

/**
 * Replace template variables in content with provided values
 */
export function replaceVariables(content: string, values: Record<string, string>): string {
  let result = content;
  
  for (const [key, value] of Object.entries(values)) {
    const regex = new RegExp(`\\{\\{\\s*${key}(?::[^}]*)?\\s*\\}\\}`, 'g');
    result = result.replace(regex, value || `{{${key}}}`);
  }
  
  return result;
}

/**
 * Create a new Google Doc with the filled content
 */
export async function createDocument(title: string, content: string, accessToken: string): Promise<string> {
  try {
    // First, create a new document
    const createResponse = await fetch(
      'https://docs.googleapis.com/v1/documents',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title
        })
      }
    );

    if (!createResponse.ok) {
      throw new Error(`Failed to create document: ${createResponse.statusText}`);
    }

    const newDoc = await createResponse.json();
    const documentId = newDoc.documentId;

    // Then, insert the content
    const insertResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: {
                  index: 1
                },
                text: content
              }
            }
          ]
        })
      }
    );

    if (!insertResponse.ok) {
      throw new Error(`Failed to insert content: ${insertResponse.statusText}`);
    }

    return documentId;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
}