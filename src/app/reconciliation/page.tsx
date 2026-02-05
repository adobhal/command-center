'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Search,
  Download,
} from 'lucide-react';

interface MatchCandidate {
  bankTransactionId: string;
  transactionId: string;
  confidence: number;
  matchReasons: string[];
  amountDifference?: number;
  dateDifference?: number;
}

interface ReconciliationResult {
  matched: MatchCandidate[];
  unmatchedBank: string[];
  unmatchedQuickBooks: string[];
  discrepancies: MatchCandidate[];
}

export default function ReconciliationPage() {
  const [accountId, setAccountId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [matching, setMatching] = useState(false);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoMatch, setAutoMatch] = useState(false);
  const [useAI, setUseAI] = useState(true);

  const handleMatch = async () => {
    setMatching(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/reconciliation/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: accountId || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          autoMatch,
          useAI,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Matching failed');
      }

      setResult(data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to match transactions');
    } finally {
      setMatching(false);
    }
  };

  const handleSaveMatches = async (matches: MatchCandidate[]) => {
    try {
      const response = await fetch('/api/reconciliation/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matches,
          matchedBy: 'manual',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save matches');
      }

      alert(`Saved ${matches.length} matches`);
      // Refresh results
      handleMatch();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleUnmatch = async (bankTxId: string, qbTxId: string) => {
    try {
      const response = await fetch('/api/reconciliation/unmatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankTransactionId: bankTxId,
          transactionId: qbTxId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to unmatch');
      }

      alert('Transactions unmatched');
      handleMatch();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation</CardTitle>
          <CardDescription>
            Match bank transactions with QuickBooks entries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="accountId">Account ID (Optional)</Label>
              <Input
                id="accountId"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="Filter by account"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Use AI enhancement</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoMatch}
                onChange={(e) => setAutoMatch(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto-match high confidence pairs</span>
            </label>
            <Button onClick={handleMatch} disabled={matching}>
              {matching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Matching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Find Matches
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {result.matched.length}
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Matched</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {result.unmatchedBank.length}
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Unmatched Bank</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {result.unmatchedQuickBooks.length}
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Unmatched QB</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {result.discrepancies.length}
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Discrepancies</p>
                  </CardContent>
                </Card>
              </div>

              {result.matched.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Matched Transactions</CardTitle>
                      <Button
                        onClick={() => handleSaveMatches(result.matched)}
                        size="sm"
                        variant="outline"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Save All Matches
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.matched.slice(0, 20).map((match, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  match.confidence >= 0.9
                                    ? 'default'
                                    : match.confidence >= 0.7
                                      ? 'secondary'
                                      : 'outline'
                                }
                              >
                                {(match.confidence * 100).toFixed(0)}%
                              </Badge>
                              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                {match.matchReasons.join(', ')}
                              </span>
                            </div>
                            {match.amountDifference && (
                              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                Amount diff: ${match.amountDifference.toFixed(2)}
                              </p>
                            )}
                            {match.dateDifference && (
                              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                Date diff: {match.dateDifference.toFixed(1)} days
                              </p>
                            )}
                          </div>
                          <Button
                            onClick={() => handleUnmatch(match.bankTransactionId, match.transactionId)}
                            size="sm"
                            variant="ghost"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {result.matched.length > 20 && (
                        <p className="text-sm text-zinc-500">
                          Showing 20 of {result.matched.length} matches
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
