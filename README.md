# Google Docs Generator

A modern document generation tool that leverages Google Docs API for perfect WYSIWYG preview and professional document creation.

## Features

🚀 **True WYSIWYG Preview** - Uses Google Docs native rendering for pixel-perfect preview  
📝 **Template-Based Generation** - Create documents from Google Docs templates  
🔄 **Real-time Placeholder Replacement** - Dynamic variable substitution with {{variable}} syntax  
📄 **Multiple Export Formats** - Download as PDF, DOCX, or save directly to Google Drive  
🔐 **Secure Google Integration** - OAuth 2.0 authentication with minimal required permissions  

## Architecture

Unlike traditional document generators that struggle with formatting preservation, this tool uses:

- **Google Docs API** for native document rendering and manipulation
- **Google Drive API** for template management and file operations  
- **OAuth 2.0** for secure, scoped access to user's Google account
- **Next.js 15** with TypeScript for modern web development

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd google-docs-generator
   npm install
   ```

2. **Google Cloud Setup**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google Docs API and Google Drive API
   - Create OAuth 2.0 credentials
   - Add your domain to authorized origins

3. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   # Add your Google Client ID to .env.local
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## How It Works

1. **Authentication** - User signs in with Google OAuth 2.0
2. **Template Selection** - Choose Google Docs template from Drive
3. **Variable Detection** - Automatically finds {{placeholder}} variables
4. **Form Generation** - Creates input form for all detected variables
5. **Live Preview** - Shows real-time Google Docs preview with substitutions
6. **Export** - Download as PDF or save to Google Drive

## Template Format

Create Google Docs templates using this variable syntax:

```
Invoice for {{client_name}}
Project: {{project_title}}
Date: {{invoice_date}}

Services Provided:
{{services_list}}

Total Amount: {{total_amount}}
```

## API Integration

The tool integrates with these Google APIs:

- **Google Docs API**: Document creation and text replacement
- **Google Drive API**: File management and export
- **Google Picker API**: Template selection interface

## Development Status

- ✅ Project setup and basic authentication
- 🔄 Template selection interface (in progress)
- ⏳ Variable extraction and form generation
- ⏳ Google Docs preview integration
- ⏳ Document export functionality

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes and test
4. Submit pull request

## License

MIT License - see LICENSE file for details