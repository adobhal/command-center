'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface PLSummary {
  period: string;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  totalOperatingExpenses: number;
  operatingIncome: number;
  netIncome: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
}

interface PLInsight {
  type: string;
  category: string;
  title: string;
  description: string;
  value: number;
  percentage?: number;
  recommendation?: string;
  priority: number;
}

export default function PLAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    plData: PLSummary;
    insights: PLInsight[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/analytics/pl/upload', {
        method: 'POST',
        body: formData,
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error(`Server returned an error. Status: ${response.status}. Please check the console for details.`);
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to analyze P&L');
      }

      setAnalysisResult(result.data);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Error: ${error.message || 'Failed to upload and analyze file. Please try again.'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImportInsights = async () => {
    setIsImporting(true);
    try {
      // Read the file from the downloads folder
      const filePath = '/Users/abhidobhal/Downloads/WAREHOUSE REPUBLIC_Profit and Loss.xlsx';
      
      // Fetch the file and convert to FormData
      const fileResponse = await fetch(`file://${filePath}`);
      if (!fileResponse.ok) {
        throw new Error('Could not read file. Please upload it manually instead.');
      }
      
      const blob = await fileResponse.blob();
      const file = new File([blob], 'WAREHOUSE REPUBLIC_Profit and Loss.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/analytics/pl/import-direct', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to import insights');
      }

      const result = await response.json();
      alert(`Successfully imported ${result.data.inserted} insights! They will now appear in the AI Insights panel.`);
      
      // Refresh the page to show updated insights
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (error: any) {
      alert(`Error: ${error.message}\n\nPlease upload the P&L file using the file upload above instead.`);
    } finally {
      setIsImporting(false);
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 9) return 'destructive';
    if (priority >= 7) return 'default';
    return 'secondary';
  };

  const getPriorityIcon = (priority: number) => {
    if (priority >= 9) return AlertTriangle;
    if (priority >= 7) return TrendingDown;
    return CheckCircle2;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Profit & Loss Analysis
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Upload your P&L statement to get AI-powered financial insights
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle>Upload P&L Statement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950 dark:file:text-blue-300"
                      />
                    </div>
                    <Button
                      onClick={handleUpload}
                      disabled={!file || isUploading}
                      className="flex items-center gap-2"
                    >
                      {isUploading ? (
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
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>{file.name}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                      Or import insights from Warehouse Republic P&L file:
                    </p>
                    <Button
                      onClick={handleImportInsights}
                      disabled={isImporting}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="h-4 w-4" />
                          Import Warehouse Republic Insights
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            {analysisResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Financial Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResult.insights.map((insight, idx) => {
                      const Icon = getPriorityIcon(insight.priority);
                      return (
                        <div
                          key={idx}
                          className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="mt-0.5">
                                <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                                    {insight.title}
                                  </h4>
                                  <Badge variant={getPriorityColor(insight.priority)} className="text-xs">
                                    P{insight.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                                  {insight.description}
                                </p>
                                {insight.recommendation && (
                                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs text-blue-900 dark:text-blue-100">
                                    <strong>Recommendation:</strong> {insight.recommendation}
                                  </div>
                                )}
                                {insight.percentage !== undefined && (
                                  <div className="mt-2 text-xs text-zinc-500">
                                    Value: {insight.percentage.toFixed(2)}%
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

          {/* Summary Sidebar */}
          {analysisResult && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-zinc-500 mb-1">Period</div>
                      <div className="font-semibold">{analysisResult.plData.period}</div>
                    </div>

                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="text-xs text-zinc-500 mb-1">Revenue</div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${analysisResult.plData.revenue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-zinc-500 mb-1">Cost of Goods Sold</div>
                      <div className="font-semibold text-red-600 dark:text-red-400">
                        ${analysisResult.plData.costOfGoodsSold.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-zinc-500 mb-1">Gross Profit</div>
                      <div className="font-semibold">
                        ${analysisResult.plData.grossProfit.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        Margin: {analysisResult.plData.grossMargin.toFixed(2)}%
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-zinc-500 mb-1">Operating Expenses</div>
                      <div className="font-semibold text-red-600 dark:text-red-400">
                        ${analysisResult.plData.totalOperatingExpenses.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="text-xs text-zinc-500 mb-1">Operating Income</div>
                      <div
                        className={`text-lg font-bold ${
                          analysisResult.plData.operatingIncome >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        ${analysisResult.plData.operatingIncome.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        Margin: {analysisResult.plData.operatingMargin.toFixed(2)}%
                      </div>
                    </div>

                    <div className="pt-4 border-t-2 border-zinc-300 dark:border-zinc-700">
                      <div className="text-xs text-zinc-500 mb-1">Net Income</div>
                      <div
                        className={`text-xl font-bold ${
                          analysisResult.plData.netIncome >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {analysisResult.plData.netIncome >= 0 ? (
                          <TrendingUp className="inline h-5 w-5 mr-1" />
                        ) : (
                          <TrendingDown className="inline h-5 w-5 mr-1" />
                        )}
                        ${Math.abs(analysisResult.plData.netIncome).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        Margin: {analysisResult.plData.netMargin.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Insights Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">Total Insights</span>
                      <span className="font-semibold">{analysisResult.insights.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">High Priority</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        {analysisResult.insights.filter((i) => i.priority >= 8).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">Actionable</span>
                      <span className="font-semibold">
                        {analysisResult.insights.filter((i) => i.recommendation).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
