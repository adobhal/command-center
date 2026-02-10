'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileArchive, TrendingUp, AlertTriangle, Zap, Loader2, CheckCircle2 } from 'lucide-react';

interface BusinessMetrics {
  revenue: number;
  expenses: number;
  netIncome: number;
  assets: number;
  liabilities: number;
  equity: number;
  cashFlow: number;
  customerCount: number;
  employeeCount: number;
  vendorCount: number;
  topCustomers: Array<{ name: string; revenue: number }>;
  topExpenses: Array<{ category: string; amount: number }>;
}

interface Insight {
  type: string;
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  priority: number;
  recommendation: string;
  actionable: boolean;
  metrics?: unknown;
}

export default function ComprehensiveAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    metrics: BusinessMetrics;
    insights: Insight[];
    summary: {
      totalInsights: number;
      stored: number;
      highPriority: number;
      critical: number;
    };
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.match(/\.zip$/i)) {
      setFile(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/analytics/comprehensive/upload', {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error(`Server returned an error. Status: ${response.status}. Response: ${text.substring(0, 200)}`);
      }

      const result = await response.json();

      if (!response.ok) {
        console.error('API Error Response:', result);
        const errorMessage = result.error?.message || result.error?.details?.message || 'Failed to analyze data';
        throw new Error(errorMessage);
      }

      setAnalysisResult(result.data);
    } catch (error: unknown) {
      console.error('Upload error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to upload and analyze file. Please try again.'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 9) return 'destructive';
    if (priority >= 7) return 'default';
    return 'secondary';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-rose-600 dark:text-rose-400';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'risk':
        return AlertTriangle;
      case 'opportunity':
        return TrendingUp;
      case 'strategic':
        return Zap;
      default:
        return CheckCircle2;
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Comprehensive Analysis
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Upload a ZIP file containing all your financial data (P&L, Balance Sheet, General Ledger, Customers, Employees, Vendors) to generate powerful business insights
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200/80 dark:border-slate-700/80">
            <CardHeader>
              <CardTitle>Upload Business Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-300"
                    />
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={!file || isAnalyzing}
                    className="flex items-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Analyze
                      </>
                    )}
                  </Button>
                </div>
                {file && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <FileArchive className="h-4 w-4" />
                    <span>{file.name}</span>
                  </div>
                )}
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Expected files: Profit_and_loss.xlsx, Balance_sheet.xlsx, General_ledger.xlsx, Customers.xlsx, Employees.xlsx, Vendors.xlsx
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    onClick={async () => {
                      setIsAnalyzing(true);
                      try {
                        const response = await fetch('/api/analytics/comprehensive/test', {
                          method: 'POST',
                        });
                        if (!response.ok) {
                          const error = await response.json();
                          throw new Error(error.error?.message || 'Failed to analyze');
                        }
                        const result = await response.json();
                        setAnalysisResult(result.data);
                      } catch (error: unknown) {
                        alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      } finally {
                        setIsAnalyzing(false);
                      }
                    }}
                    disabled={isAnalyzing}
                    variant="outline"
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <FileArchive className="h-4 w-4 mr-2" />
                        Analyze Warehouse Republic Data (Test)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {analysisResult && (
            <Card className="border-slate-200/80 dark:border-slate-700/80">
              <CardHeader>
                <CardTitle>Business Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResult.insights.map((insight, idx) => {
                    const Icon = getTypeIcon(insight.type);
                    return (
                      <div
                        key={idx}
                        className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-0.5">
                              <Icon className={`h-5 w-5 ${getImpactColor(insight.impact)}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-50">
                                  {insight.title}
                                </h4>
                                <Badge variant={getPriorityColor(insight.priority)} className="text-xs">
                                  P{insight.priority}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {insight.impact.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                {insight.description}
                              </p>
                              {insight.recommendation && (
                                <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-900 dark:text-slate-100">
                                  <strong>Recommendation:</strong> {insight.recommendation}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {analysisResult && (
          <div className="space-y-6">
            <Card className="border-slate-200/80 dark:border-slate-700/80">
              <CardHeader>
                <CardTitle>Business Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Revenue</div>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      ${analysisResult.metrics.revenue.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-1">Net Income</div>
                    <div
                      className={`text-lg font-bold ${
                        analysisResult.metrics.netIncome >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      ${analysisResult.metrics.netIncome.toLocaleString()}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-xs text-slate-500 mb-1">Assets</div>
                    <div className="font-semibold">
                      ${analysisResult.metrics.assets.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-1">Liabilities</div>
                    <div className="font-semibold text-rose-600 dark:text-rose-400">
                      ${analysisResult.metrics.liabilities.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-1">Equity</div>
                    <div className="font-semibold">
                      ${analysisResult.metrics.equity.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-1">Cash Flow</div>
                    <div
                      className={`font-semibold ${
                        analysisResult.metrics.cashFlow >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      ${analysisResult.metrics.cashFlow.toLocaleString()}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-xs text-slate-500 mb-1">Customers</div>
                    <div className="font-semibold">{analysisResult.metrics.customerCount}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-1">Employees</div>
                    <div className="font-semibold">{analysisResult.metrics.employeeCount}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-1">Vendors</div>
                    <div className="font-semibold">{analysisResult.metrics.vendorCount}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {analysisResult.metrics.topCustomers.length > 0 && (
              <Card className="border-slate-200/80 dark:border-slate-700/80">
                <CardHeader>
                  <CardTitle>Top Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysisResult.metrics.topCustomers.slice(0, 5).map((customer, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">{customer.name}</span>
                        <span className="font-semibold">${customer.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {analysisResult.metrics.topExpenses.length > 0 && (
              <Card className="border-slate-200/80 dark:border-slate-700/80">
                <CardHeader>
                  <CardTitle>Top Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysisResult.metrics.topExpenses.slice(0, 5).map((expense, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">{expense.category}</span>
                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                          ${expense.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-slate-200/80 dark:border-slate-700/80">
              <CardHeader>
                <CardTitle>Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Total Insights</span>
                    <span className="font-semibold">{analysisResult.summary.totalInsights}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Stored</span>
                    <span className="font-semibold">{analysisResult.summary.stored}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Critical</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      {analysisResult.summary.critical}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">High Priority</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {analysisResult.summary.highPriority}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
