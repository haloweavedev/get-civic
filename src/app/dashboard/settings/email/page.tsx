'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';

interface EmailStats {
  count: number;
  messagesFound: number;
  emailsProcessed: number;
}

export default function GmailSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<EmailStats | null>(null);

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/auth/gmail');
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      setError('Failed to initiate Gmail connection');
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/emails');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setStats({
        count: data.count || 0,
        messagesFound: data.debug?.messagesFound || 0,
        emailsProcessed: data.debug?.emailsProcessed || 0
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch email stats');
      console.error('Stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check URL parameters for OAuth response
    const success = searchParams.get('success');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      setError(decodeURIComponent(oauthError));
    } else if (success) {
      fetchStats().catch(console.error);
    } else {
      // Initial load
      fetchStats().catch(console.error);
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto p-4">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Gmail Integration Settings</h1>
        
        <div className="space-y-4">
          <Button 
            onClick={handleConnect} 
            disabled={loading}
            className="mb-4"
          >
            {loading ? 'Processing...' : 'Connect Gmail Account'}
          </Button>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-md mb-4">
              {error}
            </div>
          )}

          {stats && (
            <div className="space-y-2 mt-6">
              <h2 className="text-xl font-semibold">Email Statistics</h2>
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-gray-600">Total Emails</div>
                  <div className="text-2xl font-bold">{stats.count}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-gray-600">Messages Found</div>
                  <div className="text-2xl font-bold">{stats.messagesFound}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-gray-600">Processed</div>
                  <div className="text-2xl font-bold">{stats.emailsProcessed}</div>
                </Card>
              </div>
            </div>
          )}

          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => fetchStats()}
              disabled={loading}
              className="mt-4"
            >
              {loading ? 'Refreshing...' : 'Refresh Stats'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}