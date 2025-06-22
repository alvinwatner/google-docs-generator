/**
 * Section Table Utilities
 * 
 * This file contains utilities for handling section-based tables in Google Docs.
 * It provides functions to extract section variables, create section tables,
 * and style them according to specified requirements.
 */

import { google, docs_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

/**
 * Helper function to create an auth client from an access token
 */
function getAuthClient(accessToken: string): OAuth2Client {
  const oAuth2Client = new OAuth2Client();
  oAuth2Client.setCredentials({ access_token: accessToken });
  return oAuth2Client;
}

// Define interfaces for section data
export interface KeyValuePair {
  key: string;
  value: string;
}

export interface Section {
  title: string;
  keyValuePairs: KeyValuePair[];
}

/**
 * Extracts section variables from document content
 * Section variables use the syntax [[section:SectionName]]
 * 
 * @param content - The document content to extract section variables from
 * @returns Array of section variable names
 */
export function extractSectionVariables(content: string): string[] {
  const sectionRegex = /\[\[section:([^\]]+)\]\]/g;
  const sections: string[] = [];
  let match;

  while ((match = sectionRegex.exec(content)) !== null) {
    sections.push(match[1]);
  }

  return sections;
}

/**
 * Creates a section table in a Google Doc
 * 
 * @param documentId - The ID of the Google Doc
 * @param accessToken - OAuth access token
 * @param section - Section data including title and key-value pairs
 * @param insertionPoint - Index where the table should be inserted
 * @returns Promise resolving to the API response
 */
export async function createSectionTable(
  documentId: string,
  accessToken: string,
  section: Section,
  insertionPoint: number
): Promise<docs_v1.Schema$BatchUpdateDocumentResponse> {
  // Calculate number of rows (title + key-value pairs)
  const rows = 1 + section.keyValuePairs.length;
  
  // Create requests array
  const requests = [
    // 1. Insert table
    {
      insertTable: {
        rows,
        columns: 2,
        location: {
          index: insertionPoint
        }
      }
    }
  ];
  
  // Execute the request to create the table
  const docs = google.docs({ version: 'v1' });
  await docs.documents.batchUpdate({
    documentId,
    requestBody: { requests },
    auth: getAuthClient(accessToken)
  });
  
  // Get the updated document to find table indexes
  const documentResponse = await docs.documents.get({
    documentId,
    auth: getAuthClient(accessToken)
  });
  
  const document = documentResponse.data;
  
  // Find the table we just created
  const table = findTableAtIndex(document, insertionPoint);
  if (!table) {
    throw new Error('Could not find inserted table');
  }
  
  // Get the element containing the table
  const tableElement = findTableElementAtIndex(document, insertionPoint);
  if (!tableElement) {
    throw new Error('Could not find inserted table element');
  }
  
  const tableStartIndex = tableElement.startIndex || 0;
  
  // Get cell indexes
  console.log('Getting title cell index for table at:', tableStartIndex);
  const titleCellIndex = getCellIndex(table, 0, 0);
  console.log('Title cell index:', titleCellIndex);
  
  // Create styling requests
  const stylingRequests = [
    // 2. Merge cells for title
    {
      mergeTableCells: {
        tableRange: {
          tableCellLocation: {
            tableStartLocation: {
              index: tableStartIndex
            },
            rowIndex: 0,
            columnIndex: 0
          },
          rowSpan: 1,
          columnSpan: 2
        }
      }
    },
    
    // 3. Insert title text
    {
      insertText: {
        text: section.title,
        location: {
          index: titleCellIndex +1
        }
      }
    },
    
    // 4. Style title text (bold, center, size 14)
    {
      updateTextStyle: {
        range: {
          startIndex: titleCellIndex,
          endIndex: titleCellIndex + section.title.length
        },
        textStyle: {
          bold: true,
          fontSize: {
            magnitude: 14,
            unit: "PT"
          }
        },
        fields: "bold,fontSize"
      }
    },
    
    // 5. Center align title
    {
      updateParagraphStyle: {
        range: {
          startIndex: titleCellIndex,
          endIndex: titleCellIndex + section.title.length
        },
        paragraphStyle: {
          alignment: "CENTER"
        },
        fields: "alignment"
      }
    },
    
    // 6. Remove all table borders
    // {
    //   updateTableCellStyle: {
    //     tableRange: {
    //       tableCellLocation: {
    //         tableStartLocation: {
    //           index: tableStartIndex
    //         },
    //         rowIndex: 0,
    //         columnIndex: 0
    //       },
    //       rowSpan: rows,
    //       columnSpan: 2
    //     },
    //     tableCellStyle: {
    //       borderTop: {
    //         width: {
    //           magnitude: 0,
    //           unit: "PT"
    //         },
    //         dashStyle: "SOLID",
    //         color: {}
    //       },
    //       borderBottom: {
    //         width: {
    //           magnitude: 0,
    //           unit: "PT"
    //         },
    //         dashStyle: "SOLID",
    //         color: {}
    //       },
    //       borderLeft: {
    //         width: {
    //           magnitude: 0,
    //           unit: "PT"
    //         },
    //         dashStyle: "SOLID",
    //         color: {}
    //       },
    //       borderRight: {
    //         width: {
    //           magnitude: 0,
    //           unit: "PT"
    //         },
    //         dashStyle: "SOLID",
    //         color: {}
    //       }
    //     },
    //     fields: "borderTop,borderBottom,borderLeft,borderRight"
    //   }
    // }
  ];
  
  // Add key-value pairs
  section.keyValuePairs.forEach((pair, index) => {
    const rowIndex = index + 1; // +1 because first row is title
    console.log(`Processing key-value pair ${index}: ${pair.key} = ${pair.value}`);
    const keyCellIndex = getCellIndex(table, rowIndex, 0);
    const valueCellIndex = getCellIndex(table, rowIndex, 1);
    console.log(`Cell indexes - Key: ${keyCellIndex}, Value: ${valueCellIndex}`);
    
    // Insert key
    stylingRequests.push({
      insertText: {
        text: pair.key,
        location: {
          index: keyCellIndex + 1 
        }
      }
    });
    
    // Style key (bold, size 12)
    stylingRequests.push({
      updateTextStyle: {
        range: {
          startIndex: keyCellIndex,
          endIndex: keyCellIndex + pair.key.length
        },
        textStyle: {
          bold: true,
          fontSize: {
            magnitude: 12,
            unit: "PT"
          }
        },
        fields: "bold,fontSize"
      }
    });
    
    // Insert value
    stylingRequests.push({
      insertText: {
        text: pair.value,
        location: {
          index: valueCellIndex + 1
        }
      }
    });
    
    // Style value (regular, size 12)
    stylingRequests.push({
      updateTextStyle: {
        range: {
          startIndex: valueCellIndex,
          endIndex: valueCellIndex + pair.value.length
        },
        textStyle: {
          bold: false,
          fontSize: {
            magnitude: 12,
            unit: "PT"
          }
        },
        fields: "bold,fontSize"
      }
    });
  });
  
  // Execute styling requests
  return docs.documents.batchUpdate({
    documentId,
    requestBody: { requests: stylingRequests },
    auth: getAuthClient(accessToken)
  }).then(response => response.data);
}

/**
 * Replaces section variables in a document with tables
 * 
 * @param documentId - The ID of the Google Doc
 * @param accessToken - OAuth access token
 * @param sections - Map of section names to section data
 * @returns Promise resolving when all sections are replaced
 */
export async function replaceSectionVariables(
  documentId: string,
  accessToken: string,
  sections: Record<string, Section>
): Promise<void> {
  console.log('Starting replaceSectionVariables with sections:', Object.keys(sections));
  console.log('Section data:', sections);
  // Get the document content
  const docs = google.docs({ version: 'v1' });
  const documentResponse = await docs.documents.get({
    documentId,
    auth: getAuthClient(accessToken)
  });
  
  const document = documentResponse.data;
  
  // Find all section variables in the document
  const content = document.body?.content || [];
  const sectionVariables: Array<{ name: string, startIndex: number, endIndex: number }> = [];
  
  // Scan through paragraphs to find section variables
  content.forEach((item: docs_v1.Schema$StructuralElement) => {
    if (item.paragraph && item.paragraph.elements) {
      item.paragraph.elements.forEach((element: docs_v1.Schema$ParagraphElement) => {
        if (element.textRun && element.textRun.content) {
          const text = element.textRun.content;
          const regex = /\[\[section:([^\]]+)\]\]/g;
          let match;
          
          while ((match = regex.exec(text)) !== null) {
            const sectionName = match[1];
            const startIndex = (element.startIndex || 0) + match.index;
            const endIndex = startIndex + match[0].length;
            
            sectionVariables.push({
              name: sectionName,
              startIndex,
              endIndex
            });
          }
        }
      });
    }
  });
  
  // Replace each section variable with a table
  // Process in reverse order to maintain correct indices
  for (let i = sectionVariables.length - 1; i >= 0; i--) {
    const variable = sectionVariables[i];
    const section = sections[variable.name];
    
    if (section) {
      console.log(`Processing section variable: ${variable.name}`);
      console.log(`Section data:`, section);
      console.log(`Variable position: ${variable.startIndex} - ${variable.endIndex}`);
      
      // Validate section has content
      if (!section.title || section.keyValuePairs.length === 0 || 
          section.keyValuePairs.every(pair => !pair.key.trim() || !pair.value.trim())) {
        console.warn(`Skipping section ${variable.name} - missing title or empty key-value pairs`);
        continue;
      }
      
      try {
        // First delete the section variable text
        console.log(`Deleting section variable text from ${variable.startIndex} to ${variable.endIndex}`);
        await docs.documents.batchUpdate({
          documentId,
          requestBody: {
            requests: [
              {
                deleteContentRange: {
                  range: {
                    startIndex: variable.startIndex,
                    endIndex: variable.endIndex
                  }
                }
              }
            ]
          },
          auth: getAuthClient(accessToken)
        });
        
        // Then insert the section table at that position
        console.log(`Creating section table at index ${variable.startIndex}`);
        await createSectionTable(documentId, accessToken, section, variable.startIndex);
        console.log(`Successfully created table for section ${variable.name}`);
      } catch (error) {
        console.error(`Error processing section ${variable.name}:`, error);
        throw error;
      }
    } else {
      console.warn(`No section data found for variable: ${variable.name}`);
    }
  }
}

/**
 * Helper function to find a table at or after a specific index
 * 
 * @param document - The document data
 * @param insertionPoint - The index to search from
 * @returns The table object or null if not found
 */
/**
 * Helper function to find a table element at or after a specific index
 * 
 * @param document - The document data
 * @param insertionPoint - The index to search from
 * @returns The structural element containing the table or null if not found
 */
function findTableElementAtIndex(document: docs_v1.Schema$Document, insertionPoint: number): docs_v1.Schema$StructuralElement | null {
  const content = document.body?.content || [];
  
  console.log(`Looking for table at/after index ${insertionPoint}`);
  
  // First, try to find a table at or very close to the insertion point
  for (const element of content) {
    if (element.table && element.startIndex !== undefined) {
      console.log(`Found table at index ${element.startIndex}`);
      // Allow some tolerance - table might be created a few indices away
      if (element.startIndex !== null && element.startIndex >= insertionPoint - 5 && element.startIndex <= insertionPoint + 50) {
        console.log(`Using table at index ${element.startIndex}`);
        return element;
      }
    }
  }
  
  // If not found with tolerance, just get the first table after insertion point
  for (const element of content) {
    if (element.table && element.startIndex && element.startIndex >= insertionPoint) {
      console.log(`Fallback: using table at index ${element.startIndex}`);
      return element;
    }
  }
  
  console.log('No table found at or after insertion point');
  return null;
}

/**
 * Helper function to find a table at or after a specific index
 * 
 * @param document - The document data
 * @param insertionPoint - The index to search from
 * @returns The table object or null if not found
 */
function findTableAtIndex(document: docs_v1.Schema$Document, insertionPoint: number): docs_v1.Schema$Table | null {
  const element = findTableElementAtIndex(document, insertionPoint);
  return element?.table || null;
}

/**
 * Helper function to get cell index
 * 
 * @param table - The table object
 * @param rowIndex - Row index
 * @param colIndex - Column index
 * @returns The cell's content index
 */
function getCellIndex(table: docs_v1.Schema$Table, rowIndex: number, colIndex: number): number {
  try {
    if (!table.tableRows || !table.tableRows[rowIndex]) {
      throw new Error(`Row ${rowIndex} not found in table`);
    }
    
    const row = table.tableRows[rowIndex];
    if (!row.tableCells || !row.tableCells[colIndex]) {
      throw new Error(`Cell [${rowIndex}][${colIndex}] not found in table`);
    }
    
    const cell = row.tableCells[colIndex];
    if (!cell.content || !cell.content[0]) {
      throw new Error(`No content found in cell [${rowIndex}][${colIndex}]`);
    }
    
    const content = cell.content[0];
    if (!content.paragraph) {
      throw new Error(`No paragraph found in cell [${rowIndex}][${colIndex}]`);
    }
    
    // For newly created tables, we need to find the paragraph's start index
    // The content item itself should have a startIndex
    if (content.startIndex !== undefined && content.startIndex !== null) {
      return content.startIndex + 1; // +1 to insert after the paragraph start
    }
    
    // Fallback: try to get from paragraph elements
    if (content.paragraph.elements && content.paragraph.elements[0]) {
      return content.paragraph.elements[0].startIndex || 0;
    }
    
    throw new Error(`Could not determine index for cell [${rowIndex}][${colIndex}]`);
  } catch (error) {
    console.error('Error getting cell index:', error);
    throw error; // Don't return 0, throw the error to debug
  }
}
