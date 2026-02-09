import { NextResponse } from 'next/server';
import { getSlackClient } from '@/lib/infrastructure/slack/client';

/**
 * Slack Incoming Webhook endpoint
 * Simple webhook for sending messages to Slack
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channel, text, blocks } = body;

    if (!channel || !text) {
      return NextResponse.json(
        { error: 'channel and text are required' },
        { status: 400 }
      );
    }

    const slackClient = getSlackClient();
    if (!slackClient) {
      return NextResponse.json(
        { error: 'Slack not configured' },
        { status: 500 }
      );
    }

    await slackClient.sendMessage(channel, text, blocks);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
