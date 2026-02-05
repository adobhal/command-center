/**
 * QuickBooks Online API Client
 */

import axios, { AxiosInstance } from 'axios';
import {
  QuickBooksAccount,
  QuickBooksCompany,
  QuickBooksJournalEntry,
  QuickBooksQueryResponse,
  QuickBooksTransaction,
} from './types';

export interface QuickBooksClientConfig {
  accessToken: string;
  realmId: string;
  environment: 'sandbox' | 'production';
}

export class QuickBooksClient {
  private accessToken: string;
  private realmId: string;
  private apiBase: string;
  private client: AxiosInstance;

  constructor(config: QuickBooksClientConfig) {
    this.accessToken = config.accessToken;
    this.realmId = config.realmId;
    this.apiBase =
      config.environment === 'sandbox'
        ? 'https://sandbox-quickbooks.api.intuit.com'
        : 'https://quickbooks.api.intuit.com';

    this.client = axios.create({
      baseURL: `${this.apiBase}/v3/company/${this.realmId}`,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get company information
   */
  async getCompany(): Promise<QuickBooksCompany> {
    const response = await this.client.get<{ CompanyInfo: QuickBooksCompany }>(
      `/companyinfo/${this.realmId}`
    );
    return response.data.CompanyInfo;
  }

  /**
   * Query accounts
   */
  async queryAccounts(
    where?: string,
    startPosition?: number,
    maxResults?: number
  ): Promise<QuickBooksAccount[]> {
    let query = 'SELECT * FROM Account';
    if (where) {
      query += ` WHERE ${where}`;
    }
    if (maxResults) {
      query += ` MAXRESULTS ${maxResults}`;
    }
    if (startPosition) {
      query += ` STARTPOSITION ${startPosition}`;
    }

    const response = await this.client.get<QuickBooksQueryResponse<QuickBooksAccount>>('/query', {
      params: { query },
    });

    const accounts = response.data.QueryResponse.Account;
    return Array.isArray(accounts) ? accounts : [];
  }

  /**
   * Query journal entries
   */
  async queryJournalEntries(
    where?: string,
    startPosition?: number,
    maxResults?: number
  ): Promise<QuickBooksJournalEntry[]> {
    let query = 'SELECT * FROM JournalEntry';
    if (where) {
      query += ` WHERE ${where}`;
    }
    if (maxResults) {
      query += ` MAXRESULTS ${maxResults}`;
    }
    if (startPosition) {
      query += ` STARTPOSITION ${startPosition}`;
    }

    const response = await this.client.get<QuickBooksQueryResponse<QuickBooksJournalEntry>>(
      '/query',
      {
        params: { query },
      }
    );

    const entries = response.data.QueryResponse.JournalEntry;
    return Array.isArray(entries) ? entries : [];
  }

  /**
   * Query transactions (generic - can be used for various transaction types)
   */
  async queryTransactions(
    entityType: 'Purchase' | 'Payment' | 'Deposit' | 'Transfer' | 'JournalEntry',
    where?: string,
    startPosition?: number,
    maxResults?: number
  ): Promise<QuickBooksTransaction[]> {
    let query = `SELECT * FROM ${entityType}`;
    if (where) {
      query += ` WHERE ${where}`;
    }
    if (maxResults) {
      query += ` MAXRESULTS ${maxResults}`;
    }
    if (startPosition) {
      query += ` STARTPOSITION ${startPosition}`;
    }

    const response = await this.client.get<QuickBooksQueryResponse<QuickBooksTransaction>>(
      '/query',
      {
        params: { query },
      }
    );

    const key = entityType === 'JournalEntry' ? 'JournalEntry' : entityType;
    const results = response.data.QueryResponse[key];
    return Array.isArray(results) ? results : [];
  }

  /**
   * Get all journal entries with pagination
   */
  async getAllJournalEntries(
    startDate?: Date,
    endDate?: Date
  ): Promise<QuickBooksJournalEntry[]> {
    const allEntries: QuickBooksJournalEntry[] = [];
    let startPosition = 1;
    const maxResults = 20;
    let hasMore = true;

    let whereClause = '';
    if (startDate || endDate) {
      const conditions: string[] = [];
      if (startDate) {
        conditions.push(`TxnDate >= '${startDate.toISOString().split('T')[0]}'`);
      }
      if (endDate) {
        conditions.push(`TxnDate <= '${endDate.toISOString().split('T')[0]}'`);
      }
      whereClause = conditions.join(' AND ');
    }

    while (hasMore) {
      const entries = await this.queryJournalEntries(whereClause, startPosition, maxResults);
      allEntries.push(...entries);

      if (entries.length < maxResults) {
        hasMore = false;
      } else {
        startPosition += maxResults;
      }
    }

    return allEntries;
  }

  /**
   * Get account by ID
   */
  async getAccount(accountId: string): Promise<QuickBooksAccount> {
    const response = await this.client.get<{ Account: QuickBooksAccount }>(
      `/accounts/${accountId}`
    );
    return response.data.Account;
  }
}
