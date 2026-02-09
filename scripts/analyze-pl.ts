/**
 * Analyze P&L Excel file and generate insights
 */

import * as XLSX from 'xlsx';
import { PLParser } from '../src/lib/infrastructure/analytics/pl-parser';

const filePath = '/Users/abhidobhal/Downloads/WAREHOUSE REPUBLIC_Profit and Loss.xlsx';

async function analyzePL() {
  const parser = new PLParser();
  
  // Read the file
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

  console.log('📊 Analyzing P&L Statement...\n');
  console.log(`Period: ${data[2]?.[0] || 'Unknown'}`);
  console.log(`Company: ${data[1]?.[0] || 'Unknown'}\n`);

  // Parse for each year (columns 1-6 are years 2020-2025, column 7 is Total)
  const years = ['2020', '2021', '2022', '2023', '2024', '2025'];
  const insights: any[] = [];

  for (let yearIdx = 1; yearIdx <= 6; yearIdx++) {
    const year = years[yearIdx - 1];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📅 YEAR: ${year}`);
    console.log('='.repeat(60));

    // Extract data for this year
    const yearData = data.map((row: any[]) => {
      const label = row[0];
      const value = row[yearIdx];
      return [label, value];
    });

    // Parse this year's data
    const plData = await parser.parseData(yearData as any[][], `${filePath} - ${year}`);
    
    // Generate insights
    const yearInsights = parser.generateInsights(plData);

    // Display summary
    console.log(`\n💰 Financial Summary:`);
    console.log(`   Revenue: $${plData.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`   COGS: $${plData.costOfGoodsSold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`   Gross Profit: $${plData.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`   Operating Expenses: $${plData.totalOperatingExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`   Operating Income: $${plData.operatingIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`   Net Income: $${plData.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

    const grossMargin = plData.revenue > 0 ? (plData.grossProfit / plData.revenue) * 100 : 0;
    const operatingMargin = plData.revenue > 0 ? (plData.operatingIncome / plData.revenue) * 100 : 0;
    const netMargin = plData.revenue > 0 ? (plData.netIncome / plData.revenue) * 100 : 0;

    console.log(`\n📈 Margins:`);
    console.log(`   Gross Margin: ${grossMargin.toFixed(2)}%`);
    console.log(`   Operating Margin: ${operatingMargin.toFixed(2)}%`);
    console.log(`   Net Margin: ${netMargin.toFixed(2)}%`);

    if (yearInsights.length > 0) {
      console.log(`\n💡 Key Insights:`);
      yearInsights.slice(0, 5).forEach((insight, idx) => {
        const emoji = insight.priority >= 9 ? '🔴' : insight.priority >= 7 ? '🟡' : '🔵';
        console.log(`\n   ${emoji} ${insight.title}`);
        console.log(`      ${insight.description}`);
        if (insight.recommendation) {
          console.log(`      💼 Recommendation: ${insight.recommendation}`);
        }
      });
    }

    insights.push({
      year,
      plData,
      insights: yearInsights,
    });
  }

  // Overall analysis
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('📊 TREND ANALYSIS');
  console.log('='.repeat(60));

  const revenues = insights.map((i) => i.plData.revenue);
  const netIncomes = insights.map((i) => i.plData.netIncome);
  const grossMargins = insights.map((i) => 
    i.plData.revenue > 0 ? (i.plData.grossProfit / i.plData.revenue) * 100 : 0
  );

  console.log(`\nRevenue Trend:`);
  revenues.forEach((rev, idx) => {
    const year = years[idx];
    const change = idx > 0 ? ((rev - revenues[idx - 1]) / revenues[idx - 1]) * 100 : 0;
    const arrow = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
    console.log(`   ${year}: $${rev.toLocaleString()} ${arrow} ${idx > 0 ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` : ''}`);
  });

  console.log(`\nNet Income Trend:`);
  netIncomes.forEach((ni, idx) => {
    const year = years[idx];
    const change = idx > 0 ? ni - netIncomes[idx - 1] : 0;
    const arrow = ni > 0 ? '✅' : '❌';
    console.log(`   ${year}: $${ni.toLocaleString()} ${arrow} ${idx > 0 ? `${change > 0 ? '+' : ''}$${Math.abs(change).toLocaleString()}` : ''}`);
  });

  console.log(`\nGross Margin Trend:`);
  grossMargins.forEach((gm, idx) => {
    const year = years[idx];
    const change = idx > 0 ? gm - grossMargins[idx - 1] : 0;
    const arrow = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
    console.log(`   ${year}: ${gm.toFixed(2)}% ${arrow} ${idx > 0 ? `${change > 0 ? '+' : ''}${change.toFixed(2)}%` : ''}`);
  });

  // Overall recommendations
  const avgGrossMargin = grossMargins.reduce((a, b) => a + b, 0) / grossMargins.length;
  const avgNetMargin = netIncomes.reduce((sum, ni, idx) => {
    const margin = revenues[idx] > 0 ? (ni / revenues[idx]) * 100 : 0;
    return sum + margin;
  }, 0) / netIncomes.length;

  console.log(`\n\n${'='.repeat(60)}`);
  console.log('🎯 STRATEGIC RECOMMENDATIONS');
  console.log('='.repeat(60));

  if (avgGrossMargin < 30) {
    console.log(`\n⚠️  Average Gross Margin (${avgGrossMargin.toFixed(1)}%) is below 30%`);
    console.log('   → Review pricing strategy and cost of goods sold');
    console.log('   → Consider value-based pricing');
    console.log('   → Negotiate better supplier terms');
  }

  if (avgNetMargin < 5) {
    console.log(`\n⚠️  Average Net Margin (${avgNetMargin.toFixed(1)}%) is below 5%`);
    console.log('   → Focus on expense optimization');
    console.log('   → Review operating expenses line by line');
    console.log('   → Consider automation to reduce costs');
  }

  const revenueGrowth = ((revenues[revenues.length - 1] - revenues[0]) / revenues[0]) * 100;
  if (revenueGrowth > 0) {
    console.log(`\n✅ Strong Revenue Growth: ${revenueGrowth.toFixed(1)}% over period`);
    console.log('   → Continue growth strategies');
    console.log('   → Scale operations efficiently');
  }

  const latestYear = insights[insights.length - 1];
  if (latestYear.plData.netIncome < 0) {
    console.log(`\n🚨 CRITICAL: Latest year shows net loss`);
    console.log('   → Immediate action required');
    console.log('   → Review all expense categories');
    console.log('   → Consider revenue diversification');
  }

  console.log('\n');
}

analyzePL().catch(console.error);
