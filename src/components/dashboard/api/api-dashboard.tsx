// src/components/dashboard/api/api-dashboard.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiTester } from './api-tester';
import { toast } from 'sonner';
import { Copy, RefreshCw } from 'lucide-react';

interface ApiDashboardProps {
  user: {
    apiKey: string | null;
    apiUsage: number;
    apiLimit: number;
  };
}

export function ApiDashboard({ user }: ApiDashboardProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateApiKey = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch('/api/auth/api-key', {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to generate API key');
      
      const data = await response.json();
      toast.success('API key generated successfully');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to generate API key');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyApiKey = () => {
    if (user.apiKey) {
      navigator.clipboard.writeText(user.apiKey);
      toast.success('API key copied to clipboard');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">API Access</h2>
        <p className="text-muted-foreground">
          Manage your API key and view usage statistics
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your API Key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.apiKey ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  value={user.apiKey} 
                  readOnly 
                  className="font-mono"
                />
                <Button 
                  variant="outline" 
                  onClick={copyApiKey}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Usage: {user.apiUsage} / {user.apiLimit} requests
              </div>
            </div>
          ) : (
            <Button
              onClick={generateApiKey}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : 'Generate API Key'}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Endpoint</h3>
              <code className="bg-gray-100 p-2 rounded block">
                GET https://get-civic.vercel.app/api/v1/communications
              </code>
            </div>

            <div>
              <h3 className="font-medium mb-2">Headers</h3>
              <code className="bg-gray-100 p-2 rounded block">
                Authorization: Bearer YOUR_API_KEY
              </code>
            </div>

            <div>
              <h3 className="font-medium mb-2">Query Parameters</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>limit: Number of records (default: 10)</li>
                <li>page: Page number (default: 1)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">Example Response</h3>
              <pre className="bg-gray-100 p-2 rounded overflow-auto">
{JSON.stringify({
  "success": true,
  "data": [{
    "id": "example-id",
    "type": "EMAIL",
    "content": "Sample content...",
    "analysis": {
      "sentiment": { "label": "positive", "score": 0.8 },
      "categories": { "primary": "Feedback" }
    }
  }],
  "pagination": {
    "page": 1,
    "limit": 10,
    "hasMore": false
  }
}, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {user.apiKey && (
        <ApiTester apiKey={user.apiKey} />
        )}
    </div>
  );
}

export default ApiDashboard;