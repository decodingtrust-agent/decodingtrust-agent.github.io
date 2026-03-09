"use client";

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { groupByDomain, groupRulesByDomain } from '@/lib/data-auditing/dataHelpers';

const ReportDataContext = createContext<any>(null);

export function useReportData() {
  return useContext(ReportDataContext);
}

export function ReportDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/report-data.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const derived = useMemo(() => {
    if (!data) return null;
    const byDomainLLM = groupByDomain(data.llm_results || []);
    const byDomainRule = groupRulesByDomain(data.rule_results);
    const allDomains = [...new Set([
      ...Object.keys(byDomainLLM),
      ...Object.keys(byDomainRule),
    ])].sort();

    return { byDomainLLM, byDomainRule, allDomains };
  }, [data]);

  const value = useMemo(() => ({
    raw: data,
    derived,
    loading,
    error,
  }), [data, derived, loading, error]);

  return (
    <ReportDataContext.Provider value={value}>
      {children}
    </ReportDataContext.Provider>
  );
}
