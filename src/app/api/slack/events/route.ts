import { NextResponse } from 'next/server';
import { getSlackClient } from '@/lib/infrastructure/slack/client';

/**
 * Slack Events API endpoint
 * Handles Slack events (app mentions, messages, etc.)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Slack URL verification challenge
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge });
    }

    // Handle event callbacks
    if (body.type === 'event_callback') {
      const event = body.event;

      // Handle app mentions
      if (event.type === 'app_mention') {
        const text = event.text.toLowerCase();
        const channel = event.channel;

        const slackClient = getSlackClient();
        if (!slackClient) {
          return NextResponse.json({ error: 'Slack not configured' }, { status: 500 });
        }

        // Simple command parsing
        if (text.includes('status') || text.includes('health')) {
          await slackClient.sendMessage(
            channel,
            '📊 *Command Center Status*\n\nAll systems operational. Check dashboard for details.',
            [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: 'Visit the dashboard: <http://localhost:3000/dashboard|Command Center Dashboard>',
                },
              },
            ]
          );
        } else if (text.includes('reconcile') || text.includes('match')) {
          await slackClient.sendMessage(
            channel,
            '🔄 *Reconciliation*\n\nRun reconciliation from the dashboard or use the API.',
            [
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: {
                      type: 'plain_text',
                      text: 'Start Reconciliation',
                    },
                    url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/bookkeeping/reconciliation`,
                  },
                ],
              },
            ]
          );
        } else {
          await slackClient.sendMessage(
            channel,
            '👋 Hi! I can help you with:\n• `status` - System status\n• `reconcile` - Start reconciliation\n• `insights` - View AI insights',
            []
          );
        }
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Slack event error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
