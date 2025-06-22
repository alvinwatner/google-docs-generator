import { NextResponse } from 'next/server';
import { replaceSectionVariables } from '@/utils/sectionTableUtils';
import { Section } from '@/utils/sectionTableUtils';

/**
 * API endpoint to replace section variables with styled tables in a Google Doc
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { documentId, accessToken, sections } = body;
    
    console.log('Sections API received request:', { 
      documentId, 
      sectionsCount: Object.keys(sections || {}).length,
      sectionNames: Object.keys(sections || {})
    });
    
    if (!documentId || !accessToken || !sections) {
      console.error('Missing required parameters:', { 
        hasDocumentId: !!documentId, 
        hasAccessToken: !!accessToken, 
        hasSections: !!sections 
      });
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Replace section variables with tables
    console.log('Calling replaceSectionVariables with sections:', sections);
    await replaceSectionVariables(documentId, accessToken, sections as Record<string, Section>);
    
    console.log('Successfully replaced section variables');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error replacing section variables:', error);
    return NextResponse.json(
      { error: 'Failed to replace section variables', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
