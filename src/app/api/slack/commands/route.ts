import { NextResponse } from 'next/server';
import { getSlackClient } from '@/lib/infrastructure/slack/client';
import { db } from '@/lib/infrastructure/db';
import { bankTransactions, transactions, reconciliations } from '@/lib/infrastructure/db/schema';
import { count, desc, sql } from 'drizzle-orm';

/**
 * Slack Slash Commands endpoint
 * Handles /command-center commands
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const command = formData.get('command');
    const text = formData.get('text')?.toString() || '';
    const responseUrl = formData.get('response_url')?.toString();
    const channelId = formData.get('channel_id')?.toString();

    const slackClient = getSlackClient();
    if (!slackClient) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Slack integration not configured. Please set SLACK_BOT_TOKEN or SLACK_WEBHOOK_URL.',
      });
    }

    const commandText = text.toLowerCase().trim();
    let response: any;

    switch (commandText.split(' ')[0]) {
      case 'status':
      case 'health':
        // Get system status
        const [txCount] = await db.select({ count: count() }).from(transactions);
        const [bankTxCount] = await db.select({ count: count() }).from(bankTransactions);
        const [recCount] = await db.select({ count: count() }).from(reconciliations);

        response = {
          response_type: 'in_channel',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: '📊 Command Center Status',
                emoji: true,
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Transactions:*\n${txCount.count}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Bank Transactions:*\n${bankTxCount.count}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Reconciliations:*\n${recCount.count}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Status:*\n✅ Operational`,
                },
              ],
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'View Dashboard',
                  },
                  url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`,
                },
              ],
            },
          ],
        };
        break;

      case 'metrics':
        // Get financial metrics
        const metrics = await db
          .select({
            totalTransactions: count(transactions.id),
            totalBankTx: count(bankTransactions.id),
          })
          .from(transactions);

        response = {
          response_type: 'in_channel',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: '💰 Financial Metrics',
                emoji: true,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*QuickBooks Transactions:* ${metrics[0]?.totalTransactions || 0}\n*Bank Transactions:* ${metrics[0]?.totalBankTx || 0}`,
              },
            },
          ],
        };
        break;

      case 'reconcile':
        response = {
          response_type: 'in_channel',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '🔄 *Reconciliation*\n\nStart reconciliation from the dashboard.',
              },
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'Start Reconciliation',
                  },
                  url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reconciliation`,
                },
              ],
            },
          ],
        };
        break;

      case 'help':
      default:
        response = {
          response_type: 'ephemeral',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*Command Center Slack Commands*\n\n`/command-center status` - System status\n`/command-center metrics` - Financial metrics\n`/command-center reconcile` - Start reconciliation\n`/command-center help` - Show this help',
              },
            },
          ],
        };
        break;
    }

    // If response_url is provided, use it for delayed response
    if (responseUrl) {
      await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
      });
      return NextResponse.json({ response_type: 'ephemeral', text: 'Processing...' });
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Slack command error:', error);
    return NextResponse.json({
      response_type: 'ephemeral',
      text: `Error: ${error.message}`,
    });
  }
}
