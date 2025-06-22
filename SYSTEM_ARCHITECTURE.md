# Google Docs Generator - System Architecture Documentation

## Overview

The Google Docs Generator is a modern web application built with Next.js 15 that leverages Google APIs to create documents from templates with perfect WYSIWYG preview. The system allows users to select Google Docs templates, fill in placeholder variables, and generate professional documents while preserving formatting.

## Architecture Components

### 1. Frontend Framework
- **Next.js 15** with App Router for modern web development
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React 19** for UI components

### 2. Authentication System
The application implements dual authentication approaches:

#### NextAuth.js Integration (`src/app/api/auth/[...nextauth]/route.ts:4-38`)
- Uses Google OAuth provider for server-side authentication
- Configured with required scopes: `documents`, `drive`, `openid`, `email`, `profile`
- JWT callbacks store access tokens for API calls
- Custom sign-in and error pages

#### Client-Side Google Auth (`src/components/GoogleAuth.tsx:25-95`)
- Direct Google Identity Services integration
- Handles OAuth2 token client for additional scopes
- Stores access tokens in localStorage
- Provides user information and access tokens to components

### 3. Google API Integration

#### Core Utilities (`src/utils/googleDocsUtils.ts`)
**Key Functions:**
- `fetchDocumentContent()` - Retrieves document structure from Google Docs API
- `extractTextFromDocument()` - Converts Google Docs JSON to plain text
- `extractVariables()` - Finds template variables using regex `{{variable_name}}`
- `replaceVariables()` - Substitutes variables with user-provided values
- `createDocument()` - Creates new documents via Google Docs API

#### Advanced Utilities (`src/utils/advancedDocsUtils.ts`)
**Key Functions:**
- `copyDocument()` - Creates document copies via Google Drive API (preserves formatting)
- `replaceVariablesInDocument()` - Batch updates using Google Docs `batchUpdate`
- `getDocumentAsHtml()` - Converts document structure to HTML for preview
- `createFormattedDocument()` - Complete workflow: copy → replace → preview

### 4. Component Architecture

#### Main Application Flow (`src/app/page.tsx:7-51`)
- Root component managing authentication state
- Conditional rendering between auth and main application
- User state management with local state

#### Document Generator (`src/components/DocumentGenerator.tsx:22-221`)
**Core Orchestrator Component:**
- Manages 3-step workflow: Template → Form → Preview
- Step progress indicator
- Error handling and loading states
- Template selection and content fetching

#### Template Picker (`src/components/TemplatePicker.tsx:19-235`)
- Fetches Google Docs from user's Drive using Google Drive API
- Filters by `mimeType='application/vnd.google-apps.document'`
- Grid display with document metadata
- Template creation guidance

#### Variable Form (`src/components/VariableForm.tsx:14-225`)
- Dynamic form generation based on extracted variables
- Type-aware input validation (text, email, number, date)
- Real-time error feedback
- Support for typed variables: `{{email:email}}`, `{{age:number}}`

#### Document Preview (`src/components/DocumentPreview.tsx:16-313`)
- Formatted document preview using Google Docs HTML conversion
- Export functionality: PDF download and Google Drive save
- Variable substitution summary
- Real-time preview generation

## Complete User Flow

### 1. Authentication Phase
```
User visits app → NextAuthLogin component loads → Google OAuth flow begins
↓
User grants permissions → Access token stored in JWT → Authentication complete
↓
User object with accessToken passed to DocumentGenerator
```

### 2. Template Selection Phase
```
TemplatePicker component loads → Google Drive API call
↓
GET /drive/v3/files?q=mimeType='application/vnd.google-apps.document'
↓
Display templates with metadata → User selects template
↓
fetchDocumentContent() called with template ID
```

### 3. Content Processing Phase
```
Google Docs API call: GET /documents/{documentId}
↓
extractTextFromDocument() processes document structure
↓
extractVariables() finds {{variable}} patterns
↓
DocumentContent object created with title, content, variables
```

### 4. Form Generation Phase
```
VariableForm receives variables array → Dynamic form created
↓
Type-aware inputs based on variable.type → User fills form
↓
Real-time validation → Values collected in Record<string, string>
```

### 5. Preview & Export Phase
```
DocumentPreview component loads → createFormattedDocument() called
↓
copyDocument() creates template copy via Drive API
↓
replaceVariablesInDocument() uses Docs API batchUpdate
↓
getDocumentAsHtml() generates formatted preview
↓
User can export as PDF or save to Drive
```

## API Endpoints & External Services

### Google Docs API
- **Base URL:** `https://docs.googleapis.com/v1/`
- **Key Endpoints:**
  - `GET /documents/{documentId}` - Retrieve document structure
  - `POST /documents` - Create new document
  - `POST /documents/{documentId}:batchUpdate` - Update document content

### Google Drive API
- **Base URL:** `https://www.googleapis.com/drive/v3/`
- **Key Endpoints:**
  - `GET /files` - List documents with filters
  - `POST /files/{fileId}/copy` - Copy documents
  - `GET /documents/{documentId}/export?format=pdf` - Export as PDF

### Google OAuth2 API
- **Token endpoint:** `https://oauth2.googleapis.com/revoke`
- **User info:** `https://www.googleapis.com/oauth2/v2/userinfo`

## Data Flow Architecture

### Template Variable Processing
1. **Extraction Pattern:** `/\{\{([^}]+)\}\}/g` regex finds all `{{variable}}` patterns
2. **Type Support:** Variables can specify types: `{{email:email}}`, `{{date:date}}`
3. **Deduplication:** Identical variable names merged into single form field
4. **Validation:** Type-specific validation (email format, number parsing, date validation)

### Document Generation Workflow
1. **Template Copy:** Original document copied to preserve formatting
2. **Variable Replacement:** Batch updates replace all variable patterns
3. **Preview Generation:** Document converted to HTML for display
4. **Export Options:** PDF generation or Drive storage

### Error Handling Strategy
- **Authentication:** Token refresh and re-authentication flows
- **API Errors:** Graceful degradation with user-friendly messages
- **Network Issues:** Retry mechanisms and offline state handling
- **Validation:** Real-time form validation with clear error messages

## Security Considerations

### OAuth Scopes
- **Minimal Permissions:** Only requests necessary Google API scopes
- **Scope Separation:** Documents and Drive permissions clearly defined
- **Token Storage:** Access tokens stored securely in JWT or localStorage

### Data Handling
- **No Server Storage:** All processing happens client-side or in user's Google account
- **Template Privacy:** Original templates remain unchanged
- **User Data:** No personal data stored on application servers

## Performance Optimizations

### API Efficiency
- **Batch Operations:** Multiple variable replacements in single API call
- **Caching Strategy:** Template content cached during session
- **Lazy Loading:** Components load only when needed

### User Experience
- **Loading States:** Clear progress indicators throughout workflow
- **Error Recovery:** User-friendly error messages with retry options
- **Progressive Enhancement:** Works with varying levels of API access

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 15 + React 19 | Modern web application framework |
| Styling | Tailwind CSS | Utility-first CSS framework |
| Authentication | NextAuth.js + Google OAuth | Secure authentication flow |
| APIs | Google Docs + Drive APIs | Document manipulation and storage |
| Type Safety | TypeScript | Static type checking |
| State Management | React useState | Component-level state management |

## Development Workflow

### Local Development
```bash
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Production build
npm run lint        # Code linting
```

### Environment Configuration
- `GOOGLE_CLIENT_ID` - OAuth client identifier
- `GOOGLE_CLIENT_SECRET` - OAuth client secret
- `NEXTAUTH_URL` - Application URL for OAuth redirects
- `NEXTAUTH_SECRET` - JWT signing secret

This architecture provides a robust, scalable foundation for document generation while maintaining security and user experience standards.