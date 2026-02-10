/**
 * Profit & Loss Statement Parser
 * Parses Excel P&L files and extracts financial data
 */

import * as XLSX from 'xlsx';

export interface PLData {
  period: string;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: {
    [category: string]: number;
  };
  totalOperatingExpenses: number;
  operatingIncome: number;
  otherIncome: number;
  otherExpenses: number;
  netIncome: number;
  metadata: {
    filename: string;
    parsedAt: Date;
    rawData?: any;
  };
}

export interface PLInsight {
  type: 'revenue' | 'expense' | 'profitability' | 'trend' | 'anomaly';
  category: string;
  title: string;
  description: string;
  value: number;
  percentage?: number;
  recommendation?: string;
  priority: number;
}

export class PLParser {
  /**
   * Parse Excel P&L file
   */
  async parseFile(filePath: string): Promise<PLData> {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    return this.parseData(data, filePath);
  }

  /**
   * Parse P&L data from array
   */
  async parseBuffer(buffer: Buffer, filename: string, yearColumnIndex?: number): Promise<PLData> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    return this.parseData(data, filename, yearColumnIndex);
  }

  /**
   * Parse multi-year P&L data
   */
  async parseMultiYear(buffer: Buffer, filename: string): Promise<{ [year: string]: PLData }> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    // Find header row (usually row 4 or 5)
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row && row[0] && String(row[0]).toLowerCase().includes('distribution account')) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      // Fallback: parse as single year
      return { 'All Years': await this.parseData(data, filename) };
    }

    const headerRow = data[headerRowIndex];
    const result: { [year: string]: PLData } = {};

    // Parse each year column (skip first column which is labels)
    for (let colIdx = 1; colIdx < headerRow.length; colIdx++) {
      const yearLabel = String(headerRow[colIdx] || '').trim();
      if (!yearLabel || yearLabel.toLowerCase() === 'total') continue;

      const yearData = await this.parseData(data, `${filename} - ${yearLabel}`, colIdx);
      result[yearLabel] = yearData;
    }

    return result;
  }

  /**
   * Parse data array into structured P&L data
   * Supports multi-year format where columns represent different years
   */
  parseData(data: any[][], filename: string, yearColumnIndex?: number): PLData {
    const plData: PLData = {
      period: this.extractPeriod(data),
      revenue: 0,
      costOfGoodsSold: 0,
      grossProfit: 0,
      operatingExpenses: {},
      totalOperatingExpenses: 0,
      operatingIncome: 0,
      otherIncome: 0,
      otherExpenses: 0,
      netIncome: 0,
      metadata: {
        filename,
        parsedAt: new Date(),
        rawData: data,
      },
    };

    // Determine which column to use (default to last column if not specified)
    const valueColumnIndex = yearColumnIndex !== undefined 
      ? yearColumnIndex 
      : data[0] ? data[0].length - 1 : 1;

    // Common P&L patterns to look for
    const patterns = {
      revenue: [
        'revenue',
        'sales',
        'income',
        'total for income',
        'total income',
        'gross revenue',
        'total revenue',
      ],
      cogs: [
        'cost of goods sold',
        'cogs',
        'cost of sales',
        'direct costs',
        'cost of revenue',
        'total for cost of goods sold',
      ],
      operatingExpenses: [
        'operating expenses',
        'opex',
        'expenses',
        'operating costs',
        'general and administrative',
        'g&a',
        'sales and marketing',
        'research and development',
        'r&d',
        'payroll',
        'rent',
        'utilities',
        'total for expenses',
      ],
      netIncome: [
        'net income',
        'net profit',
        'profit',
        'net earnings',
        'bottom line',
        'total for net income',
      ],
    };

    // Parse rows
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const label = String(row[0] || '').toLowerCase().trim();
      
      // Skip header rows and empty rows
      if (!label || label.includes('distribution account') || label.includes('profit and loss')) {
        continue;
      }

      // Get value from the specified column
      const value = this.parseNumber(row[valueColumnIndex]);

      if (value === null || value === undefined) continue;

      // Match revenue - look for "Total for Income" or individual income items
      if (label.includes('total for income') || label === 'total income') {
        plData.revenue = Math.abs(value);
      } else if (patterns.revenue.some((p) => label.includes(p)) && !label.includes('cost') && !label.includes('expense')) {
        // Individual revenue items - sum them up
        if (plData.revenue === 0) {
          plData.revenue = Math.abs(value);
        } else {
          // If we already have revenue, this might be a subtotal - take the larger value
          if (Math.abs(value) > plData.revenue) {
            plData.revenue = Math.abs(value);
          }
        }
      }

      // Match COGS - look for "Total for Cost of Goods Sold"
      if (label.includes('total for cost of goods sold') || (patterns.cogs.some((p) => label.includes(p)) && label.includes('total'))) {
        plData.costOfGoodsSold = Math.abs(value);
      } else if (patterns.cogs.some((p) => label.includes(p)) && !label.includes('total')) {
        // Individual COGS items - accumulate
        plData.costOfGoodsSold += Math.abs(value);
      }

      // Match operating expenses
      if (label.includes('total for expenses') || (label.includes('total') && patterns.operatingExpenses.some((p) => label.includes(p)))) {
        plData.totalOperatingExpenses = Math.abs(value);
      } else if (patterns.operatingExpenses.some((p) => label.includes(p)) && !label.includes('total')) {
        // Individual expense category
        const category = this.extractCategory(label);
        plData.operatingExpenses[category] = (plData.operatingExpenses[category] || 0) + Math.abs(value);
      }

      // Match net income
      if (patterns.netIncome.some((p) => label.includes(p)) && (label.includes('total') || label.includes('net'))) {
        plData.netIncome = value; // Can be negative
      }
    }

    // Calculate derived values
    plData.grossProfit = plData.revenue - plData.costOfGoodsSold;
    
    // If total operating expenses not found, sum individual expenses
    if (plData.totalOperatingExpenses === 0) {
      plData.totalOperatingExpenses = Object.values(plData.operatingExpenses).reduce(
        (sum, val) => sum + val,
        0
      );
    }
    
    plData.operatingIncome = plData.grossProfit - plData.totalOperatingExpenses;

    return plData;
  }

  /**
   * Extract period from data
   */
  private extractPeriod(data: any[][]): string {
    // Look for date patterns in first few rows
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (!row) continue;

      for (const cell of row) {
        const str = String(cell || '');
        // Look for date patterns
        if (str.match(/\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
          return str;
        }
      }
    }
    return 'Unknown Period';
  }

  /**
   * Extract category name from label
   */
  private extractCategory(label: string): string {
    // Clean up common prefixes/suffixes
    return label
      .replace(/^total\s+/i, '')
      .replace(/\s+total$/i, '')
      .replace(/^operating\s+/i, '')
      .trim()
      || 'Other Expenses';
  }

  /**
   * Parse number from cell value
   */
  private parseNumber(value: any): number | null {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      // Remove currency symbols, commas, parentheses (negative)
      const cleaned = value
        .replace(/[$,\s]/g, '')
        .replace(/\(([\d.]+)\)/, '-$1')
        .trim();

      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    }

    return null;
  }

  /**
   * Generate insights from P&L data
   */
  generateInsights(plData: PLData): PLInsight[] {
    const insights: PLInsight[] = [];

    // Revenue insights
    if (plData.revenue > 0) {
      const grossMargin = (plData.grossProfit / plData.revenue) * 100;
      const operatingMargin = (plData.operatingIncome / plData.revenue) * 100;
      const netMargin = (plData.netIncome / plData.revenue) * 100;

      // Gross margin analysis
      if (grossMargin < 20) {
        insights.push({
          type: 'profitability',
          category: 'gross_margin',
          title: 'Low Gross Margin',
          description: `Gross margin is ${grossMargin.toFixed(1)}%, which is below the recommended 20% threshold. Consider reviewing cost of goods sold.`,
          value: grossMargin,
          percentage: grossMargin,
          recommendation: 'Review pricing strategy and COGS optimization opportunities',
          priority: 8,
        });
      } else if (grossMargin > 50) {
        insights.push({
          type: 'profitability',
          category: 'gross_margin',
          title: 'Strong Gross Margin',
          description: `Gross margin is ${grossMargin.toFixed(1)}%, indicating healthy pricing and cost control.`,
          value: grossMargin,
          percentage: grossMargin,
          priority: 5,
        });
      }

      // Operating margin analysis
      if (operatingMargin < 0) {
        insights.push({
          type: 'profitability',
          category: 'operating_margin',
          title: 'Negative Operating Income',
          description: `Operating income is negative (${operatingMargin.toFixed(1)}%). Operating expenses exceed gross profit.`,
          value: operatingMargin,
          percentage: operatingMargin,
          recommendation: 'Review operating expenses and identify cost reduction opportunities',
          priority: 10,
        });
      } else if (operatingMargin < 5) {
        insights.push({
          type: 'profitability',
          category: 'operating_margin',
          title: 'Low Operating Margin',
          description: `Operating margin is ${operatingMargin.toFixed(1)}%, indicating tight profitability.`,
          value: operatingMargin,
          percentage: operatingMargin,
          recommendation: 'Optimize operating expenses',
          priority: 7,
        });
      }

      // Net margin analysis
      if (netMargin < 0) {
        insights.push({
          type: 'profitability',
          category: 'net_margin',
          title: 'Net Loss',
          description: `Net income is negative (${netMargin.toFixed(1)}% margin). The business is operating at a loss.`,
          value: netMargin,
          percentage: netMargin,
          recommendation: 'Immediate action required: Review all expenses and revenue streams',
          priority: 10,
        });
      }

      // Expense analysis
      const expenseRatio = (plData.totalOperatingExpenses / plData.revenue) * 100;
      if (expenseRatio > 80) {
        insights.push({
          type: 'expense',
          category: 'expense_ratio',
          title: 'High Expense Ratio',
          description: `Operating expenses represent ${expenseRatio.toFixed(1)}% of revenue, which is very high.`,
          value: expenseRatio,
          percentage: expenseRatio,
          recommendation: 'Conduct expense audit and identify areas for reduction',
          priority: 9,
        });
      }

      // Largest expense categories
      const sortedExpenses = Object.entries(plData.operatingExpenses)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

      sortedExpenses.forEach(([category, amount], index) => {
        const percentage = (amount / plData.revenue) * 100;
        if (percentage > 15) {
          insights.push({
            type: 'expense',
            category: category.toLowerCase().replace(/\s+/g, '_'),
            title: `Large Expense Category: ${category}`,
            description: `${category} represents ${percentage.toFixed(1)}% of revenue ($${amount.toLocaleString()}).`,
            value: amount,
            percentage,
            recommendation: `Review ${category} for optimization opportunities`,
            priority: index === 0 ? 7 : 6,
          });
        }
      });
    }

    // COGS analysis
    if (plData.costOfGoodsSold > 0 && plData.revenue > 0) {
      const cogsRatio = (plData.costOfGoodsSold / plData.revenue) * 100;
      if (cogsRatio > 70) {
        insights.push({
          type: 'expense',
          category: 'cogs',
          title: 'High Cost of Goods Sold',
          description: `COGS represents ${cogsRatio.toFixed(1)}% of revenue, indicating low margins on products.`,
          value: cogsRatio,
          percentage: cogsRatio,
          recommendation: 'Review supplier costs, pricing strategy, and product mix',
          priority: 8,
        });
      }
    }

    return insights.sort((a, b) => b.priority - a.priority);
  }
}
