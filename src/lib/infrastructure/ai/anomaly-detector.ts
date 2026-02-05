/**
 * AI-Powered Anomaly Detection
 * Identifies unusual transactions and patterns
 */

import { getAIClient } from './client';
import { db } from '../db';
import { transactions, bankTransactions } from '../db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { logger } from '@/lib/shared/utils/logger';

export interface Anomaly {
  type: 'amount' | 'frequency' | 'pattern' | 'timing' | 'description';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  transactionIds: string[];
  metadata?: Record<string, unknown>;
}

export class AnomalyDetector {
  private aiClient: ReturnType<typeof getAIClient>;

  constructor() {
    this.aiClient = getAIClient();
  }

  /**
   * Detect anomalies in transactions
   */
  async detectAnomalies(
    accountId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    // Get transactions
    const conditions = [];
    if (accountId) {
      conditions.push(eq(bankTransactions.bankAccountId, accountId));
    }
    if (startDate) {
      conditions.push(gte(bankTransactions.transactionDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(bankTransactions.transactionDate, endDate));
    }

    const bankTxList = await db.query.bankTransactions.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
    });

    if (bankTxList.length === 0) {
      return anomalies;
    }

    // Detect different types of anomalies
    anomalies.push(...(await this.detectAmountAnomalies(bankTxList)));
    anomalies.push(...(await this.detectFrequencyAnomalies(bankTxList)));
    anomalies.push(...(await this.detectPatternAnomalies(bankTxList)));
    anomalies.push(...(await this.detectDescriptionAnomalies(bankTxList)));

    return anomalies;
  }

  /**
   * Detect unusual amounts
   */
  private async detectAmountAnomalies(transactions: any[]): Promise<Anomaly[]> {
    const amounts = transactions.map((t) => parseFloat(t.amount));
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance =
      amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    const anomalies: Anomaly[] = [];
    const threshold = mean + 3 * stdDev; // 3 standard deviations

    const unusual = transactions.filter((t) => Math.abs(parseFloat(t.amount)) > threshold);

    if (unusual.length > 0) {
      anomalies.push({
        type: 'amount',
        severity: unusual.length > 5 ? 'high' : 'medium',
        title: 'Unusually Large Transactions Detected',
        description: `Found ${unusual.length} transactions significantly larger than average (${unusual.length > 5 ? '>3σ' : '>2σ'})`,
        transactionIds: unusual.map((t) => t.id),
        metadata: {
          averageAmount: mean,
          threshold,
          count: unusual.length,
        },
      });
    }

    return anomalies;
  }

  /**
   * Detect unusual frequency patterns
   */
  private async detectFrequencyAnomalies(transactions: any[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    // Group by date
    const byDate = new Map<string, any[]>();
    transactions.forEach((tx) => {
      const date = new Date(tx.transactionDate).toISOString().split('T')[0];
      if (!byDate.has(date)) {
        byDate.set(date, []);
      }
      byDate.get(date)!.push(tx);
    });

    // Find days with unusually high transaction counts
    const counts = Array.from(byDate.values()).map((txs) => txs.length);
    const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
    const threshold = avgCount * 2; // 2x average

    const unusualDays: string[] = [];
    byDate.forEach((txs, date) => {
      if (txs.length > threshold) {
        unusualDays.push(date);
      }
    });

    if (unusualDays.length > 0) {
      const allTxIds = unusualDays.flatMap((date) =>
        byDate.get(date)!.map((tx) => tx.id)
      );

      anomalies.push({
        type: 'frequency',
        severity: 'medium',
        title: 'Unusual Transaction Frequency',
        description: `Detected ${unusualDays.length} days with unusually high transaction counts`,
        transactionIds: allTxIds,
        metadata: {
          averageDailyCount: avgCount,
          unusualDays,
        },
      });
    }

    return anomalies;
  }

  /**
   * Detect pattern anomalies using AI
   */
  private async detectPatternAnomalies(transactions: any[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    if (transactions.length < 10) {
      return anomalies; // Need enough data
    }

    try {
      // Sample transactions for AI analysis
      const sample = transactions.slice(0, 50).map((tx, idx) => ({
        id: tx.id, // Include ID for reference
        index: idx, // Include original index
        date: new Date(tx.transactionDate).toISOString().split('T')[0],
        amount: parseFloat(tx.amount),
        description: tx.description?.substring(0, 100) || '',
        type: tx.type,
      }));

      const prompt = `Analyze these financial transactions and identify any unusual patterns or anomalies:

${JSON.stringify(sample, null, 2)}

Return JSON with anomalies found:
{
  "anomalies": [
    {
      "type": "pattern",
      "severity": "low|medium|high|critical",
      "title": "brief title",
      "description": "explanation",
      "indices": [0, 1, 2] // indices in the sample array
    }
  ]
}`;

      const response = await this.aiClient.chat([
        {
          role: 'system',
          content: 'You are a financial fraud detection expert. Identify unusual patterns in transaction data.',
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
        if (parsed.anomalies && Array.isArray(parsed.anomalies)) {
          parsed.anomalies.forEach((anomaly: any) => {
            if (anomaly.indices && Array.isArray(anomaly.indices)) {
              anomalies.push({
                type: 'pattern',
                severity: anomaly.severity || 'medium',
                title: anomaly.title || 'Pattern Anomaly',
                description: anomaly.description || '',
                transactionIds: anomaly.indices
                  .map((idx: number) => {
                    const item = sample.find((s) => s.index === idx);
                    return item?.id || '';
                  })
                  .filter((id: string) => id !== ''),
                metadata: {
                  aiDetected: true,
                },
              });
            }
          });
        }
      }
    } catch (error) {
      logger.error('AI pattern detection failed', { error });
    }

    return anomalies;
  }

  /**
   * Detect unusual descriptions using AI
   */
  private async detectDescriptionAnomalies(transactions: any[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    // Find transactions with unusual descriptions
    const descriptions = transactions
      .map((t) => t.description?.toLowerCase().trim() || '')
      .filter((d) => d.length > 0);

    if (descriptions.length < 5) {
      return anomalies;
    }

    try {
      // Use AI to identify unusual descriptions
      const sampleDescriptions = descriptions.slice(0, 100).join('\n');

      const prompt = `Analyze these transaction descriptions and identify any that seem unusual, suspicious, or out of pattern:

${sampleDescriptions}

Return JSON with unusual descriptions:
{
  "unusual": [
    {
      "description": "exact description text",
      "reason": "why it's unusual",
      "severity": "low|medium|high"
    }
  ]
}`;

      const response = await this.aiClient.chat([
        {
          role: 'system',
          content: 'You are a financial analyst. Identify unusual transaction descriptions.',
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
        if (parsed.unusual && Array.isArray(parsed.unusual)) {
          const unusualDescriptions = new Set(
            parsed.unusual.map((u: any) => u.description?.toLowerCase())
          );

          const unusualTx = transactions.filter((tx) =>
            unusualDescriptions.has(tx.description?.toLowerCase())
          );

          if (unusualTx.length > 0) {
            anomalies.push({
              type: 'description',
              severity: parsed.unusual[0]?.severity || 'medium',
              title: 'Unusual Transaction Descriptions',
              description: `Found ${unusualTx.length} transactions with unusual descriptions`,
              transactionIds: unusualTx.map((t) => t.id),
              metadata: {
                reasons: parsed.unusual.map((u: any) => u.reason),
              },
            });
          }
        }
      }
    } catch (error) {
      logger.error('AI description anomaly detection failed', { error });
    }

    return anomalies;
  }
}
