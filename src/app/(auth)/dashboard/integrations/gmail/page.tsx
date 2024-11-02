// src/app/(auth)/dashboard/integrations/gmail/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Mail, RefreshCw } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export default async function GmailSetupPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Get user's current Gmail connection status
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  const settings = user?.settings as any;
  const isConnected = settings?.gmailTokens?.access_token;

  const stats = await prisma.communication.aggregate({
    where: {
      userId,
      source: 'GMAIL',
      type: 'EMAIL'
    },
    _count: true,
    _max: {
      createdAt: true
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gmail Integration</h2>
        <p className="text-muted-foreground">
          Connect your Gmail account to start analyzing email communications
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Connection Status</CardTitle>
                <CardDescription>Current status of your Gmail integration</CardDescription>
              </div>
              {isConnected ? (
                <Badge variant="default" className="h-8">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive" className="h-8">
                  <XCircle className="mr-1 h-4 w-4" />
                  Disconnected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Emails</p>
                    <p className="text-2xl font-bold">{stats._count}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Last Synced</p>
                    <p className="text-2xl font-bold">
                      {stats._max.createdAt 
                        ? new Date(stats._max.createdAt).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Emails
                  </Button>
                  <Button variant="outline" className="text-red-600 hover:text-red-700">
                    Disconnect
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <p>
                  Connect your Gmail account to start analyzing your email communications.
                  We'll only read emails sent to haloweaveinsights@gmail.com.
                </p>
                <Button asChild>
                  <a href="/api/integrations/gmail/auth">
                    <Mail className="mr-2 h-4 w-4" />
                    Connect Gmail
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Configure how your Gmail integration works
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Email Address</h4>
              <p className="text-sm text-muted-foreground">
                haloweaveinsights@gmail.com
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Sync Frequency</h4>
              <p className="text-sm text-muted-foreground">
                Every 5 minutes
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Permissions</h4>
              <ul className="text-sm text-muted-foreground list-disc pl-4">
                <li>Read email messages</li>
                <li>Read email metadata</li>
                <li>No write access required</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}