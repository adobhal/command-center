/**
 * AI Insights Generator
 * Generates strategic insights and recommendations
 */

import { getAIClient } from './client';
import { db } from '../db';
import { transactions, bankTransactions, reconciliations } from '../db/schema';
import { logger } from '@/lib/shared/utils/logger';

export interface AIInsight {
  type: 'recommendation' | 'prediction' | 'anomaly' | 'optimization';
  category: 'finance' | 'reconciliation' | 'cash_flow' | 'efficiency';
  title: string;
  description: string;
  priority: number; // 1-10, higher = more important
  actionable: boolean;
  actionUrl?: string;
  confidence: number; // 0-1
  metadata?: Record<string, unknown>;
}

export class InsightsGenerator {
  private aiClient: ReturnType<typeof getAIClient>;

  constructor() {
    this.aiClient = getAIClient();
  }

  /**
   * Generate insights based on current data
   */
  async generateInsights(): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Get data for analysis
    const recentBankTx = await db.query.bankTransactions.findMany({
      limit: 100,
      orderBy: (tx, { desc }) => [desc(tx.transactionDate)],
    });

    const recentQbTx = await db.query.transactions.findMany({
      limit: 100,
      orderBy: (tx, { desc }) => [desc(tx.transactionDate)],
    });

    const recentReconciliations = await db.query.reconciliations.findMany({
      limit: 10,
      orderBy: (rec, { desc }) => [desc(rec.createdAt)],
    });

    // Generate different types of insights
    insights.push(...(await this.generateReconciliationInsights(recentReconciliations)));
    insights.push(...(await this.generateCashFlowInsights(recentBankTx)));
    insights.push(...(await this.generateEfficiencyInsights(recentBankTx, recentQbTx)));

    return insights.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate reconciliation insights
   */
  private async generateReconciliationInsights(
    reconciliations: any[]
  ): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    if (reconciliations.length === 0) {
      return insights;
    }

    const avgHealthScore =
      reconciliations.reduce(
        (sum, rec) => sum + parseFloat(rec.healthScore || '0'),
        0
      ) / reconciliations.length;

    if (avgHealthScore < 80) {
      insights.push({
        type: 'recommendation',
        category: 'reconciliation',
        title: 'Low Reconciliation Health Score',
        description: `Average reconciliation health score is ${avgHealthScore.toFixed(0)}%. Consider reviewing unmatched transactions and improving matching accuracy.`,
        priority: 8,
        actionable: true,
        actionUrl: '/reconciliation',
        confidence: 0.9,
      });
    }

    const highDiscrepancyCount = reconciliations.filter(
      (rec) => rec.discrepancyCount > 5
    ).length;

    if (highDiscrepancyCount > 0) {
      insights.push({
        type: 'anomaly',
        category: 'reconciliation',
        title: 'Multiple Reconciliations with Discrepancies',
        description: `${highDiscrepancyCount} recent reconciliations have discrepancies. Review these matches for accuracy.`,
        priority: 7,
        actionable: true,
        actionUrl: '/reconciliation',
        confidence: 0.85,
      });
    }

    return insights;
  }

  /**
   * Generate cash flow insights using AI
   */
  private async generateCashFlowInsights(transactions: any[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    if (transactions.length < 10) {
      return insights;
    }

    try {
      // Calculate basic stats
      const amounts = transactions.map((t) => parseFloat(t.amount) * (t.type === 'credit' ? 1 : -1));
      const total = amounts.reduce((a, b) => a + b, 0);
      const avgDaily = total / 30; // Approximate

      const prompt = `Analyze this cash flow data and provide insights:

Total transactions: ${transactions.length}
Net cash flow (last 30 days): $${total.toFixed(2)}
Average daily: $${avgDaily.toFixed(2)}

Transaction breakdown:
- Credits: ${transactions.filter((t) => t.type === 'credit').length}
- Debits: ${transactions.filter((t) => t.type === 'debit').length}

Provide 2-3 key insights in JSON format:
{
  "insights": [
    {
      "type": "recommendation|prediction",
      "title": "brief title",
      "description": "detailed explanation",
      "priority": 1-10,
      "actionable": true/false
    }
  ]
}`;

      const response = await this.aiClient.chat([
        {
          role: 'system',
          content: 'You are a financial analyst providing cash flow insights.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      const content = response.choices[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.insights && Array.isArray(parsed.insights)) {
          parsed.insights.forEach((insight: any) => {
            insights.push({
              type: insight.type || 'recommendation',
              category: 'cash_flow',
              title: insight.title || 'Cash Flow Insight',
              description: insight.description || '',
              priority: insight.priority || 5,
              actionable: insight.actionable !== false,
              confidence: 0.8,
            });
          });
        }
      }
    } catch (error) {
      logger.error('AI cash flow insights failed', { error });
    }

    return insights;
  }

  /**
   * Generate efficiency insights
   */
  private async generateEfficiencyInsights(
    bankTx: any[],
    qbTx: any[]
  ): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Calculate automation rate
    const totalPossibleMatches = Math.min(bankTx.length, qbTx.length);
    const automationRate = totalPossibleMatches > 0 ? (totalPossibleMatches / Math.max(bankTx.length, qbTx.length)) * 100 : 0;

    if (automationRate < 70) {
      insights.push({
        type: 'optimization',
        category: 'efficiency',
        title: 'Low Transaction Match Rate',
        description: `Only ${automationRate.toFixed(0)}% of transactions are matched. Consider improving matching criteria or reviewing unmatched items.`,
        priority: 6,
        actionable: true,
        actionUrl: '/reconciliation',
        confidence: 0.9,
      });
    }

    return insights;
  }
}
