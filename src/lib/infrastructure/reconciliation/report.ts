/**
 * Reconciliation Report Generator
 */

import { db } from '../db';
import { reconciliations, matchedTransactions, bankTransactions, transactions } from '../db/schema';
import { eq, and, gte, lte, sql, count } from 'drizzle-orm';
import { ReconciliationResult } from './types';
import { logger } from '@/lib/shared/utils/logger';

export interface ReconciliationReport {
  id: string;
  bankAccountId: string;
  bankAccountName: string;
  periodStart: Date;
  periodEnd: Date;
  totalBankTransactions: number;
  totalQuickBooksTransactions: number;
  matchedCount: number;
  unmatchedBankCount: number;
  unmatchedQuickBooksCount: number;
  discrepancyCount: number;
  healthScore: number; // 0-100
  status: 'pending' | 'matched' | 'unmatched' | 'discrepancy' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}

export class ReconciliationReportGenerator {
  /**
   * Generate reconciliation report
   */
  async generateReport(
    bankAccountId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<ReconciliationReport> {
    // Get bank transactions for period
    const bankTxList = await db.query.bankTransactions.findMany({
      where: and(
        eq(bankTransactions.bankAccountId, bankAccountId),
        gte(bankTransactions.transactionDate, periodStart),
        lte(bankTransactions.transactionDate, periodEnd)
      ),
    });

    // Get QuickBooks transactions for period (approximate - would need account mapping)
    const qbTxList = await db.query.transactions.findMany({
      where: and(
        gte(transactions.transactionDate, periodStart),
        lte(transactions.transactionDate, periodEnd)
      ),
    });

    // Get matched transactions
    const matched = await db.query.matchedTransactions.findMany({
      where: sql`${matchedTransactions.bankTransactionId} IN (${sql.join(
        bankTxList.map((tx) => sql`${tx.id}`),
        sql`, `
      )})`,
    });

    const matchedBankIds = new Set(matched.map((m) => m.bankTransactionId));
    const matchedQbIds = new Set(matched.map((m) => m.transactionId));

    const unmatchedBank = bankTxList.filter((tx) => !matchedBankIds.has(tx.id));
    const unmatchedQb = qbTxList.filter((tx) => !matchedQbIds.has(tx.id));

    // Calculate health score
    const totalTransactions = Math.max(bankTxList.length, qbTxList.length);
    const matchRate = totalTransactions > 0 ? matched.length / totalTransactions : 0;
    const healthScore = Math.round(matchRate * 100);

    // Determine status
    let status: ReconciliationReport['status'] = 'pending';
    if (unmatchedBank.length === 0 && unmatchedQb.length === 0) {
      status = 'completed';
    } else if (unmatchedBank.length > 0 && unmatchedQb.length > 0) {
      status = 'unmatched';
    } else if (unmatchedBank.length > 0) {
      status = 'unmatched';
    }

    const bankAccountName = bankTxList[0]?.bankAccountName || 'Unknown Account';

    return {
      id: '', // Will be set when saved
      bankAccountId,
      bankAccountName,
      periodStart,
      periodEnd,
      totalBankTransactions: bankTxList.length,
      totalQuickBooksTransactions: qbTxList.length,
      matchedCount: matched.length,
      unmatchedBankCount: unmatchedBank.length,
      unmatchedQuickBooksCount: unmatchedQb.length,
      discrepancyCount: matched.filter((m) => parseFloat(m.confidenceScore || '0') < 0.95).length,
      healthScore,
      status,
      createdAt: new Date(),
    };
  }

  /**
   * Save reconciliation report
   */
  async saveReport(report: ReconciliationReport): Promise<string> {
    const [saved] = await db
      .insert(reconciliations)
      .values({
        bankAccountId: report.bankAccountId,
        bankAccountName: report.bankAccountName,
        periodStart: report.periodStart,
        periodEnd: report.periodEnd,
        status: report.status,
        matchedCount: report.matchedCount,
        unmatchedCount: report.unmatchedBankCount + report.unmatchedQuickBooksCount,
        discrepancyCount: report.discrepancyCount,
        healthScore: report.healthScore.toString(),
        completedAt: report.completedAt,
        metadata: {
          totalBankTransactions: report.totalBankTransactions,
          totalQuickBooksTransactions: report.totalQuickBooksTransactions,
        },
      })
      .returning();

    return saved.id;
  }

  /**
   * Get reconciliation report by ID
   */
  async getReport(reportId: string): Promise<ReconciliationReport | null> {
    const report = await db.query.reconciliations.findFirst({
      where: eq(reconciliations.id, reportId),
    });

    if (!report) {
      return null;
    }

    return {
      id: report.id,
      bankAccountId: report.bankAccountId,
      bankAccountName: report.bankAccountName,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      totalBankTransactions: (report.metadata as any)?.totalBankTransactions || 0,
      totalQuickBooksTransactions: (report.metadata as any)?.totalQuickBooksTransactions || 0,
      matchedCount: report.matchedCount,
      unmatchedBankCount: report.unmatchedCount,
      unmatchedQuickBooksCount: 0, // Would need separate tracking
      discrepancyCount: report.discrepancyCount,
      healthScore: parseFloat(report.healthScore || '0'),
      status: report.status as any,
      createdAt: report.createdAt,
      completedAt: report.completedAt || undefined,
    };
  }
}
