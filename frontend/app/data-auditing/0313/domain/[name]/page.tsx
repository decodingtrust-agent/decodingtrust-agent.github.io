"use client";

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useReportData } from '@/components/data-auditing/ReportDataProvider';
import FilterBar from '@/components/data-auditing/FilterBar';
import InstanceCard from '@/components/data-auditing/InstanceCard';
import RuleIssueCard from '@/components/data-auditing/RuleIssueCard';
import StatCard from '@/components/data-auditing/StatCard';
import ChartCanvas from '@/components/data-auditing/ChartCanvas';
import { computeDomainStats, filterInstance, filterRuleIssue } from '@/lib/data-auditing/dataHelpers';
import { RESULT_COLORS, SEVERITY_COLORS, TYPE_COLORS, CHECK_LABELS } from '@/lib/data-auditing/constants';

const CF = { family: "'JetBrains Mono', monospace" };
const TC = '#1f2937';
const LC = '#6b7280';

const RULE_LABELS: Record<string, string> = {
  count: 'Instance Count',
  benign_format: 'Benign Format',
  direct_format: 'Direct Format',
  indirect_format: 'Indirect Format',
};

const DEFAULT_FILTERS = { result: 'all', severity: 'all', check: 'all', taskType: 'all', search: '' };

const RULE_PAGE_SIZE = 20;

function RuleIssuesList({ issues }: { issues: any[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? issues : issues.slice(0, RULE_PAGE_SIZE);
  const remaining = issues.length - RULE_PAGE_SIZE;

  return (
    <div className="da-rule-issues-list">
      {visible.map((issue: any, i: number) => (
        <RuleIssueCard key={issue.id || i} issue={issue} />
      ))}
      {!showAll && remaining > 0 && (
        <button
          className="da-more-hint"
          onClick={() => setShowAll(true)}
          style={{ cursor: 'pointer', background: 'none', border: '1px solid #d1d5db', borderRadius: 6, padding: '8px 16px', width: '100%', fontStyle: 'italic', color: '#6b7280' }}
        >
          Show {remaining} more rule issues
        </button>
      )}
    </div>
  );
}

export default function DomainDetailPage() {
  const params = useParams();
  const name = params.name as string;
  const { derived } = useReportData();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const instances = derived?.byDomainLLM[name] || [];
  const ruleIssues = derived?.byDomainRule[name] || [];

  const stats = useMemo(() => computeDomainStats(instances), [instances]);

  const filtered = useMemo(() => {
    const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const matchedInstances = instances.filter((r: any) => filterInstance(r, filters));

    return matchedInstances.sort((a: any, b: any) => {
      let aWorst = 4, bWorst = 4;
      let aHasFail = false, bHasFail = false;

      for (const c of Object.values(a.checks || {}) as any[]) {
        if (c.result === 'fail') {
          aHasFail = true;
          const s = SEV_ORDER[c.severity] ?? 3;
          if (s < aWorst) aWorst = s;
        }
      }
      for (const c of Object.values(b.checks || {}) as any[]) {
        if (c.result === 'fail') {
          bHasFail = true;
          const s = SEV_ORDER[c.severity] ?? 3;
          if (s < bWorst) bWorst = s;
        }
      }

      if (aHasFail !== bHasFail) return aHasFail ? -1 : 1;
      if (aWorst !== bWorst) return aWorst - bWorst;
      return 0;
    });
  }, [instances, filters]);

  const filteredRules = useMemo(
    () => ruleIssues.filter((r: any) => filterRuleIssue(r, filters)),
    [ruleIssues, filters],
  );

  const extStats = useMemo(() => {
    const bySev: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    const byCheck: Record<string, any> = {};
    const byType: Record<string, number> = {};

    for (const r of instances) {
      const t = r.task_type || 'unknown';
      byType[t] = (byType[t] || 0) + 1;

      for (const [checkName, c] of Object.entries(r.checks || {}) as [string, any][]) {
        if (!byCheck[checkName]) byCheck[checkName] = { pass: 0, fail: 0, error: 0 };
        byCheck[checkName][c.result] = (byCheck[checkName][c.result] || 0) + 1;
        if (c.result === 'fail' && c.severity) bySev[c.severity]++;
      }
    }

    const total = stats.pass + stats.fail + stats.error;
    const passRate = total > 0 ? Math.round(stats.pass / total * 100) : 0;

    const ruleByRule: Record<string, number> = {};
    const ruleBySev: Record<string, number> = {};
    for (const ri of ruleIssues) {
      ruleByRule[ri.rule] = (ruleByRule[ri.rule] || 0) + 1;
      ruleBySev[ri.severity] = (ruleBySev[ri.severity] || 0) + 1;
    }

    return { bySev, byCheck, byType, passRate, ruleByRule, ruleBySev };
  }, [instances, stats, ruleIssues]);

  const resultDonutConfig = useMemo(() => {
    if (stats.pass + stats.fail + stats.error === 0) return null;
    return {
      type: 'doughnut' as const,
      data: { labels: ['Pass', 'Fail', 'Error'], datasets: [{ data: [stats.pass, stats.fail, stats.error], backgroundColor: [RESULT_COLORS.pass, RESULT_COLORS.fail, RESULT_COLORS.error], borderWidth: 0 }] },
      options: { responsive: true, cutout: '65%', plugins: {
        title: { display: true, text: 'Check Results', color: TC, font: { ...CF, size: 11, weight: 600 } },
        legend: { position: 'bottom' as const, labels: { color: LC, font: { ...CF, size: 10 }, padding: 12, usePointStyle: true, pointStyle: 'circle' as const } },
      }},
    };
  }, [stats]);

  const typeDonutConfig = useMemo(() => {
    const entries = Object.entries(extStats.byType);
    if (entries.length === 0) return null;
    return {
      type: 'doughnut' as const,
      data: { labels: entries.map(([k]) => k[0].toUpperCase() + k.slice(1)), datasets: [{ data: entries.map(([, v]) => v), backgroundColor: entries.map(([k]) => TYPE_COLORS[k] || '#9ca3af'), borderWidth: 0 }] },
      options: { responsive: true, cutout: '65%', plugins: {
        title: { display: true, text: 'Task Type Distribution', color: TC, font: { ...CF, size: 11, weight: 600 } },
        legend: { position: 'bottom' as const, labels: { color: LC, font: { ...CF, size: 10 }, padding: 12, usePointStyle: true, pointStyle: 'circle' as const } },
      }},
    };
  }, [extStats]);

  const checkBarConfig = useMemo(() => {
    const entries = Object.entries(extStats.byCheck);
    if (entries.length === 0) return null;
    return {
      type: 'bar' as const,
      data: {
        labels: entries.map(([k]) => CHECK_LABELS[k] || k),
        datasets: [
          { label: 'Pass', data: entries.map(([, v]) => v.pass), backgroundColor: RESULT_COLORS.pass, borderRadius: 4, barPercentage: 0.6 },
          { label: 'Fail', data: entries.map(([, v]) => v.fail), backgroundColor: RESULT_COLORS.fail, borderRadius: 4, barPercentage: 0.6 },
          { label: 'Error', data: entries.map(([, v]) => v.error), backgroundColor: RESULT_COLORS.error, borderRadius: 4, barPercentage: 0.6 },
        ],
      },
      options: { responsive: true,
        scales: { x: { stacked: true, grid: { display: false }, ticks: { color: LC, font: { ...CF, size: 9 } } }, y: { stacked: true, grid: { color: 'oklch(0.92 0 0)' }, ticks: { color: LC, font: { ...CF, size: 10 } }, beginAtZero: true } },
        plugins: {
          title: { display: true, text: 'Results by Check Type', color: TC, font: { ...CF, size: 11, weight: 600 } },
          legend: { position: 'bottom' as const, labels: { color: LC, font: { ...CF, size: 10 }, padding: 12, usePointStyle: true, pointStyle: 'circle' as const } },
        },
      },
    };
  }, [extStats]);

  const sevBarConfig = useMemo(() => {
    const order = ['low', 'medium', 'high', 'critical'];
    const vals = order.map(s => extStats.bySev[s] || 0);
    if (vals.every(v => v === 0)) return null;
    return {
      type: 'bar' as const,
      data: { labels: order.map(s => s[0].toUpperCase() + s.slice(1)), datasets: [{ label: 'Failures', data: vals, backgroundColor: order.map(s => SEVERITY_COLORS[s]), borderRadius: 4, barPercentage: 0.6 }] },
      options: { responsive: true,
        scales: { x: { grid: { display: false }, ticks: { color: LC, font: { ...CF, size: 10 } } }, y: { grid: { color: 'oklch(0.92 0 0)' }, ticks: { color: LC, font: { ...CF, size: 10 } }, beginAtZero: true } },
        plugins: { title: { display: true, text: 'Failure Severity', color: TC, font: { ...CF, size: 11, weight: 600 } }, legend: { display: false } },
      },
    };
  }, [extStats]);

  const ruleBarConfig = useMemo(() => {
    const entries = Object.entries(extStats.ruleByRule).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return null;
    return {
      type: 'bar' as const,
      data: { labels: entries.map(([k]) => RULE_LABELS[k] || k), datasets: [{ label: 'Issues', data: entries.map(([, v]) => v), backgroundColor: '#f59e0b', borderRadius: 4, barPercentage: 0.6 }] },
      options: { responsive: true,
        scales: { x: { grid: { display: false }, ticks: { color: LC, font: { ...CF, size: 9 } } }, y: { grid: { color: 'oklch(0.92 0 0)' }, ticks: { color: LC, font: { ...CF, size: 10 } }, beginAtZero: true } },
        plugins: { title: { display: true, text: 'Rule Checker Issues by Type', color: TC, font: { ...CF, size: 11, weight: 600 } }, legend: { display: false } },
      },
    };
  }, [extStats]);

  return (
    <div className="da-domain-detail">
      {/* Header */}
      <div className="da-domain-header">
        <h2 className="da-domain-name">{name}</h2>
        <p className="da-domain-subtitle">Quality audit results for the <strong>{name}</strong> domain</p>
      </div>

      {/* Section 1: Overview Stats */}
      <section className="da-domain-section">
        <h3 className="da-domain-section-title">Overview</h3>
        <div className="da-domain-stats-grid">
          <StatCard value={stats.instances} label="Instances" color="blue" />
          <StatCard value={`${extStats.passRate}%`} label="Pass Rate" color="green" />
          <StatCard value={stats.pass} label="Checks Passed" color="green" />
          <StatCard value={stats.fail} label="Checks Failed" color="red" />
          <StatCard value={ruleIssues.length} label="Rule Issues" color="orange" />
        </div>
        <div className="da-domain-charts-2col">
          {resultDonutConfig && <div className="da-chart-card"><ChartCanvas config={resultDonutConfig} height={240} /></div>}
          {typeDonutConfig && <div className="da-chart-card"><ChartCanvas config={typeDonutConfig} height={240} /></div>}
        </div>
      </section>

      {/* Section 2: LLM Quality by Check */}
      <section className="da-domain-section">
        <h3 className="da-domain-section-title">LLM Quality Analysis</h3>
        <div className="da-domain-charts-2col">
          {checkBarConfig && <div className="da-chart-card"><ChartCanvas config={checkBarConfig} height={240} /></div>}
          {sevBarConfig && <div className="da-chart-card"><ChartCanvas config={sevBarConfig} height={240} /></div>}
        </div>

        <div className="da-check-mini-grid">
          {['setup_completeness', 'task_quality', 'judge_quality'].map(cn => {
            const c = extStats.byCheck[cn] || { pass: 0, fail: 0, error: 0 };
            const t = c.pass + c.fail + c.error;
            const r = t > 0 ? Math.round(c.pass / t * 100) : 0;
            return (
              <div className="da-check-mini-card" key={cn}>
                <div className="da-check-mini-label">{CHECK_LABELS[cn]}</div>
                <div className="da-check-mini-row">
                  <span className="da-check-mini-rate" data-level={r >= 80 ? 'good' : r >= 50 ? 'warn' : 'bad'}>{r}%</span>
                  <span className="da-check-mini-detail">{c.pass} pass / {c.fail} fail{c.error > 0 ? ` / ${c.error} error` : ''}</span>
                </div>
                <div className="da-check-mini-bar">
                  <div className="da-check-mini-fill good" style={{ width: `${t > 0 ? c.pass / t * 100 : 0}%` }} />
                  <div className="da-check-mini-fill bad" style={{ width: `${t > 0 ? c.fail / t * 100 : 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3: Rule Checker Issues */}
      {ruleIssues.length > 0 && (
        <section className="da-domain-section">
          <h3 className="da-domain-section-title">Rule Checker Issues ({ruleIssues.length})</h3>
          <div className="da-domain-charts-2col">
            {ruleBarConfig && <div className="da-chart-card"><ChartCanvas config={ruleBarConfig} height={220} /></div>}
            <div className="da-chart-card">
              <h4 className="da-card-title">Summary</h4>
              <table className="da-mini-table">
                <thead><tr><th>Rule</th><th>Count</th><th>Severity</th></tr></thead>
                <tbody>
                  {Object.entries(extStats.ruleByRule).sort((a, b) => b[1] - a[1]).map(([rule, count]) => (
                    <tr key={rule}>
                      <td>{RULE_LABELS[rule] || rule}</td>
                      <td className="da-cell-fail">{count}</td>
                      <td><span className={`da-sev-badge da-sev-${rule === 'count' ? 'medium' : 'high'}`}>{rule === 'count' ? 'warning' : 'error'}</span></td>
                    </tr>
                  ))}
                  <tr className="da-mini-table-total">
                    <td><strong>Total</strong></td>
                    <td className="da-cell-fail"><strong>{ruleIssues.length}</strong></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <RuleIssuesList issues={ruleIssues} />
        </section>
      )}

      {/* Section 4: LLM Judge Instance Results */}
      <section className="da-domain-section">
        <h3 className="da-domain-section-title">LLM Judge Instance Results</h3>
        <FilterBar
          filters={filters}
          onChange={setFilters}
          totalVisible={filtered.length + filteredRules.length}
          totalAll={instances.length + ruleIssues.length}
        />

        {filtered.length > 0 && (
          <div className="da-instance-section">
            {filtered.map((r: any) => (
              <InstanceCard key={r.task_path} result={r} />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <p className="da-no-results">No LLM judge results match the current filters.</p>
        )}
      </section>
    </div>
  );
}
