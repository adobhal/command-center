# Slack Integration Setup Guide

## Overview

The Command Center integrates with Slack to send notifications, handle commands, and provide real-time updates.

## Features

- **Notifications**: Automatic alerts for reconciliations, syncs, anomalies, and insights
- **Slash Commands**: Query financial data via `/command-center` commands
- **Interactive Messages**: Buttons and actions in Slack messages
- **Event Handling**: Respond to app mentions and messages

## Setup Steps

### 1. Create a Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name your app (e.g., "Command Center")
4. Select your workspace
5. Click "Create App"

### 2. Configure Bot Token Scopes

1. Go to "OAuth & Permissions" in the sidebar
2. Scroll to "Scopes" → "Bot Token Scopes"
3. Add the following scopes:
   - `chat:write` - Send messages
   - `chat:write.public` - Send messages to channels
   - `commands` - Handle slash commands
   - `channels:read` - Read channel information
   - `users:read` - Read user information

### 3. Install App to Workspace

1. Scroll to top of "OAuth & Permissions"
2. Click "Install to Workspace"
3. Authorize the app
4. Copy the "Bot User OAuth Token" (starts with `xoxb-`)

### 4. Set Up Slash Command (Optional)

1. Go to "Slash Commands" in the sidebar
2. Click "Create New Command"
3. Fill in:
   - **Command**: `/command-center`
   - **Request URL**: `https://your-domain.com/api/slack/commands`
   - **Short Description**: Command Center financial operations
   - **Usage Hint**: `status|metrics|reconcile|help`
4. Click "Save"

### 5. Set Up Event Subscriptions (Optional)

1. Go to "Event Subscriptions" in the sidebar
2. Enable Events
3. Set Request URL: `https://your-domain.com/api/slack/events`
4. Subscribe to bot events:
   - `app_mention` - When app is mentioned
   - `message.channels` - Messages in channels (if needed)
5. Click "Save Changes"

### 6. Set Up Incoming Webhook (Alternative)

1. Go to "Incoming Webhooks" in the sidebar
2. Activate Incoming Webhooks
3. Click "Add New Webhook to Workspace"
4. Select channel (e.g., #command-center)
5. Copy the Webhook URL

### 7. Configure Environment Variables

Add to your `.env.local`:

```env
# Slack Bot Token (from OAuth & Permissions)
SLACK_BOT_TOKEN=xoxb-your-bot-token-here

# OR use Webhook URL (simpler, but less features)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Slack Signing Secret (for event verification)
SLACK_SIGNING_SECRET=your-signing-secret

# Default channel for notifications
SLACK_DEFAULT_CHANNEL=#command-center
```

### 8. Deploy and Update URLs

1. Deploy your app to production
2. Update Slack app settings with production URLs:
   - Slash Command URL: `https://your-domain.com/api/slack/commands`
   - Event Subscriptions URL: `https://your-domain.com/api/slack/events`

## Usage

### Slash Commands

In any Slack channel, type:

```
/command-center status
/command-center metrics
/command-center reconcile
/command-center help
```

### App Mentions

Mention the app in a channel:

```
@Command Center status
@Command Center reconcile
```

### Automatic Notifications

The app automatically sends notifications for:

- ✅ Reconciliation completions
- 📄 Bank statement uploads
- 🔄 QuickBooks syncs
- 🚨 Anomalies detected
- 💡 High-priority AI insights

## API Endpoints

- `POST /api/slack/commands` - Handle slash commands
- `POST /api/slack/events` - Handle Slack events
- `POST /api/slack/webhook` - Send messages via webhook

## Testing Locally

For local development, use a tool like ngrok to expose your local server:

```bash
ngrok http 3000
```

Then use the ngrok URL in your Slack app configuration.

## Security

- Always use HTTPS in production
- Verify Slack requests using signing secret
- Store tokens securely (never commit to git)
- Use environment variables for all secrets

## Troubleshooting

**Notifications not sending:**
- Check SLACK_BOT_TOKEN or SLACK_WEBHOOK_URL is set
- Verify bot has necessary permissions
- Check Slack app logs

**Commands not working:**
- Verify Request URL is correct and accessible
- Check Slack app logs for errors
- Ensure command is installed in workspace

**Events not received:**
- Verify Event Subscriptions URL is accessible
- Check subscribed events are correct
- Verify signing secret matches
