'use client';

import { useState } from 'react';
import GoogleAuth from '@/components/GoogleAuth';
import DocumentGenerator from '@/components/DocumentGenerator';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    picture: string;
    accessToken: string;
  } | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Google Docs Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create professional documents from templates with perfect WYSIWYG preview using Google Docs API
          </p>
        </header>

        {!isAuthenticated ? (
          <GoogleAuth 
            onAuthenticated={(user) => {
              setIsAuthenticated(true);
              setUser(user);
            }}
          />
        ) : (
          <DocumentGenerator 
            user={user}
            onSignOut={() => {
              setIsAuthenticated(false);
              setUser(null);
            }}
          />
        )}
      </div>
    </div>
  );
}