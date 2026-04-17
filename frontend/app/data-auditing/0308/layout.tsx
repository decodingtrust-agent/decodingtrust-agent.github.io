"use client";

import { ReportDataProvider, useReportData } from '@/components/data-auditing/ReportDataProvider';
import Sidebar from '@/components/data-auditing/Sidebar';
import '@/components/data-auditing/data-auditing.css';

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { raw, loading, error } = useReportData();

  const genDate = raw?.metadata?.generated_at
    ? new Date(raw.metadata.generated_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <div className="da-layout">
      <div className="da-topbar">
        <h1 className="da-topbar-title">DT-Bench Data Quality Report</h1>
        {genDate && <span className="da-topbar-date">Generated: {genDate}</span>}
      </div>

      {loading ? (
        <div className="da-loading">Loading report data...</div>
      ) : error ? (
        <div className="da-error-msg">
          <h2>Failed to load report data</h2>
          <p>{error}</p>
          <p style={{ marginTop: 12, fontSize: '0.82rem' }}>
            Make sure <code>report-data.json</code> exists in <code>public/data/</code>
          </p>
        </div>
      ) : (
        <div className="da-layout-body">
          <Sidebar />
          <main className="da-main-content">
            {children}
          </main>
        </div>
      )}
    </div>
  );
}

export default function DataAuditingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReportDataProvider>
      <LayoutInner>{children}</LayoutInner>
    </ReportDataProvider>
  );
}
