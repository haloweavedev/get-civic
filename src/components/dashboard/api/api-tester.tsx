// src/components/dashboard/api/api-tester.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Play } from 'lucide-react';

interface ApiResponse {
  success: boolean;
  data: any[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export function ApiTester({ apiKey }: { apiKey: string }) {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [limit, setLimit] = useState('5');

  const testApi = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/v1/communications?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error('API test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test API</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="Limit"
              className="w-24"
            />
            <Button 
              onClick={testApi}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Test API
                </>
              )}
            </Button>
          </div>

          {response && (
            <div className="space-y-2">
              <div className="font-medium">Response:</div>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}