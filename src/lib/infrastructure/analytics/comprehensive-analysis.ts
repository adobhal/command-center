/**
 * Comprehensive Business Analysis
 * Analyzes multiple financial data sources to generate powerful insights
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { PLParser } from './pl-parser';
import { logger } from '@/lib/shared/utils/logger';

// Lazy import database to avoid build-time errors
let db: any;
let aiInsights: any;
let eq: any;
let and: any;

async function getDb() {
  if (!db) {
    const dbModule = await import('@/lib/infrastructure/db');
    db = dbModule.db;
    const schemaModule = await import('@/lib/infrastructure/db/schema');
    aiInsights = schemaModule.aiInsights;
    const ormModule = await import('drizzle-orm');
    eq = ormModule.eq;
    and = ormModule.and;
  }
  return { db, aiInsights, eq, and };
}

export interface BusinessMetrics {
  revenue: number;
  expenses: number;
  netIncome: number;
  assets: number;
  liabilities: number;
  equity: number;
  cashFlow: number;
  customerCount: number;
  employeeCount: number;
  vendorCount: number;
  topCustomers: Array<{ name: string; revenue: number }>;
  topExpenses: Array<{ category: string; amount: number }>;
  trends: {
    revenueGrowth: number;
    expenseGrowth: number;
    marginTrend: number;
  };
}

export interface ComprehensiveInsight {
  type: 'strategic' | 'financial' | 'operational' | 'risk' | 'opportunity';
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  priority: number;
  recommendation: string;
  metrics?: any;
  actionable: boolean;
}

export class ComprehensiveAnalyzer {
  private plParser: PLParser;

  constructor() {
    this.plParser = new PLParser();
  }

  /**
   * Analyze all data files and generate comprehensive insights
   */
  async analyzeAll(dataDir: string): Promise<{
    metrics: BusinessMetrics;
    insights: ComprehensiveInsight[];
  }> {
    const metrics: BusinessMetrics = {
      revenue: 0,
      expenses: 0,
      netIncome: 0,
      assets: 0,
      liabilities: 0,
      equity: 0,
      cashFlow: 0,
      customerCount: 0,
      employeeCount: 0,
      vendorCount: 0,
      topCustomers: [],
      topExpenses: [],
      trends: {
        revenueGrowth: 0,
        expenseGrowth: 0,
        marginTrend: 0,
      },
    };

    const insights: ComprehensiveInsight[] = [];

    try {
      // 1. Analyze Profit & Loss
      try {
        const plData = await this.analyzeProfitAndLoss(`${dataDir}/Profit_and_loss.xlsx`);
        metrics.revenue = plData.revenue;
        metrics.expenses = plData.totalOperatingExpenses + plData.costOfGoodsSold;
        metrics.netIncome = plData.netIncome;
        insights.push(...this.generatePLInsights(plData));
        metrics.trends.marginTrend = plData.revenue > 0 ? (plData.netIncome / plData.revenue) * 100 : 0;
      } catch (error: any) {
        logger.warn('Failed to analyze P&L', { error: error.message, file: `${dataDir}/Profit_and_loss.xlsx` });
      }

      // 2. Analyze Balance Sheet
      let balanceSheet = { totalAssets: 0, totalLiabilities: 0, totalEquity: 0 };
      try {
        balanceSheet = await this.analyzeBalanceSheet(`${dataDir}/Balance_sheet.xlsx`);
        metrics.assets = balanceSheet.totalAssets;
        metrics.liabilities = balanceSheet.totalLiabilities;
        metrics.equity = balanceSheet.totalEquity;
        insights.push(...this.generateBalanceSheetInsights(balanceSheet));
      } catch (error: any) {
        logger.warn('Failed to analyze Balance Sheet', { error: error.message, file: `${dataDir}/Balance_sheet.xlsx` });
      }

      // 3. Analyze General Ledger
      try {
        const ledgerData = await this.analyzeGeneralLedger(`${dataDir}/General_ledger.xlsx`);
        metrics.cashFlow = ledgerData.cashFlow;
        metrics.topExpenses = ledgerData.topExpenses;
        insights.push(...this.generateLedgerInsights(ledgerData));
      } catch (error: any) {
        logger.warn('Failed to analyze General Ledger', { error: error.message, file: `${dataDir}/General_ledger.xlsx` });
      }

      // 4. Analyze Customers
      try {
        const customers = await this.analyzeCustomers(`${dataDir}/Customers.xlsx`);
        metrics.customerCount = customers.count;
        metrics.topCustomers = customers.topCustomers;
        insights.push(...this.generateCustomerInsights(customers));
      } catch (error: any) {
        logger.warn('Failed to analyze Customers', { error: error.message, file: `${dataDir}/Customers.xlsx` });
      }

      // 5. Analyze Employees
      try {
        const employees = await this.analyzeEmployees(`${dataDir}/Employees.xlsx`);
        metrics.employeeCount = employees.count;
        insights.push(...this.generateEmployeeInsights(employees, metrics));
      } catch (error: any) {
        logger.warn('Failed to analyze Employees', { error: error.message, file: `${dataDir}/Employees.xlsx` });
      }

      // 6. Analyze Vendors
      try {
        const vendors = await this.analyzeVendors(`${dataDir}/Vendors.xlsx`);
        metrics.vendorCount = vendors.count;
        insights.push(...this.generateVendorInsights(vendors));
      } catch (error: any) {
        logger.warn('Failed to analyze Vendors', { error: error.message, file: `${dataDir}/Vendors.xlsx` });
      }

      // 7. Generate cross-functional insights
      insights.push(...this.generateCrossFunctionalInsights(metrics));

      // Calculate trends
      metrics.trends = this.calculateTrends(metrics, balanceSheet);

      return { metrics, insights: insights.sort((a, b) => b.priority - a.priority) };
    } catch (error: any) {
      logger.error('Error in comprehensive analysis', { 
        error: error.message,
        stack: error.stack,
        name: error.name,
      });
      // Re-throw with more context
      const enhancedError = new Error(`Comprehensive analysis failed: ${error.message}`);
      (enhancedError as any).originalError = error;
      throw enhancedError;
    }
  }

  /**
   * Analyze Profit & Loss statement
   */
  private async analyzeProfitAndLoss(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`P&L file not found: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath);
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('P&L file has no sheets');
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    if (!data || data.length === 0) {
      throw new Error('P&L file is empty');
    }

    // Use the last column (most recent period)
    const lastColumnIndex = data[0] ? data[0].length - 1 : 1;
    const yearData = data.map((row: any[]) => [row[0], row[lastColumnIndex]]);

    return await this.plParser.parseData(yearData as any[][], filePath, 1);
  }

  /**
   * Analyze Balance Sheet
   */
  private async analyzeBalanceSheet(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Balance Sheet file not found: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath);
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Balance Sheet file has no sheets');
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    if (!data || data.length === 0) {
      return { totalAssets: 0, totalLiabilities: 0, totalEquity: 0 };
    }

    const lastColumnIndex = data[0] ? data[0].length - 1 : 1;
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    for (const row of data) {
      if (!row || !row[0]) continue;
      const label = String(row[0]).toLowerCase();
      const value = this.parseNumber(row[lastColumnIndex]);

      if (value === null) continue;

      if (label.includes('total assets') || label.includes('assets total')) {
        totalAssets = Math.abs(value);
      } else if (label.includes('total liabilities') || label.includes('liabilities total')) {
        totalLiabilities = Math.abs(value);
      } else if (label.includes('total equity') || label.includes('equity total') || label.includes('owner')) {
        totalEquity = Math.abs(value);
      }
    }

    return { totalAssets, totalLiabilities, totalEquity };
  }

  /**
   * Analyze General Ledger
   */
  private async analyzeGeneralLedger(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`General Ledger file not found: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath);
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { cashFlow: 0, topExpenses: [] };
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    if (!data || data.length < 2) return { cashFlow: 0, topExpenses: [] };

    const headers = data[0] as string[];
    const amountIndex = headers.findIndex((h) => h?.toLowerCase().includes('amount') || h?.toLowerCase().includes('debit') || h?.toLowerCase().includes('credit'));
    const accountIndex = headers.findIndex((h) => h?.toLowerCase().includes('account') || h?.toLowerCase().includes('name'));
    const dateIndex = headers.findIndex((h) => h?.toLowerCase().includes('date'));

    if (amountIndex === -1) return { cashFlow: 0, topExpenses: [] };

    let cashFlow = 0;
    const expenseMap: { [key: string]: number } = {};

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;

      const amount = this.parseNumber(row[amountIndex]);
      if (amount === null) continue;

      const accountName = accountIndex >= 0 ? String(row[accountIndex] || '').toLowerCase() : '';

      // Calculate cash flow (cash account transactions)
      if (accountName.includes('cash') || accountName.includes('bank')) {
        cashFlow += amount;
      }

      // Track expenses
      if (amount < 0 && accountName) {
        const category = this.categorizeExpense(accountName);
        expenseMap[category] = (expenseMap[category] || 0) + Math.abs(amount);
      }
    }

    const topExpenses = Object.entries(expenseMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return { cashFlow, topExpenses };
  }

  /**
   * Analyze Customers
   */
  private async analyzeCustomers(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Customers file not found: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath);
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { count: 0, topCustomers: [] };
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    if (!data || data.length < 2) return { count: 0, topCustomers: [] };

    const headers = data[0] as string[];
    const nameIndex = headers.findIndex((h) => h?.toLowerCase().includes('name') || h?.toLowerCase().includes('customer'));
    const balanceIndex = headers.findIndex((h) => h?.toLowerCase().includes('balance') || h?.toLowerCase().includes('total') || h?.toLowerCase().includes('amount'));

    const customers: Array<{ name: string; revenue: number }> = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[nameIndex]) continue;

      const name = String(row[nameIndex]);
      const balance = balanceIndex >= 0 ? this.parseNumber(row[balanceIndex]) || 0 : 0;

      if (name && balance > 0) {
        customers.push({ name, revenue: Math.abs(balance) });
      }
    }

    return {
      count: customers.length,
      topCustomers: customers.sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    };
  }

  /**
   * Analyze Employees
   */
  private async analyzeEmployees(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Employees file not found: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath);
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { count: 0 };
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    if (!data || data.length < 2) return { count: 0 };

    // Count unique employees (assuming first column is name/ID)
    const employeeSet = new Set<string>();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row && row[0]) {
        employeeSet.add(String(row[0]));
      }
    }

    return { count: employeeSet.size };
  }

  /**
   * Analyze Vendors
   */
  private async analyzeVendors(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Vendors file not found: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath);
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { count: 0 };
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    if (!data || data.length < 2) return { count: 0 };

    // Count unique vendors
    const vendorSet = new Set<string>();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row && row[0]) {
        vendorSet.add(String(row[0]));
      }
    }

    return { count: vendorSet.size };
  }

  /**
   * Generate P&L insights
   */
  private generatePLInsights(plData: any): ComprehensiveInsight[] {
    const insights: ComprehensiveInsight[] = [];
    const grossMargin = plData.revenue > 0 ? (plData.grossProfit / plData.revenue) * 100 : 0;
    const netMargin = plData.revenue > 0 ? (plData.netIncome / plData.revenue) * 100 : 0;

    if (plData.netIncome < 0) {
      insights.push({
        type: 'risk',
        category: 'profitability',
        title: 'Business Operating at Loss',
        description: `Net income is negative ($${Math.abs(plData.netIncome).toLocaleString()}), indicating the business is not profitable. Net margin is ${netMargin.toFixed(2)}%.`,
        impact: 'high',
        priority: 10,
        recommendation: 'Immediate action required: Review all expenses, optimize pricing, and identify cost reduction opportunities. Consider revenue diversification.',
        actionable: true,
        metrics: { netIncome: plData.netIncome, netMargin },
      });
    }

    if (grossMargin < 30) {
      insights.push({
        type: 'financial',
        category: 'margins',
        title: 'Low Gross Margin',
        description: `Gross margin is ${grossMargin.toFixed(2)}%, which is below the recommended 30% threshold. This indicates pricing or COGS issues.`,
        impact: 'high',
        priority: 8,
        recommendation: 'Review pricing strategy, negotiate better supplier terms, and consider value-based pricing.',
        actionable: true,
        metrics: { grossMargin },
      });
    }

    return insights;
  }

  /**
   * Generate Balance Sheet insights
   */
  private generateBalanceSheetInsights(bs: { totalAssets: number; totalLiabilities: number; totalEquity: number }): ComprehensiveInsight[] {
    const insights: ComprehensiveInsight[] = [];
    const debtToEquity = bs.totalEquity > 0 ? (bs.totalLiabilities / bs.totalEquity) : Infinity;

    if (debtToEquity > 2) {
      insights.push({
        type: 'risk',
        category: 'financial_structure',
        title: 'High Debt-to-Equity Ratio',
        description: `Debt-to-equity ratio is ${debtToEquity.toFixed(2)}, indicating high leverage. This increases financial risk.`,
        impact: 'high',
        priority: 9,
        recommendation: 'Consider reducing debt, increasing equity, or restructuring financing to improve financial stability.',
        actionable: true,
        metrics: { debtToEquity, liabilities: bs.totalLiabilities, equity: bs.totalEquity },
      });
    }

    if (bs.totalEquity < 0) {
      insights.push({
        type: 'risk',
        category: 'financial_structure',
        title: 'Negative Equity',
        description: `Total equity is negative ($${Math.abs(bs.totalEquity).toLocaleString()}), indicating the business owes more than it owns.`,
        impact: 'high',
        priority: 10,
        recommendation: 'Critical: Business is insolvent. Immediate action required to improve profitability and reduce liabilities.',
        actionable: true,
        metrics: { equity: bs.totalEquity },
      });
    }

    return insights;
  }

  /**
   * Generate Ledger insights
   */
  private generateLedgerInsights(ledger: { cashFlow: number; topExpenses: Array<{ category: string; amount: number }> }): ComprehensiveInsight[] {
    const insights: ComprehensiveInsight[] = [];

    if (ledger.cashFlow < 0) {
      insights.push({
        type: 'risk',
        category: 'cash_flow',
        title: 'Negative Cash Flow',
        description: `Cash flow is negative ($${Math.abs(ledger.cashFlow).toLocaleString()}), indicating cash is leaving the business faster than it's coming in.`,
        impact: 'high',
        priority: 9,
        recommendation: 'Improve collections, reduce expenses, or secure additional financing to maintain operations.',
        actionable: true,
        metrics: { cashFlow: ledger.cashFlow },
      });
    }

    if (ledger.topExpenses.length > 0) {
      const largestExpense = ledger.topExpenses[0];
      insights.push({
        type: 'operational',
        category: 'expense_optimization',
        title: `Largest Expense Category: ${largestExpense.category}`,
        description: `${largestExpense.category} represents the largest expense at $${largestExpense.amount.toLocaleString()}.`,
        impact: 'medium',
        priority: 7,
        recommendation: `Review ${largestExpense.category} for optimization opportunities and cost reduction strategies.`,
        actionable: true,
        metrics: { category: largestExpense.category, amount: largestExpense.amount },
      });
    }

    return insights;
  }

  /**
   * Generate Customer insights
   */
  private generateCustomerInsights(customers: { count: number; topCustomers: Array<{ name: string; revenue: number }> }): ComprehensiveInsight[] {
    const insights: ComprehensiveInsight[] = [];

    if (customers.topCustomers.length > 0) {
      const topCustomer = customers.topCustomers[0];
      const top3Revenue = customers.topCustomers.slice(0, 3).reduce((sum, c) => sum + c.revenue, 0);
      const concentration = top3Revenue > 0 ? (top3Revenue / customers.topCustomers.reduce((sum, c) => sum + c.revenue, 0)) * 100 : 0;

      if (concentration > 50) {
        insights.push({
          type: 'risk',
          category: 'customer_concentration',
          title: 'High Customer Concentration Risk',
          description: `Top 3 customers represent ${concentration.toFixed(1)}% of total customer revenue. This creates significant business risk if any key customer leaves.`,
          impact: 'high',
          priority: 8,
          recommendation: 'Diversify customer base by expanding marketing efforts and developing relationships with new customers to reduce dependency.',
          actionable: true,
          metrics: { concentration, topCustomer: topCustomer.name },
        });
      }

      insights.push({
        type: 'opportunity',
        category: 'customer_relationship',
        title: `Top Customer: ${topCustomer.name}`,
        description: `${topCustomer.name} is the largest customer with $${topCustomer.revenue.toLocaleString()} in revenue.`,
        impact: 'medium',
        priority: 6,
        recommendation: 'Strengthen relationship with top customer, identify upsell opportunities, and ensure excellent service to retain them.',
        actionable: true,
        metrics: { customer: topCustomer.name, revenue: topCustomer.revenue },
      });
    }

    return insights;
  }

  /**
   * Generate Employee insights
   */
  private generateEmployeeInsights(employees: { count: number }, metrics: BusinessMetrics): ComprehensiveInsight[] {
    const insights: ComprehensiveInsight[] = [];

    if (employees.count > 0 && metrics.revenue > 0) {
      const revenuePerEmployee = metrics.revenue / employees.count;
      insights.push({
        type: 'operational',
        category: 'productivity',
        title: `Revenue per Employee: $${revenuePerEmployee.toLocaleString()}`,
        description: `With ${employees.count} employees generating $${metrics.revenue.toLocaleString()} in revenue, revenue per employee is $${revenuePerEmployee.toLocaleString()}.`,
        impact: 'medium',
        priority: 6,
        recommendation: revenuePerEmployee < 100000
          ? 'Consider improving employee productivity through training, automation, or process optimization.'
          : 'Strong productivity metrics. Continue to invest in employee development and tools.',
        actionable: true,
        metrics: { employeeCount: employees.count, revenuePerEmployee },
      });
    }

    return insights;
  }

  /**
   * Generate Vendor insights
   */
  private generateVendorInsights(vendors: { count: number }): ComprehensiveInsight[] {
    const insights: ComprehensiveInsight[] = [];

    if (vendors.count > 20) {
      insights.push({
        type: 'operational',
        category: 'vendor_management',
        title: 'Large Vendor Base',
        description: `Business works with ${vendors.count} vendors, which may create complexity in vendor management.`,
        impact: 'low',
        priority: 5,
        recommendation: 'Consider consolidating vendors where possible to improve negotiation power and simplify management.',
        actionable: true,
        metrics: { vendorCount: vendors.count },
      });
    }

    return insights;
  }

  /**
   * Generate cross-functional insights
   */
  private generateCrossFunctionalInsights(metrics: BusinessMetrics): ComprehensiveInsight[] {
    const insights: ComprehensiveInsight[] = [];

    // Cash flow vs profitability
    if (metrics.netIncome > 0 && metrics.cashFlow < 0) {
      insights.push({
        type: 'financial',
        category: 'cash_management',
        title: 'Profitability Without Cash Flow',
        description: 'Business is profitable but experiencing negative cash flow. This indicates timing issues with collections or payments.',
        impact: 'high',
        priority: 8,
        recommendation: 'Improve accounts receivable collection, negotiate better payment terms with vendors, and optimize cash management.',
        actionable: true,
        metrics: { netIncome: metrics.netIncome, cashFlow: metrics.cashFlow },
      });
    }

    // Customer concentration vs revenue
    if (metrics.topCustomers.length > 0) {
      const topCustomerRevenue = metrics.topCustomers[0]?.revenue || 0;
      const customerConcentration = metrics.revenue > 0 ? (topCustomerRevenue / metrics.revenue) * 100 : 0;

      if (customerConcentration > 30) {
        insights.push({
          type: 'strategic',
          category: 'business_diversification',
          title: 'Strategic Customer Diversification Opportunity',
          description: `Single customer represents ${customerConcentration.toFixed(1)}% of revenue. Diversifying customer base is critical for long-term stability.`,
          impact: 'high',
          priority: 9,
          recommendation: 'Develop a customer acquisition strategy, invest in marketing, and build relationships with multiple customer segments.',
          actionable: true,
          metrics: { concentration: customerConcentration },
        });
      }
    }

    return insights;
  }

  /**
   * Calculate trends
   */
  private calculateTrends(metrics: BusinessMetrics, balanceSheet: { totalAssets: number; totalLiabilities: number; totalEquity: number }) {
    // Simplified trend calculation - in production, would compare multiple periods
    return {
      revenueGrowth: 0, // Would calculate from historical data
      expenseGrowth: 0,
      marginTrend: metrics.revenue > 0 ? (metrics.netIncome / metrics.revenue) * 100 : 0,
    };
  }

  /**
   * Categorize expense
   */
  private categorizeExpense(accountName: string): string {
    const name = accountName.toLowerCase();
    if (name.includes('rent') || name.includes('lease')) return 'Rent & Lease';
    if (name.includes('payroll') || name.includes('salary') || name.includes('wage')) return 'Payroll';
    if (name.includes('utilities') || name.includes('electric') || name.includes('water')) return 'Utilities';
    if (name.includes('supplies') || name.includes('material')) return 'Supplies';
    if (name.includes('marketing') || name.includes('advertising')) return 'Marketing';
    if (name.includes('insurance')) return 'Insurance';
    if (name.includes('tax')) return 'Taxes';
    return 'Other Expenses';
  }

  /**
   * Parse number from cell value
   */
  private parseNumber(value: any): number | null {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
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
   * Store insights in database
   */
  async storeInsights(insights: ComprehensiveInsight[]): Promise<number> {
    let stored = 0;

    // Don't fail if database is not available
    try {
      const { db: dbInstance, aiInsights: insightsTable, eq: eqFn, and: andFn } = await getDb();
      const mapTypeToAIType = (type: string): 'recommendation' | 'prediction' | 'anomaly' | 'optimization' => {
        switch (type) {
          case 'risk':
          case 'anomaly':
            return 'anomaly';
          case 'opportunity':
          case 'prediction':
            return 'prediction';
          case 'operational':
          case 'financial':
          case 'strategic':
            return 'optimization';
          default:
            return 'recommendation';
        }
      };

      for (const insight of insights) {
        try {
          const categoryKey = `comprehensive_${insight.category}`;
          const title = insight.title;

          // Check if already exists
          const existing = await dbInstance
            .select()
            .from(insightsTable)
            .where(
              andFn(
                eqFn(insightsTable.category, categoryKey),
                eqFn(insightsTable.title, title)
              )
            )
            .limit(1);

          if (existing.length === 0) {
            await dbInstance.insert(insightsTable).values({
              type: mapTypeToAIType(insight.type),
              category: categoryKey,
              title: title,
              description: insight.description,
              priority: insight.priority,
              actionable: insight.actionable,
              actionUrl: insight.actionable ? '/dashboard' : undefined,
              confidence: '0.95',
              metadata: {
                comprehensiveAnalysis: true,
                impact: insight.impact,
                recommendation: insight.recommendation,
                metrics: insight.metrics,
              },
            });
            stored++;
          }
        } catch (insertError: any) {
          logger.warn('Failed to store individual insight', {
            error: insertError.message,
            insight: insight.title,
          });
          // Continue with next insight
        }
      }
    } catch (dbError: any) {
      logger.error('Database error when storing insights', {
        error: dbError.message,
        stack: dbError.stack,
      });
      // Return 0 stored but don't throw - analysis can still succeed
    }

    return stored;
  }
}
