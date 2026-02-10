/**
 * Slack Client Configuration
 */

import { WebClient } from '@slack/web-api';

export interface SlackConfig {
  botToken?: string;
  signingSecret?: string;
  webhookUrl?: string;
}

export class SlackClient {
  private client: WebClient | null = null;
  private webhookUrl: string | null = null;

  constructor(config: SlackConfig) {
    if (config.botToken) {
      this.client = new WebClient(config.botToken);
    }
    if (config.webhookUrl) {
      this.webhookUrl = config.webhookUrl;
    }
  }

  /**
   * Get Slack client instance
   */
  getClient(): WebClient {
    if (!this.client) {
      throw new Error('Slack bot token not configured');
    }
    return this.client;
  }

  /**
   * Send message to Slack channel via webhook
   */
  async sendWebhookMessage(channel: string, text: string, blocks?: any[]) {
    if (!this.webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        text,
        blocks,
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Send message via bot API
   */
  async sendMessage(channel: string, text: string, blocks?: any[]) {
    if (!this.client) {
      // Fallback to webhook if bot token not available
      return this.sendWebhookMessage(channel, text, blocks);
    }

    const result = await this.client.chat.postMessage({
      channel,
      text,
      blocks,
    });

    return result;
  }

  /**
   * Send formatted financial alert
   */
  async sendFinancialAlert(
    channel: string,
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'error' = 'info'
  ) {
    const colorMap = {
      info: '#36a64f', // Green
      warning: '#ff9900', // Orange
      error: '#ff0000', // Red
    };

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: title,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `*Command Center* | ${new Date().toLocaleString()}`,
          },
        ],
      },
    ];

    return this.sendMessage(channel, title, blocks);
  }

  /**
   * Send reconciliation notification
   */
  async sendReconciliationNotification(
    channel: string,
    data: {
      matched: number;
      unmatchedBank: number;
      unmatchedQuickBooks: number;
      discrepancies: number;
      healthScore: number;
    }
  ) {
    const { matched, unmatchedBank, unmatchedQuickBooks, discrepancies, healthScore } = data;

    const statusEmoji = healthScore >= 90 ? '✅' : healthScore >= 70 ? '⚠️' : '❌';
    const statusColor = healthScore >= 90 ? 'good' : healthScore >= 70 ? 'warning' : 'danger';

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${statusEmoji} Reconciliation Complete`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Matched:*\n${matched}`,
          },
          {
            type: 'mrkdwn',
            text: `*Health Score:*\n${healthScore}%`,
          },
          {
            type: 'mrkdwn',
            text: `*Unmatched Bank:*\n${unmatchedBank}`,
          },
          {
            type: 'mrkdwn',
            text: `*Unmatched QB:*\n${unmatchedQuickBooks}`,
          },
        ],
      },
      ...(discrepancies > 0
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `⚠️ *${discrepancies} discrepancies* detected. Review required.`,
              },
            },
          ]
        : []),
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Details',
            },
            url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/bookkeeping/reconciliation`,
            style: statusColor === 'danger' ? 'danger' : undefined,
          },
        ],
      },
    ];

    return this.sendMessage(channel, `Reconciliation: ${matched} matched, ${unmatchedBank + unmatchedQuickBooks} unmatched`, blocks);
  }

  /**
   * Send AI insight notification
   */
  async sendAIInsight(
    channel: string,
    insight: {
      title: string;
      description: string;
      priority: number;
      actionable: boolean;
      actionUrl?: string;
    }
  ) {
    const priorityEmoji = insight.priority >= 8 ? '🔴' : insight.priority >= 6 ? '🟡' : '🔵';

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${priorityEmoji} ${insight.title}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: insight.description,
        },
      },
      ...(insight.actionable && insight.actionUrl
        ? [
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'Take Action',
                  },
                  url: insight.actionUrl,
                  style: insight.priority >= 8 ? 'danger' : undefined,
                },
              ],
            },
          ]
        : []),
    ];

    return this.sendMessage(channel, insight.title, blocks);
  }
}

/**
 * Get Slack client from environment variables
 */
export function getSlackClient(): SlackClient | null {
  const botToken = process.env.SLACK_BOT_TOKEN;
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!botToken && !webhookUrl) {
    return null; // Slack not configured
  }

  return new SlackClient({
    botToken,
    webhookUrl,
  });
}
