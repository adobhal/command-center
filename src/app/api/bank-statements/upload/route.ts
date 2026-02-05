import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/infrastructure/auth/config';
import { BankStatementParser } from '@/lib/infrastructure/bank-statements/parser';
import { db } from '@/lib/infrastructure/db';
import { bankTransactions } from '@/lib/infrastructure/db/schema';
import { logger } from '@/lib/shared/utils/logger';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const accountName = formData.get('accountName') as string;
    const accountNumber = formData.get('accountNumber') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'File is required' } },
        { status: 400 }
      );
    }

    if (!accountName) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Account name is required' } },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'File size exceeds 10MB limit' } },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();
    const parser = new BankStatementParser();

    // Parse bank statement
    const parseResult = await parser.parse(
      fileContent,
      file.name,
      accountName,
      accountNumber || undefined
    );

    logger.info('Bank statement parsed', {
      filename: file.name,
      format: parseResult.format,
      totalParsed: parseResult.totalParsed,
      validTransactions: parseResult.validTransactions,
      userId: session.user.id,
    });

    // Store transactions in database
    const insertedTransactions = [];
    let errors = 0;

    for (const transaction of parseResult.transactions) {
      try {
        // Check for duplicates (same date, amount, and reference number)
        const existing = await db.query.bankTransactions.findFirst({
          where: (tx, { and, eq }) =>
            and(
              eq(tx.transactionDate, transaction.date),
              eq(tx.amount, transaction.amount.toString()),
              transaction.referenceNumber
                ? eq(tx.referenceNumber, transaction.referenceNumber)
                : undefined
            ),
        });

        if (existing) {
          continue; // Skip duplicate
        }

        const [inserted] = await db
          .insert(bankTransactions)
          .values({
            bankAccountId: accountNumber || accountName,
            bankAccountName: accountName,
            amount: transaction.amount.toString(),
            type: transaction.type,
            description: transaction.description,
            transactionDate: transaction.date,
            referenceNumber: transaction.referenceNumber,
            balance: transaction.balance?.toString(),
            source: 'upload',
            metadata: {
              format: parseResult.format,
              ...transaction.metadata,
            },
          })
          .returning();

        insertedTransactions.push(inserted);
      } catch (error) {
        logger.error('Error inserting bank transaction', {
          transaction,
          error,
        });
        errors++;
      }
    }

    logger.info('Bank statement upload completed', {
      filename: file.name,
      inserted: insertedTransactions.length,
      errors,
      userId: session.user.id,
    });

    return NextResponse.json({
      data: {
        filename: file.name,
        format: parseResult.format,
        totalParsed: parseResult.totalParsed,
        validTransactions: parseResult.validTransactions,
        inserted: insertedTransactions.length,
        errors,
        metadata: parseResult.metadata,
      },
    });
  } catch (error: any) {
    logger.error('Error uploading bank statement', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: {
          code: 'UPLOAD_ERROR',
          message: error.message || 'Failed to process bank statement',
        },
      },
      { status: 500 }
    );
  }
}
