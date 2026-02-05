/**
 * Bank Statement Parser
 * Main entry point for parsing bank statements in various formats
 */

import { CSVParser } from './csv-parser';
import { OFXParser } from './ofx-parser';
import { BankStatementNormalizer } from './normalizer';
import {
  ParsedBankStatement,
  BankStatementFormat,
} from './types';
import { NormalizedBankTransaction } from './normalizer';

export interface ParseResult {
  transactions: NormalizedBankTransaction[];
  metadata: ParsedBankStatement['metadata'];
  format: BankStatementFormat;
  totalParsed: number;
  validTransactions: number;
}

export class BankStatementParser {
  private csvParser: CSVParser;
  private ofxParser: OFXParser;
  private normalizer: BankStatementNormalizer;

  constructor() {
    this.csvParser = new CSVParser();
    this.ofxParser = new OFXParser();
    this.normalizer = new BankStatementNormalizer();
  }

  /**
   * Detect file format from filename or content
   */
  detectFormat(filename: string, content?: string): BankStatementFormat {
    const lowerFilename = filename.toLowerCase();

    if (lowerFilename.endsWith('.ofx') || lowerFilename.endsWith('.ofc')) {
      return 'ofx';
    }

    if (lowerFilename.endsWith('.csv')) {
      return 'csv';
    }

    if (lowerFilename.endsWith('.qif')) {
      return 'qif';
    }

    // Try to detect from content
    if (content) {
      if (content.includes('OFXHEADER') || content.includes('<OFX>')) {
        return 'ofx';
      }
      if (content.includes(',') && content.split('\n').length > 1) {
        return 'csv';
      }
    }

    // Default to CSV
    return 'csv';
  }

  /**
   * Parse bank statement file
   */
  async parse(
    fileContent: string,
    filename: string,
    accountName: string,
    accountNumber?: string
  ): Promise<ParseResult> {
    const format = this.detectFormat(filename, fileContent);
    let parsedStatement: ParsedBankStatement;

    // Parse based on format
    switch (format) {
      case 'csv':
        parsedStatement = await this.csvParser.parse(fileContent, accountName, accountNumber);
        break;
      case 'ofx':
        parsedStatement = await this.ofxParser.parse(fileContent);
        // Override account info if provided
        if (accountName) {
          parsedStatement.metadata.accountName = accountName;
        }
        if (accountNumber) {
          parsedStatement.metadata.accountNumber = accountNumber;
        }
        break;
      case 'qif':
        throw new Error('QIF format not yet implemented');
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Normalize transactions
    const normalized = this.normalizer.normalize(parsedStatement.transactions, format);
    const validTransactions = this.normalizer.filterValid(normalized);

    return {
      transactions: validTransactions,
      metadata: parsedStatement.metadata,
      format,
      totalParsed: parsedStatement.transactions.length,
      validTransactions: validTransactions.length,
    };
  }
}
