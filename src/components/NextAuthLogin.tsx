/* eslint-disable @next/next/no-img-element */
'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';

// Define a type for the user object structure from NextAuth
interface NextAuthUser {
  name: string;
  email: string;
  picture: string;
  accessToken: string;
}

interface NextAuthLoginProps {
  onAuthenticated: (user: NextAuthUser) => void;
  onSignOut?: () => void;
}

export default function NextAuthLogin({ onAuthenticated, onSignOut }: NextAuthLoginProps) {
  const { data: session, status } = useSession();

  // Use useEffect to notify parent component when authenticated
  useEffect(() => {
    if (session && status === 'authenticated') {
      const user = {
        name: session.user?.name || '',
        email: session.user?.email || '',
        picture: session.user?.image || '',
        accessToken: (session as { accessToken?: string }).accessToken || '',
      };
      onAuthenticated(user);
    }
  }, [session, status, onAuthenticated]);

  const handleSignIn = () => {
    signIn('google', { prompt: 'consent' });
  };

  const handleSignOut = () => {
    signOut();
    onSignOut?.();
  };

  if (status === 'loading') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <img
            src={session.user?.image || ''}
            alt={session.user?.name || ''}
            className="w-16 h-16 rounded-full mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome, {session.user?.name}!
          </h2>
          <p className="text-gray-600 mb-6">{session.user?.email}</p>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Sign in to Google
        </h2>
        <p className="text-gray-600 mb-8">
          Access your Google Docs templates and create professional documents
        </p>

        <button
          onClick={handleSignIn}
          className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        <div className="mt-6 text-xs text-gray-500">
          <p>We need access to:</p>
          <ul className="mt-2 space-y-1">
            <li>• Google Docs (create and edit documents)</li>
            <li>• Google Drive (access templates and save files)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}