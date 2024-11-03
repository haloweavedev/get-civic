'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Phone } from 'lucide-react';

interface TestCallResponse {
  success: boolean;
  callSid?: string;
  error?: string;
}

export function TestCallSection() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastCallSid, setLastCallSid] = useState<string | null>(null);

  const handleTestCall = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      toast.error('Please enter a phone number');
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error('Please enter a valid phone number (E.164 format)');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/communications/test-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data: TestCallResponse = await response.json();

      if (data.success && data.callSid) {
        setLastCallSid(data.callSid);
        toast.success('Test call initiated successfully!');
      } else {
        throw new Error(data.error || 'Failed to initiate call');
      }
    } catch (error) {
      console.error('Test call error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to make test call');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Test Voice Integration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleTestCall} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              type="tel"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Enter phone number in E.164 format (e.g., +1234567890)
            </p>
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initiating Call...
              </>
            ) : (
              <>
                <Phone className="mr-2 h-4 w-4" />
                Make Test Call
              </>
            )}
          </Button>
        </form>
      </CardContent>
      {lastCallSid && (
        <CardFooter>
          <div className="w-full text-sm text-muted-foreground">
            Last Call SID: {lastCallSid}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}