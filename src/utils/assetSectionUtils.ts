// Asset section utilities for table-based template processing

export interface AssetField {
  key: string;
  value: string;
  id: string;
}

export interface AssetSection {
  id: string;
  title: string;
  fields: AssetField[];
}

export interface AssetSectionData {
  sections: AssetSection[];
}

export interface AssetSectionVariable {
  name: string;
  placeholder: string;
  type: 'asset_section';
  template: string;
}

/**
 * Parse asset section templates from document content
 */
export function parseAssetSections(content: string): AssetSectionVariable[] {
  const assetSections: AssetSectionVariable[] = [];
  const regex = /\{\{#ASSET_SECTION:([^}]+)\}\}([\s\S]*?)\{\{\/#ASSET_SECTION:\1\}\}/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const sectionName = match[1].trim();
    const template = match[2].trim();
    
    assetSections.push({
      name: sectionName,
      placeholder: match[0],
      type: 'asset_section',
      template
    });
  }
  
  return assetSections;
}

/**
 * Parse template fields from asset section template
 */
export function parseTemplateFields(template: string): string[] {
  const fields: string[] = [];
  const regex = /\{\{([^}]+)\}\}/g;
  
  let match;
  while ((match = regex.exec(template)) !== null) {
    const fieldName = match[1].trim();
    if (!fields.includes(fieldName)) {
      fields.push(fieldName);
    }
  }
  
  return fields;
}

/**
 * Generate Google Docs table structure for asset section
 */
export function generateAssetSectionTable(section: AssetSection): any {
  const tableRows = [];
  
  // Title row (spans both columns)
  if (section.title) {
    tableRows.push({
      tableCells: [
        {
          content: [
            {
              paragraph: {
                elements: [
                  {
                    textRun: {
                      content: section.title,
                      textStyle: {
                        bold: true,
                        fontSize: {
                          magnitude: 12,
                          unit: 'PT'
                        }
                      }
                    }
                  }
                ],
                paragraphStyle: {
                  alignment: 'CENTER'
                }
              }
            }
          ],
          tableCellStyle: {
            rowSpan: 1,
            columnSpan: 2,
            borderLeft: { width: { magnitude: 0, unit: 'PT' } },
            borderRight: { width: { magnitude: 0, unit: 'PT' } },
            borderTop: { width: { magnitude: 0, unit: 'PT' } },
            borderBottom: { width: { magnitude: 0, unit: 'PT' } }
          }
        }
      ]
    });
  }
  
  // Field rows
  for (const field of section.fields) {
    tableRows.push({
      tableCells: [
        {
          content: [
            {
              paragraph: {
                elements: [
                  {
                    textRun: {
                      content: field.key,
                      textStyle: {
                        bold: true
                      }
                    }
                  }
                ],
                paragraphStyle: {
                  alignment: 'START'
                }
              }
            }
          ],
          tableCellStyle: {
            borderLeft: { width: { magnitude: 0, unit: 'PT' } },
            borderRight: { width: { magnitude: 0, unit: 'PT' } },
            borderTop: { width: { magnitude: 0, unit: 'PT' } },
            borderBottom: { width: { magnitude: 0, unit: 'PT' } }
          }
        },
        {
          content: [
            {
              paragraph: {
                elements: [
                  {
                    textRun: {
                      content: `: ${field.value}`,
                      textStyle: {}
                    }
                  }
                ],
                paragraphStyle: {
                  alignment: 'START'
                }
              }
            }
          ],
          tableCellStyle: {
            borderLeft: { width: { magnitude: 0, unit: 'PT' } },
            borderRight: { width: { magnitude: 0, unit: 'PT' } },
            borderTop: { width: { magnitude: 0, unit: 'PT' } },
            borderBottom: { width: { magnitude: 0, unit: 'PT' } }
          }
        }
      ]
    });
  }
  
  return {
    table: {
      columns: 2,
      tableRows,
      tableStyle: {
        tableColumnProperties: [
          {
            widthType: 'FIXED_WIDTH',
            width: {
              magnitude: 200,
              unit: 'PT'
            }
          },
          {
            widthType: 'FIXED_WIDTH',
            width: {
              magnitude: 300,
              unit: 'PT'
            }
          }
        ]
      }
    }
  };
}

/**
 * Render asset sections to plain text for preview
 */
export function renderAssetSectionsPreview(data: AssetSectionData): string {
  let result = '';
  
  for (const section of data.sections) {
    if (section.title) {
      result += `\n${section.title}\n\n`;
    }
    
    for (const field of section.fields) {
      const padding = ' '.repeat(Math.max(0, 25 - field.key.length));
      result += `${field.key}${padding}: ${field.value}\n`;
    }
    
    result += '\n';
  }
  
  return result;
}

/**
 * Create default asset section
 */
export function createDefaultAssetSection(): AssetSection {
  return {
    id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: 'Tanah dan Bangunan Rumah Tinggal',
    fields: [
      {
        id: `field_${Date.now()}_1`,
        key: 'Tanah',
        value: ''
      },
      {
        id: `field_${Date.now()}_2`,
        key: 'Bangunan',
        value: ''
      },
      {
        id: `field_${Date.now()}_3`,
        key: 'Lokasi/Alamat Aset',
        value: ''
      },
      {
        id: `field_${Date.now()}_4`,
        key: 'Kepemilikan Aset',
        value: ''
      }
    ]
  };
}

/**
 * Validate asset section data
 */
export function validateAssetSection(section: AssetSection): string[] {
  const errors: string[] = [];
  
  if (!section.title.trim()) {
    errors.push('Section title is required');
  }
  
  if (section.fields.length === 0) {
    errors.push('At least one field is required');
  }
  
  section.fields.forEach((field, index) => {
    if (!field.key.trim()) {
      errors.push(`Field ${index + 1}: Key is required`);
    }
    if (!field.value.trim()) {
      errors.push(`Field ${index + 1}: Value is required`);
    }
  });
  
  return errors;
}