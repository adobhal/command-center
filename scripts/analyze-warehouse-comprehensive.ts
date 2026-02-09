/**
 * Comprehensive Analysis of Warehouse Republic Data
 * Analyzes all financial files and generates powerful business insights
 */

import { ComprehensiveAnalyzer } from '../src/lib/infrastructure/analytics/comprehensive-analysis';
import { logger } from '../src/lib/shared/utils/logger';

const dataDir = '/tmp/warehouse_republic_feb8';

async function runComprehensiveAnalysis() {
  try {
    console.log('🚀 Starting Comprehensive Business Analysis...\n');
    console.log(`📁 Analyzing data from: ${dataDir}\n`);

    const analyzer = new ComprehensiveAnalyzer();
    const { metrics, insights } = await analyzer.analyzeAll(dataDir);

    console.log('\n' + '='.repeat(80));
    console.log('📊 BUSINESS METRICS');
    console.log('='.repeat(80));
    console.log(`\n💰 Financial Metrics:`);
    console.log(`   Revenue: $${metrics.revenue.toLocaleString()}`);
    console.log(`   Expenses: $${metrics.expenses.toLocaleString()}`);
    console.log(`   Net Income: $${metrics.netIncome.toLocaleString()}`);
    console.log(`   Assets: $${metrics.assets.toLocaleString()}`);
    console.log(`   Liabilities: $${metrics.liabilities.toLocaleString()}`);
    console.log(`   Equity: $${metrics.equity.toLocaleString()}`);
    console.log(`   Cash Flow: $${metrics.cashFlow.toLocaleString()}`);

    console.log(`\n👥 Operational Metrics:`);
    console.log(`   Customers: ${metrics.customerCount}`);
    console.log(`   Employees: ${metrics.employeeCount}`);
    console.log(`   Vendors: ${metrics.vendorCount}`);

    if (metrics.topCustomers.length > 0) {
      console.log(`\n🏆 Top 5 Customers:`);
      metrics.topCustomers.slice(0, 5).forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.name}: $${c.revenue.toLocaleString()}`);
      });
    }

    if (metrics.topExpenses.length > 0) {
      console.log(`\n💸 Top 5 Expense Categories:`);
      metrics.topExpenses.slice(0, 5).forEach((e, i) => {
        console.log(`   ${i + 1}. ${e.category}: $${e.amount.toLocaleString()}`);
      });
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('💡 POWERFUL BUSINESS INSIGHTS');
    console.log('='.repeat(80));

    // Group insights by type
    const byType = {
      critical: insights.filter((i) => i.priority >= 9),
      high: insights.filter((i) => i.priority >= 7 && i.priority < 9),
      medium: insights.filter((i) => i.priority >= 5 && i.priority < 7),
      low: insights.filter((i) => i.priority < 5),
    };

    if (byType.critical.length > 0) {
      console.log('\n🚨 CRITICAL INSIGHTS (Priority 9-10):');
      byType.critical.forEach((insight, idx) => {
        console.log(`\n   ${idx + 1}. ${insight.title}`);
        console.log(`      ${insight.description}`);
        console.log(`      💼 Recommendation: ${insight.recommendation}`);
        if (insight.metrics) {
          console.log(`      📈 Metrics: ${JSON.stringify(insight.metrics)}`);
        }
      });
    }

    if (byType.high.length > 0) {
      console.log('\n⚠️  HIGH PRIORITY INSIGHTS (Priority 7-8):');
      byType.high.forEach((insight, idx) => {
        console.log(`\n   ${idx + 1}. ${insight.title}`);
        console.log(`      ${insight.description}`);
        console.log(`      💼 Recommendation: ${insight.recommendation}`);
      });
    }

    if (byType.medium.length > 0) {
      console.log('\n📋 MEDIUM PRIORITY INSIGHTS (Priority 5-6):');
      byType.medium.slice(0, 5).forEach((insight, idx) => {
        console.log(`\n   ${idx + 1}. ${insight.title}`);
        console.log(`      ${insight.description}`);
        if (insight.recommendation) {
          console.log(`      💼 Recommendation: ${insight.recommendation}`);
        }
      });
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('📈 INSIGHT SUMMARY');
    console.log('='.repeat(80));
    console.log(`\n   Total Insights Generated: ${insights.length}`);
    console.log(`   Critical (P9-10): ${byType.critical.length}`);
    console.log(`   High Priority (P7-8): ${byType.high.length}`);
    console.log(`   Medium Priority (P5-6): ${byType.medium.length}`);
    console.log(`   Low Priority (P<5): ${byType.low.length}`);

    // Store insights in database
    console.log('\n💾 Storing insights in database...');
    const storedCount = await analyzer.storeInsights(insights);
    console.log(`   ✅ Stored ${storedCount} insights`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ ANALYSIS COMPLETE');
    console.log('='.repeat(80));
    console.log(`\n💡 View insights at: http://localhost:3000/dashboard`);
    console.log(`   Insights are now available in the AI Insights Panel\n`);

  } catch (error: any) {
    logger.error('Error in comprehensive analysis', {
      error: error.message,
      stack: error.stack,
    });
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runComprehensiveAnalysis();
