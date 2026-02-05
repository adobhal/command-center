/**
 * Bank Statement Types
 */

export interface ParsedBankTransaction {
  date: Date;
  amount: number;
  type: 'debit' | 'credit';
  description: string;
  referenceNumber?: string;
  balance?: number;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface BankStatementMetadata {
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  statementStartDate?: Date;
  statementEndDate?: Date;
  currency?: string;
  openingBalance?: number;
  closingBalance?: number;
  totalDebits?: number;
  totalCredits?: number;
}

export interface ParsedBankStatement {
  transactions: ParsedBankTransaction[];
  metadata: BankStatementMetadata;
}

export type BankStatementFormat = 'csv' | 'ofx' | 'qif';
