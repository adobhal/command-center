import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/analytics/pl-analysis', destination: '/analysis/pl-analysis', permanent: true },
      { source: '/analytics/comprehensive', destination: '/analysis/comprehensive', permanent: true },
      { source: '/analytics', destination: '/analysis', permanent: true },
      { source: '/quickbooks/connect', destination: '/bookkeeping/quickbooks', permanent: true },
      { source: '/quickbooks', destination: '/bookkeeping/quickbooks', permanent: true },
      { source: '/bank-statements/upload', destination: '/bookkeeping/bank-statements', permanent: true },
      { source: '/bank-statements', destination: '/bookkeeping/bank-statements', permanent: true },
      { source: '/reconciliation', destination: '/bookkeeping/reconciliation', permanent: true },
    ];
  },
};

export default nextConfig;
