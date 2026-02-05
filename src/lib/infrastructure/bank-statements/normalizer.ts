/**
 * Bank Statement Normalizer
 * Normalizes parsed transactions from different formats to a common structure
 */

import { ParsedBankTransaction, BankStatementFormat } from './types';

export interface NormalizedBankTransaction {
  date: Date;
  amount: number;
  type: 'debit' | 'credit';
  description: string;
  referenceNumber?: string;
  balance?: number;
  category?: string;
  metadata: {
    sourceFormat: BankStatementFormat;
    originalData?: Record<string, unknown>;
  };
}

export class BankStatementNormalizer {
  /**
   * Normalize parsed transactions
   */
  normalize(
    transactions: ParsedBankTransaction[],
    sourceFormat: BankStatementFormat
  ): NormalizedBankTransaction[] {
    return transactions.map((tx) => ({
      date: tx.date,
      amount: tx.amount,
      type: tx.type,
      description: this.normalizeDescription(tx.description),
      referenceNumber: tx.referenceNumber,
      balance: tx.balance,
      category: tx.category,
      metadata: {
        sourceFormat,
        originalData: tx.metadata,
      },
    }));
  }

  /**
   * Normalize description (clean up, remove extra whitespace, etc.)
   */
  private normalizeDescription(description: string): string {
    return description
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .substring(0, 255); // Limit length
  }

  /**
   * Validate normalized transaction
   */
  validate(transaction: NormalizedBankTransaction): boolean {
    if (!transaction.date || isNaN(transaction.date.getTime())) {
      return false;
    }

    if (!transaction.amount || transaction.amount <= 0) {
      return false;
    }

    if (!transaction.description || transaction.description.trim().length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Filter out invalid transactions
   */
  filterValid(transactions: NormalizedBankTransaction[]): NormalizedBankTransaction[] {
    return transactions.filter((tx) => this.validate(tx));
  }
}
