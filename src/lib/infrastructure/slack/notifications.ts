/**
 * Slack Notification Service
 * Sends notifications to Slack channels
 */

import { getSlackClient } from './client';
import { logger } from '@/lib/shared/utils/logger';

export class SlackNotificationService {
  private defaultChannel: string;

  constructor(defaultChannel: string = '#command-center') {
    this.defaultChannel = defaultChannel;
  }

  /**
   * Send reconciliation completion notification
   */
  async notifyReconciliationComplete(data: {
    matched: number;
    unmatchedBank: number;
    unmatchedQuickBooks: number;
    discrepancies: number;
    healthScore: number;
    channel?: string;
  }) {
    const slackClient = getSlackClient();
    if (!slackClient) {
      logger.warn('Slack not configured, skipping notification');
      return;
    }

    try {
      await slackClient.sendReconciliationNotification(data.channel || this.defaultChannel, data);
      logger.info('Reconciliation notification sent to Slack', { data });
    } catch (error) {
      logger.error('Failed to send Slack notification', { error });
    }
  }

  /**
   * Send AI insight notification
   */
  async notifyAIInsight(
    insight: {
      title: string;
      description: string;
      priority: number;
      actionable: boolean;
      actionUrl?: string;
    },
    channel?: string
  ) {
    const slackClient = getSlackClient();
    if (!slackClient) {
      return;
    }

    try {
      await slackClient.sendAIInsight(channel || this.defaultChannel, insight);
      logger.info('AI insight notification sent to Slack', { insight });
    } catch (error) {
      logger.error('Failed to send Slack notification', { error });
    }
  }

  /**
   * Send anomaly alert
   */
  async notifyAnomaly(
    anomaly: {
      type: string;
      severity: string;
      title: string;
      description: string;
      transactionIds: string[];
    },
    channel?: string
  ) {
    const slackClient = getSlackClient();
    if (!slackClient) {
      return;
    }

    const severityMap: Record<string, 'info' | 'warning' | 'error'> = {
      critical: 'error',
      high: 'error',
      medium: 'warning',
      low: 'info',
    };

    try {
      await slackClient.sendFinancialAlert(
        channel || this.defaultChannel,
        `🚨 Anomaly Detected: ${anomaly.title}`,
        `${anomaly.description}\n\n*Type:* ${anomaly.type}\n*Severity:* ${anomaly.severity}\n*Transactions:* ${anomaly.transactionIds.length}`,
        severityMap[anomaly.severity] || 'warning'
      );
      logger.info('Anomaly notification sent to Slack', { anomaly });
    } catch (error) {
      logger.error('Failed to send Slack notification', { error });
    }
  }

  /**
   * Send QuickBooks sync notification
   */
  async notifyQuickBooksSync(
    data: {
      synced: number;
      errors: number;
      companyName: string;
    },
    channel?: string
  ) {
    const slackClient = getSlackClient();
    if (!slackClient) {
      return;
    }

    try {
      await slackClient.sendFinancialAlert(
        channel || this.defaultChannel,
        `✅ QuickBooks Sync Complete`,
        `*Company:* ${data.companyName}\n*Synced:* ${data.synced} transactions\n${data.errors > 0 ? `*Errors:* ${data.errors}` : 'No errors'}`,
        data.errors > 0 ? 'warning' : 'info'
      );
      logger.info('QuickBooks sync notification sent to Slack', { data });
    } catch (error) {
      logger.error('Failed to send Slack notification', { error });
    }
  }

  /**
   * Send bank statement upload notification
   */
  async notifyBankStatementUpload(
    data: {
      filename: string;
      inserted: number;
      totalParsed: number;
      accountName: string;
    },
    channel?: string
  ) {
    const slackClient = getSlackClient();
    if (!slackClient) {
      return;
    }

    try {
      await slackClient.sendFinancialAlert(
        channel || this.defaultChannel,
        `📄 Bank Statement Uploaded`,
        `*File:* ${data.filename}\n*Account:* ${data.accountName}\n*Imported:* ${data.inserted} of ${data.totalParsed} transactions`,
        'info'
      );
      logger.info('Bank statement upload notification sent to Slack', { data });
    } catch (error) {
      logger.error('Failed to send Slack notification', { error });
    }
  }
}

// Default instance
export const slackNotifications = new SlackNotificationService(
  process.env.SLACK_DEFAULT_CHANNEL || '#command-center'
);
