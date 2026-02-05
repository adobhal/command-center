/**
 * Reconciliation Types
 */

export interface MatchCandidate {
  bankTransactionId: string;
  transactionId: string;
  confidence: number; // 0-1
  matchReasons: string[];
  amountDifference?: number;
  dateDifference?: number; // days
}

export interface ReconciliationResult {
  matched: MatchCandidate[];
  unmatchedBank: string[]; // Bank transaction IDs
  unmatchedQuickBooks: string[]; // QuickBooks transaction IDs
  discrepancies: MatchCandidate[]; // Matches with amount/date differences
}

export interface ReconciliationOptions {
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
  dateTolerance?: number; // days
  amountTolerance?: number; // percentage or absolute
  minConfidence?: number; // 0-1
  autoMatch?: boolean; // Automatically match high-confidence pairs
}

export interface MatchRule {
  name: string;
  weight: number; // 0-1, contributes to confidence score
  match: (bankTx: any, qbTx: any) => boolean;
}
