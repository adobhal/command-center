/**
 * Transaction Matcher
 * Matches bank transactions with QuickBooks entries using multiple strategies
 */

import { db } from '../db';
import { transactions, bankTransactions, matchedTransactions } from '../db/schema';
import { eq, and, gte, lte, sql, or, isNull } from 'drizzle-orm';
import { MatchCandidate, ReconciliationResult, ReconciliationOptions, MatchRule } from './types';
import { logger } from '@/lib/shared/utils/logger';
import { AIMatchingEnhancer } from '../ai/matching';

export class TransactionMatcher {
  private dateTolerance: number;
  private amountTolerance: number;
  private minConfidence: number;

  constructor(options: ReconciliationOptions = {}) {
    this.dateTolerance = options.dateTolerance || 3; // Default 3 days
    this.amountTolerance = options.amountTolerance || 0.01; // Default 1% or $0.01
    this.minConfidence = options.minConfidence || 0.7; // Default 70% confidence
  }

  /**
   * Match bank transactions with QuickBooks transactions
   */
  async matchTransactions(
    options: ReconciliationOptions & { useAI?: boolean } = {}
  ): Promise<ReconciliationResult> {
    const {
      accountId,
      startDate,
      endDate,
      dateTolerance = this.dateTolerance,
      amountTolerance = this.amountTolerance,
      minConfidence = this.minConfidence,
    } = options;

    // Build query conditions
    const bankConditions = [];
    const qbConditions = [];

    if (accountId) {
      bankConditions.push(eq(bankTransactions.bankAccountId, accountId));
    }

    if (startDate) {
      bankConditions.push(gte(bankTransactions.transactionDate, startDate));
      qbConditions.push(gte(transactions.transactionDate, startDate));
    }

    if (endDate) {
      bankConditions.push(lte(bankTransactions.transactionDate, endDate));
      qbConditions.push(lte(transactions.transactionDate, endDate));
    }

    // Fetch unmatched bank transactions
    const bankTxList = await db.query.bankTransactions.findMany({
      where: bankConditions.length > 0 ? and(...bankConditions) : undefined,
    });

    // Fetch unmatched QuickBooks transactions
    // Get transactions that aren't already matched
    const matchedBankTxIds = await db
      .select({ id: matchedTransactions.bankTransactionId })
      .from(matchedTransactions);

    const matchedBankTxIdSet = new Set(matchedBankTxIds.map((m) => m.id));

    const unmatchedBankTx = bankTxList.filter((tx) => !matchedBankTxIdSet.has(tx.id));

    // Fetch QuickBooks transactions
    const qbTxList = await db.query.transactions.findMany({
      where: qbConditions.length > 0 ? and(...qbConditions) : undefined,
    });

    // Get already matched QB transactions
    const matchedQbTxIds = await db
      .select({ id: matchedTransactions.transactionId })
      .from(matchedTransactions);

    const matchedQbTxIdSet = new Set(matchedQbTxIds.map((m) => m.id));
    const unmatchedQbTx = qbTxList.filter((tx) => !matchedQbTxIdSet.has(tx.id));

    logger.info('Starting reconciliation', {
      unmatchedBank: unmatchedBankTx.length,
      unmatchedQuickBooks: unmatchedQbTx.length,
    });

    // Match transactions
    let matches: MatchCandidate[] = [];
    const matchedBankIds = new Set<string>();
    const matchedQbIds = new Set<string>();

    for (const bankTx of unmatchedBankTx) {
      const bestMatch = this.findBestMatch(
        bankTx,
        unmatchedQbTx.filter((qb) => !matchedQbIds.has(qb.id)),
        dateTolerance,
        amountTolerance
      );

      if (bestMatch && bestMatch.confidence >= minConfidence) {
        matches.push(bestMatch);
        matchedBankIds.add(bankTx.id);
        matchedQbIds.add(bestMatch.transactionId);
      }
    }

    // Enhance with AI if requested
    if (options.useAI && matches.length > 0) {
      try {
        const enhancer = new AIMatchingEnhancer();
        matches = await enhancer.enhanceMatches(matches, unmatchedBankTx, unmatchedQbTx);
        logger.info('AI-enhanced matches', { count: matches.length });
      } catch (error) {
        logger.warn('AI enhancement failed, using base matches', { error });
      }
    }

    // Identify discrepancies (matches with differences)
    const discrepancies = matches.filter(
      (m) => m.amountDifference !== undefined || (m.dateDifference && m.dateDifference > 0)
    );

    // Get unmatched transactions
    const unmatchedBank = unmatchedBankTx
      .filter((tx) => !matchedBankIds.has(tx.id))
      .map((tx) => tx.id);

    const unmatchedQuickBooks = unmatchedQbTx
      .filter((tx) => !matchedQbIds.has(tx.id))
      .map((tx) => tx.id);

    return {
      matched: matches,
      unmatchedBank,
      unmatchedQuickBooks,
      discrepancies,
    };
  }

  /**
   * Find best match for a bank transaction
   */
  private findBestMatch(
    bankTx: any,
    qbTransactions: any[],
    dateTolerance: number,
    amountTolerance: number
  ): MatchCandidate | null {
    let bestMatch: MatchCandidate | null = null;
    let bestConfidence = 0;

    for (const qbTx of qbTransactions) {
      const candidate = this.calculateMatch(
        bankTx,
        qbTx,
        dateTolerance,
        amountTolerance
      );

      if (candidate && candidate.confidence > bestConfidence) {
        bestConfidence = candidate.confidence;
        bestMatch = candidate;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate match confidence between bank and QuickBooks transaction
   */
  private calculateMatch(
    bankTx: any,
    qbTx: any,
    dateTolerance: number,
    amountTolerance: number
  ): MatchCandidate | null {
    const bankAmount = parseFloat(bankTx.amount);
    const qbAmount = parseFloat(qbTx.amount);

    // Amount must match (within tolerance)
    const amountDiff = Math.abs(bankAmount - qbAmount);
    const amountMatch = amountDiff <= amountTolerance || amountDiff / Math.max(bankAmount, qbAmount) <= amountTolerance;

    if (!amountMatch) {
      return null; // Amount doesn't match, skip
    }

    // Calculate date difference
    const bankDate = new Date(bankTx.transactionDate);
    const qbDate = new Date(qbTx.transactionDate);
    const dateDiffMs = Math.abs(bankDate.getTime() - qbDate.getTime());
    const dateDiffDays = dateDiffMs / (1000 * 60 * 60 * 24);

    if (dateDiffDays > dateTolerance) {
      return null; // Date difference too large
    }

    // Calculate confidence score
    const matchReasons: string[] = [];
    let confidence = 0;

    // Amount match (40% weight)
    if (amountDiff === 0) {
      confidence += 0.4;
      matchReasons.push('Exact amount match');
    } else {
      confidence += 0.3;
      matchReasons.push(`Amount match (diff: $${amountDiff.toFixed(2)})`);
    }

    // Date match (30% weight)
    if (dateDiffDays === 0) {
      confidence += 0.3;
      matchReasons.push('Exact date match');
    } else if (dateDiffDays <= 1) {
      confidence += 0.25;
      matchReasons.push(`Date match (${dateDiffDays.toFixed(1)} days)`);
    } else {
      confidence += 0.2;
      matchReasons.push(`Date match (${dateDiffDays.toFixed(1)} days)`);
    }

    // Reference number match (20% weight)
    if (
      bankTx.referenceNumber &&
      qbTx.referenceNumber &&
      bankTx.referenceNumber === qbTx.referenceNumber
    ) {
      confidence += 0.2;
      matchReasons.push('Reference number match');
    } else if (bankTx.referenceNumber || qbTx.referenceNumber) {
      // Partial match
      confidence += 0.1;
    }

    // Description similarity (10% weight)
    const descriptionSimilarity = this.calculateDescriptionSimilarity(
      bankTx.description || '',
      qbTx.description || ''
    );
    confidence += descriptionSimilarity * 0.1;
    if (descriptionSimilarity > 0.7) {
      matchReasons.push('Description similarity');
    }

    return {
      bankTransactionId: bankTx.id,
      transactionId: qbTx.id,
      confidence: Math.min(confidence, 1.0), // Cap at 1.0
      matchReasons,
      amountDifference: amountDiff > 0 ? amountDiff : undefined,
      dateDifference: dateDiffDays > 0 ? dateDiffDays : undefined,
    };
  }

  /**
   * Calculate similarity between two descriptions (simple Levenshtein-like)
   */
  private calculateDescriptionSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;

    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1.0;

    // Check if one contains the other
    if (s1.includes(s2) || s2.includes(s1)) {
      return 0.8;
    }

    // Simple word overlap
    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));
    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) return 0;

    return intersection.size / union.size;
  }

  /**
   * Save matches to database
   */
  async saveMatches(
    matches: MatchCandidate[],
    matchedBy: 'ai' | 'rule' | 'manual' = 'ai',
    reconciliationId?: string
  ): Promise<number> {
    let saved = 0;

    for (const match of matches) {
      try {
        // Check if already matched
        const existing = await db.query.matchedTransactions.findFirst({
          where: and(
            eq(matchedTransactions.bankTransactionId, match.bankTransactionId),
            eq(matchedTransactions.transactionId, match.transactionId)
          ),
        });

        if (existing) {
          continue; // Already matched
        }

        await db.insert(matchedTransactions).values({
          reconciliationId: reconciliationId || '', // Optional - can be empty for unmatched pairs
          bankTransactionId: match.bankTransactionId,
          transactionId: match.transactionId,
          confidenceScore: match.confidence.toString(),
          matchedBy,
          metadata: {
            matchReasons: match.matchReasons,
            amountDifference: match.amountDifference,
            dateDifference: match.dateDifference,
          },
        });

        saved++;
      } catch (error) {
        logger.error('Error saving match', {
          match,
          error,
        });
      }
    }

    return saved;
  }

  /**
   * Unmatch transactions
   */
  async unmatch(bankTransactionId: string, transactionId: string): Promise<void> {
    await db
      .delete(matchedTransactions)
      .where(
        and(
          eq(matchedTransactions.bankTransactionId, bankTransactionId),
          eq(matchedTransactions.transactionId, transactionId)
        )
      );
  }
}
