/**
 * Analyze Warehouse Republic P&L and generate insights
 * This script analyzes the specific file and stores insights in the database
 */

import * as XLSX from 'xlsx';
import { PLParser } from '../src/lib/infrastructure/analytics/pl-parser';
import { db } from '../src/lib/infrastructure/db';
import { aiInsights } from '../src/lib/infrastructure/db/schema';
import { slackNotifications } from '../src/lib/infrastructure/slack/notifications';
import { logger } from '../src/lib/shared/utils/logger';
import { and, eq, sql } from 'drizzle-orm';

const filePath = '/Users/abhidobhal/Downloads/WAREHOUSE REPUBLIC_Profit and Loss.xlsx';

async function analyzeAndStore() {
  try {
    console.log('📊 Analyzing Warehouse Republic P&L...\n');

    const parser = new PLParser();
    
    // Read the file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    console.log(`Period: ${data[2]?.[0] || 'Unknown'}`);
    console.log(`Company: ${data[1]?.[0] || 'Unknown'}\n`);

    // Parse for each year (columns 1-6 are years 2020-2025, column 7 is Total)
    const years = ['2020', '2021', '2022', '2023', '2024', '2025'];
    const allInsights: any[] = [];

    for (let yearIdx = 1; yearIdx <= 6; yearIdx++) {
      const year = years[yearIdx - 1];
      console.log(`Processing ${year}...`);

      // Extract data for this year
      const yearData = data.map((row: any[]) => {
        const label = row[0];
        const value = row[yearIdx];
        return [label, value];
      });

      // Parse this year's data
      const plData = await parser.parseData(yearData as any[][], `${filePath} - ${year}`, 1);
      
      // Generate insights
      const yearInsights = parser.generateInsights(plData);

      // Store insights in database
      for (const insight of yearInsights) {
        const existing = await db
          .select()
          .from(aiInsights)
          .where(
            and(
              eq(aiInsights.category, insight.category),
              eq(aiInsights.title, insight.title),
              // Check if metadata contains this year
              sql`metadata->>'period' LIKE ${`%${year}%`}`
            )
          )
          .limit(1);

        if (existing.length === 0) {
          await db.insert(aiInsights).values({
            type: insight.type,
            category: `${insight.category}_${year}`,
            title: `${insight.title} (${year})`,
            description: `${insight.description} [Year: ${year}]`,
            priority: insight.priority,
            actionable: !!insight.recommendation,
            actionUrl: insight.recommendation ? '/analytics/pl-analysis' : undefined,
            confidence: '0.9',
            metadata: {
              plAnalysis: true,
              year,
              value: insight.value,
              percentage: insight.percentage,
              recommendation: insight.recommendation,
              period: plData.period,
              revenue: plData.revenue,
              netIncome: plData.netIncome,
              grossMargin: plData.revenue > 0 ? (plData.grossProfit / plData.revenue) * 100 : 0,
              operatingMargin: plData.revenue > 0 ? (plData.operatingIncome / plData.revenue) * 100 : 0,
              netMargin: plData.revenue > 0 ? (plData.netIncome / plData.revenue) * 100 : 0,
            },
          });

          allInsights.push({ ...insight, year });
        }
      }
    }

    // Send high-priority insights to Slack
    const highPriorityInsights = allInsights.filter((i) => i.priority >= 8);
    console.log(`\n📤 Sending ${highPriorityInsights.length} high-priority insights to Slack...`);

    for (const insight of highPriorityInsights.slice(0, 5)) {
      await slackNotifications.notifyAIInsight({
        title: `${insight.title} (${insight.year})`,
        description: insight.description,
        priority: insight.priority,
        actionable: !!insight.recommendation,
        actionUrl: insight.recommendation ? '/analytics/pl-analysis' : undefined,
      });
    }

    console.log(`\n✅ Analysis complete!`);
    console.log(`   Total insights generated: ${allInsights.length}`);
    console.log(`   High-priority insights: ${highPriorityInsights.length}`);
    console.log(`\n💡 View insights at: http://localhost:3000/dashboard`);

  } catch (error: any) {
    logger.error('Error analyzing P&L', {
      error: error.message,
      stack: error.stack,
    });
    console.error('Error:', error);
    process.exit(1);
  }
}

analyzeAndStore();
