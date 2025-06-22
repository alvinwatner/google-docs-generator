# Section Tables Implementation Guide

This document provides comprehensive guidance on implementing styled section-based tables in Google Docs using the Google Docs API. The implementation allows for creating structured documents with sections containing key-value pairs, with specific styling requirements.

## Table of Contents

1. [Section Variable Syntax](#section-variable-syntax)
2. [Table Structure](#table-structure)
3. [Table Creation API](#table-creation-api)
4. [Table Styling](#table-styling)
5. [Text Styling](#text-styling)
6. [Complete Implementation Example](#complete-implementation-example)
7. [API Reference](#api-reference)

## Section Variable Syntax

To differentiate section variables from regular variables, we use the following syntax:

```
[[section:SectionName]]
```

For example:
```
[[section:PropertyDetails]]
```

This syntax is distinct from the regular variable syntax (`{{variable}}` or `{{variable:type}}`), making it easy to parse and identify.

## Table Structure

Each section will be represented as a table with the following structure:

1. **Title Row**: A single row with merged cells containing the section title
2. **Key-Value Pairs**: Multiple rows with two columns (key and value)

Example structure:
```
+--------------------------------------+
| Tanah dan Bangunan Rumah Tinggal    |
+----------------+---------------------+
| Tanah          | SHM No. 119 atas   |
|                | nama Rico Rusli... |
+----------------+---------------------+
| Bangunan       | ± 1.574 m²         |
+----------------+---------------------+
```

## Table Creation API

### Creating a Table

To create a table, use the `InsertTableRequest`:

```javascript
{
  insertTable: {
    rows: 3, // Title row + key-value pairs
    columns: 2,
    location: {
      index: insertionPoint
    }
  }
}
```

### Merging Cells for Title

To merge cells for the title row:

```javascript
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
}
```

### Inserting Content

To insert text into cells:

```javascript
{
  insertText: {
    text: "Cell content",
    location: {
      index: cellIndex
    }
  }
}
```

## Table Styling

### Removing Table Borders

To create a borderless table, use `UpdateTableCellStyleRequest` with empty borders:

```javascript
{
  updateTableCellStyle: {
    tableRange: {
      tableCellLocation: {
        tableStartLocation: {
          index: tableStartIndex
        },
        rowIndex: 0,
        columnIndex: 0
      },
      rowSpan: tableRows,
      columnSpan: tableCols
    },
    tableCellStyle: {
      borderTop: {
        width: {
          magnitude: 0,
          unit: "PT"
        },
        dashStyle: "SOLID",
        color: {}
      },
      borderBottom: {
        width: {
          magnitude: 0,
          unit: "PT"
        },
        dashStyle: "SOLID",
        color: {}
      },
      borderLeft: {
        width: {
          magnitude: 0,
          unit: "PT"
        },
        dashStyle: "SOLID",
        color: {}
      },
      borderRight: {
        width: {
          magnitude: 0,
          unit: "PT"
        },
        dashStyle: "SOLID",
        color: {}
      }
    },
    fields: "borderTop,borderBottom,borderLeft,borderRight"
  }
}
```

### Setting Column Widths

To set column widths:

```javascript
{
  updateTableColumnProperties: {
    tableStartLocation: {
      index: tableStartIndex
    },
    columnIndices: [0, 1],
    tableColumnProperties: {
      widthType: "FIXED_WIDTH",
      width: {
        magnitude: 150,
        unit: "PT"
      }
    },
    fields: "widthType,width"
  }
}
```

## Text Styling

### Title Styling (Bold, Center, Size 14)

```javascript
// First, get the range of the title text
const titleStartIndex = titleCellIndex;
const titleEndIndex = titleStartIndex + sectionTitle.length;

// Apply text style
{
  updateTextStyle: {
    range: {
      startIndex: titleStartIndex,
      endIndex: titleEndIndex,
      tabId: tabId
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
}

// Apply paragraph style for center alignment
{
  updateParagraphStyle: {
    range: {
      startIndex: titleStartIndex,
      endIndex: titleEndIndex,
      tabId: tabId
    },
    paragraphStyle: {
      alignment: "CENTER"
    },
    fields: "alignment"
  }
}
```

### Key Styling (Bold, Size 12)

```javascript
{
  updateTextStyle: {
    range: {
      startIndex: keyStartIndex,
      endIndex: keyEndIndex,
      tabId: tabId
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
}
```

### Value Styling (Regular, Size 12)

```javascript
{
  updateTextStyle: {
    range: {
      startIndex: valueStartIndex,
      endIndex: valueEndIndex,
      tabId: tabId
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
}
```

## Complete Implementation Example

Here's a complete example of creating a styled section table:

```javascript
async function createSectionTable(documentId, accessToken, sectionTitle, keyValuePairs, insertionPoint) {
  // Calculate number of rows (title + key-value pairs)
  const rows = 1 + keyValuePairs.length;
  
  // Create requests array
  const requests = [
    // 1. Insert table
    {
      insertTable: {
        rows: rows,
        columns: 2,
        location: {
          index: insertionPoint
        }
      }
    }
  ];
  
  // Execute the request to create the table
  const createTableResponse = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    }
  );
  
  // Get the updated document to find table indexes
  const document = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  ).then(res => res.json());
  
  // Find the table we just created
  const table = findTableAtIndex(document, insertionPoint);
  const tableStartIndex = table.startIndex;
  
  // Get cell indexes
  const titleCellIndex = getCellIndex(table, 0, 0);
  
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
        text: sectionTitle,
        location: {
          index: titleCellIndex
        }
      }
    },
    
    // 4. Style title text (bold, center, size 14)
    {
      updateTextStyle: {
        range: {
          startIndex: titleCellIndex,
          endIndex: titleCellIndex + sectionTitle.length
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
          endIndex: titleCellIndex + sectionTitle.length
        },
        paragraphStyle: {
          alignment: "CENTER"
        },
        fields: "alignment"
      }
    },
    
    // 6. Remove all table borders
    {
      updateTableCellStyle: {
        tableRange: {
          tableCellLocation: {
            tableStartLocation: {
              index: tableStartIndex
            },
            rowIndex: 0,
            columnIndex: 0
          },
          rowSpan: rows,
          columnSpan: 2
        },
        tableCellStyle: {
          borderTop: {
            width: {
              magnitude: 0,
              unit: "PT"
            },
            dashStyle: "SOLID",
            color: {}
          },
          borderBottom: {
            width: {
              magnitude: 0,
              unit: "PT"
            },
            dashStyle: "SOLID",
            color: {}
          },
          borderLeft: {
            width: {
              magnitude: 0,
              unit: "PT"
            },
            dashStyle: "SOLID",
            color: {}
          },
          borderRight: {
            width: {
              magnitude: 0,
              unit: "PT"
            },
            dashStyle: "SOLID",
            color: {}
          }
        },
        fields: "borderTop,borderBottom,borderLeft,borderRight"
      }
    }
  ];
  
  // Add key-value pairs
  keyValuePairs.forEach((pair, index) => {
    const rowIndex = index + 1; // +1 because first row is title
    const keyCellIndex = getCellIndex(table, rowIndex, 0);
    const valueCellIndex = getCellIndex(table, rowIndex, 1);
    
    // Insert key
    stylingRequests.push({
      insertText: {
        text: pair.key,
        location: {
          index: keyCellIndex
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
          index: valueCellIndex
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
  const stylingResponse = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests: stylingRequests })
    }
  );
  
  return stylingResponse.json();
}

// Helper function to find a table at a specific index
function findTableAtIndex(document, insertionPoint) {
  // Implementation depends on document structure
  // This is a simplified example
  for (const element of document.body.content) {
    if (element.table && element.startIndex >= insertionPoint) {
      return element.table;
    }
  }
  return null;
}

// Helper function to get cell index
function getCellIndex(table, rowIndex, colIndex) {
  // Implementation depends on table structure
  // This is a simplified example
  return table.tableRows[rowIndex].tableCells[colIndex].content[0].paragraph.elements[0].startIndex;
}
```

## API Reference

### Key Request Types

1. **InsertTableRequest**
   - Creates a new table with specified rows and columns
   - [Documentation](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/request#inserttablerequest)

2. **MergeTableCellsRequest**
   - Merges cells within a table range
   - [Documentation](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/request#mergetablecellsrequest)

3. **UpdateTableCellStyleRequest**
   - Updates styling of table cells, including borders
   - [Documentation](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/request#updatetablecellstylerequest)

4. **UpdateTextStyleRequest**
   - Updates text styling (bold, size, etc.)
   - [Documentation](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/request#updatetextstylerequest)

5. **UpdateParagraphStyleRequest**
   - Updates paragraph styling (alignment, etc.)
   - [Documentation](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/request#updateparagraphstylerequest)

6. **UpdateTableColumnPropertiesRequest**
   - Updates column properties like width
   - [Documentation](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/request#updatetablecolumnpropertiesrequest)

### Style Objects

1. **TextStyle**
   - Controls text appearance (bold, italic, size, etc.)
   - [Documentation](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents#textstyle)

2. **ParagraphStyle**
   - Controls paragraph formatting (alignment, spacing, etc.)
   - [Documentation](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents#paragraphstyle)

3. **TableCellStyle**
   - Controls cell appearance (borders, background, etc.)
   - [Documentation](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents#tablecellstyle)

4. **TableColumnProperties**
   - Controls column properties (width)
   - [Documentation](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents#tablecolumnproperties)

### Common Fields

1. **Border Properties**
   - `width`: Border width (magnitude and unit)
   - `dashStyle`: Border style (SOLID, DASH, etc.)
   - `color`: Border color (RGB)

2. **Text Style Properties**
   - `bold`: Boolean for bold text
   - `italic`: Boolean for italic text
   - `fontSize`: Size (magnitude and unit)
   - `foregroundColor`: Text color

3. **Paragraph Style Properties**
   - `alignment`: Text alignment (START, CENTER, END, JUSTIFIED)
   - `lineSpacing`: Space between lines
   - `direction`: Text direction

This documentation provides a comprehensive guide to implementing styled section tables in Google Docs using the Google Docs API.
