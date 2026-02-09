/**
 * Analyze Warehouse Republic P&L and display insights
 * This script analyzes the file and displays insights without requiring database
 */

import * as XLSX from 'xlsx';
import { PLParser } from '../src/lib/infrastructure/analytics/pl-parser';

const filePath = '/Users/abhidobhal/Downloads/WAREHOUSE REPUBLIC_Profit and Loss.xlsx';

async function analyzePL() {
  try {
    console.log('📊 Analyzing Warehouse Republic P&L Statement...\n');

    const parser = new PLParser();
    
    // Read the file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    console.log(`Period: ${data[2]?.[0] || 'Unknown'}`);
    console.log(`Company: ${data[1]?.[0] || 'Unknown'}\n`);

    // Parse for each year (columns 1-6 are years 2020-2025)
    const years = ['2020', '2021', '2022', '2023', '2024', '2025'];
    const allInsights: any[] = [];
    const summaries: any[] = [];

    for (let yearIdx = 1; yearIdx <= 6; yearIdx++) {
      const year = years[yearIdx - 1];
      
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

      summaries.push({
        year,
        plData,
        insights: yearInsights,
      });

      allInsights.push(...yearInsights.map(i => ({ ...i, year })));
    }

    // Display summary for each year
    console.log('\n' + '='.repeat(80));
    console.log('📊 YEAR-BY-YEAR ANALYSIS');
    console.log('='.repeat(80));

    summaries.forEach(({ year, plData, insights }) => {
      const grossMargin = plData.revenue > 0 ? (plData.grossProfit / plData.revenue) * 100 : 0;
      const operatingMargin = plData.revenue > 0 ? (plData.operatingIncome / plData.revenue) * 100 : 0;
      const netMargin = plData.revenue > 0 ? (plData.netIncome / plData.revenue) * 100 : 0;

      console.log(`\n📅 ${year}`);
      console.log(`   Revenue: $${plData.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`   COGS: $${plData.costOfGoodsSold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`   Gross Profit: $${plData.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${grossMargin.toFixed(2)}%)`);
      console.log(`   Operating Expenses: $${plData.totalOperatingExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`   Operating Income: $${plData.operatingIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${operatingMargin.toFixed(2)}%)`);
      console.log(`   Net Income: $${plData.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${netMargin.toFixed(2)}%)`);

      const highPriority = insights.filter(i => i.priority >= 8);
      if (highPriority.length > 0) {
        console.log(`\n   ⚠️  High Priority Insights:`);
        highPriority.forEach(insight => {
          console.log(`      • ${insight.title}`);
          console.log(`        ${insight.description}`);
          if (insight.recommendation) {
            console.log(`        💼 ${insight.recommendation}`);
          }
        });
      }
    });

    // Overall trends
    console.log('\n\n' + '='.repeat(80));
    console.log('📈 TREND ANALYSIS');
    console.log('='.repeat(80));

    const revenues = summaries.map(s => s.plData.revenue);
    const netIncomes = summaries.map(s => s.plData.netIncome);
    const grossMargins = summaries.map(s => 
      s.plData.revenue > 0 ? (s.plData.grossProfit / s.plData.revenue) * 100 : 0
    );
    const operatingMargins = summaries.map(s =>
      s.plData.revenue > 0 ? (s.plData.operatingIncome / s.plData.revenue) * 100 : 0
    );

    console.log('\nRevenue Growth:');
    revenues.forEach((rev, idx) => {
      const year = years[idx];
      const change = idx > 0 ? ((rev - revenues[idx - 1]) / revenues[idx - 1]) * 100 : 0;
      const arrow = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
      console.log(`   ${year}: $${rev.toLocaleString()} ${arrow} ${idx > 0 ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` : ''}`);
    });

    console.log('\nNet Income Trend:');
    netIncomes.forEach((ni, idx) => {
      const year = years[idx];
      const change = idx > 0 ? ni - netIncomes[idx - 1] : 0;
      const arrow = ni > 0 ? '✅' : '❌';
      console.log(`   ${year}: $${ni.toLocaleString()} ${arrow} ${idx > 0 ? `${change > 0 ? '+' : ''}$${Math.abs(change).toLocaleString()}` : ''}`);
    });

    console.log('\nGross Margin Trend:');
    grossMargins.forEach((gm, idx) => {
      const year = years[idx];
      const change = idx > 0 ? gm - grossMargins[idx - 1] : 0;
      const arrow = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
      console.log(`   ${year}: ${gm.toFixed(2)}% ${arrow} ${idx > 0 ? `${change > 0 ? '+' : ''}${change.toFixed(2)}%` : ''}`);
    });

    console.log('\nOperating Margin Trend:');
    operatingMargins.forEach((om, idx) => {
      const year = years[idx];
      const change = idx > 0 ? om - operatingMargins[idx - 1] : 0;
      const arrow = om >= 0 ? '✅' : '❌';
      console.log(`   ${year}: ${om.toFixed(2)}% ${arrow} ${idx > 0 ? `${change > 0 ? '+' : ''}${change.toFixed(2)}%` : ''}`);
    });

    // Strategic recommendations
    console.log('\n\n' + '='.repeat(80));
    console.log('🎯 STRATEGIC RECOMMENDATIONS');
    console.log('='.repeat(80));

    const avgGrossMargin = grossMargins.reduce((a, b) => a + b, 0) / grossMargins.length;
    const avgNetMargin = netIncomes.reduce((sum, ni, idx) => {
      const margin = revenues[idx] > 0 ? (ni / revenues[idx]) * 100 : 0;
      return sum + margin;
    }, 0) / netIncomes.length;
    const avgOperatingMargin = operatingMargins.reduce((a, b) => a + b, 0) / operatingMargins.length;

    const revenueGrowth = ((revenues[revenues.length - 1] - revenues[0]) / revenues[0]) * 100;
    const latestYear = summaries[summaries.length - 1];

    console.log(`\n📊 Key Metrics:`);
    console.log(`   Average Gross Margin: ${avgGrossMargin.toFixed(2)}%`);
    console.log(`   Average Operating Margin: ${avgOperatingMargin.toFixed(2)}%`);
    console.log(`   Average Net Margin: ${avgNetMargin.toFixed(2)}%`);
    console.log(`   Total Revenue Growth (2020-2025): ${revenueGrowth.toFixed(1)}%`);

    console.log(`\n💡 Recommendations:`);

    if (latestYear.plData.netIncome < 0) {
      console.log(`\n🚨 CRITICAL: Latest year (2025) shows net loss of $${Math.abs(latestYear.plData.netIncome).toLocaleString()}`);
      console.log(`   → Immediate action required to achieve profitability`);
      console.log(`   → Operating expenses ($${latestYear.plData.totalOperatingExpenses.toLocaleString()}) exceed gross profit`);
      console.log(`   → Need to reduce expenses by at least $${Math.abs(latestYear.plData.operatingIncome).toLocaleString()} to break even`);
    }

    if (avgOperatingMargin < 0) {
      console.log(`\n⚠️  Operating Margin Analysis:`);
      console.log(`   → Average operating margin is negative (${avgOperatingMargin.toFixed(2)}%)`);
      console.log(`   → Operating expenses consistently exceed gross profit`);
      console.log(`   → Focus on expense reduction and operational efficiency`);
    }

    if (avgGrossMargin < 30) {
      console.log(`\n⚠️  Gross Margin Analysis:`);
      console.log(`   → Average gross margin (${avgGrossMargin.toFixed(1)}%) is below 30%`);
      console.log(`   → Review pricing strategy and cost of goods sold`);
      console.log(`   → Consider value-based pricing and supplier negotiations`);
    } else {
      console.log(`\n✅ Gross Margin Analysis:`);
      console.log(`   → Average gross margin (${avgGrossMargin.toFixed(1)}%) is healthy`);
      console.log(`   → Focus should be on controlling operating expenses`);
    }

    if (revenueGrowth > 0) {
      console.log(`\n✅ Revenue Growth:`);
      console.log(`   → Strong revenue growth of ${revenueGrowth.toFixed(1)}% over 6 years`);
      console.log(`   → Continue growth strategies while improving profitability`);
      console.log(`   → Scale operations efficiently to maintain margins`);
    }

    // Expense analysis
    const latestExpenses = latestYear.plData.operatingExpenses;
    const expenseEntries = Object.entries(latestExpenses).sort(([, a], [, b]) => (b as number) - (a as number));
    if (expenseEntries.length > 0) {
      console.log(`\n💰 Top Operating Expenses (2025):`);
      expenseEntries.slice(0, 5).forEach(([category, amount], idx) => {
        const percentage = latestYear.plData.revenue > 0 
          ? ((amount as number) / latestYear.plData.revenue) * 100 
          : 0;
        console.log(`   ${idx + 1}. ${category}: $${(amount as number).toLocaleString()} (${percentage.toFixed(2)}% of revenue)`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Analysis Complete');
    console.log('='.repeat(80));
    console.log(`\n💡 Total insights generated: ${allInsights.length}`);
    console.log(`   High-priority insights: ${allInsights.filter(i => i.priority >= 8).length}`);
    console.log(`\n📱 To view insights in the dashboard:`);
    console.log(`   1. Upload the P&L file at: http://localhost:3000/analytics/pl-analysis`);
    console.log(`   2. Or view existing insights at: http://localhost:3000/dashboard`);

  } catch (error: any) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

analyzePL();
