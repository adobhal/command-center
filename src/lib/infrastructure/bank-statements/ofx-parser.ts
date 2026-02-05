/**
 * OFX Bank Statement Parser
 * Handles OFX (Open Financial Exchange) format
 */

// OFX parsing - using a simple parser since the 'ofx' package has compatibility issues
// For production, consider using a more robust OFX parser library
import { ParsedBankTransaction, ParsedBankStatement, BankStatementMetadata } from './types';

export class OFXParser {
  /**
   * Parse OFX bank statement
   * Note: This is a simplified parser. For production, use a robust OFX library.
   */
  async parse(fileContent: string): Promise<ParsedBankStatement> {
    try {
      const ofxData = this.parseOFXString(fileContent);
      const transactions = this.parseTransactions(ofxData);
      const metadata = this.extractMetadata(ofxData);

      return {
        transactions,
        metadata,
      };
    } catch (error: any) {
      throw new Error(`Failed to parse OFX file: ${error.message}`);
    }
  }

  /**
   * Simple OFX string parser
   */
  private parseOFXString(content: string): any {
    const result: any = {
      BANKMSGSRSV1: {
        STMTTRNRS: {
          STMTRS: {
            BANKACCTFROM: {},
            BANKTRANLIST: {
              STMTTRN: [],
            },
            LEDGERBAL: {},
          },
        },
      },
    };

    // Extract account info
    const acctIdMatch = content.match(/<ACCTID>([^<]+)</);
    const acctTypeMatch = content.match(/<ACCTTYPE>([^<]+)</);
    const bankIdMatch = content.match(/<BANKID>([^<]+)</);

    if (acctIdMatch) {
      result.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKACCTFROM.ACCTID = acctIdMatch[1];
    }
    if (acctTypeMatch) {
      result.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKACCTFROM.ACCTTYPE = acctTypeMatch[1];
    }
    if (bankIdMatch) {
      result.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKACCTFROM.BANKID = bankIdMatch[1];
    }

    // Extract transactions
    const transactionMatches = content.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/g);
    const transactions: any[] = [];

    for (const match of transactionMatches) {
      const txContent = match[1];
      const tx: any = {};

      const dtMatch = txContent.match(/<DTPOSTED>([^<]+)</);
      const amtMatch = txContent.match(/<TRNAMT>([^<]+)</);
      const fitIdMatch = txContent.match(/<FITID>([^<]+)</);
      const nameMatch = txContent.match(/<NAME>([^<]+)</);
      const memoMatch = txContent.match(/<MEMO>([^<]+)</);
      const checkNumMatch = txContent.match(/<CHECKNUM>([^<]+)</);

      if (dtMatch) tx.DTTRAN = dtMatch[1];
      if (amtMatch) tx.TRNAMT = amtMatch[1];
      if (fitIdMatch) tx.FITID = fitIdMatch[1];
      if (nameMatch) tx.NAME = nameMatch[1];
      if (memoMatch) tx.MEMO = memoMatch[1];
      if (checkNumMatch) tx.CHECKNUM = checkNumMatch[1];

      transactions.push(tx);
    }

    result.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN = transactions;

    // Extract statement dates
    const dtStartMatch = content.match(/<DTSTART>([^<]+)</);
    const dtEndMatch = content.match(/<DTEND>([^<]+)</);
    if (dtStartMatch) {
      result.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.DTSTART = dtStartMatch[1];
    }
    if (dtEndMatch) {
      result.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.DTEND = dtEndMatch[1];
    }

    // Extract balance
    const balMatch = content.match(/<BALAMT>([^<]+)</);
    const curDefMatch = content.match(/<CURDEF>([^<]+)</);
    if (balMatch) {
      result.BANKMSGSRSV1.STMTTRNRS.STMTRS.LEDGERBAL.BALAMT = balMatch[1];
    }
    if (curDefMatch) {
      result.BANKMSGSRSV1.STMTTRNRS.STMTRS.LEDGERBAL.CURDEF = curDefMatch[1];
    }

    return result;
  }

  /**
   * Parse transactions from OFX data
   */
  private parseTransactions(ofxData: any): ParsedBankTransaction[] {
    const transactions: ParsedBankTransaction[] = [];

    // OFX structure: ofxData.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN[]
    const bankTransactions =
      ofxData.BANKMSGSRSV1?.STMTTRNRS?.STMTRS?.BANKTRANLIST?.STMTTRN || [];

    for (const ofxTx of bankTransactions) {
      try {
        const transaction = this.parseTransaction(ofxTx);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        console.warn('Failed to parse OFX transaction:', ofxTx, error);
      }
    }

    return transactions;
  }

  /**
   * Parse a single OFX transaction
   */
  private parseTransaction(ofxTx: any): ParsedBankTransaction | null {
    if (!ofxTx.DTTRAN || !ofxTx.TRNAMT) {
      return null;
    }

    // Parse date (OFX format: YYYYMMDDHHMMSS or YYYYMMDD)
    const dateStr = String(ofxTx.DTTRAN);
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-indexed
    const day = parseInt(dateStr.substring(6, 8));
    const date = new Date(year, month, day);

    // Parse amount
    const amount = Math.abs(parseFloat(ofxTx.TRNAMT));
    const type = parseFloat(ofxTx.TRNAMT) >= 0 ? 'credit' : 'debit';

    return {
      date,
      amount,
      type,
      description: ofxTx.MEMO || ofxTx.NAME || 'Transaction',
      referenceNumber: ofxTx.FITID || ofxTx.CHECKNUM,
      metadata: {
        fitId: ofxTx.FITID,
        checkNum: ofxTx.CHECKNUM,
        name: ofxTx.NAME,
        memo: ofxTx.MEMO,
      },
    };
  }

  /**
   * Extract metadata from OFX data
   */
  private extractMetadata(ofxData: any): BankStatementMetadata {
    const stmtRs = ofxData.BANKMSGSRSV1?.STMTTRNRS?.STMTRS;
    const bankAcctFrom = stmtRs?.BANKACCTFROM;
    const bankTranList = stmtRs?.BANKTRANLIST;
    const ledgerBal = stmtRs?.LEDGERBAL;

    const accountNumber = bankAcctFrom?.ACCTID;
    const accountType = bankAcctFrom?.ACCTTYPE;
    const bankId = bankAcctFrom?.BANKID;

    // Get statement period
    const dtStart = bankTranList?.DTSTART;
    const dtEnd = bankTranList?.DTEND;

    let statementStartDate: Date | undefined;
    let statementEndDate: Date | undefined;

    if (dtStart) {
      const startStr = String(dtStart);
      statementStartDate = this.parseOFXDate(startStr);
    }

    if (dtEnd) {
      const endStr = String(dtEnd);
      statementEndDate = this.parseOFXDate(endStr);
    }

    // Get balances
    let openingBalance: number | undefined;
    let closingBalance: number | undefined;

    if (ledgerBal) {
      closingBalance = parseFloat(ledgerBal.BALAMT);
    }

    return {
      accountNumber,
      accountName: accountNumber ? `Account ${accountNumber}` : undefined,
      bankName: bankId,
      statementStartDate,
      statementEndDate,
      closingBalance,
      openingBalance,
      currency: ledgerBal?.CURDEF || 'USD',
    };
  }

  /**
   * Parse OFX date format (YYYYMMDDHHMMSS or YYYYMMDD)
   */
  private parseOFXDate(dateStr: string): Date {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    const hour = dateStr.length > 8 ? parseInt(dateStr.substring(8, 10)) : 0;
    const minute = dateStr.length > 10 ? parseInt(dateStr.substring(10, 12)) : 0;
    const second = dateStr.length > 12 ? parseInt(dateStr.substring(12, 14)) : 0;

    return new Date(year, month, day, hour, minute, second);
  }
}
