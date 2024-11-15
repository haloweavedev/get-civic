// src/app/(auth)/dashboard/integrations/gmail/gmail-integration-client.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Mail, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type EmailPreview = {
  id: string;
  metadata: {
    date: string;
    fromName?: string;
    source: string;
    threadId: string;
  };
  subject: string;
  from: string;
  content: string;
  createdAt: string | Date;
  status: string;
};

type Props = {
  isConnected: boolean;
  emailCount: number;
  lastSynced?: Date | null;
  userId: string;
  latestEmails: EmailPreview[];
};

interface SyncResponse {
  success: boolean;
  new?: number;
  total?: number;
  error?: string;
}

export default function GmailIntegrationClient({
  isConnected,
  emailCount,
  lastSynced,
  userId,
  latestEmails,
}: Props) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const router = useRouter();

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const response = await fetch('/api/integrations/gmail/auth');
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('No auth URL received');
      }
    } catch (error) {
      toast.error('Failed to start Gmail connection');
      console.error('Connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSync = async () => {
    if (!isConnected) {
      toast.error('Please connect Gmail first');
      return;
    }

    try {
      setIsSyncing(true);
      setSyncProgress('Initializing sync...');
      setLastSyncError(null);

      const response = await fetch('/api/integrations/gmail/sync', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }

      const data: SyncResponse = await response.json();

      if (data.error) {
        if (data.error.includes('token')) {
          toast.error('Gmail connection expired. Please reconnect your account.');
          setLastSyncError('Gmail connection expired. Please reconnect.');
        } else {
          throw new Error(data.error);
        }
      } else if (data.success) {
        toast.success(`Synced ${data.new} new emails`);
        router.refresh();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sync emails';
      setLastSyncError(message);
      toast.error(message);
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      const response = await fetch('/api/integrations/gmail/disconnect', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      toast.success('Gmail disconnected successfully');
      router.refresh();
    } catch (error) {
      toast.error('Failed to disconnect Gmail');
      console.error('Disconnect error:', error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PROCESSED':
        return <Badge variant="default">Processed</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gmail Integration</h2>
        <p className="text-muted-foreground">
          Connect your Gmail account to start analyzing email communications.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>Current status of your Gmail integration</CardDescription>
            </div>
            <Badge variant={isConnected ? 'default' : 'destructive'} className="h-8">
              {isConnected ? (
                <>
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Connected
                </>
              ) : (
                <>
                  <XCircle className="mr-1 h-4 w-4" />
                  Disconnected
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isConnected ? (
              <>
                <div className="grid grid-cols-3 gap-4 bg-muted p-4 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Total Emails</div>
                    <div className="text-2xl font-bold">{emailCount}</div>
                  </div>
                  {lastSynced && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Last Synced</div>
                      <div className="text-sm font-medium">
                        {formatDistanceToNow(new Date(lastSynced), { addSuffix: true })}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Email Account</div>
                    <div className="text-sm font-medium">haloweaveinsights@gmail.com</div>
                  </div>
                </div>

                {lastSyncError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {lastSyncError}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button onClick={handleSync} disabled={isSyncing || isDisconnecting}>
                    {isSyncing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {syncProgress || 'Syncing...'}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync Emails
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting || isSyncing}
                  >
                    {isDisconnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Disconnect
                      </>
                    )}
                  </Button>
                </div>

                {latestEmails.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Latest Emails</h3>
                      <div className="space-y-4">
                        {latestEmails.map((email) => (
                          <Card key={email.id}>
                            <CardContent className="pt-6">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <h4 className="font-medium">{email.subject}</h4>
                                  <p className="text-sm text-muted-foreground">From: {email.from}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {getStatusBadge(email.status)}
                                  <span className="text-sm text-muted-foreground">
                                    {formatDate(email.createdAt)}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm line-clamp-2">{email.content}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="bg-muted p-6 rounded-lg mb-6">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Connect your Gmail account to start analyzing your email communications. We'll only read emails
                    sent to haloweaveinsights@gmail.com.
                  </p>
                </div>
                <Button size="lg" onClick={handleConnect} disabled={isConnecting}>
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Connect Gmail
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}