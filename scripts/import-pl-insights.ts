/**
 * Import P&L insights into the database
 * Run this script to import insights from the Warehouse Republic P&L file
 * 
 * Usage: npx tsx scripts/import-pl-insights.ts
 */

import * as XLSX from 'xlsx';
import { PLParser } from '../src/lib/infrastructure/analytics/pl-parser';
import { db } from '../src/lib/infrastructure/db';
import { aiInsights } from '../src/lib/infrastructure/db/schema';
import { eq, and, like } from 'drizzle-orm';

const filePath = '/Users/abhidobhal/Downloads/WAREHOUSE REPUBLIC_Profit and Loss.xlsx';

// Map P&L insight types to AI insight types
const mapPLTypeToAIType = (plType: string): 'recommendation' | 'prediction' | 'anomaly' | 'optimization' => {
  switch (plType) {
    case 'anomaly':
      return 'anomaly';
    case 'trend':
      return 'prediction';
    case 'profitability':
    case 'expense':
      return 'optimization';
    default:
      return 'recommendation';
  }
};

async function importPLInsights() {
  try {
    console.log('📊 Importing P&L insights...\n');

    const parser = new PLParser();
    
    // Read the file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    console.log(`Period: ${data[2]?.[0] || 'Unknown'}`);
    console.log(`Company: ${data[1]?.[0] || 'Unknown'}\n`);

    const years = ['2020', '2021', '2022', '2023', '2024', '2025'];
    let totalInserted = 0;
    let totalSkipped = 0;

    // Parse each year
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
        const categoryKey = `pl_${insight.category}_${year}`;
        const titleWithYear = `${insight.title} (${year})`;

        // Check if insight already exists
        const existing = await db
          .select()
          .from(aiInsights)
          .where(
            and(
              eq(aiInsights.category, categoryKey),
              eq(aiInsights.title, titleWithYear)
            )
          )
          .limit(1);

        if (existing.length === 0) {
          await db.insert(aiInsights).values({
            type: mapPLTypeToAIType(insight.type),
            category: categoryKey,
            title: titleWithYear,
            description: `${insight.description} [Year: ${year}]`,
            priority: insight.priority,
            actionable: !!insight.recommendation,
            actionUrl: insight.recommendation ? '/analysis/pl-analysis' : undefined,
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
          totalInserted++;
          console.log(`   ✓ Inserted: ${titleWithYear}`);
        } else {
          totalSkipped++;
          console.log(`   ⊘ Skipped (exists): ${titleWithYear}`);
        }
      }
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   Total inserted: ${totalInserted}`);
    console.log(`   Total skipped: ${totalSkipped}`);
    console.log(`\n💡 View insights at: http://localhost:3000/dashboard`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

importPLInsights();
