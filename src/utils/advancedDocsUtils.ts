// Advanced Google Docs utilities that preserve formatting

export interface TemplateVariable {
  name: string;
  placeholder: string;
  type?: 'text' | 'number' | 'date' | 'email';
}

/**
 * Copy a Google Doc to preserve all formatting
 */
export async function copyDocument(
  originalDocId: string, 
  newTitle: string, 
  accessToken: string
): Promise<string> {
  try {
    // Use Google Drive API to copy the document
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${originalDocId}/copy`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newTitle
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Copy document error:', response.status, response.statusText, errorText);
      throw new Error(`Failed to copy document: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result.id;
  } catch (error) {
    console.error('Error copying document:', error);
    throw error;
  }
}

/**
 * Find and replace variables in a document while preserving formatting
 */
export async function replaceVariablesInDocument(
  documentId: string,
  variables: Record<string, string>,
  accessToken: string
): Promise<void> {
  try {
    // Create batch update requests for each variable
    const requests = [];
    
    for (const [variableName, value] of Object.entries(variables)) {
      // Handle different variable formats
      const patterns = [
        `{{${variableName}}}`,
        `{{ ${variableName} }}`,
        `{{${variableName}:text}}`,
        `{{${variableName}:email}}`,
        `{{${variableName}:number}}`,
        `{{${variableName}:date}}`
      ];
      
      for (const pattern of patterns) {
        requests.push({
          replaceAllText: {
            containsText: {
              text: pattern,
              matchCase: false
            },
            replaceText: value || ''
          }
        });
      }
    }

    if (requests.length === 0) {
      return;
    }

    // Execute batch update
    const response = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update document: ${response.statusText} - ${errorText}`);
    }

  } catch (error) {
    console.error('Error replacing variables in document:', error);
    throw error;
  }
}

/**
 * Get document as HTML for preview (preserves some formatting)
 */
export async function getDocumentAsHtml(
  documentId: string,
  accessToken: string
): Promise<string> {
  try {
    // Export document as HTML
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
    return convertDocumentToHtml(doc);
  } catch (error) {
    console.error('Error getting document as HTML:', error);
    throw error;
  }
}

/**
 * Convert Google Docs structure to HTML (preserving basic formatting)
 */
function convertDocumentToHtml(doc: any): string {
  let html = '';
  
  if (doc.body && doc.body.content) {
    for (const element of doc.body.content) {
      if (element.paragraph) {
        html += convertParagraphToHtml(element.paragraph);
      } else if (element.table) {
        html += convertTableToHtml(element.table);
      } else if (element.sectionBreak) {
        html += '<hr>';
      }
    }
  }
  
  return html;
}

function convertParagraphToHtml(paragraph: any): string {
  let paragraphHtml = '<p';
  
  // Add paragraph styling
  if (paragraph.paragraphStyle) {
    const style = paragraph.paragraphStyle;
    const styles = [];
    
    if (style.alignment) {
      styles.push(`text-align: ${style.alignment.toLowerCase()}`);
    }
    if (style.spaceAbove) {
      styles.push(`margin-top: ${style.spaceAbove.magnitude}${style.spaceAbove.unit.toLowerCase()}`);
    }
    if (style.spaceBelow) {
      styles.push(`margin-bottom: ${style.spaceBelow.magnitude}${style.spaceBelow.unit.toLowerCase()}`);
    }
    
    if (styles.length > 0) {
      paragraphHtml += ` style="${styles.join('; ')}"`;
    }
  }
  
  paragraphHtml += '>';
  
  // Process paragraph elements
  if (paragraph.elements) {
    for (const element of paragraph.elements) {
      if (element.textRun) {
        paragraphHtml += convertTextRunToHtml(element.textRun);
      } else if (element.pageBreak) {
        paragraphHtml += '<div style="page-break-before: always;"></div>';
      }
    }
  }
  
  paragraphHtml += '</p>';
  return paragraphHtml;
}

function convertTextRunToHtml(textRun: any): string {
  let text = textRun.content || '';
  
  if (textRun.textStyle) {
    const style = textRun.textStyle;
    
    // Apply formatting
    if (style.bold) {
      text = `<strong>${text}</strong>`;
    }
    if (style.italic) {
      text = `<em>${text}</em>`;
    }
    if (style.underline) {
      text = `<u>${text}</u>`;
    }
    if (style.strikethrough) {
      text = `<s>${text}</s>`;
    }
    
    // Apply colors and fonts
    const styles = [];
    if (style.foregroundColor && style.foregroundColor.color) {
      const color = style.foregroundColor.color;
      if (color.rgbColor) {
        const rgb = color.rgbColor;
        styles.push(`color: rgb(${Math.round(rgb.red * 255)}, ${Math.round(rgb.green * 255)}, ${Math.round(rgb.blue * 255)})`);
      }
    }
    
    if (style.fontSize && style.fontSize.magnitude) {
      styles.push(`font-size: ${style.fontSize.magnitude}${style.fontSize.unit.toLowerCase()}`);
    }
    
    if (style.weightedFontFamily && style.weightedFontFamily.fontFamily) {
      styles.push(`font-family: "${style.weightedFontFamily.fontFamily}"`);
    }
    
    if (styles.length > 0) {
      text = `<span style="${styles.join('; ')}">${text}</span>`;
    }
  }
  
  return text;
}

function convertTableToHtml(table: any): string {
  let tableHtml = '<table style="border-collapse: collapse; width: 100%;">';
  
  if (table.tableRows) {
    for (const row of table.tableRows) {
      tableHtml += '<tr>';
      if (row.tableCells) {
        for (const cell of row.tableCells) {
          tableHtml += '<td style="border: 1px solid #ccc; padding: 8px;">';
          if (cell.content) {
            for (const content of cell.content) {
              if (content.paragraph) {
                tableHtml += convertParagraphToHtml(content.paragraph);
              }
            }
          }
          tableHtml += '</td>';
        }
      }
      tableHtml += '</tr>';
    }
  }
  
  tableHtml += '</table>';
  return tableHtml;
}

/**
 * Create a formatted document by copying template and replacing variables
 */
export async function createFormattedDocument(
  templateDocId: string,
  newTitle: string,
  variables: Record<string, string>,
  accessToken: string
): Promise<{ documentId: string; previewHtml: string }> {
  try {
    // Step 1: Copy the original document
    const newDocId = await copyDocument(templateDocId, newTitle, accessToken);
    
    // Step 2: Replace variables in the copied document
    await replaceVariablesInDocument(newDocId, variables, accessToken);
    
    // Step 3: Get HTML preview
    const previewHtml = await getDocumentAsHtml(newDocId, accessToken);
    
    return {
      documentId: newDocId,
      previewHtml
    };
  } catch (error) {
    console.error('Error creating formatted document:', error);
    throw error;
  }
}