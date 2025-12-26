import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SessionData {
  sessionToken: string;
  sessionId: string;
  createdAt: string;
}

interface RedirectData {
  redirectUrl: string;
  expiresIn: number;
}

export function useLinkSession() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isIssuingToken, setIsIssuingToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(async (
    linkId: string, 
    fingerprint: string | null,
    userAgent: string,
    referrer: string | null
  ): Promise<SessionData | null> => {
    setIsCreatingSession(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-session', {
        body: {
          linkId,
          fingerprint,
          userAgent,
          referrer,
        },
      });

      if (error) {
        console.error('Create session error:', error);
        setError(error.message || 'Failed to create session');
        return null;
      }

      if (data.error) {
        console.error('Session error:', data.error);
        setError(data.message || data.error);
        return null;
      }

      const sessionData: SessionData = {
        sessionToken: data.sessionToken,
        sessionId: data.sessionId,
        createdAt: data.createdAt,
      };

      setSession(sessionData);
      return sessionData;
    } catch (err) {
      console.error('Unexpected error creating session:', err);
      setError('An unexpected error occurred');
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  }, []);

  const issueRedirectToken = useCallback(async (
    sessionToken: string,
    linkId: string
  ): Promise<RedirectData | null> => {
    setIsIssuingToken(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('issue-token', {
        body: {
          sessionToken,
          linkId,
        },
      });

      if (error) {
        console.error('Issue token error:', error);
        setError(error.message || 'Failed to issue redirect token');
        return null;
      }

      if (data.error) {
        console.error('Token error:', data.error);
        setError(data.message || data.error);
        return null;
      }

      return {
        redirectUrl: data.redirectUrl,
        expiresIn: data.expiresIn,
      };
    } catch (err) {
      console.error('Unexpected error issuing token:', err);
      setError('An unexpected error occurred');
      return null;
    } finally {
      setIsIssuingToken(false);
    }
  }, []);

  return {
    session,
    isCreatingSession,
    isIssuingToken,
    error,
    createSession,
    issueRedirectToken,
  };
}
