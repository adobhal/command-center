'use client';

import { useEffect, useState, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface QuickBooksConnection {
  id: string;
  companyName: string;
  companyId: string;
  realmId: string;
  expiresAt: Date;
  isExpired: boolean;
  createdAt: Date;
}

function QuickBooksConnectContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<QuickBooksConnection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const successParam = searchParams.get('success');

    if (errorParam) {
      setError(getErrorMessage(errorParam));
    }
    if (successParam === 'true') {
      setSuccess(true);
      fetchConnections();
    } else {
      fetchConnections();
    }
  }, [searchParams]);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/quickbooks/connections');
      if (!response.ok) throw new Error('Failed to fetch connections');
      const data = await response.json();
      setConnections(data.data || []);
    } catch (err) {
      console.error('Error fetching connections:', err);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/quickbooks/connect');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const data = await response.json();
      window.location.href = data.data.authUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect to QuickBooks');
      setLoading(false);
    }
  };

  const handleSync = async (connectionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/quickbooks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Sync failed');
      }

      const data = await response.json();
      setSuccess(true);
      alert(`Sync completed: ${data.data.message}`);
      setLoading(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sync');
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    const messages: Record<string, string> = {
      missing_params: 'Missing required parameters',
      invalid_state: 'Invalid state parameter',
      not_configured: 'QuickBooks is not configured',
      callback_failed: 'Failed to complete connection',
    };
    return messages[errorCode] || 'An error occurred';
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>QuickBooks Online Connection</CardTitle>
          <CardDescription>
            Connect your QuickBooks Online account to sync transactions and enable reconciliation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  QuickBooks connected successfully!
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Connect QuickBooks</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Authorize access to your QuickBooks Online account
              </p>
            </div>
            <Button onClick={handleConnect} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Connect QuickBooks
                </>
              )}
            </Button>
          </div>

          {connections.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Connected Accounts</h3>
              {connections.map((connection) => (
                <Card key={connection.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{connection.companyName}</h4>
                          {connection.isExpired ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          Realm ID: {connection.realmId}
                        </p>
                        <p className="text-xs text-zinc-500">
                          Expires: {new Date(connection.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleSync(connection.id)}
                        disabled={loading || connection.isExpired}
                        variant="outline"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Sync Now
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function QuickBooksConnectPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <QuickBooksConnectContent />
    </Suspense>
  );
}
