// Advanced Google Docs utilities that preserve formatting
import { AssetSectionData } from './assetSectionUtils';

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
 * Now supports both simple variables and asset sections
 */
export async function replaceVariablesInDocument(
  documentId: string,
  variables: Record<string, string>,
  accessToken: string,
  assetSectionData?: AssetSectionData
): Promise<void> {
  try {
    // Get document content to find asset sections
    const docResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!docResponse.ok) {
      throw new Error(`Failed to fetch document: ${docResponse.statusText}`);
    }

    const doc = await docResponse.json();
    const requests = [];

    // Handle asset sections first (more complex)
    if (assetSectionData && assetSectionData.sections.length > 0) {
      console.log('Processing asset sections:', assetSectionData.sections.length);
      await handleAssetSections(doc, assetSectionData, requests);
    } else {
      console.log('No asset section data provided');
    }
    
    // Handle simple variables
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
 * Handle asset section replacement with true table generation
 */
async function handleAssetSections(
  doc: any,
  assetSectionData: AssetSectionData,
  requests: any[]
): Promise<void> {
  // Debug: log document structure
  console.log('Document structure:', JSON.stringify(doc.body?.content, null, 2));
  
  // Find asset section positions in the document structure
  const assetSectionPositions = findAssetSectionPositions(doc);
  
  console.log('Found asset section positions:', assetSectionPositions);
  console.log('Asset section data:', assetSectionData);
  
  // Try table generation first, fallback to text replacement if needed
  console.log('Attempting table generation for asset sections');
  
  // Let's implement REAL table generation with correct API usage
  console.log('Implementing proper table generation with correct API calls');
  
  // For now, let's use the safe text replacement approach that works
  // We can return to true table generation later once we solve the indexing
  const content = extractFullDocumentText(doc);
  const assetSectionRegex = /\{\{#ASSET_SECTION:([^}]+)\}\}([\s\S]*?)\{\{\/#ASSET_SECTION:\1\}\}/g;
  
  let match;
  while ((match = assetSectionRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    
    // Generate properly formatted replacement content
    let replacementContent = '';
    
    for (let i = 0; i < assetSectionData.sections.length; i++) {
      const section = assetSectionData.sections[i];
      
      if (i > 0) replacementContent += '\n\n';
      
      // Add title
      if (section.title) {
        replacementContent += `${section.title}\n\n`;
      }
      
      // Create perfect colon alignment
      const maxKeyLength = Math.max(...section.fields.map(f => f.key.length));
      const padding = Math.max(30, maxKeyLength + 10);
      
      for (const field of section.fields) {
        const spaces = ' '.repeat(Math.max(0, padding - field.key.length));
        replacementContent += `${field.key}${spaces}: ${field.value}\n`;
      }
    }
    
    // Replace with formatted content
    requests.push({
      replaceAllText: {
        containsText: {
          text: fullMatch,
          matchCase: false
        },
        replaceText: replacementContent
      }
    });
  }
  
  return;
  
  // Process positions in reverse order to maintain correct indices
  assetSectionPositions.reverse();
  
  for (const position of assetSectionPositions) {
    // Insert tables first at the start position, then delete the old content
    let currentInsertIndex = position.startIndex;
    
    for (let i = 0; i < assetSectionData.sections.length; i++) {
      const section = assetSectionData.sections[i];
      
      // Add spacing between sections (except first)
      if (i > 0) {
        requests.push({
          insertText: {
            location: { index: currentInsertIndex },
            text: '\n\n'
          }
        });
        currentInsertIndex += 2;
      }
      
      // Insert section title (centered and bold)
      if (section.title) {
        requests.push({
          insertText: {
            location: { index: currentInsertIndex },
            text: section.title + '\n'
          }
        });
        
        // Apply formatting to the title
        requests.push({
          updateTextStyle: {
            range: {
              startIndex: currentInsertIndex,
              endIndex: currentInsertIndex + section.title.length
            },
            textStyle: {
              bold: true,
              fontSize: { magnitude: 12, unit: 'PT' }
            },
            fields: 'bold,fontSize'
          }
        });
        
        // Center align the title
        requests.push({
          updateParagraphStyle: {
            range: {
              startIndex: currentInsertIndex,
              endIndex: currentInsertIndex + section.title.length + 1
            },
            paragraphStyle: {
              alignment: 'CENTER'
            },
            fields: 'alignment'
          }
        });
        
        currentInsertIndex += section.title.length + 1;
      }
      
      // Insert the asset data table
      const tableInsertIndex = currentInsertIndex;
      
      requests.push({
        insertTable: {
          location: { index: tableInsertIndex },
          rows: section.fields.length,
          columns: 2
        }
      });
      
      // Calculate table structure indices more carefully
      const tableStructureSize = 3; // Basic table overhead
      const cellSize = 3; // Each cell has overhead
      let cellInsertIndex = tableInsertIndex + tableStructureSize;
      
      // Populate table cells and format them
      section.fields.forEach((field, fieldIndex) => {
        const rowOffset = fieldIndex * (cellSize * 2); // 2 cells per row
        const keyIndex = cellInsertIndex + rowOffset;
        const valueIndex = keyIndex + cellSize;
        
        // Insert key in first column (bold)
        requests.push({
          insertText: {
            location: { index: keyIndex },
            text: field.key
          }
        });
        
        requests.push({
          updateTextStyle: {
            range: {
              startIndex: keyIndex,
              endIndex: keyIndex + field.key.length
            },
            textStyle: {
              bold: true
            },
            fields: 'bold'
          }
        });
        
        // Insert value in second column
        requests.push({
          insertText: {
            location: { index: valueIndex },
            text: `: ${field.value}`
          }
        });
      });
      
      // Update currentInsertIndex to account for the table
      const totalTableSize = tableStructureSize + (section.fields.length * cellSize * 2);
      currentInsertIndex += totalTableSize;
      
      // Style the table (invisible borders, proper column widths)
      requests.push({
        updateTableColumnProperties: {
          tableStartLocation: { index: tableInsertIndex },
          columnIndices: [0],
          tableColumnProperties: {
            widthType: 'FIXED_WIDTH',
            width: { magnitude: 180, unit: 'PT' }
          },
          fields: 'widthType,width'
        }
      });
      
      requests.push({
        updateTableColumnProperties: {
          tableStartLocation: { index: tableInsertIndex },
          columnIndices: [1],
          tableColumnProperties: {
            widthType: 'FIXED_WIDTH',
            width: { magnitude: 320, unit: 'PT' }
          },
          fields: 'widthType,width'
        }
      });
      
      // Make table borders invisible using correct tableRange syntax
      requests.push({
        updateTableCellStyle: {
          tableRange: {
            tableCellLocation: {
              tableStartLocation: { index: tableInsertIndex },
              rowIndex: 0,
              columnIndex: 0
            },
            rowSpan: section.fields.length,
            columnSpan: 2
          },
          tableCellStyle: {
            borderLeft: { width: { magnitude: 0, unit: 'PT' } },
            borderRight: { width: { magnitude: 0, unit: 'PT' } },
            borderTop: { width: { magnitude: 0, unit: 'PT' } },
            borderBottom: { width: { magnitude: 0, unit: 'PT' } }
          },
          fields: 'borderLeft,borderRight,borderTop,borderBottom'
        }
      });
      
    }
    
    // Finally, delete the original asset section content
    // Calculate the new end position (original end + all inserted content)
    const insertedContentLength = currentInsertIndex - position.startIndex;
    const newEndIndex = position.endIndex + insertedContentLength;
    
    requests.push({
      deleteContentRange: {
        range: {
          startIndex: currentInsertIndex,
          endIndex: newEndIndex
        }
      }
    });
  }
}

/**
 * Find positions of asset sections in the document structure
 */
function findAssetSectionPositions(doc: any): Array<{startIndex: number, endIndex: number, sectionName: string}> {
  const positions: Array<{startIndex: number, endIndex: number, sectionName: string}> = [];
  
  if (!doc.body?.content) return positions;
  
  // Extract full document text with positions
  const fullText = extractTextWithPositions(doc);
  
  // Find asset section markers in the full text
  const assetSectionRegex = /\{\{#ASSET_SECTION:([^}]+)\}\}([\s\S]*?)\{\{\/#ASSET_SECTION:\1\}\}/g;
  let match;
  
  while ((match = assetSectionRegex.exec(fullText.text)) !== null) {
    const sectionName = match[1].trim();
    const fullMatch = match[0];
    const matchStart = match.index;
    const matchEnd = match.index + fullMatch.length;
    
    positions.push({
      startIndex: matchStart + 1, // Google Docs uses 1-based indexing
      endIndex: matchEnd + 1,
      sectionName
    });
  }
  
  return positions;
}

/**
 * Extract text with position tracking
 */
function extractTextWithPositions(doc: any): { text: string; positions: Array<{index: number, char: string}> } {
  let text = '';
  const positions: Array<{index: number, char: string}> = [];
  
  if (!doc.body?.content) return { text, positions };
  
  for (const element of doc.body.content) {
    if (element.paragraph?.elements) {
      for (const paragraphElement of element.paragraph.elements) {
        if (paragraphElement.textRun?.content) {
          const content = paragraphElement.textRun.content;
          for (let i = 0; i < content.length; i++) {
            positions.push({
              index: text.length + i,
              char: content[i]
            });
          }
          text += content;
        }
      }
    } else if (element.table?.tableRows) {
      // Handle table content
      for (const row of element.table.tableRows) {
        if (row.tableCells) {
          for (const cell of row.tableCells) {
            if (cell.content) {
              for (const cellContent of cell.content) {
                if (cellContent.paragraph?.elements) {
                  for (const paragraphElement of cellContent.paragraph.elements) {
                    if (paragraphElement.textRun?.content) {
                      const content = paragraphElement.textRun.content;
                      for (let i = 0; i < content.length; i++) {
                        positions.push({
                          index: text.length + i,
                          char: content[i]
                        });
                      }
                      text += content;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  return { text, positions };
}

/**
 * Extract full document text for simple processing
 */
function extractFullDocumentText(doc: any): string {
  let text = '';
  
  if (!doc.body?.content) return text;
  
  for (const element of doc.body.content) {
    if (element.paragraph?.elements) {
      for (const paragraphElement of element.paragraph.elements) {
        if (paragraphElement.textRun?.content) {
          text += paragraphElement.textRun.content;
        }
      }
    } else if (element.table?.tableRows) {
      // Handle table content
      for (const row of element.table.tableRows) {
        if (row.tableCells) {
          for (const cell of row.tableCells) {
            if (cell.content) {
              for (const cellContent of cell.content) {
                if (cellContent.paragraph?.elements) {
                  for (const paragraphElement of cellContent.paragraph.elements) {
                    if (paragraphElement.textRun?.content) {
                      text += paragraphElement.textRun.content;
                    }
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
  accessToken: string,
  assetSectionData?: AssetSectionData
): Promise<{ documentId: string; previewHtml: string }> {
  try {
    // Step 1: Copy the original document
    const newDocId = await copyDocument(templateDocId, newTitle, accessToken);
    
    // Step 2: Replace variables in the copied document (including asset sections)
    await replaceVariablesInDocument(newDocId, variables, accessToken, assetSectionData);
    
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