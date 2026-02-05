/**
 * QuickBooks Sync Service
 * Handles syncing QuickBooks data to local database
 */

import { db } from '../db';
import {
  transactions,
  quickbooksConnections,
  bankTransactions,
} from '../db/schema';
import { QuickBooksClient } from './client';
import { QuickBooksJournalEntry, QuickBooksAccount } from './types';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/shared/utils/logger';

export interface SyncOptions {
  startDate?: Date;
  endDate?: Date;
  connectionId: string;
}

export class QuickBooksSyncService {
  /**
   * Sync journal entries from QuickBooks to database
   */
  async syncJournalEntries(options: SyncOptions): Promise<{
    synced: number;
    errors: number;
  }> {
    const { connectionId, startDate, endDate } = options;

    // Get QuickBooks connection
    const connection = await db.query.quickbooksConnections.findFirst({
      where: eq(quickbooksConnections.id, connectionId),
    });

    if (!connection) {
      throw new Error(`QuickBooks connection ${connectionId} not found`);
    }

    // Check if token needs refresh
    const now = new Date();
    if (connection.expiresAt < now) {
      throw new Error('QuickBooks access token expired. Please reconnect.');
    }

    // Create QuickBooks client
    const client = new QuickBooksClient({
      accessToken: connection.accessToken,
      realmId: connection.realmId,
      environment: process.env.QUICKBOOKS_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
    });

    let synced = 0;
    let errors = 0;

    try {
      // Fetch journal entries from QuickBooks
      const journalEntries = await client.getAllJournalEntries(startDate, endDate);

      logger.info('Fetched journal entries from QuickBooks', {
        count: journalEntries.length,
        connectionId,
      });

      // Process each journal entry
      for (const entry of journalEntries) {
        try {
          // Check if transaction already exists
          const existing = await db.query.transactions.findFirst({
            where: eq(transactions.quickbooksId, entry.Id),
          });

          if (existing) {
            // Skip if already synced
            continue;
          }

          // Process each line in the journal entry
          for (const line of entry.Line || []) {
            if (line.DetailType !== 'JournalEntryLineDetail') {
              continue;
            }

            const detail = line.JournalEntryLineDetail;
            const amount = Math.abs(Number(line.Amount) || 0);
            const type = detail.PostingType === 'Debit' ? 'debit' : 'credit';

            // Get account name
            let accountName = detail.AccountRef?.name || 'Unknown';
            try {
              const account = await client.getAccount(detail.AccountRef.value);
              accountName = account.Name;
            } catch (error) {
              logger.warn('Failed to fetch account details', {
                accountId: detail.AccountRef?.value,
                error,
              });
            }

            // Insert transaction
            await db.insert(transactions).values({
              quickbooksId: entry.Id,
              quickbooksConnectionId: connectionId,
              accountId: detail.AccountRef.value,
              accountName,
              amount: amount.toString(),
              type,
              description: line.Description || entry.PrivateNote || 'Journal Entry',
              transactionDate: new Date(entry.TxnDate),
              referenceNumber: entry.DocNumber || entry.Id,
              category: detail.AccountRef?.name,
              metadata: {
                journalEntryId: entry.Id,
                lineId: line.Id,
                postingType: detail.PostingType,
                docNumber: entry.DocNumber,
              },
            });

            synced++;
          }
        } catch (error) {
          logger.error('Error syncing journal entry', {
            entryId: entry.Id,
            error,
          });
          errors++;
        }
      }

      logger.info('QuickBooks sync completed', {
        synced,
        errors,
        connectionId,
      });

      return { synced, errors };
    } catch (error) {
      logger.error('QuickBooks sync failed', {
        connectionId,
        error,
      });
      throw error;
    }
  }

  /**
   * Sync accounts from QuickBooks
   */
  async syncAccounts(connectionId: string): Promise<number> {
    const connection = await db.query.quickbooksConnections.findFirst({
      where: eq(quickbooksConnections.id, connectionId),
    });

    if (!connection) {
      throw new Error(`QuickBooks connection ${connectionId} not found`);
    }

    const client = new QuickBooksClient({
      accessToken: connection.accessToken,
      realmId: connection.realmId,
      environment: process.env.QUICKBOOKS_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
    });

    const accounts = await client.queryAccounts('Active = true');
    logger.info('Fetched accounts from QuickBooks', {
      count: accounts.length,
      connectionId,
    });

    // Accounts are stored in metadata for reference
    // In a full implementation, you might want a separate accounts table
    return accounts.length;
  }
}
