import { pgTable, text, timestamp, decimal, integer, boolean, jsonb, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';

/**
 * Database schema for Command Center
 * Using Drizzle ORM with PostgreSQL
 */

// ============================================================================
// Authentication Tables (for NextAuth)
// ============================================================================

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires').notNull(),
});

// ============================================================================
// Enums
// ============================================================================
export const reconciliationStatusEnum = pgEnum('reconciliation_status', [
  'pending',
  'matched',
  'unmatched',
  'discrepancy',
  'completed',
]);

export const transactionTypeEnum = pgEnum('transaction_type', [
  'debit',
  'credit',
]);

export const workflowStatusEnum = pgEnum('workflow_status', [
  'pending',
  'running',
  'completed',
  'failed',
]);

// QuickBooks Connections
export const quickbooksConnections = pgTable('quickbooks_connections', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull(),
  companyId: text('company_id').notNull(),
  companyName: text('company_name').notNull(),
  accessToken: text('access_token').notNull(), // Should be encrypted
  refreshToken: text('refresh_token').notNull(), // Should be encrypted
  realmId: text('realm_id').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Transactions (from QuickBooks)
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  quickbooksId: text('quickbooks_id').notNull(),
  quickbooksConnectionId: text('quickbooks_connection_id')
    .notNull()
    .references(() => quickbooksConnections.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  accountName: text('account_name').notNull(),
  amount: decimal('amount', { precision: 19, scale: 4 }).notNull(),
  type: transactionTypeEnum('type').notNull(),
  description: text('description'),
  transactionDate: timestamp('transaction_date').notNull(),
  referenceNumber: text('reference_number'),
  category: text('category'),
  metadata: jsonb('metadata'), // Store additional QB data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Bank Transactions (from bank statements)
export const bankTransactions = pgTable('bank_transactions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  bankAccountId: text('bank_account_id').notNull(),
  bankAccountName: text('bank_account_name').notNull(),
  amount: decimal('amount', { precision: 19, scale: 4 }).notNull(),
  type: transactionTypeEnum('type').notNull(),
  description: text('description'),
  transactionDate: timestamp('transaction_date').notNull(),
  referenceNumber: text('reference_number'),
  balance: decimal('balance', { precision: 19, scale: 4 }),
  source: text('source').notNull(), // 'upload', 'plaid', etc.
  sourceFileId: text('source_file_id'), // If uploaded from file
  metadata: jsonb('metadata'), // Store additional bank data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Reconciliations
export const reconciliations = pgTable('reconciliations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  bankAccountId: text('bank_account_id').notNull(),
  bankAccountName: text('bank_account_name').notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  status: reconciliationStatusEnum('status').default('pending').notNull(),
  matchedCount: integer('matched_count').default(0).notNull(),
  unmatchedCount: integer('unmatched_count').default(0).notNull(),
  discrepancyCount: integer('discrepancy_count').default(0).notNull(),
  healthScore: decimal('health_score', { precision: 5, scale: 2 }), // 0-100
  completedAt: timestamp('completed_at'),
  completedBy: text('completed_by'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Matched Transactions
export const matchedTransactions = pgTable('matched_transactions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  reconciliationId: text('reconciliation_id')
    .references(() => reconciliations.id, { onDelete: 'cascade' }), // Optional - can be null for unmatched pairs
  bankTransactionId: text('bank_transaction_id')
    .notNull()
    .references(() => bankTransactions.id, { onDelete: 'cascade' }),
  transactionId: text('transaction_id')
    .notNull()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  confidenceScore: decimal('confidence_score', { precision: 5, scale: 2 }), // 0-1
  matchedBy: text('matched_by').notNull(), // 'ai', 'rule', 'manual'
  matchedAt: timestamp('matched_at').defaultNow().notNull(),
  metadata: jsonb('metadata'),
});

// AI Insights
export const aiInsights = pgTable('ai_insights', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  type: text('type').notNull(), // 'anomaly', 'recommendation', 'prediction'
  category: text('category').notNull(), // 'finance', 'reconciliation', 'cash_flow'
  title: text('title').notNull(),
  description: text('description').notNull(),
  priority: integer('priority').default(0).notNull(), // Higher = more important
  confidence: decimal('confidence', { precision: 5, scale: 2 }), // 0-1
  actionable: boolean('actionable').default(false).notNull(),
  actionUrl: text('action_url'), // URL to take action
  metadata: jsonb('metadata'),
  acknowledged: boolean('acknowledged').default(false).notNull(),
  acknowledgedAt: timestamp('acknowledged_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'), // When insight becomes stale
});

// Automation Workflows
export const automationWorkflows = pgTable('automation_workflows', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description'),
  triggerType: text('trigger_type').notNull(), // 'scheduled', 'event', 'manual'
  triggerConfig: jsonb('trigger_config').notNull(),
  workflowDefinition: jsonb('workflow_definition').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  lastRunAt: timestamp('last_run_at'),
  nextRunAt: timestamp('next_run_at'),
  successCount: integer('success_count').default(0).notNull(),
  failureCount: integer('failure_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Automation Runs
export const automationRuns = pgTable('automation_runs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  workflowId: text('workflow_id')
    .notNull()
    .references(() => automationWorkflows.id, { onDelete: 'cascade' }),
  status: workflowStatusEnum('status').default('pending').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  duration: integer('duration'), // milliseconds
  error: text('error'),
  result: jsonb('result'),
  metadata: jsonb('metadata'),
});

// Anomalies
export const anomalies = pgTable('anomalies', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  type: text('type').notNull(), // 'transaction', 'reconciliation', 'cash_flow'
  severity: text('severity').notNull(), // 'low', 'medium', 'high', 'critical'
  title: text('title').notNull(),
  description: text('description').notNull(),
  detectedAt: timestamp('detected_at').defaultNow().notNull(),
  resolved: boolean('resolved').default(false).notNull(),
  resolvedAt: timestamp('resolved_at'),
  metadata: jsonb('metadata'),
});

// Predictions
export const predictions = pgTable('predictions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  type: text('type').notNull(), // 'cash_flow', 'reconciliation', 'revenue'
  targetDate: timestamp('target_date').notNull(),
  predictedValue: decimal('predicted_value', { precision: 19, scale: 4 }).notNull(),
  confidence: decimal('confidence', { precision: 5, scale: 2 }), // 0-1
  model: text('model').notNull(), // AI model used
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Strategic Metrics
export const strategicMetrics = pgTable('strategic_metrics', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  metricName: text('metric_name').notNull(),
  metricValue: decimal('metric_value', { precision: 19, scale: 4 }).notNull(),
  period: text('period').notNull(), // 'daily', 'weekly', 'monthly'
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  metadata: jsonb('metadata'),
  calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
});
