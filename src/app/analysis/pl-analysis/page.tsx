'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

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
    } catch (error: unknown) {
      console.error('Upload error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to upload and analyze file. Please try again.'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImportInsights = async () => {
    setIsImporting(true);
    try {
      const filePath = '/Users/abhidobhal/Downloads/WAREHOUSE REPUBLIC_Profit and Loss.xlsx';
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
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (error: unknown) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease upload the P&L file using the file upload above instead.`);
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
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          P&L Analysis
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Upload your P&L statement to get AI-powered financial insights
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200/80 dark:border-slate-700/80">
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
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-300"
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
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>{file.name}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
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

          {analysisResult && (
            <Card className="border-slate-200/80 dark:border-slate-700/80">
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
                        className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-0.5">
                              <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-50">
                                  {insight.title}
                                </h4>
                                <Badge variant={getPriorityColor(insight.priority)} className="text-xs">
                                  P{insight.priority}
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
                              {insight.percentage !== undefined && (
                                <div className="mt-2 text-xs text-slate-500">
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

        {analysisResult && (
          <div className="space-y-6">
            <Card className="border-slate-200/80 dark:border-slate-700/80">
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Period</div>
                    <div className="font-semibold">{analysisResult.plData.period}</div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-xs text-slate-500 mb-1">Revenue</div>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      ${analysisResult.plData.revenue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-1">Cost of Goods Sold</div>
                    <div className="font-semibold text-rose-600 dark:text-rose-400">
                      ${analysisResult.plData.costOfGoodsSold.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-1">Gross Profit</div>
                    <div className="font-semibold">
                      ${analysisResult.plData.grossProfit.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Margin: {analysisResult.plData.grossMargin.toFixed(2)}%
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-1">Operating Expenses</div>
                    <div className="font-semibold text-rose-600 dark:text-rose-400">
                      ${analysisResult.plData.totalOperatingExpenses.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-xs text-slate-500 mb-1">Operating Income</div>
                    <div
                      className={`text-lg font-bold ${
                        analysisResult.plData.operatingIncome >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      ${analysisResult.plData.operatingIncome.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Margin: {analysisResult.plData.operatingMargin.toFixed(2)}%
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-slate-300 dark:border-slate-600">
                    <div className="text-xs text-slate-500 mb-1">Net Income</div>
                    <div
                      className={`text-xl font-bold ${
                        analysisResult.plData.netIncome >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
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
                    <div className="text-xs text-slate-500 mt-1">
                      Margin: {analysisResult.plData.netMargin.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 dark:border-slate-700/80">
              <CardHeader>
                <CardTitle>Insights Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Total Insights</span>
                    <span className="font-semibold">{analysisResult.insights.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">High Priority</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      {analysisResult.insights.filter((i) => i.priority >= 8).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Actionable</span>
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
  );
}
