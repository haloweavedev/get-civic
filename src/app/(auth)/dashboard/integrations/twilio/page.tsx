// src/app/(auth)/dashboard/integrations/twilio/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Phone, MessageSquare } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export default async function TwilioSetupPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Get Twilio stats
  const stats = await prisma.communication.groupBy({
    by: ['type'],
    where: {
      userId,
      source: 'TWILIO',
      type: {
        in: ['CALL', 'SMS']
      }
    },
    _count: true
  });

  const callCount = stats.find(s => s.type === 'CALL')?._count ?? 0;
  const smsCount = stats.find(s => s.type === 'SMS')?._count ?? 0;

  const isConfigured = process.env.TWILIO_ACCOUNT_SID && 
                      process.env.TWILIO_AUTH_TOKEN;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Twilio Integration</h2>
        <p className="text-muted-foreground">
          Configure Twilio to handle phone calls and SMS communications
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Connection Status</CardTitle>
                <CardDescription>Current status of your Twilio integration</CardDescription>
              </div>
              {isConfigured ? (
                <Badge variant="success" className="h-8">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Configured
                </Badge>
              ) : (
                <Badge variant="destructive" className="h-8">
                  <XCircle className="mr-1 h-4 w-4" />
                  Not Configured
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <p className="text-sm text-muted-foreground">Total Calls</p>
                </div>
                <p className="text-2xl font-bold">{callCount}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <p className="text-sm text-muted-foreground">Total SMS</p>
                </div>
                <p className="text-2xl font-bold">{smsCount}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="accountSid">Account SID</Label>
                <Input 
                  id="accountSid" 
                  value={process.env.TWILIO_ACCOUNT_SID} 
                  disabled 
                  type="password"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input 
                  id="phoneNumber" 
                  value={process.env.TWILIO_PHONE_NUMBER} 
                  disabled
                />
              </div>

              <Button variant="outline">
                Update Configuration
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
            <CardDescription>
              Configure your Twilio webhooks to receive communications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Voice Webhook URL</Label>
              <Input 
                value={`${process.env.NEXT_PUBLIC_URL}/api/webhooks/twilio/voice`}
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label>SMS Webhook URL</Label>
              <Input 
                value={`${process.env.NEXT_PUBLIC_URL}/api/webhooks/twilio/sms`}
                readOnly
              />
            </div>

            <div className="pt-4">
              <h4 className="font-medium mb-2">Instructions</h4>
              <ol className="text-sm text-muted-foreground list-decimal pl-4 space-y-2">
                <li>Copy these webhook URLs</li>
                <li>Go to your Twilio Console</li>
                <li>Configure the webhooks for your phone number</li>
                <li>Set HTTP POST as the request method</li>
                <li>Save your changes</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}