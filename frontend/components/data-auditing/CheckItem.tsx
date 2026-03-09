"use client";

import { useState } from 'react';
import { ResultTag, SevBadge } from './Badges';
import IssueDetail from './IssueDetail';
import { CHECK_LABELS } from '@/lib/data-auditing/constants';

export default function CheckItem({ checkName, check }: { checkName: string; check: any }) {
  const [open, setOpen] = useState(check.result === 'fail');
  const issues = check.issues || [];
  const label = CHECK_LABELS[checkName] || checkName;

  return (
    <div className="da-check-item">
      <div className="da-check-hdr" onClick={() => setOpen(!open)}>
        <span className={`da-toggle ${open ? 'open' : ''}`}>&#9654;</span>
        <ResultTag result={check.result} severity={check.severity} />
        <SevBadge severity={check.severity} />
        <span className="da-check-name">{label}</span>
        <span className="da-check-summary">{check.summary || ''}</span>
      </div>
      {open && (
        <div className="da-check-body">
          {issues.length > 0 ? (
            <div className="da-issues-list">
              {issues.map((issue: any, i: number) => (
                <IssueDetail key={i} issue={issue} checkName={checkName} />
              ))}
            </div>
          ) : (
            <p className="da-no-issues">
              {check.result === 'pass' ? 'All checks passed.' : 'No detailed issues.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
