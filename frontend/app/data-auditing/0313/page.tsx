"use client";

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useReportData } from '@/components/data-auditing/ReportDataProvider';
import StatCard from '@/components/data-auditing/StatCard';
import ChartCanvas from '@/components/data-auditing/ChartCanvas';
import { SEVERITY_COLORS, RESULT_COLORS, CHECK_LABELS } from '@/lib/data-auditing/constants';
import { computeDomainStats, getEffectiveResult } from '@/lib/data-auditing/dataHelpers';

const CF = { family: "'JetBrains Mono', monospace" };
const TC = '#1f2937';
const LC = '#6b7280';

const EXCLUDED = new Set(['dataset']);

const RULE_LABELS: Record<string, string> = {
  benign_format: 'Benign Format',
  direct_format: 'Direct Format',
  indirect_format: 'Indirect Format',
};

const EXCLUDED_RULES = new Set(['count']);

export default function DashboardPage() {
  const { raw, derived } = useReportData();
  const router = useRouter();
  if (!raw || !derived) return null;

  const { llm_stats: ls, rule_stats: rs } = raw;
  const { allDomains, byDomainLLM, byDomainRule } = derived;
  const visibleDomains = allDomains.filter((d: string) => !EXCLUDED.has(d));

  const totalChecks = useMemo(() => {
    if (!ls) return 0;
    return Object.values(ls.by_check).reduce((s: number, c: any) => s + c.pass + (c.warning || 0) + c.fail + c.error, 0);
  }, [ls]);

  const passRate = useMemo(() => {
    if (!ls || totalChecks === 0) return '—';
    const passes = Object.values(ls.by_check).reduce((s: number, c: any) => s + c.pass + (c.warning || 0), 0);
    return Math.round(passes / totalChecks * 100) + '%';
  }, [ls, totalChecks]);

  const domainData = useMemo(() => {
    return visibleDomains.map((d: string) => {
      const items = byDomainLLM[d] || [];
      const ruleItems = byDomainRule[d] || [];
      const overall = computeDomainStats(items);

      const byCheck: Record<string, any> = {};
      for (const r of items) {
        for (const [cn, c] of Object.entries(r.checks || {}) as [string, any][]) {
          if (!byCheck[cn]) byCheck[cn] = { pass: 0, fail: 0, warning: 0, error: 0 };
          const eff = getEffectiveResult(c.result, c.severity);
          byCheck[cn][eff] = (byCheck[cn][eff] || 0) + 1;
        }
      }

      const byRule: Record<string, number> = {};
      for (const ri of ruleItems) {
        byRule[ri.rule] = (byRule[ri.rule] || 0) + 1;
      }

      const bySev: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
      for (const r of items) {
        for (const c of Object.values(r.checks || {}) as any[]) {
          if (c.result === 'fail' && c.severity) bySev[c.severity]++;
        }
      }

      const total = overall.pass + overall.warning + overall.fail + overall.error;
      const rate = total > 0 ? Math.round((overall.pass + overall.warning) / total * 100) : 0;

      return { domain: d, ...overall, rate, byCheck, byRule, bySev, ruleCount: ruleItems.length };
    });
  }, [visibleDomains, byDomainLLM, byDomainRule]);

  const leaderboard = useMemo(() => [...domainData].sort((a, b) => b.rate - a.rate), [domainData]);

  const ruleByRule = rs?.by_rule || {};
  const ruleBySev = rs?.by_severity || {};
  const allRuleNames = useMemo(() => Object.keys(ruleByRule).filter((k: string) => !EXCLUDED_RULES.has(k)).sort(), [ruleByRule]);
  const checkNames = ['setup_completeness', 'task_quality', 'judge_quality'];

  const ruleRanking = useMemo(() => [...domainData].sort((a, b) => a.ruleCount - b.ruleCount), [domainData]);

  // Charts
  const overallDonut = useMemo(() => {
    if (!ls) return null;
    const p = Object.values(ls.by_check).reduce((s: number, c: any) => s + c.pass, 0);
    const w = Object.values(ls.by_check).reduce((s: number, c: any) => s + (c.warning || 0), 0);
    const f = Object.values(ls.by_check).reduce((s: number, c: any) => s + c.fail, 0);
    const e = Object.values(ls.by_check).reduce((s: number, c: any) => s + c.error, 0);
    if (p + w + f + e === 0) return null;
    return {
      type: 'doughnut' as const,
      data: { labels: ['Pass', 'Warning', 'Fail', 'Error'], datasets: [{ data: [p, w, f, e], backgroundColor: [RESULT_COLORS.pass, RESULT_COLORS.warning, RESULT_COLORS.fail, RESULT_COLORS.error], borderWidth: 0 }] },
      options: { responsive: true, cutout: '65%', plugins: {
        title: { display: true, text: 'Overall Check Results', color: TC, font: { ...CF, size: 11, weight: 600 } },
        legend: { position: 'bottom' as const, labels: { color: LC, font: { ...CF, size: 10 }, padding: 12, usePointStyle: true, pointStyle: 'circle' as const } },
      }},
    };
  }, [ls]);

  const sevChart = useMemo(() => {
    if (!ls) return null;
    const sev = ls.by_severity || {};
    const order = ['low', 'medium', 'high', 'critical'];
    const vals = order.map((s: string) => sev[s] || 0);
    if (vals.every((v: number) => v === 0)) return null;
    return {
      type: 'bar' as const,
      data: { labels: order.map((s: string) => s[0].toUpperCase() + s.slice(1)), datasets: [{ label: 'Failures', data: vals, backgroundColor: order.map((s: string) => SEVERITY_COLORS[s]), borderRadius: 4, barPercentage: 0.6 }] },
      options: { responsive: true,
        scales: { x: { grid: { display: false }, ticks: { color: LC, font: { ...CF, size: 10 } } }, y: { grid: { color: 'oklch(0.92 0 0)' }, ticks: { color: LC, font: { ...CF, size: 10 } }, beginAtZero: true } },
        plugins: { title: { display: true, text: 'LLM Judge Failure Severity', color: TC, font: { ...CF, size: 11, weight: 600 } }, legend: { display: false } },
      },
    };
  }, [ls]);

  const domainFailChart = useMemo(() => {
    if (!ls) return null;
    const entries = leaderboard.filter(d => d.fail > 0).sort((a, b) => b.fail - a.fail);
    if (entries.length === 0) return null;
    return {
      type: 'bar' as const,
      data: { labels: entries.map(e => e.domain), datasets: [{ label: 'Failures', data: entries.map(e => e.fail), backgroundColor: RESULT_COLORS.fail, borderRadius: 4, barPercentage: 0.6 }] },
      options: { indexAxis: 'y' as const, responsive: true,
        scales: { x: { grid: { color: 'oklch(0.92 0 0)' }, ticks: { color: LC, font: { ...CF, size: 10 } }, beginAtZero: true }, y: { grid: { display: false }, ticks: { color: LC, font: { ...CF, size: 9 } } } },
        plugins: { title: { display: true, text: 'LLM Failures by Domain', color: TC, font: { ...CF, size: 11, weight: 600 } }, legend: { display: false } },
      },
    };
  }, [ls, leaderboard]);

  const ruleBarChart = useMemo(() => {
    const entries = Object.entries(ruleByRule).filter(([, v]) => (v as number) > 0).sort((a, b) => (b[1] as number) - (a[1] as number));
    if (entries.length === 0) return null;
    return {
      type: 'bar' as const,
      data: { labels: entries.map(([k]) => RULE_LABELS[k] || k), datasets: [{ label: 'Issues', data: entries.map(([, v]) => v), backgroundColor: '#f59e0b', borderRadius: 4, barPercentage: 0.6 }] },
      options: { responsive: true,
        scales: { x: { grid: { display: false }, ticks: { color: LC, font: { ...CF, size: 9 } } }, y: { grid: { color: 'oklch(0.92 0 0)' }, ticks: { color: LC, font: { ...CF, size: 10 } }, beginAtZero: true } },
        plugins: { title: { display: true, text: 'Issues by Rule Type', color: TC, font: { ...CF, size: 11, weight: 600 } }, legend: { display: false } },
      },
    };
  }, [ruleByRule]);

  const checkStackedChart = useMemo(() => {
    if (!ls) return null;
    const bc = ls.by_check || {};
    const checks = Object.keys(bc);
    if (checks.length === 0) return null;
    return {
      type: 'bar' as const,
      data: {
        labels: checks.map((k: string) => CHECK_LABELS[k] || k),
        datasets: [
          { label: 'Pass', data: checks.map((k: string) => bc[k].pass), backgroundColor: RESULT_COLORS.pass, borderRadius: 4, barPercentage: 0.6 },
          { label: 'Warning', data: checks.map((k: string) => bc[k].warning || 0), backgroundColor: RESULT_COLORS.warning, borderRadius: 4, barPercentage: 0.6 },
          { label: 'Fail', data: checks.map((k: string) => bc[k].fail), backgroundColor: RESULT_COLORS.fail, borderRadius: 4, barPercentage: 0.6 },
          { label: 'Error', data: checks.map((k: string) => bc[k].error), backgroundColor: RESULT_COLORS.error, borderRadius: 4, barPercentage: 0.6 },
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
  }, [ls]);

  const checkRate = (d: any, cn: string) => {
    const c = d.byCheck[cn] || { pass: 0, fail: 0, warning: 0, error: 0 };
    const t = c.pass + (c.warning || 0) + c.fail + c.error;
    return t > 0 ? Math.round((c.pass + (c.warning || 0)) / t * 100) : null;
  };

  const rateClass = (r: number | null) => r === null ? '' : r >= 80 ? 'da-cell-pass' : r >= 50 ? 'da-cell-warn' : 'da-cell-fail';

  return (
    <div className="da-dashboard">
      {/* Section 1: Overview Stats */}
      <section className="da-dash-section">
        <h2 className="da-section-title">Overview</h2>
        <div className="da-stats-grid">
          <StatCard value={ls?.total_instances || 0} label="Instances Scanned" color="blue" />
          <StatCard value={passRate} label="Overall Pass Rate" color="green" />
          <StatCard value={ls?.total_issues || 0} label="LLM Judge Issues" color="red" />
          <StatCard value={rs?.total_issues || 0} label="Rule Checker Issues" color="orange" />
          <StatCard value={visibleDomains.length} label="Domains" color="blue" />
        </div>
        <div className="da-charts-row-2">
          {overallDonut && <div className="da-chart-card"><ChartCanvas config={overallDonut} height={240} /></div>}
          {sevChart && <div className="da-chart-card"><ChartCanvas config={sevChart} height={240} /></div>}
        </div>
      </section>

      {/* Section 2: Domain Summary Table */}
      <section className="da-dash-section">
        <h2 className="da-section-title">Domain Summary</h2>
        <div className="da-table-scroll">
          <table className="da-summary-table">
            <thead>
              <tr>
                <th rowSpan={2}>Domain</th>
                <th rowSpan={2}>Instances</th>
                <th rowSpan={2}>Overall Rate</th>
                <th colSpan={3} className="da-th-group">LLM Judge Pass Rate</th>
                <th colSpan={allRuleNames.length} className="da-th-group">Rule Issues</th>
                <th rowSpan={2}>Total Rules</th>
              </tr>
              <tr>
                {checkNames.map(cn => <th key={cn} className="da-th-sub">{CHECK_LABELS[cn]?.replace(' ', '\u00A0') || cn}</th>)}
                {allRuleNames.map(rn => <th key={rn} className="da-th-sub">{RULE_LABELS[rn] || rn}</th>)}
              </tr>
            </thead>
            <tbody>
              {leaderboard.map(d => (
                <tr key={d.domain} onClick={() => router.push(`/data-auditing/0313/domain/${d.domain}`)}>
                  <td><strong>{d.domain}</strong></td>
                  <td>{d.instances}</td>
                  <td className={rateClass(d.rate)}><strong>{d.rate}%</strong></td>
                  {checkNames.map(cn => {
                    const r = checkRate(d, cn);
                    return <td key={cn} className={rateClass(r)}>{r !== null ? `${r}%` : '—'}</td>;
                  })}
                  {allRuleNames.map(rn => {
                    const v = d.byRule[rn] || 0;
                    return <td key={rn} className={v > 0 ? 'da-cell-fail' : ''}>{v || ''}</td>;
                  })}
                  <td className={d.ruleCount > 0 ? 'da-cell-fail' : ''}>{d.ruleCount || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3: Rule Checker Statistics */}
      {(rs?.total_issues > 0) && <section className="da-dash-section">
        <h2 className="da-section-title">Rule Checker Statistics</h2>
        <div className="da-stats-grid-3">
          <StatCard value={rs?.total_issues || 0} label="Total Rule Issues" color="orange" />
          <StatCard value={ruleBySev.error || 0} label="Errors" color="red" />
          <StatCard value={ruleBySev.warning || 0} label="Warnings" color="orange" />
        </div>
        <div className="da-charts-row-2">
          {ruleBarChart && <div className="da-chart-card"><ChartCanvas config={ruleBarChart} height={240} /></div>}
          <div className="da-chart-card">
            <h3 className="da-card-title">Issues by Rule</h3>
            <table className="da-mini-table">
              <thead><tr><th>Rule</th><th>Count</th><th>Severity</th></tr></thead>
              <tbody>
                {Object.entries(ruleByRule).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([rule, count]) => (
                  <tr key={rule}>
                    <td>{RULE_LABELS[rule] || rule}</td>
                    <td className="da-cell-fail">{count as number}</td>
                    <td><span className={`da-sev-badge da-sev-${rule === 'count' ? 'medium' : 'high'}`}>{rule === 'count' ? 'warning' : 'error'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <h3 className="da-sub-section-title">Rule Issues by Domain</h3>
        <table className="da-summary-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Domain</th>
              {allRuleNames.map(rn => <th key={rn}>{RULE_LABELS[rn] || rn}</th>)}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {ruleRanking.map((d, i) => (
              <tr key={d.domain} onClick={() => router.push(`/data-auditing/0313/domain/${d.domain}`)}>
                <td className="da-cell-rank">{i + 1}</td>
                <td><strong>{d.domain}</strong></td>
                {allRuleNames.map(rn => {
                  const v = d.byRule[rn] || 0;
                  return <td key={rn} className={v > 0 ? 'da-cell-fail' : ''}>{v || ''}</td>;
                })}
                <td className={d.ruleCount > 0 ? 'da-cell-fail' : ''}><strong>{d.ruleCount || '0'}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>}

      {/* Section 4: LLM Quality Analysis */}
      <section className="da-dash-section">
        <h2 className="da-section-title">LLM Quality Analysis</h2>
        <div className="da-charts-row-2">
          {checkStackedChart && <div className="da-chart-card"><ChartCanvas config={checkStackedChart} height={240} /></div>}
          {domainFailChart && <div className="da-chart-card"><ChartCanvas config={domainFailChart} height={280} /></div>}
        </div>

        <div className="da-check-tables-grid">
          {checkNames.map(checkName => {
            const label = CHECK_LABELS[checkName] || checkName;
            const sorted = [...leaderboard].sort((a, b) => {
              const ra = checkRate(a, checkName) ?? -1;
              const rb = checkRate(b, checkName) ?? -1;
              return rb - ra;
            });
            return (
              <div className="da-check-table-card" key={checkName}>
                <h3 className="da-card-title">{label}</h3>
                <table className="da-mini-table">
                  <thead><tr><th>#</th><th>Domain</th><th>Pass</th><th>Fail</th><th>Rate</th></tr></thead>
                  <tbody>
                    {sorted.map((d, i) => {
                      const c = d.byCheck[checkName] || { pass: 0, fail: 0, error: 0 };
                      const t = c.pass + c.fail + c.error;
                      const r = t > 0 ? Math.round(c.pass / t * 100) : null;
                      return (
                        <tr key={d.domain}>
                          <td className="da-cell-rank">{i + 1}</td>
                          <td>{d.domain}</td>
                          <td className="da-cell-pass">{c.pass}</td>
                          <td className="da-cell-fail">{c.fail || ''}</td>
                          <td className={rateClass(r)}>{r !== null ? `${r}%` : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 5: Domain Leaderboard by Severity */}
      <section className="da-dash-section">
        <h2 className="da-section-title">Domain Leaderboard by Severity</h2>
        <table className="da-summary-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Domain</th>
              <th>Pass Rate</th>
              <th>Pass</th>
              <th>Fail</th>
              <th>Critical</th>
              <th>High</th>
              <th>Medium</th>
              <th>Low</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((d, i) => (
              <tr key={d.domain} onClick={() => router.push(`/data-auditing/0313/domain/${d.domain}`)}>
                <td className="da-cell-rank">{i + 1}</td>
                <td><strong>{d.domain}</strong></td>
                <td className={rateClass(d.rate)}><strong>{d.rate}%</strong></td>
                <td className="da-cell-pass">{d.pass}</td>
                <td className="da-cell-fail">{d.fail || ''}</td>
                <td className="da-cell-critical">{d.bySev.critical || ''}</td>
                <td className="da-cell-fail">{d.bySev.high || ''}</td>
                <td className="da-cell-warn">{d.bySev.medium || ''}</td>
                <td>{d.bySev.low || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
