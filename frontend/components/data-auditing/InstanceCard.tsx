"use client";

import { useState } from 'react';
import { TypeBadge } from './Badges';
import CheckItem from './CheckItem';
import { getEffectiveResult } from '@/lib/data-auditing/dataHelpers';

export default function InstanceCard({ result }: { result: any }) {
  const [open, setOpen] = useState(false);
  const checks = result.checks || {};

  const hasFail = Object.values(checks).some((c: any) => getEffectiveResult(c.result, c.severity) === 'fail');
  const hasWarning = Object.values(checks).some((c: any) => getEffectiveResult(c.result, c.severity) === 'warning');
  const sevRank: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
  let worst = 'low';
  for (const c of Object.values(checks) as any[]) {
    if (c.result === 'fail' && (sevRank[c.severity] || 0) > (sevRank[worst] || 0)) {
      worst = c.severity;
    }
  }

  let cls = 'da-instance-card';
  if (hasFail) cls += ` da-has-fail da-sev-border-${worst}`;
  else if (hasWarning) cls += ' da-has-warning';

  return (
    <div className={cls}>
      <div className="da-instance-hdr" onClick={() => setOpen(!open)}>
        <span className={`da-toggle ${open ? 'open' : ''}`}>&#9654;</span>
        <TypeBadge type={result.task_type} />
        <span className="da-instance-path">{result.task_path}</span>
        {hasFail && <span className="da-fail-dot" />}
        {!hasFail && hasWarning && <span className="da-warning-dot" />}
      </div>
      {open && (
        <div className="da-instance-body">
          {Object.entries(checks).map(([name, check]) => (
            <CheckItem key={name} checkName={name} check={check} />
          ))}
        </div>
      )}
    </div>
  );
}
