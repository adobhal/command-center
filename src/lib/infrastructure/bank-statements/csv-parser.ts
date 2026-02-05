/**
 * CSV Bank Statement Parser
 * Handles various CSV formats from different banks
 */

import Papa from 'papaparse';
import { ParsedBankTransaction, ParsedBankStatement, BankStatementMetadata } from './types';

interface CSVRow {
  [key: string]: string | number;
}

export class CSVParser {
  /**
   * Parse CSV bank statement
   */
  async parse(
    fileContent: string,
    accountName: string,
    accountNumber?: string
  ): Promise<ParsedBankStatement> {
    return new Promise((resolve, reject) => {
      Papa.parse<CSVRow>(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase(),
        complete: (results) => {
          try {
            const transactions = this.parseRows(results.data, accountName);
            const metadata = this.extractMetadata(results.data, accountName, accountNumber);

            resolve({
              transactions,
              metadata,
            });
          } catch (error) {
            reject(error);
          }
        },
        error: (error: Error) => {
          reject(error);
        },
      });
    });
  }

  /**
   * Parse CSV rows into transactions
   */
  private parseRows(rows: CSVRow[], accountName: string): ParsedBankTransaction[] {
    const transactions: ParsedBankTransaction[] = [];

    for (const row of rows) {
      try {
        const transaction = this.parseRow(row, accountName);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error: unknown) {
        console.warn('Failed to parse row:', row, error);
        // Continue parsing other rows
      }
    }

    return transactions;
  }

  /**
   * Parse a single CSV row
   */
  private parseRow(row: CSVRow, accountName: string): ParsedBankTransaction | null {
    // Try to detect column names (common variations)
    const dateStr = this.findColumn(row, ['date', 'transaction date', 'posting date', 'posted date']);
    const amountStr = this.findColumn(row, ['amount', 'transaction amount', 'debit', 'credit']);
    const descriptionStr = this.findColumn(row, ['description', 'memo', 'details', 'payee', 'merchant']);
    const referenceStr = this.findColumn(row, ['reference', 'check number', 'reference number', 'id']);
    const balanceStr = this.findColumn(row, ['balance', 'running balance', 'account balance']);

    if (!dateStr || !amountStr) {
      return null; // Skip rows without essential data
    }

    // Parse date
    const date = this.parseDate(dateStr);
    if (!date) {
      return null;
    }

    // Parse amount
    const amount = this.parseAmount(amountStr);
    if (amount === null) {
      return null;
    }

    // Determine transaction type
    const type = amount >= 0 ? 'credit' : 'debit';
    const absoluteAmount = Math.abs(amount);

    // Parse balance if available
    const balance = balanceStr ? this.parseAmount(balanceStr) : undefined;

    return {
      date,
      amount: absoluteAmount,
      type,
      description: descriptionStr || 'Transaction',
      referenceNumber: referenceStr,
      balance: balance !== null && balance !== undefined ? Math.abs(balance) : undefined,
      metadata: {
        rawRow: row,
        accountName,
      },
    };
  }

  /**
   * Find column value by trying multiple possible column names
   */
  private findColumn(row: CSVRow, possibleNames: string[]): string | undefined {
    for (const name of possibleNames) {
      const value = row[name];
      if (value !== undefined && value !== null && value !== '') {
        return String(value).trim();
      }
    }
    return undefined;
  }

  /**
   * Parse date from various formats
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Try common date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    ];

    // Try parsing as ISO date first
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // Try parsing with common formats
    for (const format of formats) {
      if (format.test(dateStr)) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }

    return null;
  }

  /**
   * Parse amount from string (handles negatives, commas, currency symbols)
   */
  private parseAmount(amountStr: string): number | null {
    if (!amountStr) return null;

    // Remove currency symbols and whitespace
    const cleaned = String(amountStr)
      .replace(/[$,\s]/g, '')
      .trim();

    const amount = parseFloat(cleaned);
    if (isNaN(amount)) {
      return null;
    }

    return amount;
  }

  /**
   * Extract metadata from CSV data
   */
  private extractMetadata(
    rows: CSVRow[],
    accountName: string,
    accountNumber?: string
  ): BankStatementMetadata {
    const transactions = this.parseRows(rows, accountName);
    
    if (transactions.length === 0) {
      return {
        accountName,
        accountNumber,
      };
    }

    const dates = transactions.map((t) => t.date.getTime()).filter((d) => !isNaN(d));
    if (dates.length === 0) {
      return {
        accountName,
        accountNumber,
      };
    }
    const startDate = new Date(Math.min(...dates));
    const endDate = new Date(Math.max(...dates));

    const debits = transactions.filter((t) => t.type === 'debit');
    const credits = transactions.filter((t) => t.type === 'credit');

    return {
      accountName,
      accountNumber,
      statementStartDate: startDate,
      statementEndDate: endDate,
      totalDebits: debits.reduce((sum, t) => sum + t.amount, 0),
      totalCredits: credits.reduce((sum, t) => sum + t.amount, 0),
      openingBalance: transactions[0]?.balance,
      closingBalance: transactions[transactions.length - 1]?.balance,
    };
  }
}
