"use client";

import { SevBadge } from './Badges';

export default function RuleIssueCard({ issue }: { issue: any }) {
  return (
    <div className="da-rule-issue">
      <div className="da-rule-issue-header">
        {issue.id && <span className="da-issue-id">{issue.id}</span>}
        <SevBadge severity={issue.severity === 'error' ? 'high' : 'medium'} />
        <strong className="da-rule-name">[{issue.rule}]</strong>
        <span className="da-rule-path">{issue.path}</span>
      </div>
      <p className="da-rule-msg">{issue.message}</p>
    </div>
  );
}
